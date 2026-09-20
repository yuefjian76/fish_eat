/**
 * BalanceCurve - 平衡曲线纯函数
 *
 * 集中管理"玩家成长 ↔ 敌人成长"的数值关系，供 GameScene / SpawnSystem /
 * CollisionSystem 共用，避免同一套公式散落在多个文件里。
 *
 * 设计背景（feat-055 实测）：
 *   玩家体型每级 ×1.5 复利，Lv11 达 57.7×；而敌鱼尺寸几乎不随玩家成长
 *   （敌人等级区间被 zones.json 的浅海区间钉死在 [1,3]）。结果是 Lv4 之后
 *   全部普通敌鱼都能被吃，接触伤害永远不可能触发 —— 难度曲线在中期塌陷。
 *
 * 修复方式：
 *   1. 玩家成长改为数据驱动并收敛（levels.json `sizeGrowth`，Lv11 ≈ 9.4×）。
 *   2. 敌人尺寸按玩家体型**开方**缩放，保证任意等级都存在
 *      「可吃 / 中立 / 威胁」三档。
 */

/** sizeGrowth 表缺失或越界时的回退倍率（保持历史行为） */
export const DEFAULT_SIZE_GROWTH_FACTOR = 1.5;

/** 敌人尺寸缩放的上下限：下限 1 保证低等级不缩小，上限防止数值失控 */
export const MIN_ENEMY_SCALE = 1;
export const MAX_ENEMY_SCALE = 3.2;

/** 单次接触伤害不得超过玩家最大生命的比例（防止被大鱼一击秒杀） */
export const DEFAULT_CONTACT_DAMAGE_CAP_RATIO = 0.25;

/**
 * 读取玩家体型成长倍率表。
 *
 * @param {object} levelsData - levels.json 内容
 * @returns {number[]} 每级倍率，长度 = experienceTable.length - 1
 */
export function getPlayerSizeMultipliers(levelsData) {
    const table = levelsData?.experienceTable;
    const expected = Array.isArray(table) ? Math.max(0, table.length - 1) : 0;
    const raw = levelsData?.sizeGrowth;

    if (!Array.isArray(raw) || raw.length === 0) {
        return new Array(expected).fill(DEFAULT_SIZE_GROWTH_FACTOR);
    }

    const out = [];
    for (let i = 0; i < expected; i++) {
        const value = Number(raw[i]);
        out.push(Number.isFinite(value) && value > 0 ? value : DEFAULT_SIZE_GROWTH_FACTOR);
    }
    return out;
}

/**
 * 计算某等级下的玩家体型（与 onLevelUp 的逐级 Math.floor 行为一致）。
 *
 * @param {number} baseSize - Lv1 体型
 * @param {number} level - 目标等级（1 起）
 * @param {object} levelsData - levels.json 内容
 * @returns {number} 取整后的体型
 */
export function getPlayerSizeAtLevel(baseSize, level, levelsData) {
    const base = Number.isFinite(baseSize) && baseSize > 0 ? baseSize : 30;
    const target = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
    const mults = getPlayerSizeMultipliers(levelsData);

    let size = Math.floor(base);
    for (let i = 1; i < target; i++) {
        const idx = mults.length ? Math.min(i - 1, mults.length - 1) : 0;
        const factor = mults.length ? mults[idx] : DEFAULT_SIZE_GROWTH_FACTOR;
        size = Math.floor(size * factor);
    }
    return size;
}

/**
 * 敌人尺寸缩放：按玩家体型相对基准体型开方增长。
 *
 * 开方而非线性，是为了让"玩家长大 9.4×"对应"敌人长大 3.07×"：
 * 三档阶梯（最小鱼仍是食物、最大鱼成为威胁）在 1~11 级全程成立。
 *
 * @param {number} baseSize - 玩家 Lv1 体型（基准）
 * @param {number} playerSize - 玩家当前体型
 * @returns {number} 缩放系数
 */
export function getEnemyScale(baseSize, playerSize) {
    const base = Number(baseSize);
    const current = Number(playerSize);
    if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(current) || current <= 0) {
        return MIN_ENEMY_SCALE;
    }
    const scale = Math.sqrt(current / base);
    return Math.min(Math.max(scale, MIN_ENEMY_SCALE), MAX_ENEMY_SCALE);
}

/**
 * 判定一条鱼相对玩家的关系（与 CollisionSystem 的阈值保持一致）。
 *
 * @param {number} playerSize
 * @param {number} fishSize
 * @param {number} [threshold=1.2]
 * @returns {'food'|'peer'|'threat'}
 */
export function classifyFishAgainst(playerSize, fishSize, threshold = 1.2) {
    if (playerSize > fishSize * threshold) return 'food';
    if (fishSize > playerSize * threshold) return 'threat';
    return 'peer';
}

/**
 * 敌人等级的有效区间：区域范围 ∪ 玩家等级邻域。
 *
 * 区域（zones.json）只负责视觉主题，不应把敌人等级钉死在出生点的浅海区间
 * [1,3]（feat-055 实测：Lv4 之后 `levelDiff` 恒为负，敌人缩放公式失效）。
 *
 * @param {number[]} [zoneRange] - [min, max]
 * @param {number} playerLevel
 * @returns {{min: number, max: number}}
 */
