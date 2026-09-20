/**
 * E2E Smoke Tests for Fish Eat Fish
 * Run with: npx playwright test e2e/smoke.spec.js --project=chromium
 *
 * Uses the shared bootstrap in ./helpers/game.js: load → guest mode →
 * "开始游戏" button → wait for window.__GAME_SCENE__.
 */

import { test, expect } from '@playwright/test';
import { openGame, startGame, delay } from './helpers/game.js';

test('游戏加载成功，无崩溃', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    await openGame(page);
    await delay(2000);
    expect(errors).toEqual([]);
});

test('点击开始游戏后进入 GameScene', async ({ page }) => {
    await startGame(page);
    const scene = await page.evaluate(() => ({
        ready: window.__GAME_SCENE__ != null,
        hasPlayer: !!window.__GAME_SCENE__?.player,
    }));
    expect(scene.ready).toBe(true);
    expect(scene.hasPlayer).toBe(true);
});

test('wave state 从 calm 开始', async ({ page }) => {
    await startGame(page);
    const waveState = await page.evaluate(() => window.__GAME_SCENE__?.waveSystem?.getState());
    expect(waveState).toBe('calm');
});

test('HP 初始值为 maxHp', async ({ page }) => {
    await startGame(page);
    const { hp, maxHp } = await page.evaluate(() => ({
        hp: window.__GAME_SCENE__?.hp,
        maxHp: window.__GAME_SCENE__?.maxHp,
    }));
    expect(typeof maxHp).toBe('number');
    expect(maxHp).toBeGreaterThan(0);
    expect(hp).toBe(maxHp);
});

test('score 初始为 0', async ({ page }) => {
    await startGame(page);
    const score = await page.evaluate(() => window.__GAME_SCENE__?.score);
    expect(score).toBe(0);
});

test('level 初始为 1', async ({ page }) => {
    await startGame(page);
    const level = await page.evaluate(() => window.__GAME_SCENE__?.level);
    expect(level).toBe(1);
});

test('debug overlay 可见（?debug=true）', async ({ page }) => {
    await startGame(page);
    const debugText = await page.evaluate(() => window.__GAME_SCENE__?._debugText);
    expect(debugText).toBeTruthy();
    const content = await page.evaluate(() => window.__GAME_SCENE__?._debugText?.text);
    expect(content).toContain('HP');
});

test('无 debug 参数时 window.__GAME_SCENE__ 未暴露', async ({ page }) => {
    await openGame(page, { debug: false });
    await delay(2000);
    const gameScene = await page.evaluate(() => window.__GAME_SCENE__);
    expect(gameScene).toBeUndefined();
});
