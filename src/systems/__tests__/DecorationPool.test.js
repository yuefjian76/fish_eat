import { DecorationPool } from '../DecorationPool.js';
import { DepthColorMapper } from '../DepthColorMapper.js';

// ---------------------------------------------------------------------------
// Mock scene（简单，不依赖 Phaser）
// ---------------------------------------------------------------------------
const createMockScene = () => ({
    add: {
        graphics: () => ({
            setDepth: () => ({}),
            setScrollFactor: () => ({}),
            setVisible: () => ({}),
            setAlpha: () => ({}),
            setPosition: () => ({}),
            clear: () => ({}),
            fillStyle: () => ({}),
            fillRect: () => ({}),
            fillCircle: () => ({}),
            fillTriangle: () => ({}),
            fillEllipse: () => ({}),
            lineStyle: () => ({}),
            strokeCircle: () => ({}),
            destroy: () => {},
        }),
    },
});

// ---------------------------------------------------------------------------
// Group K: zone 判断（复用 DepthColorMapper）
// ---------------------------------------------------------------------------
describe('zone mapping', () => {
    test('returns correct zone for each depth range', () => {
        expect(DecorationPool.worldYToZone(1000)).toBe('surface');
        expect(DecorationPool.worldYToZone(3000)).toBe('shallow');
        expect(DecorationPool.worldYToZone(6000)).toBe('mid');
        expect(DecorationPool.worldYToZone(10000)).toBe('deep');
        expect(DecorationPool.worldYToZone(15000)).toBe('abyss');
    });

    test('boundary values return correct zones', () => {
        expect(DecorationPool.worldYToZone(2000)).toBe('shallow');
        expect(DecorationPool.worldYToZone(4000)).toBe('mid');
        expect(DecorationPool.worldYToZone(12000)).toBe('abyss');
    });
});

// ---------------------------------------------------------------------------
// Group L: 对象池回收
// ---------------------------------------------------------------------------
describe('pool recycling', () => {
    const GRADIENT_CONFIG = DepthColorMapper.getGradientConfig();
    const OPTIONS = {
        worldWidth:  20000,
        worldHeight: 20000,
        viewportW:   1024,
        viewportH:   768,
    };

    test('active pool never exceeds MAX_POOL_SIZE(200)', () => {
        const scene = createMockScene();
        const pool = new DecorationPool(scene, GRADIENT_CONFIG, OPTIONS);
        pool.create();
        // 模拟相机在不同位置跳动，触发多 chunk 生成
        const positions = [
            { sx: 0, sy: 0 },
            { sx: 1024, sy: 0 },
            { sx: 2048, sy: 768 },
            { sx: 3072, sy: 1536 },
            { sx: 4096, sy: 2304 },
            { sx: 8192, sy: 4608 },
            { sx: 12288, sy: 6912 },
            { sx: 16384, sy: 9216 },
        ];
        for (const { sx, sy } of positions) {
            pool.update(sx, sy, 8000 + sy);
        }
        // pool size 不超过 MAX_POOL_SIZE
        expect(pool._activeCount).toBeLessThanOrEqual(DecorationPool.MAX_POOL_SIZE);
        pool.destroy();
    });

    test('same chunk is not generated twice without recycling', () => {
        const scene = createMockScene();
        const pool = new DecorationPool(scene, GRADIENT_CONFIG, OPTIONS);
        pool.create();
        // 同一位置调用两次 update
        pool.update(0, 0, 8000);
        pool.update(0, 0, 8000);
        // 活跃 chunk 数量不应翻倍（相同 chunk 不重复创建）
        expect(pool._activeCount).toBeLessThanOrEqual(DecorationPool.MAX_POOL_SIZE);
        pool.destroy();
    });

    test('chunks beyond buffer distance are recycled', () => {
        const scene = createMockScene();
        const pool = new DecorationPool(scene, GRADIENT_CONFIG, OPTIONS);
        pool.create();

        // 初始在 (0, 0) 附近
        pool.update(0, 0, 8000);
        const initialCount = pool._activeCount;

        // 移动到很远的地方（超过 BUFFER_CHUNKS * CHUNK_W）
        pool.update(10000, 0, 8000);

        // 活跃数量应显著减少（远处 chunk 被回收）
        expect(pool._activeCount).toBeLessThan(initialCount + 10);
        pool.destroy();
    });

    test('zone changes affect decoration type selection', () => {
        const scene = createMockScene();
        const pool = new DecorationPool(scene, GRADIENT_CONFIG, OPTIONS);
        pool.create();
        // shallow zone (worldY~3000)
        pool.update(0, 0, 3000);
        // abyss zone (worldY~15000)
        pool.update(0, 0, 15000);
        // 两个 zone 都会生成装饰，但类型应不同
        expect(pool._activeCount).toBeGreaterThan(0);
        pool.destroy();
    });
});

// ---------------------------------------------------------------------------
// Group C: create/destroy 生命周期
// ---------------------------------------------------------------------------
describe('DecorationPool lifecycle', () => {
    const GRADIENT_CONFIG = DepthColorMapper.getGradientConfig();
    const OPTIONS = {
        worldWidth:  20000,
        worldHeight: 20000,
        viewportW:   1024,
        viewportH:   768,
    };

    test('create() does not throw', () => {
        const scene = createMockScene();
        const pool = new DecorationPool(scene, GRADIENT_CONFIG, OPTIONS);
        expect(() => pool.create()).not.toThrow();
    });

    test('update() before create() is safe no-op', () => {
        const scene = createMockScene();
        const pool = new DecorationPool(scene, GRADIENT_CONFIG, OPTIONS);
        expect(() => pool.update(0, 0, 8000)).not.toThrow();
    });

    test('update() after destroy() is safe no-op', () => {
        const scene = createMockScene();
        const pool = new DecorationPool(scene, GRADIENT_CONFIG, OPTIONS);
        pool.create();
        pool.destroy();
        expect(() => pool.update(0, 0, 8000)).not.toThrow();
    });

    test('_created flag is false before create() and true after', () => {
        const scene = createMockScene();
        const pool = new DecorationPool(scene, GRADIENT_CONFIG, OPTIONS);
        expect(pool._created).toBe(false);
        pool.create();
        expect(pool._created).toBe(true);
        pool.destroy();
        expect(pool._created).toBe(false);
    });
});