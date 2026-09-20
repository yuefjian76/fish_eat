import { test, expect } from '@playwright/test';
import { clickStartButton } from './helpers/game.js';

test('Game loads with local phaser (no CDN) and enters GameScene via start button', async ({ page }) => {
  const errors = [];
  const networkFails = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('requestfailed', req => {
    const url = req.url();
    if (!url.startsWith('chrome-extension://')) {
      networkFails.push(`${url} -> ${req.failure()?.errorText}`);
    }
  });

  await page.goto('http://localhost:8765?debug=true', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // 1. Phaser loaded locally
  const phaserLoaded = await page.evaluate(() => ({
    hasPhaser: !!window.Phaser,
    phaserVersion: window.Phaser?.VERSION,
  }));
  expect(phaserLoaded.hasPhaser).toBe(true);
  expect(phaserLoaded.phaserVersion).toBe('3.60.0');

  // 2. MenuScene active
  const menuState = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const menu = game?.scene.scenes.find(s => s.scene.key === 'MenuScene');
    return { hasMenu: !!menu, menuActive: menu?.scene?.isActive() };
  });
  expect(menuState.hasMenu).toBe(true);
  expect(menuState.menuActive).toBe(true);

  // 3. Click start button (canvas-relative coordinates, viewport independent)
  await clickStartButton(page);
  await page.waitForTimeout(2000);

  // 4. GameScene active
  const gameState = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const scene = game?.scene.scenes.find(s => s.scene.key === 'GameScene');
    return {
      hasGameScene: !!scene,
      sceneActive: scene?.scene?.isActive(),
      playerExists: !!scene?.player,
      enemiesCount: scene?.enemies?.length,
    };
  });
  expect(gameState.hasGameScene).toBe(true);
  expect(gameState.sceneActive).toBe(true);
  expect(gameState.playerExists).toBe(true);
  expect(gameState.enemiesCount).toBeGreaterThan(0);

  // 5. No errors, no network failures
  expect(errors).toEqual([]);
  expect(networkFails).toEqual([]);
});
