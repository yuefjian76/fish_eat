/**
 * E2E Smoke Tests for Fish Eat Fish
 * Run with: npx playwright test e2e/smoke.spec.js --project=chromium
 * Requires game server running on port 8765
 */

import { test, expect } from '@playwright/test';

test('游戏加载成功，无崩溃', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas', { timeout: 5000 });
    // Wait for BootScene → MenuScene → GameScene transition
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
});

test('wave state 从 calm 开始', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);
    const waveState = await page.evaluate(() => window.__GAME_SCENE__?._waveState);
    expect(waveState).toBe('calm');
});

test('HP 初始值为 maxHp', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);
    const hp = await page.evaluate(() => window.__GAME_SCENE__?.hp);
    const maxHp = await page.evaluate(() => window.__GAME_SCENE__?.maxHp);
    expect(hp).toBe(maxHp);
});

test('score 初始为 0', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);
    const score = await page.evaluate(() => window.__GAME_SCENE__?.score);
    expect(score).toBe(0);
});

test('level 初始为 1', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);
    const level = await page.evaluate(() => window.__GAME_SCENE__?.level);
    expect(level).toBe(1);
});

test('debug overlay 可见（?debug=true）', async ({ page }) => {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);
    const debugText = await page.evaluate(() => window.__GAME_SCENE__?._debugText);
    expect(debugText).toBeTruthy();
});

test('无 debug 参数时 window.__GAME_SCENE__ 未暴露', async ({ page }) => {
    await page.goto('http://localhost:8765');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(3000);
    const gameScene = await page.evaluate(() => window.__GAME_SCENE__);
    expect(gameScene).toBeUndefined();
});