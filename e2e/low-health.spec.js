/**
 * E2E tests for the feat-053 low-health warning.
 *
 * Warning contract (LowHealthWarningSystem → UIScene):
 *   ratio >= 0.30            : silent
 *   0.18 < ratio < 0.30      : red vignette, intensity scales with danger
 *   ratio <= 0.18 (critical) : + pulsing vignette, "危险" text, heartbeat sound
 *
 * Uses window.__DEBUG_API__.damage(n) / .fullHealth() to drive HP directly.
 *
 * Run with:
 *   npx playwright test e2e/low-health.spec.js --project=chromium
 */

import { test, expect } from '@playwright/test';
import { startGame, delay } from './helpers/game.js';

/** Read the rendered warning state from UIScene + the logic system. */
async function readWarning(page) {
    return page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        const ui = game.scene.getScene('UIScene');
        const scene = window.__GAME_SCENE__;
        return {
            hpRatio: scene.hp / scene.maxHp,
            vignetteVisible: ui.vignetteGraphics.visible,
            vignetteAlpha: ui.vignetteGraphics.alpha,
            dangerVisible: ui.dangerText.visible,
            dangerAlpha: ui.dangerText.alpha,
            dangerText: ui.dangerText.text,
            heartbeatCount: scene.lowHealthWarning.getHeartbeatCount(),
        };
    });
}

test.describe('LowHealthWarning (feat-053)', () => {
    test('满血时没有任何警告', async ({ page }) => {
        await startGame(page);
        const w = await readWarning(page);

        expect(w.hpRatio).toBe(1);
        expect(w.vignetteVisible).toBe(false);
        expect(w.vignetteAlpha).toBe(0);
        expect(w.dangerVisible).toBe(false);
        expect(w.heartbeatCount).toBe(0);
    });

    test('血量下降但未到 critical：只有红光，无文字无心跳', async ({ page }) => {
        await startGame(page);

        const result = await page.evaluate(() => {
            const scene = window.__GAME_SCENE__;
            return window.__DEBUG_API__.damage(scene.maxHp * 0.75); // → 25%
        });
        expect(result.success).toBe(true);

        await page.waitForFunction(
            () => window.__PHASER_GAME__.scene.getScene('UIScene').vignetteGraphics.visible === true,
            null,
            { timeout: 5000 }
        );

        const w = await readWarning(page);
        expect(w.hpRatio).toBeCloseTo(0.25, 2);
        expect(w.vignetteAlpha).toBeGreaterThan(0.05);
        expect(w.dangerVisible).toBe(false);

        await delay(1300);
        expect((await readWarning(page)).heartbeatCount).toBe(0);
    });

    test('critical 血量：红光脉动 + "危险"文字 + 心跳', async ({ page }) => {
        await startGame(page);

        await page.evaluate(() => {
            const scene = window.__GAME_SCENE__;
            return window.__DEBUG_API__.damage(scene.maxHp * 0.9); // → 10%
        });

        await page.waitForFunction(
            () => window.__PHASER_GAME__.scene.getScene('UIScene').dangerText.visible === true,
            null,
            { timeout: 5000 }
        );

        const w = await readWarning(page);
        expect(w.hpRatio).toBeCloseTo(0.1, 2);
        expect(w.vignetteVisible).toBe(true);
        expect(w.vignetteAlpha).toBeGreaterThan(0.15);
        expect(w.dangerText).toBe('危险');

        // Alpha must actually pulse (not a static overlay)
        const samples = [];
        for (let i = 0; i < 12; i++) {
            samples.push((await readWarning(page)).vignetteAlpha);
            await delay(60);
        }
        expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(0.03);

        // Heartbeat fires while critical (interval <= 1200ms)
        await page.waitForFunction(
            () => window.__GAME_SCENE__.lowHealthWarning.getHeartbeatCount() > 0,
            null,
            { timeout: 5000 }
        );
    });

    test('回满血后警告完全消失，心跳停止', async ({ page }) => {
        await startGame(page);

        await page.evaluate(() => {
            const scene = window.__GAME_SCENE__;
            return window.__DEBUG_API__.damage(scene.maxHp * 0.9);
        });
        await page.waitForFunction(
            () => window.__PHASER_GAME__?.scene?.getScene('UIScene').dangerText.visible === true,
            null,
            { timeout: 5000 }
        );

        await page.evaluate(() => window.__DEBUG_API__.fullHealth());
        await page.waitForFunction(
            () => window.__PHASER_GAME__.scene.getScene('UIScene').vignetteGraphics.visible === false,
            null,
            { timeout: 5000 }
        );

        const countAtHeal = (await readWarning(page)).heartbeatCount;
        const w = await readWarning(page);
        expect(w.vignetteAlpha).toBe(0);
        expect(w.dangerVisible).toBe(false);

        await delay(1300);
        expect((await readWarning(page)).heartbeatCount).toBe(countAtHeal);
    });

    test('死亡演出开始时清除低血量警告', async ({ page }) => {
        await startGame(page);

        await page.evaluate(() => {
            const scene = window.__GAME_SCENE__;
            return window.__DEBUG_API__.damage(scene.maxHp * 0.9);
        });
        await page.waitForFunction(
            () => window.__PHASER_GAME__?.scene?.getScene('UIScene').vignetteGraphics.visible === true,
            null,
            { timeout: 5000 }
        );

        await page.evaluate(() => window.__DEBUG_API__.kill());

        const w = await readWarning(page);
        expect(w.vignetteVisible).toBe(false);
        expect(w.dangerVisible).toBe(false);
    });

    test('damage() 参数校验', async ({ page }) => {
        await startGame(page);

        const [bad, zero] = await page.evaluate(() => [
            window.__DEBUG_API__.damage('abc'),
            window.__DEBUG_API__.damage(0),
        ]);

        expect(bad.success).toBe(false);
        expect(zero.success).toBe(false);
    });

    test('damage() 把血量打到 0 会走正常死亡流程（与 kill() 语义一致）', async ({ page }) => {
        await startGame(page);

        const result = await page.evaluate(() => {
            const scene = window.__GAME_SCENE__;
            return window.__DEBUG_API__.damage(scene.maxHp + 50);
        });
        expect(result.hp).toBe(0);

        const dying = await page.evaluate(() => window.__GAME_SCENE__._isDying);
        expect(dying).toBe(true);

        await page.waitForFunction(
            () => window.__PHASER_GAME__?.scene?.isActive('GameOverScene') === true,
            null,
            { timeout: 10000 }
        );
    });
});
