/**
 * E2E test for the player breathing animation drift bug.
 *
 * Bug:
 *   GameScene.update() applied the breathing sin() each frame WITHOUT
 *   subtracting the previous offset:
 *     this._playerBaseY = this.player.y;            // already includes prev sin
 *     this.player.y = this._playerBaseY + breathY;  // re-adds sin → accumulates
 *   So player.y drifts ~30-100 px per second instead of oscillating in
 *   [base-2, base+2].
 *
 * Fix:
 *   Delta-based update — apply (breathY - prevBreathY) so the y axis
 *   oscillates around a constant base.
 *
 * Run with:
 *   npx playwright test e2e/breathing.spec.js --project=chromium
 *
 * Requires local server on :8765.
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

test('player y does not drift over 3 seconds (breathing bug)', async ({ page }) => {
    await startGame(page);

    // Park the mouse outside the canvas so PlayerControlSystem / inline
    // mouse-chase code does not steer the player around during the window
    // we are measuring. Also explicitly silence those flags inside the
    // scene to be safe.
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

    const y0 = await page.evaluate(() => window.__GAME_SCENE__.player.y);

    // Sample over 3 seconds — bug drifts ~30-100px in this window;
    // a correct oscillation stays within ±2 plus negligible noise.
    await delay(3000);

    const y1 = await page.evaluate(() => window.__GAME_SCENE__.player.y);
    const drift = Math.abs(y1 - y0);

    test.info().annotations.push({
        type: 'snapshot',
        description: JSON.stringify({ y0, y1, drift }),
    });

    expect(
        drift,
        'player y should oscillate in ±2, not drift cumulatively'
    ).toBeLessThan(10);
});
