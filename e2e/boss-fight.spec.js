/**
 * E2E tests for the feat-054 boss fight fixes.
 *
 * Regression targets (all found by driving the game through __DEBUG_API__):
 *   B1 boss config had no `size` -> NaN physics body -> invisible boss
 *   B3 spawning was never actually paused during a boss fight
 *   B5 bossDefeated was written under a key nothing ever read
 *   B7 the HP bar showed one hardcoded name for all three bosses
 *   B8 __DEBUG_API__.level()/boss() could not reproduce a boss fight
 *
 * Run with:
 *   npx playwright test e2e/boss-fight.spec.js --project=chromium
 */

import { test, expect } from '@playwright/test';
import { startGame } from './helpers/game.js';

/** Spawn a boss through the debug API and return its first observed state. */
async function spawnBoss(page, type = 'boss_squid') {
    return page.evaluate((t) => window.__DEBUG_API__.boss(t), type);
}

/** Snapshot of the live boss + fight state. */
async function readBossState(page) {
    return page.evaluate(() => {
        const s = window.__GAME_SCENE__;
        const boss = s.bossSystem.getCurrentBoss();
        const cam = s.cameras.main;
        const ui = s.scene.get('UIScene');
        return {
            inBossFight: s.bossSystem.isInBossFight(),
            bossType: boss?.bossType ?? null,
            name: boss?.displayName ?? null,
            hp: boss?.hp ?? null,
            maxHp: boss?.maxHp ?? null,
            x: boss?.graphics?.x ?? null,
            y: boss?.graphics?.y ?? null,
            size: boss?.fishConfig?.size ?? null,
            damage: boss?.fishConfig?.damage ?? null,
            attackCooldown: boss?.attackCooldown ?? null,
            inView: boss?.graphics
                ? cam.worldView.contains(boss.graphics.x, boss.graphics.y)
                : false,
            barName: ui.bossNameText.text,
            barVisible: ui.bossNameText.visible,
            enemies: s.enemies.length,
            bossDefeated: { ...s.bossDefeated },
        };
    });
}

