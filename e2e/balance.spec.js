/**
 * E2E tests for the feat-055 balance tuning.
 *
 * Regression targets (all found by measuring a real run through __DEBUG_API__):
 *   B1 玩家体型每级 ×1.5 复利 → Lv4 之后所有普通敌鱼可吃，接触伤害永不触发
 *   B2 敌人等级被钉死在 [1,3] → 敌人尺寸/血量几乎不随玩家成长
 *   B3 刷怪表不含 mutant_shark / giant_jellyfish（死内容）
 *   B4 Boss 体型固定 → 满级玩家比最终 Boss 还大
 *   B5 __DEBUG_API__.spawn() 参数错位 + 生成在远离玩家的世界角落
 *   B6 难度随时间放大"尺寸" → 开局 20 秒后唯一可吃的虾被放大到吃不下（成长死锁）
 *
 * Run with:
 *   npx playwright test e2e/balance.spec.js --project=chromium
 */

import { test, expect } from '@playwright/test';
import { startGame, delay } from './helpers/game.js';

/** 读取玩家/敌人/平衡相关的实况。 */
async function readBalance(page) {
    return page.evaluate(() => {
        const s = window.__GAME_SCENE__;
        const playerSize = s.player.playerData.size;
        const enemies = (s.enemies || []).map((e) => ({
            type: e.fishType,
            size: e.fishConfig.size,
            edible: playerSize > e.fishConfig.size * 1.2,
            threat: e.fishConfig.size > playerSize * 1.2,
        }));
        return {
            level: s.level,
            maxHp: s.maxHp,
            hp: s.hp,
            playerSize,
            detailed: window.__DEBUG_API__.state.detailed().player,
            enemies,
        };
    });
}

