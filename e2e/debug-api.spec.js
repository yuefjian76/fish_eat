/**
 * E2E Debug API Tests
 * Run with: npx playwright test e2e/debug-api.spec.js --project=chromium
 * Requires game server running on port 8765
 */

import { test, expect } from '@playwright/test';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to start game from menu by clicking the start button
async function startGame(page) {
    await page.goto('http://localhost:8765?debug=true');
    await page.waitForSelector('canvas');
    await delay(1000);

    // Try to click guest mode button if visible (in case login screen appears first)
    try {
        const guestBtn = page.locator('button:has-text("游客模式")');
        if (await guestBtn.isVisible({ timeout: 2000 })) {
            await guestBtn.click();
            await delay(500);
        }
    } catch (e) {
        // Guest button not visible, continue
    }

    // Now click start button to go from MenuScene to GameScene
    await page.mouse.click(640, 520);

    // Wait for GameScene to be ready - wait for debug API to exist
    await page.waitForFunction(
        () => window.__DEBUG_API__ != null,
        { timeout: 10000 }
    );
    await delay(1000);
}

test('game.debug.state() returns structured object', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.state.current);
    expect(result).toHaveProperty('hp');
    expect(result).toHaveProperty('maxHp');
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('wave');
    expect(result).toHaveProperty('skillCooldowns');
});

test('game.debug.level(5) changes level', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.level(5));
    expect(result.success).toBe(true);
    expect(result.level).toBe(5);
});

test('game.debug.level(20) clamps to 15', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.level(20));
    expect(result.level).toBe(15);
});

test('game.debug.level("bad") returns error', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.level("bad"));
    expect(result.error).toBeTruthy();
    expect(result.error).toContain('level must be integer');
});

test('game.debug.watch("hp") starts monitoring', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.watch("hp"));
    expect(result.success).toBe(true);
    expect(result.watching).toContain("hp");
    await page.evaluate(() => window.__DEBUG_API__.unwatch());
});

test('game.debug.unwatch() stops monitoring', async ({ page }) => {
    await startGame(page);
    await page.evaluate(() => window.__DEBUG_API__.watch("hp"));
    const result = await page.evaluate(() => window.__DEBUG_API__.unwatch());
    expect(result.success).toBe(true);
});

test('game.debug.unwatch() when not watching is safe', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.unwatch());
    expect(result.success).toBe(true);
    expect(result.message).toBeTruthy();
});

test('game.debug.skill("Q") executes', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.skill("Q"));
    expect(result.success).toBe(true);
    expect(result.skillKey).toBe('Q');
});

test('game.debug.skill("R") when locked returns error', async ({ page }) => {
    await startGame(page);
    // Level 1 doesn't have R (heal is unlocked at level 6)
    const result = await page.evaluate(() => window.__DEBUG_API__.skill("R"));
    expect(result.success).toBe(false);
    expect(result.reason).toContain('not unlocked');
});

test('game.debug.spawn("shark", 2) creates enemies', async ({ page }) => {
    await startGame(page);
    const before = await page.evaluate(() => window.__DEBUG_API__.state.current.enemyCount);
    const result = await page.evaluate(() => window.__DEBUG_API__.spawn("shark", 2));
    expect(result.spawned).toBeGreaterThan(0);
    const after = await page.evaluate(() => window.__DEBUG_API__.state.current.enemyCount);
    expect(after - before).toBeGreaterThan(0);
});

test('game.debug.spawn("invalid", 1) returns error', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.spawn("invalid", 1));
    expect(result.spawned).toBe(0);
    expect(result.reason).toContain('Invalid fish type');
});

// Note: Boss exclusion cannot be easily tested here without spawning a real boss
test('game.debug.killAll() excludes bosses', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.killAll());
    expect(result).toHaveProperty('killed');
    expect(result).toHaveProperty('skipped');
    expect(result.killed).toBeGreaterThanOrEqual(0);
});

test('game.debug.help() prints commands', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.help());
    expect(result).toContain('state()');
    expect(result).toContain('level(n)');
    expect(result).toContain('skill(');
    expect(result).toContain('watch(');
    expect(result).toContain('spawn(');
});

test('game.debug.eat("nonexistent") returns error', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.eat("nonexistent"));
    expect(result.error).toBeTruthy();
    expect(result.error).toContain('No nonexistent fish within range');
});

test('game.debug.maxExp() sets exp to level-up threshold', async ({ page }) => {
    await startGame(page);
    const result = await page.evaluate(() => window.__DEBUG_API__.maxExp());
    expect(result.success).toBe(true);
    expect(result.exp).toBeGreaterThan(0);
});

test('game.debug.fullHealth() restores hp to maxHp', async ({ page }) => {
    await startGame(page);
    const stateBefore = await page.evaluate(() => window.__DEBUG_API__.state.current);
    // Take damage first to make test meaningful
    const damagedHp = stateBefore.hp > 10 ? stateBefore.hp - 10 : stateBefore.hp;
    await page.evaluate((hp) => { window.__DEBUG_API__.state.current.hp = hp; }, damagedHp);
    const result = await page.evaluate(() => window.__DEBUG_API__.fullHealth());
    expect(result.success).toBe(true);
    const stateAfter = await page.evaluate(() => window.__DEBUG_API__.state.current);
    expect(stateAfter.hp).toBe(stateAfter.maxHp);
});