test.describe('Boss fight (feat-054)', () => {
    test('boss() 生成的 Boss 可见：坐标有限且落在相机视口内', async ({ page }) => {
        await startGame(page);
        const spawned = await spawnBoss(page);
        expect(spawned.success).toBe(true);
        expect(spawned.hp).toBeGreaterThan(0);

        // 入场动画 2s，等它结束后再看位置
        await page.waitForTimeout(2600);
        const st = await readBossState(page);

        expect(Number.isFinite(st.x)).toBe(true);
        expect(Number.isFinite(st.y)).toBe(true);
        expect(st.inView).toBe(true);
        expect(st.size).toBe(200);
        expect(st.damage).toBe(18);
    });

    test('Boss 出现后不再刷怪（1v1）', async ({ page }) => {
        await startGame(page);
        await spawnBoss(page);

        // 给现有敌鱼打标记，之后新刷出来的不会有标记
        const before = await page.evaluate(() => {
            const s = window.__GAME_SCENE__;
            s.enemies.forEach((e, i) => { e.__tag = `t${i}`; });
            return { tagged: s.enemies.length, interval: s.waveSystem.getSpawnInterval() };
        });

        // 等两倍以上的刷新间隔
        await page.waitForTimeout(before.interval * 2 + 1500);

        const after = await page.evaluate(() => {
            const s = window.__GAME_SCENE__;
            return {
                untagged: s.enemies.filter((e) => e.__tag === undefined).length,
                inBossFight: s.bossSystem.isInBossFight(),
            };
        });

        expect(after.inBossFight).toBe(true);
        expect(after.untagged).toBe(0);
    });

    test('击败 Boss：记录进度、结束战斗、恢复刷怪', async ({ page }) => {
        await startGame(page);
        await spawnBoss(page);
        await page.waitForTimeout(600);

        await page.evaluate(() => {
            const s = window.__GAME_SCENE__;
            const boss = s.bossSystem.getCurrentBoss();
            boss.takeDamage(boss.hp);
        });
        await page.waitForFunction(
            () => window.__GAME_SCENE__.bossSystem.isInBossFight() === false,
            null,
            { timeout: 5000 }
        );

        const st = await readBossState(page);
        expect(st.bossDefeated.squid).toBe(true);
        expect(st.bossType).toBeNull();
        expect(st.barVisible).toBe(false);

        // 战斗结束后刷怪恢复：应出现没打标记的新敌鱼。
        // 用 waitForFunction 而不是固定 sleep —— 并行跑时帧率下降会让刷新变慢。
        await page.evaluate(() => {
            const s = window.__GAME_SCENE__;
            s.enemies.forEach((e, i) => { e.__tag = `r${i}`; });
        });
        await page.waitForFunction(
            () => window.__GAME_SCENE__.enemies.some((e) => e.__tag === undefined),
            null,
            { timeout: 20000 }
        );

        const untagged = await page.evaluate(
            () => window.__GAME_SCENE__.enemies.filter((e) => e.__tag === undefined).length
        );
        expect(untagged).toBeGreaterThan(0);
    });

    test('level(5) 同步 GrowthSystem 并触发 Boss 预警', async ({ page }) => {
        await startGame(page);

        const jumped = await page.evaluate(() => window.__DEBUG_API__.level(5));
        expect(jumped.success).toBe(true);

        const levels = await page.evaluate(() => ({
            sceneLevel: window.__GAME_SCENE__.level,
            growthLevel: window.__GAME_SCENE__.growthSystem.getLevel(),
            maxHp: window.__GAME_SCENE__.maxHp,
        }));
        expect(levels.growthLevel).toBe(5);
        expect(levels.sceneLevel).toBe(5);
        expect(levels.maxHp).toBe(180);

        // 3s 预警后 Boss 登场
        await page.waitForFunction(
            () => window.__GAME_SCENE__.bossSystem.isInBossFight() === true,
            null,
            { timeout: 8000 }
        );
        const st = await readBossState(page);
        expect(st.bossType).toBe('boss_squid');
        expect(st.maxHp).toBe(240);
    });

    test('升级到偶数级不会崩溃（Boss 触发路径必经）', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await startGame(page);
        // 走到 2 级会触发主题切换分支：ScrollingBackground 只有 setTheme()，
        // 以前这里调 transitionToNewTheme() 抛错，整个游戏循环冻结
        const first = await page.evaluate(() => window.__DEBUG_API__.maxExp());
        expect(first.newLevel).toBe(2);

        const second = await page.evaluate(() => window.__DEBUG_API__.maxExp());
        expect(second.newLevel).toBe(3);

        // 再跳到偶数级（4/6）确认仍然正常
        await page.evaluate(() => window.__DEBUG_API__.level(6));
        const state = await page.evaluate(() => ({
            level: window.__GAME_SCENE__.level,
            growthLevel: window.__GAME_SCENE__.growthSystem.getLevel(),
            alive: !!window.__GAME_SCENE__.backgroundSystem,
        }));

        expect(state.growthLevel).toBe(6);
        expect(state.alive).toBe(true);
        expect(errors).toEqual([]);
    });

    test('血条显示配置里的 Boss 名字', async ({ page }) => {
        await startGame(page);
        await spawnBoss(page, 'boss_shark_king');
        await page.waitForTimeout(400);

        const st = await readBossState(page);
        expect(st.barVisible).toBe(true);
        expect(st.barName).toBe('鲨鱼之王');
        expect(st.name).toBe('鲨鱼之王');
        expect(st.maxHp).toBe(280);
    });

    test('Boss 会伤害玩家（不再 NaN、不再 0 伤害）', async ({ page }) => {
        await startGame(page);
        await page.waitForTimeout(3500); // 等出生无敌结束

        await spawnBoss(page);
        await page.waitForTimeout(2600); // 等入场动画

        const result = await page.evaluate(async () => {
            const s = window.__GAME_SCENE__;
            const boss = s.bossSystem.getCurrentBoss();
            const before = s.hp;
            // 把 Boss 拉到玩家身边，强制进入攻击范围
            boss.graphics.x = s.player.x + 10;
            boss.graphics.y = s.player.y;
            boss.lastAttackTime = 0;
            const damage = boss.attackPlayer(s.player);
            return { before, damage, hpAfter: s.hp };
        });

        expect(Number.isFinite(result.damage)).toBe(true);
        expect(result.damage).toBe(18);
    });
});