test.describe('Balance tuning (feat-055)', () => {
    test('B5: spawn() 生成在玩家周围，且 fishType 是正确的类型字符串', async ({ page }) => {
        await startGame(page);

        const result = await page.evaluate(() => {
            const api = window.__DEBUG_API__;
            api.killAll();
            const r = api.spawn('shark', 3);
            const s = window.__GAME_SCENE__;
            return {
                r,
                player: { x: s.player.x, y: s.player.y },
                enemies: s.enemies.map((e) => ({
                    type: e.fishType,
                    x: e.graphics.x,
                    y: e.graphics.y,
                    size: e.fishConfig.size,
                })),
            };
        });

        expect(result.r.spawned).toBe(3);

        for (const enemy of result.enemies) {
            expect(enemy.type).toBe('shark');

            const dist = Math.hypot(enemy.x - result.player.x, enemy.y - result.player.y);
            expect(dist).toBeGreaterThan(200);
            expect(dist).toBeLessThan(900);
        }
    });

    test('B6: Lv1 的可吃小鱼不会因时间推移而变成不可吃', async ({ page }) => {
        await startGame(page);

        // 难度随时长爬升（最多 +30%）。旧实现把它乘进 size，
        // 于是唯一可吃的虾在 ~20s 后越过了 1.2 倍判定，玩家永远无法升级。
        const baseline = await page.evaluate(() => {
            const s = window.__GAME_SCENE__;
            const before = s._getDifficultyMultiplier();
            const shrimpSize = s.fishData.shrimp.size;
            s.gameStartTime = Date.now() - 300000; // 把生存时间推后 5 分钟
            return {
                before,
                shrimpSize,
                playerSize: s.player.playerData.size,
                after: s._getDifficultyMultiplier(),
            };
        });

        // 难度确实涨上去了（否则这个测试没有意义）
        expect(baseline.after).toBeGreaterThan(baseline.before);
        // 但虾的尺寸不吃难度加成，仍然在可吃范围内
        expect(baseline.shrimpSize * 1.2).toBeLessThan(baseline.playerSize);

        // 让刷怪跑一会儿，确认自然刷出来的虾都还是可吃的
        await page.waitForFunction(
            () => window.__GAME_SCENE__.enemies.some((e) => e.fishType === 'shrimp'),
            null,
            { timeout: 20000 }
        );

        const observed = await page.evaluate(() => {
            const s = window.__GAME_SCENE__;
            const playerSize = s.player.playerData.size;
            return {
                playerSize,
                sizes: s.enemies
                    .filter((e) => e.fishType === 'shrimp')
                    .map((e) => e.fishConfig.size),
            };
        });

        expect(observed.sizes.length).toBeGreaterThan(0);
        for (const size of observed.sizes) {
            expect(size * 1.2).toBeLessThan(observed.playerSize);
        }
    });

    test('B1: 满级体型收敛到 9~10 倍，不再让玩家大于最终 Boss', async ({ page }) => {
        await startGame(page);

        const state = await page.evaluate(() => {
            const api = window.__DEBUG_API__;
            const s = window.__GAME_SCENE__;
            api.level(11);
            return {
                level: s.level,
                size: s.player.playerData.size,
                baseSize: s._playerBaseSize,
                bossSize: s.fishData.boss_sea_dragon.size,
            };
        });

        expect(state.level).toBe(11);
        const ratio = state.size / state.baseSize;
        expect(ratio).toBeGreaterThan(9);
        expect(ratio).toBeLessThan(10);
        expect(state.size).toBeLessThan(state.bossSize);
    });

    test('B1: 调试 API 的体型与真实成长曲线一致（level(n) 跳级不跑偏）', async ({ page }) => {
        await startGame(page);

        const rows = await page.evaluate(() => {
            const api = window.__DEBUG_API__;
            const s = window.__GAME_SCENE__;
            const out = [];
            for (const lv of [3, 6, 9, 11]) {
                api.level(lv);
                const d = api.state.detailed().player;
                out.push({ lv, size: d.size, expectedSize: d.expectedSize });
            }
            return out;
        });

        for (const row of rows) {
            expect(row.size).toBe(row.expectedSize);
        }
    });

    test('B2/B4: 高等级仍存在"威胁"档，且 Boss 比玩家大', async ({ page }) => {
        await startGame(page);

        const state = await page.evaluate(() => {
            const api = window.__DEBUG_API__;
            const s = window.__GAME_SCENE__;
            api.level(11);
            const playerSize = s.player.playerData.size;
            const enemyScale = s._getEnemyScale();
            const boss = api.boss('boss_sea_dragon');
            return {
                playerSize,
                enemyScale,
                giant: Math.floor(s.fishData.giant_jellyfish.size * enemyScale),
                mutant: Math.floor(s.fishData.mutant_shark.size * enemyScale),
                bossSize: boss.bossType ? s.bossSystem.getCurrentBoss().fishConfig.size : null,
            };
        });

        // 大型敌鱼必须超过玩家的可吃上限（1.2×），否则玩家永远无敌
        expect(state.giant).toBeGreaterThan(state.playerSize * 1.2);
        expect(state.mutant).toBeLessThanOrEqual(state.playerSize * 1.2);
        // Boss 必须仍然显著大于玩家
        expect(state.bossSize).toBeGreaterThan(state.playerSize * 1.5);
    });

    test('接触伤害被限制在玩家最大生命的 25% 以内', async ({ page }) => {
        await startGame(page);

        // 出生保护 3s 内不结算接触伤害，先等它结束（与真实开局一致）
        await page.waitForFunction(() => window.__GAME_SCENE__._spawnInvincible === false, null, {
            timeout: 10000,
        });

        const result = await page.evaluate(() => {
            const api = window.__DEBUG_API__;
            const s = window.__GAME_SCENE__;
            api.level(11);
            api.killAll();
            api.fullHealth();

            const maxHp = s.maxHp;
            const playerSize = s.player.playerData.size;

            // 构造一条远大于玩家的敌鱼（模拟"被大鱼撞到"）
            const config = { ...s.fishData.mutant_shark, size: playerSize * 3 };
            let lastContactAt;
            const fakeFish = {
                fishData: config,
                fishType: 'mutant_shark',
                x: s.player.x,
                y: s.player.y,
                getData: () => lastContactAt,
                setData: (_k, v) => { lastContactAt = v; },
            };

            const collision = s.collisionSystem.checkCollision(s.player, fakeFish, s.player.playerData);
            const before = s.hp;
            s._handleCollisionResult({ ...collision, fish: fakeFish });

            return {
                type: collision.type,
                raw: collision.damage,
                applied: before - s.hp,
                maxHp,
            };
        });

        expect(result.type).toBe('damaged');
        expect(result.raw).toBeGreaterThan(result.applied); // 上限确实生效
        expect(result.applied).toBeGreaterThan(0);
        expect(result.applied).toBeLessThanOrEqual(Math.floor(result.maxHp * 0.25));
    });

    test('B3: 高等级的刷怪表包含此前永不出现的大型鱼', async ({ page }) => {
        await startGame(page);

        const weights = await page.evaluate(() => {
            const s = window.__GAME_SCENE__;
            return { lv9: s._getSpawnWeights(9), lv11: s._getSpawnWeights(11) };
        });

        expect(weights.lv9.giant_jellyfish).toBeGreaterThan(0);
        expect(weights.lv9.mutant_shark).toBeGreaterThan(0);
        expect(weights.lv11.giant_jellyfish).toBeGreaterThan(0);
        expect(weights.lv11.mutant_shark).toBeGreaterThan(0);

        for (const table of [weights.lv9, weights.lv11]) {
            const sum = Object.values(table).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1.0, 5);
        }
    });
});
