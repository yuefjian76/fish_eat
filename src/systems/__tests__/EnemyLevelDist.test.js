/**
 * EnemyLevelDist.test.js - 敌人等级分布测试
 *
 * feat-055 起改为直接测试真实实现（`BalanceCurve.pickEnemyLevel`）。
 * 旧版本在本文件里内联了一份"70/20/10 + 无区间限制"的逻辑副本，
 * 与 GameScene 的真实实现早已不一致 —— 那种"文档测试"会说谎。
 */
import { pickEnemyLevel, getEnemyLevelRange } from '../BalanceCurve.js';

/**
 * 跑等级分布。样本量取 20000，容差给足，避免统计抖动导致 flaky。
 */
function distribution({ zoneRange, playerLevel, iterations = 20000, survivalMinutes = 0 }) {
    const counts = new Map();
    for (let n = 0; n < iterations; n++) {
        const lv = pickEnemyLevel(zoneRange, playerLevel, { survivalMinutes });
        counts.set(lv, (counts.get(lv) || 0) + 1);
    }
    return counts;
}

describe('EnemyLevelDistribution', () => {
    test('低等级（Lv1~3）不会低于 1 级', () => {
        for (let n = 0; n < 500; n++) {
            expect(pickEnemyLevel([1, 3], 1)).toBeGreaterThanOrEqual(1);
        }
    });

    test('敌人等级跟随玩家：高等级时区间上移，不会永远停在 [1,3]', () => {
        const { min, max } = getEnemyLevelRange([1, 3], 11);
        expect(min).toBe(9);
        expect(max).toBe(13);

        for (let n = 0; n < 500; n++) {
            const lv = pickEnemyLevel([1, 3], 11);
            expect(lv).toBeGreaterThanOrEqual(9);
            expect(lv).toBeLessThanOrEqual(13);
        }
    });

    test('区域范围更大时取并集，不会被区域压小', () => {
        expect(getEnemyLevelRange([6, 9], 5)).toEqual({ min: 6, max: 9 });
        expect(getEnemyLevelRange([9, 12], 3)).toEqual({ min: 9, max: 12 });
    });

    test('大多数敌人落在玩家等级 ±1 内（70% 同档）', () => {
        const counts = distribution({ zoneRange: [1, 3], playerLevel: 5 });
        let near = 0;
        let total = 0;
        counts.forEach((count, lv) => {
            total += count;
            if (lv >= 4 && lv <= 6) near += count;
        });
        // 理论值 ≈ 0.70 + 0.18 × 0.5 ≈ 0.79
        expect(near / total).toBeGreaterThan(0.65);
        expect(near / total).toBeLessThan(0.9);
    });

    test('存在高于玩家等级的精英敌人（威胁位）', () => {
        const counts = distribution({ zoneRange: [1, 3], playerLevel: 5 });
        const higher = Array.from(counts.entries())
            .filter(([lv]) => lv > 5)
            .reduce((sum, [, count]) => sum + count, 0);
        expect(higher).toBeGreaterThan(0);
    });

    test('存活时间让等级分布向玩家等级收敛（难度由 scaleFactor 承担）', () => {
        // `survivalMinutes` 会扣减 roll，使更多抽取落到"与玩家同级"分支。
        // 等级分布不是难度旋钮 —— 真正的难度爬升是 _getDifficultyMultiplier()
        // 对敌人 size/hp 的加成，这里只断言分布确实发生了位移。
        const aboveRatio = (m) => {
            let above = 0, total = 0;
            m.forEach((count, lv) => { total += count; if (lv > 3) above += count; });
            return above / total;
        };
        const early = distribution({ zoneRange: [1, 3], playerLevel: 3, iterations: 20000, survivalMinutes: 0 });
        const late = distribution({ zoneRange: [1, 3], playerLevel: 3, iterations: 20000, survivalMinutes: 20 });

        expect(aboveRatio(late)).toBeLessThan(aboveRatio(early));
    });

    test('等级始终是整数', () => {
        for (let n = 0; n < 200; n++) {
            expect(Number.isInteger(pickEnemyLevel([1, 3], 7))).toBe(true);
        }
    });
});
