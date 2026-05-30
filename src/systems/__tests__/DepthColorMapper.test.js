import { DepthColorMapper } from '../DepthColorMapper.js';

// ---------------------------------------------------------------------------
// Group A: _computeDepthColor(worldY) — 颜色计算
// ---------------------------------------------------------------------------
describe('_computeDepthColor', () => {
    // A-01: worldY=0 返回最浅颜色
    test('worldY=0 returns surface color 0x64c8d2', () => {
        const result = DepthColorMapper.computeDepthColor(0);
        expect(result).toBe(0x64c8d2);
    });

    // A-02: worldY=20000 返回最深颜色
    test('worldY=20000 returns abyss color 0x02050f', () => {
        const result = DepthColorMapper.computeDepthColor(20000);
        expect(result).toBe(0x02050f);
    });

    // A-03: worldY=14000（出生点）返回 deep 区域颜色
    test('worldY=14000 returns deep color approx 0x062b42', () => {
        const result = DepthColorMapper.computeDepthColor(14000);
        expect(result).toBe(0x062b42);
    });

    // A-04: worldY=8000（两 stop 中间）返回插值色
    test('worldY=8000 interpolates between mid and deep stops', () => {
        // stop at 2000: 0x1ea0b4, stop at 8000: 0x0a5064
        // worldY=8000 = 100% deep stop
        const result = DepthColorMapper.computeDepthColor(8000);
        expect(result).toBe(0x0a5064);
    });

    // A-05: worldY<0 夹紧到 stop[0] 颜色
    test('worldY<0 clamps to stop[0] color', () => {
        expect(DepthColorMapper.computeDepthColor(-100)).toBe(0x64c8d2);
        expect(DepthColorMapper.computeDepthColor(-9999)).toBe(0x64c8d2);
    });

    // A-06: worldY>20000 夹紧到最后 stop 颜色
    test('worldY>20000 clamps to last stop color', () => {
        expect(DepthColorMapper.computeDepthColor(20001)).toBe(0x02050f);
        expect(DepthColorMapper.computeDepthColor(99999)).toBe(0x02050f);
    });

    // A-07: 颜色值在 [0x000000, 0xFFFFFF] 范围内（合法 24-bit）
    test('returned color is always a valid 24-bit integer', () => {
        const testYs = [-100, 0, 500, 1000, 2000, 3000, 4000, 6000, 8000, 10000, 12000, 14000, 16000, 18000, 20000, 99999];
        for (const y of testYs) {
            const color = DepthColorMapper.computeDepthColor(y);
            expect(color).toBeGreaterThanOrEqual(0x000000);
            expect(color).toBeLessThanOrEqual(0xFFFFFF);
        }
    });
});

// ---------------------------------------------------------------------------
// Group B: _interpolateColor(colorA, colorB, t) — 颜色插值
// ---------------------------------------------------------------------------
describe('_interpolateColor', () => {
    // B-01: t=0 返回 colorA
    test('t=0 returns colorA exactly', () => {
        expect(DepthColorMapper.interpolateColor(0x112233, 0xAABBCC, 0)).toBe(0x112233);
    });

    // B-02: t=1 返回 colorB
    test('t=1 returns colorB exactly', () => {
        expect(DepthColorMapper.interpolateColor(0x112233, 0xAABBCC, 1)).toBe(0xAABBCC);
    });

    // B-03: t=0.5 返回中间色（RGB 各分量取整）
    test('t=0.5 returns midpoint color', () => {
        const result = DepthColorMapper.interpolateColor(0x000000, 0xFFFFFF, 0.5);
        // Math.round(255 * 0.5) = Math.round(127.5) = 128 → 0x808080
        expect(result).toBe(0x808080);
    });

    // B-04: t<0 夹紧到 colorA
    test('t<0 clamps to colorA', () => {
        expect(DepthColorMapper.interpolateColor(0x111111, 0x222222, -0.5)).toBe(0x111111);
    });

    // B-05: t>1 夹紧到 colorB
    test('t>1 clamps to colorB', () => {
        expect(DepthColorMapper.interpolateColor(0x111111, 0x222222, 1.5)).toBe(0x222222);
    });
});

