/**
 * E2E tests for the feat-052 death sequence.
 *
 * Before feat-052 the player died by hard-cutting to GameOverScene.
 * Now: hitStop (world frozen + flash/shake) → impact (camera push-in,
 * player fade, particles, "GAME OVER") → fadeOut → GameOverScene.
 *
 * Uses window.__DEBUG_API__.kill() so the sequence can be triggered
 * deterministically without waiting for enemies to land a killing blow.
 *
 * Run with:
 *   npx playwright test e2e/death-sequence.spec.js --project=chromium
 */

import { test, expect } from '@playwright/test';
import { startGame, delay } from './helpers/game.js';

test.describe('DeathSequence (feat-052)', () => {
    test('kill() 触发死亡演出：世界冻结、HP 归零、进入 hitStop 阶段', async ({ page }) => {
        await startGame(page);

        const triggered = await page.evaluate(() => window.__DEBUG_API__.kill());
        expect(triggered.success).toBe(true);
        expect(triggered.hp).toBe(0);

        const atDeath = await page.evaluate(() => {
            const scene = window.__GAME_SCENE__;
            return {
                dying: scene._isDying,
                hp: scene.hp,
                physicsPaused: scene.physics.world.isPaused,
                phase: scene.deathSequence.getPhase(),
                playerVelocity: {
                    x: scene.player.body.velocity.x,
                    y: scene.player.body.velocity.y,
                },
            };
        });

        expect(atDeath.dying).toBe(true);
        expect(atDeath.hp).toBe(0);
        expect(atDeath.physicsPaused).toBe(true);
        expect(atDeath.phase).toBe('hitStop');
        expect(atDeath.playerVelocity).toEqual({ x: 0, y: 0 });
    });

    test('impact 阶段镜头推进到玩家身上', async ({ page }) => {
        await startGame(page);
        const zoomBefore = await page.evaluate(() => window.__GAME_SCENE__.cameras.main.zoom);
        expect(zoomBefore).toBeCloseTo(1, 1);

        await page.evaluate(() => window.__DEBUG_API__.kill());

        // Wait until the camera push-in is actually visible. A fixed sleep is
        // unreliable here: tween progress depends on when the frame lands.
        await page.waitForFunction(
            () => (window.__GAME_SCENE__?.cameras?.main?.zoom ?? 1) > 1.05,
            null,
            { timeout: 5000 }
        );

        const zoomDuring = await page.evaluate(() => ({
            zoom: window.__GAME_SCENE__.cameras.main.zoom,
            phase: window.__GAME_SCENE__.deathSequence.getPhase(),
        }));
        expect(zoomDuring.zoom).toBeGreaterThan(1.05);
        expect(zoomDuring.phase).toBe('impact');
    });

    test('演出结束后进入 GameOverScene，且结算数据在死亡瞬间定格', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await startGame(page);

        await page.evaluate(() => window.__DEBUG_API__.kill());
        const payloadAtDeath = await page.evaluate(() => ({ ...window.__GAME_SCENE__._deathPayload }));

        await page.waitForFunction(
            () => window.__PHASER_GAME__?.scene?.isActive('GameOverScene') === true,
            null,
            { timeout: 10000 }
        );

        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const gameOver = game.scene.getScene('GameOverScene');
            const data = gameOver.sys.settings.data;
            return {
                gameSceneActive: game.scene.isActive('GameScene'),
                score: data.score,
                level: data.level,
                kills: data.kills,
                survivalTime: data.survivalTime,
            };
        });

        expect(result.gameSceneActive).toBe(false);
        expect(result.score).toBe(payloadAtDeath.score);
        expect(result.level).toBe(payloadAtDeath.level);
        expect(result.kills).toBe(payloadAtDeath.kills);
        // Snapshot taken at death — the ~1.35s sequence must not inflate it
        expect(result.survivalTime).toBe(payloadAtDeath.survivalTime);
        expect(errors).toEqual([]);
    });

    test('死亡演出期间重复 kill() 被拒绝（重入保护）', async ({ page }) => {
        await startGame(page);

        const [first, second] = await page.evaluate(() => [
            window.__DEBUG_API__.kill(),
            window.__DEBUG_API__.kill(),
        ]);

        expect(first.success).toBe(true);
        expect(second.success).toBe(false);
        expect(second.error).toContain('already running');
    });

    test('"GAME OVER" 文字渲染在镜头视口中心（不是世界原点附近）', async ({ page }) => {
        await startGame(page);
        await page.evaluate(() => window.__DEBUG_API__.kill());

        // Wait until the text has finished fading in
        await page.waitForFunction(
            () => {
                const scene = window.__GAME_SCENE__;
                return !!scene?._deathText && scene._deathText.alpha > 0.9;
            },
            null,
            { timeout: 5000 }
        );

        const textState = await page.evaluate(() => {
            const scene = window.__GAME_SCENE__;
            const cam = scene.cameras.main;
            const text = scene._deathText;
            const view = cam.worldView;
            return {
                content: text.text,
                visible: text.visible,
                alpha: text.alpha,
                // World-space containment is what actually decides whether the
                // text lands on screen once the camera is zoomed on the player.
                insideView: view.contains(text.x, text.y),
                cameraMid: { x: cam.midPoint.x, y: cam.midPoint.y },
                textPos: { x: text.x, y: text.y },
                zoom: cam.zoom,
            };
        });

        expect(textState.content).toBe('GAME OVER');
        expect(textState.visible).toBe(true);
        expect(textState.alpha).toBeGreaterThan(0.9);
        expect(textState.insideView).toBe(true);
        expect(textState.textPos.x).toBeCloseTo(textState.cameraMid.x, 0);
        expect(textState.textPos.y).toBeCloseTo(textState.cameraMid.y, 0);
        expect(textState.zoom).toBeGreaterThan(1);
    });
});
