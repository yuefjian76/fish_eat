/**
 * DepthColorMapper — 独立工具类
 * 纯函数模块：worldY → 颜色映射、区域判断、雾效 alpha、气泡配置
 *
 * 所有方法均为纯静态函数，便于单元测试。
 */

const GRADIENT_CONFIG = {
    stops: [
        { worldY: 0,     color: 0x64c8d2 },   // surface:  亮青绿
        { worldY: 2000,  color: 0x1ea0b4 },   // shallow:  青蓝
        { worldY: 8000,  color: 0x0a5064 },   // mid:      深蓝
        { worldY: 14000, color: 0x062b42 },   // deep:     暗蓝
        { worldY: 20000, color: 0x02050f },   // abyss:    接近黑
    ],
    fogStart:   12000,
    fogEnd:     20000,
    fogMaxAlpha: 0.65,
};

// Zone 边界定义（与 docs/SCROLLING_WORLD_DESIGN.md 一致）
const ZONE_BOUNDARIES = [
    { maxY: 2000,  zone: 'surface' },
    { maxY: 4000,  zone: 'shallow' },
    { maxY: 8000,  zone: 'mid' },
    { maxY: 12000, zone: 'deep' },
    { maxY: Infinity, zone: 'abyss' },
];

// 气泡配置（按深度区域参数化）
const BUBBLE_CONFIGS = {
    surface: { radiusMin: 3,  radiusMax: 8,  countMin: 40, countMax: 50 },
    shallow: { radiusMin: 3,  radiusMax: 8,  countMin: 30, countMax: 45 },
    mid:     { radiusMin: 8,  radiusMax: 15, countMin: 15, countMax: 25 },
    deep:    { radiusMin: 12, radiusMax: 20, countMin: 8,  countMax: 15 },
    abyss:   { radiusMin: 15, radiusMax: 30, countMin: 2,  countMax: 8  },
};

export class DepthColorMapper {
    // =======================================================================
    // 公开静态方法
    // =======================================================================

    /**
     * 根据 worldY 计算深度颜色（0xRRGGBB）
     * @param {number} worldY
     * @returns {number} 颜色值 0xRRGGBB
     */
    static computeDepthColor(worldY) {
        const { stops } = GRADIENT_CONFIG;

        // 夹紧到有效范围
        if (worldY <= stops[0].worldY) return stops[0].color;
        if (worldY >= stops[stops.length - 1].worldY) return stops[stops.length - 1].color;

        // 找到 worldY 落在哪两个 stop 之间
        for (let i = 0; i < stops.length - 1; i++) {
            const a = stops[i];
            const b = stops[i + 1];
            if (worldY >= a.worldY && worldY <= b.worldY) {
                const t = (worldY - a.worldY) / (b.worldY - a.worldY);
                return this.interpolateColor(a.color, b.color, t);
            }
        }

        // 兜底（不应该走到这里）
        return stops[stops.length - 1].color;
    }

    /**
     * 在两个颜色之间线性插值
     * @param {number} colorA  0xRRGGBB
     * @param {number} colorB  0xRRGGBB
     * @param {number} t       [0,1] 插值因子
     * @returns {number} 插值结果 0xRRGGBB
     */
    static interpolateColor(colorA, colorB, t) {
        // 夹紧 t 到 [0, 1]
        const tClamped = Math.max(0, Math.min(1, t));

        const r = Math.round(((colorA >> 16) & 0xFF) * (1 - tClamped) + ((colorB >> 16) & 0xFF) * tClamped);
        const g = Math.round(((colorA >> 8)  & 0xFF) * (1 - tClamped) + ((colorB >> 8)  & 0xFF) * tClamped);
        const b = Math.round(((colorA)       & 0xFF) * (1 - tClamped) + ((colorB)       & 0xFF) * tClamped);

        return (r << 16) | (g << 8) | b;
    }

    /**
     * 将 worldY 映射为深度区域 ID
     * @param {number} worldY
     * @returns {'surface'|'shallow'|'mid'|'deep'|'abyss'}
     */
    static worldYToDepthZone(worldY) {
        for (const { maxY, zone } of ZONE_BOUNDARIES) {
            if (worldY < maxY) return zone;
        }
        return 'abyss';
    }

    /**
     * 根据 worldY 计算深度雾的 alpha 值
     * @param {number} worldY
     * @returns {number} alpha [0, fogMaxAlpha]
     */
    static computeFogAlpha(worldY) {
        const { fogStart, fogEnd, fogMaxAlpha } = GRADIENT_CONFIG;
        if (worldY <= fogStart) return 0;
        if (worldY >= fogEnd) return fogMaxAlpha;
        const t = (worldY - fogStart) / (fogEnd - fogStart);
        return t * fogMaxAlpha;
    }

    /**
     * 根据 worldY 返回气泡配置参数
     * @param {number} worldY
     * @returns {{ radius: number, count: number }}
     */
    static bubbleConfigForDepth(worldY) {
        const zone = this.worldYToDepthZone(worldY);
        const cfg = BUBBLE_CONFIGS[zone];
        // 线性插值：浅层偏小/密，深层偏大/稀
        const zoneOrder = ['surface', 'shallow', 'mid', 'deep', 'abyss'];
        const idx = zoneOrder.indexOf(zone);
        const t = idx / (zoneOrder.length - 1); // 0=浅, 1=深

        const radius = cfg.radiusMin + t * (cfg.radiusMax - cfg.radiusMin);
        const count  = Math.round(cfg.countMin + t * (cfg.countMax - cfg.countMin));

        return {
            radius: Math.round(radius),
            count: Math.min(count, 40), // cap at BUBBLE_POOL_SIZE
        };
    }

    /**
     * 获取完整梯度配置（供 ScrollingBackground 等使用）
     * @returns {object}
     */
    static getGradientConfig() {
        return { ...GRADIENT_CONFIG };
    }
}