// ---------------------------------------------------------------------------
// Group C: _worldYToDepthZone(worldY) — 区域判断
// ---------------------------------------------------------------------------
describe('_worldYToDepthZone', () => {
    // C-01: worldY=1000 返回 "surface"
    test('worldY=1000 returns "surface"', () => {
        expect(DepthColorMapper.worldYToDepthZone(1000)).toBe('surface');
    });

    // C-02: worldY=3000 返回 "shallow"
    test('worldY=3000 returns "shallow"', () => {
        expect(DepthColorMapper.worldYToDepthZone(3000)).toBe('shallow');
    });

    // C-03: worldY=6000 返回 "mid"
    test('worldY=6000 returns "mid"', () => {
        expect(DepthColorMapper.worldYToDepthZone(6000)).toBe('mid');
    });

    // C-04: worldY=10000 返回 "deep"
    test('worldY=10000 returns "deep"', () => {
        expect(DepthColorMapper.worldYToDepthZone(10000)).toBe('deep');
    });

    // C-05: worldY=15000 返回 "abyss"
    test('worldY=15000 returns "abyss"', () => {
        expect(DepthColorMapper.worldYToDepthZone(15000)).toBe('abyss');
    });

    // C-06: 边界值（worldY=2000 属于 shallow 而非 surface）
    test('worldY=2000 (boundary) returns "shallow" not "surface"', () => {
        expect(DepthColorMapper.worldYToDepthZone(2000)).toBe('shallow');
    });

    // C-07: 边界值（worldY=4000 属于 mid 而非 shallow）
    test('worldY=4000 (boundary) returns "mid"', () => {
        expect(DepthColorMapper.worldYToDepthZone(4000)).toBe('mid');
    });

    // C-08: worldY=12000 边界属于 abyss
    test('worldY=12000 (boundary) returns "abyss"', () => {
        expect(DepthColorMapper.worldYToDepthZone(12000)).toBe('abyss');
    });
});

// ---------------------------------------------------------------------------
// Group D: _computeFogAlpha(worldY) — 雾效 alpha 计算
// ---------------------------------------------------------------------------
describe('_computeFogAlpha', () => {
    // D-01: worldY < fogStart → alpha=0
    test('worldY=11999 returns fog alpha 0', () => {
        expect(DepthColorMapper.computeFogAlpha(11999)).toBe(0);
    });

    // D-02: worldY = fogStart → alpha=0
    test('worldY=fogStart(12000) returns fog alpha 0', () => {
        expect(DepthColorMapper.computeFogAlpha(12000)).toBe(0);
    });

    // D-03: worldY = fogEnd → alpha=maxAlpha(0.65)
    test('worldY=fogEnd(20000) returns fog alpha 0.65', () => {
        expect(DepthColorMapper.computeFogAlpha(20000)).toBeCloseTo(0.65, 5);
    });

    // D-04: worldY 中间线性插值
    test('worldY=16000 returns fog alpha ~0.325', () => {
        const alpha = DepthColorMapper.computeFogAlpha(16000);
        // (16000 - 12000) / (20000 - 12000) = 0.5
        expect(alpha).toBeCloseTo(0.325, 5);
    });

    // D-05: fogEnd 之外继续夹紧
    test('worldY>20000 returns fog alpha clamped at maxAlpha', () => {
        expect(DepthColorMapper.computeFogAlpha(99999)).toBeCloseTo(0.65, 5);
    });
});

// ---------------------------------------------------------------------------
// Group E: _bubbleConfigForDepth(worldY) — 气泡配置计算
// ---------------------------------------------------------------------------
describe('_bubbleConfigForDepth', () => {
    // E-01: 浅层 → 气泡小、密
    test('shallow depth returns small radius and high count', () => {
        const config = DepthColorMapper.bubbleConfigForDepth(2000);
        expect(config.radius).toBeLessThanOrEqual(8);       // 小
        expect(config.count).toBeGreaterThanOrEqual(30);      // 密
    });

    // E-02: 深层 → 气泡大、稀
    test('abyss depth returns large radius and low count', () => {
        const config = DepthColorMapper.bubbleConfigForDepth(15000);
        expect(config.radius).toBeGreaterThanOrEqual(15);    // 大
        expect(config.count).toBeLessThanOrEqual(10);         // 稀
    });

    // E-03: count 不超过 BUBBLE_POOL_SIZE
    test('count never exceeds BUBBLE_POOL_SIZE(40)', () => {
        const config = DepthColorMapper.bubbleConfigForDepth(0);
        expect(config.count).toBeLessThanOrEqual(40);
    });

    // E-04: radius 始终为正数
    test('radius is always positive', () => {
        const depths = [0, 1000, 4000, 8000, 12000, 16000, 20000];
        for (const y of depths) {
            const config = DepthColorMapper.bubbleConfigForDepth(y);
            expect(config.radius).toBeGreaterThan(0);
        }
    });
});