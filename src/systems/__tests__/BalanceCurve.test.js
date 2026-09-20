/**
 * BalanceCurve.test.js - 平衡曲线纯函数测试（feat-055）
 *
 * 核心不变式：玩家 1~11 级全程都必须同时存在「可吃 / 中立 / 威胁」三档，
 * 否则难度曲线会在中期塌陷（Lv4 后无威胁）或早期不可玩（Lv1 无可吃）。
 */
import {
    DEFAULT_SIZE_GROWTH_FACTOR,
    MAX_ENEMY_SCALE,
    getPlayerSizeMultipliers,
    getPlayerSizeAtLevel,
    getEnemyScale,
    classifyFishAgainst,
    getSpawnWeights,
    capContactDamage,
} from '../BalanceCurve.js';
import levelsData from '../../config/levels.json';
import fishData from '../../config/fish.json';

const MAX_LEVEL = levelsData.experienceTable.length;
const PLAYER_BASE_SIZE = fishData.clownfish.size;
const PLAYER_HP_BASE = fishData.clownfish.hp;
const HP_PER_LEVEL = 20;

describe('BalanceCurve.getPlayerSizeMultipliers', () => {
    test('levels.json 提供了每级一个倍率', () => {
        const mults = getPlayerSizeMultipliers(levelsData);
        expect(mults).toHaveLength(MAX_LEVEL - 1);
        mults.forEach(m => expect(m).toBeGreaterThan(1));
    });

    test('表缺失时回退到历史默认 1.5', () => {
        const mults = getPlayerSizeMultipliers({ experienceTable: [0, 1, 2] });
        expect(mults).toEqual([DEFAULT_SIZE_GROWTH_FACTOR, DEFAULT_SIZE_GROWTH_FACTOR]);
    });

    test('表内出现非法值时逐项回退，不影响其它项', () => {
        const mults = getPlayerSizeMultipliers({
            experienceTable: [0, 1, 2, 3],
            sizeGrowth: [1.4, 'x', -2],
        });
        expect(mults[0]).toBe(1.4);
        expect(mults[1]).toBe(DEFAULT_SIZE_GROWTH_FACTOR);
        expect(mults[2]).toBe(DEFAULT_SIZE_GROWTH_FACTOR);
    });

    test('experienceTable 缺失时不抛错', () => {
        expect(getPlayerSizeMultipliers(undefined)).toEqual([]);
    });
});

describe('BalanceCurve.getPlayerSizeAtLevel', () => {
    test('Lv1 等于基准体型', () => {
        expect(getPlayerSizeAtLevel(PLAYER_BASE_SIZE, 1, levelsData)).toBe(PLAYER_BASE_SIZE);
    });

    test('逐级单调递增', () => {
        let prev = 0;
        for (let lv = 1; lv <= MAX_LEVEL; lv++) {
            const size = getPlayerSizeAtLevel(PLAYER_BASE_SIZE, lv, levelsData);
            expect(size).toBeGreaterThan(prev);
            prev = size;
        }
    });

    test('满级体型收敛到 9~10 倍（旧曲线是 57.7 倍）', () => {
        const ratio = getPlayerSizeAtLevel(PLAYER_BASE_SIZE, MAX_LEVEL, levelsData) / PLAYER_BASE_SIZE;
        expect(ratio).toBeGreaterThan(9);
        expect(ratio).toBeLessThan(10);
    });

    test('满级玩家仍小于最终 Boss 基础体型（保留压迫感）', () => {
        const size = getPlayerSizeAtLevel(PLAYER_BASE_SIZE, MAX_LEVEL, levelsData);
        expect(size).toBeLessThan(fishData.boss_sea_dragon.size);
    });

    test('非法等级被夹到 1 及以上', () => {
        expect(getPlayerSizeAtLevel(PLAYER_BASE_SIZE, 0, levelsData)).toBe(PLAYER_BASE_SIZE);
        expect(getPlayerSizeAtLevel(PLAYER_BASE_SIZE, NaN, levelsData)).toBe(PLAYER_BASE_SIZE);
    });
});

describe('BalanceCurve.getEnemyScale', () => {
    test('玩家未成长时缩放为 1（不缩小敌人）', () => {
        expect(getEnemyScale(30, 30)).toBe(1);
        expect(getEnemyScale(30, 20)).toBe(1);
    });

    test('按体型比开方增长', () => {
        expect(getEnemyScale(30, 120)).toBeCloseTo(2, 5);
        expect(getEnemyScale(30, 270)).toBeCloseTo(3, 5);
    });

    test('有上限，避免数值失控', () => {
        expect(getEnemyScale(30, 30 * 100)).toBe(MAX_ENEMY_SCALE);
    });

    test('非法输入回退为 1', () => {
        expect(getEnemyScale(0, 100)).toBe(1);
        expect(getEnemyScale(30, NaN)).toBe(1);
    });
});

