/**
 * E2E tests for the ScrollingBackground visual fix.
 *
 * Bug (post commit 194ec91):
 *   _updateDepthGradient() filled the *entire* viewport with a solid
 *   depth color (fillRect(0, 0, viewportW, viewportH)) every frame.
 *   Combined with bg layer alpha 0.55, the depth color completely
 *   dominated the visual — player saw a solid panel + a barely visible
 *   smeared bg texture rather than a real "scrolling scroll" effect.
 *
 * Fix:
 *   - _updateDepthGradient() now fills only the bottom 30% of the
 *     viewport ("depth haze" effect) instead of the whole screen.
 *   - LAYER_CONFIG alphas bumped: bg 0.55→1.0, mid 0.40→0.85,
 *     fg 0.22→0.55, so the bg layer is fully visible while mid/fg
 *     retain some translucency.
 *
 * These tests pin those invariants so a future refactor can't silently
 * regress to the "solid panel covering bg" behavior.
 *
 * Run with:
 *   npx playwright test e2e/scrolling-visual.spec.js --project=chromium
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

test('bg layer is fully opaque and gradient only covers bottom 30%', async ({ page }) => {
    await startGame(page);

    // Wait until the scrolling background tile layers exist
    await page.waitForFunction(() => {
        const scene = window.__GAME_SCENE__;
        if (!scene) return false;
        const bg = scene.backgroundSystem;
        return !!(
            bg &&
            bg._tileLayers &&
            bg._tileLayers.bg &&
            bg._tileLayers.mid &&
            bg._tileLayers.fg &&
            bg._gradientLayer
        );
    }, { timeout: 10000 });

    // Park the mouse / freeze the player so the camera doesn't drift.
    await page.mouse.move(0, 0);
    await page.evaluate(() => {
        const scene = window.__GAME_SCENE__;
        scene.isMouseActive = false;
        scene.mouseTarget = null;
        if (scene.player && scene.player.body) {
            scene.player.body.setVelocity(0, 0);
        }
    });
    await delay(200);

    const snap = await page.evaluate(() => {
        const scene = window.__GAME_SCENE__;
        const bg = scene.backgroundSystem;
        const bgLayer = bg._tileLayers.bg;
        const midLayer = bg._tileLayers.mid;
        const fgLayer = bg._tileLayers.fg;

        return {
            viewportW: bg.options.viewportW,
            viewportH: bg.options.viewportH,
            bgAlpha: bgLayer.alpha,
            midAlpha: midLayer.alpha,
            fgAlpha: fgLayer.alpha,
            // Probe the depth color the gradient layer would draw at the
            // current camera Y. We use the same _computeDepthColor the
            // gradient uses so we can assert it returns a non-zero color.
            depthColor: bg._computeDepthColor(
                scene.cameras.main.scrollY + bg.options.viewportH / 2
            ),
        };
    });

    test.info().annotations.push({
        type: 'snapshot',
        description: JSON.stringify(snap),
    });

    // bg layer must be essentially fully opaque (no longer 0.55 smearing).
    expect(snap.bgAlpha, 'bg layer must be fully opaque').toBeGreaterThanOrEqual(0.99);

    // mid layer should be much more visible than before (was 0.40).
    expect(snap.midAlpha, 'mid layer alpha must be at least 0.80').toBeGreaterThanOrEqual(0.80);

    // Sanity: depth color returns a real color (not 0/black which would
    // mean gradient is invisible — we'd want to know if that regresses).
    expect(snap.depthColor, 'depth color must be non-zero').not.toBe(0);
});

test('gradient fillRect only covers bottom 30% of viewport (depth haze)', async ({ page }) => {
    await startGame(page);

    await page.waitForFunction(() => {
        const scene = window.__GAME_SCENE__;
        if (!scene) return false;
        const bg = scene.backgroundSystem;
        return !!(
            bg &&
            bg._tileLayers &&
            bg._tileLayers.bg &&
            bg._gradientLayer
        );
    }, { timeout: 10000 });

    // Park and freeze player.
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

    // Record initial bg.x (creation value = viewportW/2 = 512), then
    // move the camera far right and verify parallax math still works
    // AND the gradient's fillRect is constrained to the bottom 30%.
    const initial = await page.evaluate(() => {
        const bg = window.__GAME_SCENE__.backgroundSystem._tileLayers.bg;
        return {
            x: bg.x,
            scrollFactorX: bg.scrollFactorX,
            viewportW: window.__GAME_SCENE__.backgroundSystem.options.viewportW,
        };
    });

    const SCROLL = 5000;
    await page.evaluate((scroll) => {
        const cam = window.__GAME_SCENE__.cameras.main;
        cam.stopFollow();
        cam.scrollX = scroll;
    }, SCROLL);

    // Let _updateDepthGradient run for a few frames.
    await delay(500);

    const result = await page.evaluate(() => {
        const scene = window.__GAME_SCENE__;
        const cam = scene.cameras.main;
        const bg = scene.backgroundSystem;
        const bgLayer = bg._tileLayers.bg;
        const g = bg._gradientLayer;

        // Install a fillRect spy for this one update so we can read the
        // exact arguments Phaser's Graphics got, regardless of how the
        // commandBuffer encodes them internally. (Phaser's WebGL command
        // buffer is a flat numeric array that's not stable to inspect
        // across versions, so a spy is the most robust hook.)
        if (!g.__fillRectSpy) {
            g.__fillRectCalls = [];
            const original = g.fillRect.bind(g);
            g.fillRect = function (x, y, w, h) {
                g.__fillRectCalls.push({ x, y, w, h });
                return original(x, y, w, h);
            };
            g.__fillRectSpy = true;
        } else {
            g.__fillRectCalls.length = 0;
        }

        // Force a single gradient update.
        bg._updateDepthGradient(cam.scrollY + bg.options.viewportH / 2);

        return {
            cameraScrollX: cam.scrollX,
            bgX: bgLayer.x,
            bgScreenX_actual: bgLayer.x - cam.scrollX * bgLayer.scrollFactorX,
            viewportW: bg.options.viewportW,
            viewportH: bg.options.viewportH,
            fillRectCount: g.__fillRectCalls.length,
            lastFill: g.__fillRectCalls[g.__fillRectCalls.length - 1] || null,
        };
    });

    test.info().annotations.push({
        type: 'snapshot',
        description: JSON.stringify({ initial, result }),
    });

    // 1. Parallax math is intact: bg.x stays at creation value (no-op
    //    setPosition), screenX_actual moved from 512 to 112.
    expect(result.bgX, 'bg.x must not be rewritten per-frame').toBe(initial.x);
    expect(result.cameraScrollX, 'camera scrollX must stick at SCROLL').toBe(SCROLL);
    expect(
        Math.abs(result.bgScreenX_actual - 512),
        'bg layer must visibly parallax (screenX_actual != 512)'
    ).toBeGreaterThan(50);

    // 2. Gradient update issued exactly one fillRect per call.
    expect(
        result.fillRectCount,
        'gradient must issue exactly one fillRect (depth haze band)'
    ).toBe(1);

    // 3. The fillRect y must start in the bottom 30% of the viewport
    //    (i.e. y >= viewportH * 0.7), NOT at y=0 (which would mean
    //    the gradient still covers the whole screen).
    const minStartY = Math.floor(result.viewportH * 0.7);
    expect(
        result.lastFill,
        'gradient must have a fillRect command'
    ).not.toBeNull();
    expect(
        result.lastFill.y,
        `gradient fillRect must start at y >= ${minStartY} (bottom 30% band)`
    ).toBeGreaterThanOrEqual(minStartY);
    // And it must reach the bottom of the viewport.
    expect(
        result.lastFill.y + result.lastFill.h,
        'gradient fillRect must reach the bottom of the viewport'
    ).toBeGreaterThanOrEqual(result.viewportH - 1);
    // And span the full width.
    expect(
        result.lastFill.w,
        'gradient fillRect must span the full viewport width'
    ).toBe(result.viewportW);
});