export function getEnemyLevelRange(zoneRange, playerLevel) {
    const zoneMin = Array.isArray(zoneRange) && Number.isFinite(zoneRange[0]) ? zoneRange[0] : 1;
    const zoneMax = Array.isArray(zoneRange) && Number.isFinite(zoneRange[1]) ? zoneRange[1] : 3;
    const level = Number.isFinite(playerLevel) ? playerLevel : 1;
    return {
        min: Math.max(zoneMin, level - 2),
        max: Math.max(zoneMax, level + 2),
    };
}

/**
 * 按等级分布抽取敌人等级。
 *
 * 分布：70% 与玩家等级相邻、18% 高出 1 级、12% 高出 2 级（精英位）。
 * 存活时间会把分布整体上移（最多 20%）。
 *
 * @param {number[]} zoneRange - 区域等级范围
 * @param {number} playerLevel
 * @param {object} [options]
 * @param {number} [options.survivalMinutes=0]
 * @param {function} [options.rng=Math.random] - 注入随机源，便于确定性测试
 * @returns {number} 敌人等级
 */
export function pickEnemyLevel(zoneRange, playerLevel, options = {}) {
    const rng = typeof options.rng === 'function' ? options.rng : Math.random;
    const survivalMinutes = Number.isFinite(options.survivalMinutes) ? options.survivalMinutes : 0;

    const { min, max } = getEnemyLevelRange(zoneRange, playerLevel);
    const level = Number.isFinite(playerLevel) ? playerLevel : 1;
    const clamped = Math.min(Math.max(level, min), max);
    const between = (a, b) => Math.floor(rng() * (b - a + 1)) + a;

    const bonus = Math.min(Math.max(0, survivalMinutes) * 0.05, 0.2);
    const roll = rng() - bonus;

    if (roll < 0.70) {
        return between(Math.max(min, clamped - 1), Math.min(max, clamped + 1));
    }
    if (roll < 0.88) {
        return between(Math.min(clamped + 1, max), max);
    }
    return between(Math.min(clamped + 2, max), max);
}

/**
 * 按玩家等级给出刷怪权重。
 *
 * 与历史版本的区别：低等级起就纳入 `mutant_shark` / `giant_jellyfish`
 * （此前这两条鱼永远不会出现，属死内容），并让它们在 Lv11 承担"威胁"位。
 *
 * @param {number} level - 玩家等级
 * @returns {object} 类型 → 权重（和为 1）
 */
export function getSpawnWeights(level) {
    const lv = Number.isFinite(level) ? level : 1;
    // 每张表都必须留出"威胁位"：体型缩放后至少有一种鱼大于玩家的可吃上限。
    // 只看 fish.json 全表是不够的 —— Lv3~6 的历史权重表里最大的鱼是
    // octopus(45)，缩放后仍小于玩家，实测 11 条可吃 / 0 条威胁（feat-055）。
    if (lv <= 3) {
        return { clownfish: 0.35, shrimp: 0.3, shark: 0.15, jellyfish: 0.12, mutant_shark: 0.08 };
    }
    if (lv <= 6) {
        return {
            clownfish: 0.15, shrimp: 0.15, shark: 0.2, jellyfish: 0.15,
            seahorse: 0.15, octopus: 0.05, mutant_shark: 0.1, giant_jellyfish: 0.05,
        };
    }
    if (lv <= 10) {
        return {
            clownfish: 0.05, shrimp: 0.05, shark: 0.15, anglerfish: 0.15,
            jellyfish: 0.1, seahorse: 0.1, octopus: 0.15, eel: 0.1,
            giant_jellyfish: 0.1, mutant_shark: 0.05,
        };
    }
    return {
        shark: 0.2, anglerfish: 0.15, octopus: 0.15, eel: 0.15,
        giant_jellyfish: 0.2, mutant_shark: 0.15,
    };
}

/**
 * 接触伤害上限：单次伤害不超过玩家最大生命的给定比例。
 *
 * 敌人尺寸随玩家成长后，`size/4` 在大体型敌鱼上会达到玩家半血以上，
 * 加上 1s 节流仍可能两下致死，故按最大生命比例收敛。
 *
 * @param {number} damage - 原始伤害
 * @param {number} playerMaxHp - 玩家最大生命
 * @param {number} [ratio=0.25]
 * @returns {number} 取整后的实际伤害
 */
export function capContactDamage(damage, playerMaxHp, ratio = DEFAULT_CONTACT_DAMAGE_CAP_RATIO) {
    const raw = Number(damage);
    if (!Number.isFinite(raw) || raw <= 0) return 0;

    const maxHp = Number(playerMaxHp);
    if (!Number.isFinite(maxHp) || maxHp <= 0) return Math.floor(raw);

    const cap = maxHp * (Number.isFinite(ratio) && ratio > 0 ? ratio : DEFAULT_CONTACT_DAMAGE_CAP_RATIO);
    return Math.floor(Math.min(raw, cap));
}

export default {
    getPlayerSizeMultipliers,
    getEnemyLevelRange,
    pickEnemyLevel,
    getPlayerSizeAtLevel,
    getEnemyScale,
    classifyFishAgainst,
    getSpawnWeights,
    capContactDamage,
};
