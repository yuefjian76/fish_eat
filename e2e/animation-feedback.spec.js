import { test, expect } from '@playwright/test';

test.describe('AnimationFeedbackSystem', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8765?debug=true', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        // Click start button to enter GameScene
        const canvasBounds = await page.evaluate(() => {
            const rect = document.querySelector('canvas')?.getBoundingClientRect();
            return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
        });
        await page.mouse.click(canvasBounds.x + 512, canvasBounds.y + 520);
        await page.waitForTimeout(2000);
    });

    test('feedbackSystem exists in GameScene after start', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game?.scene.scenes.find(s => s.scene.key === 'GameScene');
            return {
                exists: !!scene?.feedbackSystem,
                hasConfig: !!scene?.feedbackSystem?.config,
                hasLevelUp: !!scene?.feedbackSystem?.config?.levelUp,
                hasSkillUse: !!scene?.feedbackSystem?.config?.skillUse,
                hasEat: !!scene?.feedbackSystem?.config?.eat,
            };
        });
        expect(result.exists).toBe(true);
        expect(result.hasConfig).toBe(true);
        expect(result.hasLevelUp).toBe(true);
        expect(result.hasSkillUse).toBe(true);
        expect(result.hasEat).toBe(true);
    });

    test('trigger("levelUp") creates display objects', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.scenes.find(s => s.scene.key === 'GameScene');
            const before = scene.add.displayList.length;
            scene.feedbackSystem.trigger('levelUp', { level: 5 });
            const after = scene.add.displayList.length;
            return { before, after, delta: after - before };
        });
        expect(result.delta).toBeGreaterThan(0);
    });

    test('trigger("skillUse") creates flash + text + particles', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.scenes.find(s => s.scene.key === 'GameScene');
            const before = scene.add.displayList.length;
            scene.feedbackSystem.trigger('skillUse', { slot: 'Q', text: '撕咬', color: '#FF4444' });
            const after = scene.add.displayList.length;
            return { before, after, delta: after - before };
        });
        expect(result.delta).toBeGreaterThan(5);
    });

    test('trigger("eat") creates particles', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.scenes.find(s => s.scene.key === 'GameScene');
            const before = scene.add.displayList.length;
            scene.feedbackSystem.trigger('eat', { x: 500, y: 400, exp: 10 });
            const after = scene.add.displayList.length;
            return { before, after, delta: after - before };
        });
        expect(result.delta).toBeGreaterThan(0);
    });

    test('trigger("unknown") returns null and does not throw', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.scenes.find(s => s.scene.key === 'GameScene');
            return scene.feedbackSystem.trigger('unknown', {});
        });
        expect(result).toBeNull();
    });
});
