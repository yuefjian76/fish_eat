/**
 * E2E test for the ScrollingBackground parallax bug.
 *
 * Bug:
 *   ScrollingBackground._updateTileLayers() runs every frame and does
 *       obj.setPosition(viewportW/2 + cameraScrollX * cfg.parallaxX,
 *                       viewportH/2)
 *   while the layer was created with setScrollFactor(parallaxX, 0).
 *
 *   Phaser draws a layer at
 *       screenX = worldX - cameraScrollX * scrollFactorX
 *   so combining the two yields
 *       screenX = (viewportW/2 + scrollX*parallax)
 *                 - scrollX*parallax
 *               = viewportW/2          (always 512)
 *
 *   Net effect: parallax is exactly cancelled; the background image is
 *   pinned to the center of the screen regardless of camera scroll, and
 *   the player sees no scrolling when they move past the original spawn.
 *
 * Fix:
 *   Stop per-frame setPosition in _updateTileLayers. Phaser's
 *   scrollFactor already gives correct parallax. Add a non-zero
 *   parallaxY for vertical scrolling and widen the display size so the
 *   player does not run off the background image when far from spawn.
 *
 * Test 1: After the camera has been moved via cameras.main.scrollX, the
 *         layer's worldX must NOT be rewritten to viewportW/2 +
 *         scrollX*parallax (i.e. the per-frame setPosition is gone).
 *
 * Test 2: The on-screen X position of the background layer must be
 *         somewhere other than viewportW/2 once the camera has moved
 *         (i.e. the parallax effect is actually visible).
 *
 * Run with:
 *   npx playwright test e2e/scrolling-bg.spec.js --project=chromium
 *
 * Requires local server on :8765 (python3 -m http.server 8765).
 */

import { test, expect } from '@playwright/test';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startGame(page) {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(1000);

    try {
        const guestBtn = page.locator('button:has-text("游客模式")');
        if (await guestBtn.isVisible({ timeout: 2000 })) {
            await guestBtn.click();
            await delay(500);
        }
    } catch (e) {
        // No guest button — already in menu.
    }

    await page.mouse.click(640, 520);

    await page.waitForFunction(() => window.__GAME_SCENE__ != null, {
        timeout: 10000,
    });
    await delay(500);
}

test('bg layer world x is not rewritten per-frame (parallax fix)', async ({ page }) => {
    await startGame(page);

    // Park the mouse so the player doesn't chase it.
    await page.mouse.move(0, 0);
    await page.evaluate(() => {
        const scene = window.__GAME_SCENE__;
        scene.isMouseActive = false;
        scene.mouseTarget = null;
        if (scene.player && scene.player.body) {
            scene.player.body.setVelocity(0, 0);
        }
    });
    await delay(100);

    // Read the original world X assigned at layer creation (viewportW/2 = 512).
    const initial = await page.evaluate(() => {
        const bg = window.__GAME_SCENE__.backgroundSystem._tileLayers.bg;
        return {
            x: bg.x,
            scrollFactorX: bg.scrollFactorX,
            scrollFactorY: bg.scrollFactorY,
            viewportW: window.__GAME_SCENE__.backgroundSystem.options.viewportW,
        };
    });

    // Move the camera far to the right. With the bug, _updateTileLayers will
    // rewrite bg.x to viewportW/2 + scrollX * parallaxX on the next frame.
    // Stop the camera follow first so the value we set actually sticks
    // (otherwise startFollow's lerp pulls the camera back to the player).
    const SCROLL = 5000;
    await page.evaluate((scroll) => {
        const cam = window.__GAME_SCENE__.cameras.main;
        cam.stopFollow();
        cam.scrollX = scroll;
    }, SCROLL);
    // Let _updateTileLayers run for several frames.
    await delay(200);

    const after = await page.evaluate(() => {
        const bg = window.__GAME_SCENE__.backgroundSystem._tileLayers.bg;
        const cam = window.__GAME_SCENE__.cameras.main;
        return {
            x: bg.x,
            cameraScrollX: cam.scrollX,
        };
    });

    test.info().annotations.push({
        type: 'snapshot',
        description: JSON.stringify({ initial, after }),
    });

    // After the fix: the layer's world X is no longer rewritten each frame.
    // It should stay at its creation value (viewportW/2 = 512).
    expect(after.cameraScrollX).toBe(SCROLL);
    expect(
        after.x,
        'bg.x must not be rewritten per-frame by _updateTileLayers'
    ).toBe(initial.x);
});

test('bg layer screen x is no longer pinned to viewportW/2 (parallax visible)', async ({
    page,
}) => {
    await startGame(page);

    await page.mouse.move(0, 0);
    await page.evaluate(() => {
        const scene = window.__GAME_SCENE__;
        scene.isMouseActive = false;
        scene.mouseTarget = null;
        if (scene.player && scene.player.body) {
            scene.player.body.setVelocity(0, 0);
        }
    });
    await delay(100);

    const SCROLL = 5000;
    await page.evaluate((scroll) => {
        const cam = window.__GAME_SCENE__.cameras.main;
        cam.stopFollow();
        cam.scrollX = scroll;
    }, SCROLL);
    await delay(200);

    // Compute the on-screen X the way Phaser does:
    //   screenX = worldX - cameraScrollX * scrollFactorX
    // With the bug, worldX is rewritten to (viewportW/2 + scroll*parallax)
    // and screenX collapses to viewportW/2 (= 512).
    // With the fix, worldX stays at viewportW/2 and screenX = viewportW/2
    // - scroll*parallax, which is far from 512.
    const result = await page.evaluate(() => {
        const bg = window.__GAME_SCENE__.backgroundSystem._tileLayers.bg;
        const cam = window.__GAME_SCENE__.cameras.main;
        const screenX = bg.x - cam.scrollX * bg.scrollFactorX;
        return {
            x: bg.x,
            cameraScrollX: cam.scrollX,
            scrollFactorX: bg.scrollFactorX,
            screenX,
        };
    });

    test.info().annotations.push({
        type: 'snapshot',
        description: JSON.stringify(result),
    });

    expect(result.cameraScrollX).toBe(SCROLL);
    // Should be far from viewportW/2 (512). The bg layer is the slowest
    // (parallaxX = 0.08) so the expected screenX is 512 - 5000*0.08 = 112.
    expect(
        Math.abs(result.screenX - 512),
        'bg layer must visibly parallax when camera scrolls'
    ).toBeGreaterThan(50);
});
