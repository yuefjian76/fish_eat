/**
 * Shared E2E bootstrap for Fish Eat Fish.
 *
 * Two things make the menu fragile to drive from tests:
 *   1. MenuScene renders an optional login overlay made of DOM buttons on
 *      top of the canvas ("游客模式 →").
 *   2. The "开始游戏" button is a Phaser text object at design coordinates
 *      (512, 520) inside a 1024x768 canvas. The canvas is centered in the
 *      page, so page coordinates must be derived from its bounding box —
 *      a hardcoded click position lands on the edge of the hit area (or
 *      misses it entirely) whenever the viewport size changes.
 */

export const GAME_URL = process.env.GAME_URL || 'http://localhost:8765';

export const DESIGN_WIDTH = 1024;
export const DESIGN_HEIGHT = 768;

/** Position of the MenuScene "开始游戏" text object in canvas coordinates. */
export const START_BUTTON = { x: 512, y: 520 };

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Load the game page and wait for the Phaser canvas to exist. */
export async function openGame(page, { debug = true } = {}) {
    const url = debug ? `${GAME_URL}/?debug=true` : `${GAME_URL}/`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas', { timeout: 15000 });
    return page;
}

/**
 * Dismiss the login overlay by choosing guest mode.
 * The overlay is created by MenuScene, so it can appear several frames
 * after the canvas; wait for it instead of polling with isVisible()
 * (which does not auto-wait and silently returns false too early).
 */
export async function dismissLogin(page, { timeout = 10000 } = {}) {
    const guestBtn = page.locator('button:has-text("游客模式")');
    try {
        await guestBtn.waitFor({ state: 'visible', timeout });
    } catch {
        return false;
    }
    await guestBtn.click();
    await guestBtn.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    return true;
}

/** Click the MenuScene "开始游戏" button using canvas-relative coordinates. */
export async function clickStartButton(page) {
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas bounding box unavailable');
    await page.mouse.click(
        box.x + START_BUTTON.x * (box.width / DESIGN_WIDTH),
        box.y + START_BUTTON.y * (box.height / DESIGN_HEIGHT)
    );
}

/** Wait until GameScene exposes itself on window (requires ?debug=true). */
export async function waitForGameScene(page, { timeout = 15000 } = {}) {
    await page.waitForFunction(() => window.__GAME_SCENE__ != null, null, { timeout });
    return page;
}

/** Wait until GameScene has built window.__DEBUG_API__ (requires ?debug=true). */
export async function waitForDebugApi(page, { timeout = 15000 } = {}) {
    await page.waitForFunction(() => window.__DEBUG_API__ != null, null, { timeout });
    return page;
}

/**
 * Boot straight into GameScene: load → guest mode → start button →
 * wait until the scene exposes window.__GAME_SCENE__.
 */
export async function startGame(page, { debug = true, sceneTimeout = 15000 } = {}) {
    await openGame(page, { debug });
    await dismissLogin(page);
    await clickStartButton(page);
    await waitForGameScene(page, { timeout: sceneTimeout });
    await delay(300);
    return page;
}
