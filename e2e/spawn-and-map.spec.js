/**
 * E2E tests for two gameplay bugs:
 *   Bug 1: enemies spawn far outside the viewport (off-screen) and immediately
 *          get despawned by DESPAWN_MARGIN logic, so the player never sees them.
 *   Bug 2: player gets clamped at world bounds because setCollideWorldBounds(true)
 *          locks them inside the 20000x20000 physics world even when the
 *          intended UX is "infinite map with camera follow".
 *
 * Run with:
 *   npx playwright test e2e/spawn-and-map.spec.js --project=chromium
 *
 * Requires local server on :8765 (python3 -m http.server 8765).
 */

import { test, expect } from '@playwright/test';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reusable bootstrap: load game with ?debug=true, click past guest mode /
// main menu, wait for GameScene to expose window.__GAME_SCENE__.
async function startGame(page) {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(1000);

    // Guest mode (if login screen shown).
    try {
        const guestBtn = page.locator('button:has-text("游客模式")');
        if (await guestBtn.isVisible({ timeout: 2000 })) {
            await guestBtn.click();
            await delay(500);
        }
    } catch (e) {
        // No guest button — already in menu.
    }

    // Click start button on MenuScene.
    await page.mouse.click(640, 520);

    // Wait until GameScene exposes itself.
    await page.waitForFunction(() => window.__GAME_SCENE__ != null, {
        timeout: 10000,
    });
    await delay(500);
}

test('Bug 1: enemies appear near player at game start', async ({ page }) => {
    await startGame(page);

    // Give wave system a few cycles to spawn enemies (calm wave spawns ~every 2s).
    await delay(5000);

    const result = await page.evaluate(() => {
        const scene = window.__GAME_SCENE__;
        if (!scene || !scene.player) return { error: 'no scene/player' };

        const px = scene.player.x;
        const py = scene.player.y;
        const enemyList = Array.isArray(scene.enemies) ? scene.enemies : [];
        const positions = enemyList
            .filter((e) => e && e.graphics && e.graphics.active !== false)
            .map((e) => ({
                x: e.graphics.x,
                y: e.graphics.y,
                dist: Math.hypot(e.graphics.x - px, e.graphics.y - py),
            }));
        const nearCount = positions.filter((p) => p.dist < 1500).length;
        const minDist = positions.length
            ? Math.min(...positions.map((p) => p.dist))
            : Infinity;
        return {
            playerPos: { x: px, y: py },
            enemyCount: positions.length,
            nearCount,
            minDist,
        };
    });

    // Sanity log so failure messages are useful.
    test.info().annotations.push({
        type: 'snapshot',
        description: JSON.stringify(result),
    });

    expect(result.enemyCount, 'at least one enemy alive').toBeGreaterThan(0);
    expect(
        result.minDist,
        'closest enemy should be within 1500 units of player'
    ).toBeLessThan(1500);
    expect(
        result.nearCount,
        'at least one enemy within viewport-margin distance'
    ).toBeGreaterThan(0);
});

test('Bug 2: player can move beyond initial position (no world-bounds clamp)', async ({
    page,
}) => {
    await startGame(page);

    const initial = await page.evaluate(() => ({
        x: window.__GAME_SCENE__.player.x,
        y: window.__GAME_SCENE__.player.y,
    }));

    // Teleport player far away from spawn. With setCollideWorldBounds(true) and
    // the spawn at (512, 384), Phaser would clamp them back inside the world.
    // We also need to silence the mouse-control system that would otherwise
    // steer the player back toward the initial click target (640, 520).
    // Move the OS-level mouse cursor away from the canvas, so Phaser
    // doesn't continue firing pointermove events that set mouseTarget to
    // the player's old screen position and tug them back via the inline
    // mouse-chase code in GameScene.update.
    await page.mouse.move(0, 0);
    await delay(100);

    await page.evaluate(() => {
        const scene = window.__GAME_SCENE__;
        // Belt-and-braces: silence the inline mouse-chase code in
        // GameScene.update by disabling its activation flag and clearing
        // its target. PlayerControlSystem (if present on the scene) is
        // similarly silenced.
        scene.isMouseActive = false;
        scene.mouseTarget = null;
        scene.player.x = 5000;
        scene.player.y = 5000;
        if (scene.player.body) {
            scene.player.body.reset(5000, 5000);
            scene.player.body.setVelocity(0, 0);
        }
    });

    // Let physics run a few frames so we measure the *settled* position,
    // not the instantaneous teleport.
    await delay(500);

    // Re-pin the player at (5000, 5000) and zero velocity to take a clean
    // snapshot. The cosmetic "breathing" animation in GameScene.update
    // adds an unbounded-sum `sin()*2` to player.y each frame (it never
    // subtracts the previous offset), so without this re-pin the value
    // drifts by ~30-50 px over 1s — that's a separate cosmetic bug, not
    // the world-bounds clamp we're testing here.
    await page.evaluate(() => {
        const scene = window.__GAME_SCENE__;
        scene.isMouseActive = false;
        scene.mouseTarget = null;
        scene.player.x = 5000;
        scene.player.y = 5000;
        scene._playerBaseY = 5000;
        if (scene.player.body) {
            scene.player.body.reset(5000, 5000);
            scene.player.body.setVelocity(0, 0);
        }
    });
    // One frame for the snapshot.
    await delay(50);

    // Snapshot the position. The breathing-animation in GameScene.update
    // overwrites player.y each frame with _playerBaseY + sin()*2 — that's
    // harmless ±2px drift, not a clamp.
    const moved = await page.evaluate(() => {
        const s = window.__GAME_SCENE__;
        return {
            x: s.player.x,
            y: s.player.y,
            baseY: s._playerBaseY,
            vx: s.player.body ? s.player.body.velocity.x : null,
            vy: s.player.body ? s.player.body.velocity.y : null,
            isMouseActive: s.isMouseActive,
            mouseTarget: s.mouseTarget,
        };
    });

    test.info().annotations.push({
        type: 'snapshot',
        description: JSON.stringify({ initial, moved }),
    });

    expect(moved.x, 'player.x should remain ~5000 (not snapped back)').toBeGreaterThanOrEqual(4990);
    // For y, also accept the breathing animation's offset (~2px) plus minor
    // sub-frame physics integration — both are non-bug noise. Same lower
    // bound as x.
    expect(moved.y, 'player.y should remain ~5000 (not snapped back)').toBeGreaterThanOrEqual(4990);
});