describe('BalanceCurve 三档阶梯（核心不变式）', () => {
    const normalFishTypes = Object.entries(fishData)
        .filter(([, cfg]) => !cfg.boss)
        .map(([type, cfg]) => ({ type, size: cfg.size }));

    test.each(Array.from({ length: MAX_LEVEL }, (_, i) => i + 1))(
        'Lv%i：刷怪表里同时存在可吃与威胁（按权重）',
        (level) => {
            const playerSize = getPlayerSizeAtLevel(PLAYER_BASE_SIZE, level, levelsData);
            const scale = getEnemyScale(PLAYER_BASE_SIZE, playerSize);
            const weights = getSpawnWeights(level);

            let foodWeight = 0;
            let threatWeight = 0;
            for (const [type, weight] of Object.entries(weights)) {
                const size = Math.floor(fishData[type].size * scale);
                const band = classifyFishAgainst(playerSize, size);
                if (band === 'food') foodWeight += weight;
                if (band === 'threat') threatWeight += weight;
            }

            // 只断言"整份 fish.json 里存在"是不够的：Lv3~6 的历史权重表
            // 一条威胁鱼都没有（实测 11 可吃 / 0 威胁），被这条断言挡下。
            expect(foodWeight).toBeGreaterThan(0.25);
            expect(threatWeight).toBeGreaterThan(0.03);
        }
    );

    test('全鱼种范围内每个等级都有可吃与威胁（更强的阶梯不变量）', () => {
        for (let level = 1; level <= MAX_LEVEL; level++) {
            const playerSize = getPlayerSizeAtLevel(PLAYER_BASE_SIZE, level, levelsData);
            const scale = getEnemyScale(PLAYER_BASE_SIZE, playerSize);
            const bands = normalFishTypes.map(({ size }) =>
                classifyFishAgainst(playerSize, Math.floor(size * scale))
            );
            expect(bands).toContain('food');
            expect(bands).toContain('threat');
        }
    });

    test('Lv1 的刷怪表里至少有一种可吃的（否则开局无法成长）', () => {
        const playerSize = getPlayerSizeAtLevel(PLAYER_BASE_SIZE, 1, levelsData);
        const weights = getSpawnWeights(1);
        const food = Object.keys(weights).filter(
            (type) => classifyFishAgainst(playerSize, fishData[type].size) === 'food'
        );
        expect(food).toContain('shrimp');
    });
});

describe('BalanceCurve.getSpawnWeights', () => {
    test('任意等级权重和为 1', () => {
        for (let lv = 1; lv <= 20; lv++) {
            const sum = Object.values(getSpawnWeights(lv)).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1.0, 5);
        }
    });

    test('低等级不含 eel / anglerfish 这类高等级鱼', () => {
        const w = getSpawnWeights(1);
        expect(w.anglerfish).toBeUndefined();
        expect(w.eel).toBeUndefined();
    });

    test('mutant_shark / giant_jellyfish 不再是死内容，各等级段都有出场', () => {
        for (const lv of [1, 5, 8, 11]) {
            const w = getSpawnWeights(lv);
            expect((w.giant_jellyfish || 0) + (w.mutant_shark || 0)).toBeGreaterThan(0);
        }
        expect(getSpawnWeights(11).giant_jellyfish).toBeGreaterThan(0);
        expect(getSpawnWeights(11).mutant_shark).toBeGreaterThan(0);
    });

    test('权重表里的类型都存在于 fish.json', () => {
        for (const lv of [1, 5, 8, 11]) {
            Object.keys(getSpawnWeights(lv)).forEach((type) => {
                expect(fishData[type]).toBeDefined();
            });
        }
    });

    test('非法等级按 Lv1 处理', () => {
        expect(getSpawnWeights(undefined)).toEqual(getSpawnWeights(1));
    });
});

describe('BalanceCurve.capContactDamage', () => {
    test('低于上限时保持原值', () => {
        expect(capContactDamage(10, 300)).toBe(10);
    });

    test('高于上限时被夹到最大生命的 25%', () => {
        expect(capContactDamage(500, 100)).toBe(25);
        expect(capContactDamage(200, 320)).toBe(80);
    });

    test('满级玩家遇到最大体型威胁鱼仍能承受至少 4 次', () => {
        const playerSize = getPlayerSizeAtLevel(PLAYER_BASE_SIZE, MAX_LEVEL, levelsData);
        const scale = getEnemyScale(PLAYER_BASE_SIZE, playerSize);
        const biggestThreat = Math.floor(fishData.giant_jellyfish.size * scale);
        const rawDamage = Math.floor(biggestThreat / 4);
        const maxHp = PLAYER_HP_BASE + HP_PER_LEVEL * (MAX_LEVEL - 1);

        const applied = capContactDamage(rawDamage, maxHp);
        expect(rawDamage).toBeGreaterThan(applied); // 上限确实生效
        expect(Math.ceil(maxHp / applied)).toBeGreaterThanOrEqual(4);
    });

    test('非法输入返回 0 或原值', () => {
        expect(capContactDamage(0, 100)).toBe(0);
        expect(capContactDamage(-5, 100)).toBe(0);
        expect(capContactDamage(20, 0)).toBe(20);
    });
});
