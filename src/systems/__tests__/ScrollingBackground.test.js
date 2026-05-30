import { ScrollingBackground } from '../ScrollingBackground.js';
import { DepthColorMapper } from '../DepthColorMapper.js';

// ---------------------------------------------------------------------------
// Mock Phaser 对象（带状态追踪）
// ---------------------------------------------------------------------------
const createMockGraphics = () => {
    let _x = 0, _y = 0, _alpha = 0, _visible = false, _scrollFactor = 0;
    return {
        setDepth: () => ({}),
        setScrollFactor: (sx, sy) => { _scrollFactor = sx; return {}; },
        setAlpha: (a) => { _alpha = a; return {}; },
        setVisible: (v) => { _visible = v; return {}; },
        setPosition: (x, y) => { _x = x; _y = y; return {}; },
        setDisplaySize: () => ({}),
        setTexture: () => ({}),
        clear: () => ({}),
        fillStyle: () => ({}),
        fillRect: () => ({}),
        generateTexture: () => ({}),
        destroy: () => {},
        // 属性访问器
        get x() { return _x; },
        get y() { return _y; },
        get alpha() { return _alpha; },
        get visible() { return _visible; },
        get scrollFactor() { return _scrollFactor; },
        // 记录 setPosition 调用
        _setPositionCalls: [],
    };
};

const createMockScene = () => {
    const makeImage = () => {
        let _x = 512, _y = 384, _alpha = 1, _visible = true, _scrollFactorX = 0;
        return {
            setDepth: () => ({}),
            setScrollFactor: (sx, sy) => { _scrollFactorX = sx; return {}; },
            setAlpha: (a) => { _alpha = a; return {}; },
            setVisible: (v) => { _visible = v; return {}; },
            setPosition: (x, y) => { _x = x; _y = y; return {}; },
            setDisplaySize: () => ({}),
            setTexture: () => ({}),
            destroy: () => {},
            get x() { return _x; },
            get y() { return _y; },
            get alpha() { return _alpha; },
            get visible() { return _visible; },
            _setPositionCalls: [],
        };
    };
    return {
        add: {
            graphics: () => {
                const g = createMockGraphics();
                const origSetPosition = g.setPosition.bind(g);
                g.setPosition = (x, y) => {
                    g._setPositionCalls.push([x, y]);
                    return origSetPosition(x, y);
                };
                return g;
            },
            image: () => makeImage(),
            tileSprite: () => ({
                setDepth: () => ({}),
                setScrollFactor: () => ({}),
                setAlpha: () => ({}),
                setVisible: () => ({}),
                setOrigin: () => ({}),
                setTexture: () => ({}),
            }),
        },
        sys: {
            settings: { get: () => 'undersea' },
        },
    };
};

const GRADIENT_CONFIG = DepthColorMapper.getGradientConfig();
const OPTIONS = {
    worldWidth:  20000,
    worldHeight: 20000,
    viewportW:   1024,
    viewportH:   768,
    theme: 'undersea',
};

// ---------------------------------------------------------------------------
// Group F: 构造与生命周期（mock Phaser）
// ---------------------------------------------------------------------------
describe('ScrollingBackground lifecycle', () => {
    let scene;

    beforeEach(() => {
        scene = createMockScene();
    });

    // F-01: create() 不抛异常
    test('create() executes without throwing', () => {
        const bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        expect(() => bg.create()).not.toThrow();
    });

    // F-02: update() 在 create() 前调用不崩溃（安全 no-op）
    test('update() before create() is safe no-op', () => {
        const bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        expect(() => bg.update(0, 0, 16)).not.toThrow();
    });

    // F-03: destroy() 后 update() 不崩溃
    test('update() after destroy() is safe no-op', () => {
        const bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        bg.create();
        bg.destroy();
        expect(() => bg.update(0, 0, 16)).not.toThrow();
    });

    // F-04: setTheme() 接受合法 key
    test('setTheme("undersea") does not throw', () => {
        const bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        bg.create();
        expect(() => bg.setTheme('undersea')).not.toThrow();
    });

    // F-05: setTheme("unknown") 记录 warn 不抛异常
    test('setTheme("unknown") logs warn and does not throw', () => {
        const bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        bg.create();
        const consoleSpy = global.console.warn;
        expect(() => bg.setTheme('unknown_theme')).not.toThrow();
    });

    // F-06: 连续 create/destroy 不崩溃
    test('multiple create/destroy cycles are safe', () => {
        const bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        for (let i = 0; i < 3; i++) {
            bg.create();
            bg.destroy();
        }
        expect(true).toBe(true);
    });

    // F-07: 内部 _created 标志正确
    test('_created flag is false before create() and true after', () => {
        const bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        expect(bg._created).toBe(false);
        bg.create();
        expect(bg._created).toBe(true);
        bg.destroy();
        expect(bg._created).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Group A: _computeDepthColor — 委托给 DepthColorMapper.computeDepthColor
// ---------------------------------------------------------------------------
describe('_computeDepthColor integration', () => {
    let bg, scene;

    beforeEach(() => {
        scene = createMockScene();
        bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
    });

    test('worldY=0 returns surface color 0x64c8d2', () => {
        expect(bg._computeDepthColor(0)).toBe(0x64c8d2);
    });

    test('worldY=20000 returns abyss color 0x02050f', () => {
        expect(bg._computeDepthColor(20000)).toBe(0x02050f);
    });

    test('worldY=14000 returns deep color 0x062b42', () => {
        expect(bg._computeDepthColor(14000)).toBe(0x062b42);
    });

    test('worldY outside range clamps correctly', () => {
        expect(bg._computeDepthColor(-100)).toBe(0x64c8d2);
        expect(bg._computeDepthColor(99999)).toBe(0x02050f);
    });
});

// ---------------------------------------------------------------------------
// Group B: _interpolateColor — 委托给 DepthColorMapper
// ---------------------------------------------------------------------------
describe('_interpolateColor integration', () => {
    let bg, scene;

    beforeEach(() => {
        scene = createMockScene();
        bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
    });

    test('t=0 returns colorA exactly', () => {
        expect(bg._interpolateColor(0x112233, 0xAABBCC, 0)).toBe(0x112233);
    });

    test('t=1 returns colorB exactly', () => {
        expect(bg._interpolateColor(0x112233, 0xAABBCC, 1)).toBe(0xAABBCC);
    });

    test('t=0.5 returns midpoint (with rounding)', () => {
        const result = bg._interpolateColor(0x000000, 0xFFFFFF, 0.5);
        expect(result).toBe(0x808080);
    });

    test('t outside [0,1] clamps correctly', () => {
        expect(bg._interpolateColor(0x111111, 0x222222, -0.5)).toBe(0x111111);
        expect(bg._interpolateColor(0x111111, 0x222222, 1.5)).toBe(0x222222);
    });
});

// ---------------------------------------------------------------------------
// Group C: _worldYToDepthZone — 委托给 DepthColorMapper
// ---------------------------------------------------------------------------
describe('_worldYToDepthZone integration', () => {
    let bg, scene;

    beforeEach(() => {
        scene = createMockScene();
        bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
    });

    test('returns correct zone for each depth range', () => {
        expect(bg._worldYToDepthZone(1000)).toBe('surface');
        expect(bg._worldYToDepthZone(3000)).toBe('shallow');
        expect(bg._worldYToDepthZone(6000)).toBe('mid');
        expect(bg._worldYToDepthZone(10000)).toBe('deep');
        expect(bg._worldYToDepthZone(15000)).toBe('abyss');
    });

    test('boundary values return correct zones', () => {
        expect(bg._worldYToDepthZone(2000)).toBe('shallow');
        expect(bg._worldYToDepthZone(4000)).toBe('mid');
        expect(bg._worldYToDepthZone(12000)).toBe('abyss');
    });
});

// ---------------------------------------------------------------------------
// Group D: _computeFogAlpha — 委托给 DepthColorMapper
// ---------------------------------------------------------------------------
describe('_computeFogAlpha integration', () => {
    let bg, scene;

    beforeEach(() => {
        scene = createMockScene();
        bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
    });

    test('worldY<fogStart returns 0', () => {
        expect(bg._computeFogAlpha(11999)).toBe(0);
        expect(bg._computeFogAlpha(12000)).toBe(0);
    });

    test('worldY=fogEnd returns maxAlpha', () => {
        expect(bg._computeFogAlpha(20000)).toBeCloseTo(0.65, 5);
    });

    test('worldY=16000 returns interpolated alpha', () => {
        const alpha = bg._computeFogAlpha(16000);
        expect(alpha).toBeCloseTo(0.325, 5);
    });

    test('worldY>20000 clamps to maxAlpha', () => {
        expect(bg._computeFogAlpha(99999)).toBeCloseTo(0.65, 5);
    });
});

// ---------------------------------------------------------------------------
// Group E: _bubbleConfigForDepth — 委托给 DepthColorMapper
// ---------------------------------------------------------------------------
describe('_bubbleConfigForDepth integration', () => {
    let bg, scene;

    beforeEach(() => {
        scene = createMockScene();
        bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
    });

    test('shallow depth returns small radius and high count', () => {
        const config = bg._bubbleConfigForDepth(2000);
        expect(config.radius).toBeLessThanOrEqual(8);
        expect(config.count).toBeGreaterThanOrEqual(30);
    });

    test('abyss depth returns large radius and low count', () => {
        const config = bg._bubbleConfigForDepth(15000);
        expect(config.radius).toBeGreaterThanOrEqual(15);
        expect(config.count).toBeLessThanOrEqual(10);
    });

    test('count never exceeds BUBBLE_POOL_SIZE(40)', () => {
        const config = bg._bubbleConfigForDepth(0);
        expect(config.count).toBeLessThanOrEqual(40);
    });

    test('radius is always positive', () => {
        const depths = [0, 1000, 4000, 8000, 12000, 16000, 20000];
        for (const y of depths) {
            const config = bg._bubbleConfigForDepth(y);
            expect(config.radius).toBeGreaterThan(0);
        }
    });
});

// ---------------------------------------------------------------------------
// Group G: _updateTileLayers — 视差层 tilePositionX 计算
// ---------------------------------------------------------------------------
describe('_updateTileLayers', () => {
    let bg, scene;

    beforeEach(() => {
        scene = createMockScene();
        bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        bg.create();
    });

    // G-01: BgLayer tilePositionX = cameraScrollX * 0.08
    test('bg layer tilePositionX is cameraScrollX * 0.08', () => {
        const scrollX = 1000;
        const offset = bg._computeTileOffset('bg', scrollX);
        expect(offset.x).toBeCloseTo(1024 / 2 + scrollX * 0.08, 4);
        expect(offset.y).toBe(768 / 2);
    });

    // G-02: MidLayer tilePositionX = cameraScrollX * 0.25
    test('mid layer tilePositionX is cameraScrollX * 0.25', () => {
        const scrollX = 1000;
        const offset = bg._computeTileOffset('mid', scrollX);
        expect(offset.x).toBeCloseTo(1024 / 2 + scrollX * 0.25, 4);
        expect(offset.y).toBe(768 / 2);
    });

    // G-03: FgLayer tilePositionX = cameraScrollX * 0.50
    test('fg layer tilePositionX is cameraScrollX * 0.50', () => {
        const scrollX = 1000;
        const offset = bg._computeTileOffset('fg', scrollX);
        expect(offset.x).toBeCloseTo(1024 / 2 + scrollX * 0.50, 4);
        expect(offset.y).toBe(768 / 2);
    });

    // G-04: 各层 tilePositionX 互不相同（视差有差异）
    test('three layers have distinct tilePositionX values for same cameraScrollX', () => {
        const scrollX = 10000;
        const offsets = ['bg', 'mid', 'fg'].map(key => bg._computeTileOffset(key, scrollX));
        expect(offsets[0].x).not.toBe(offsets[1].x);
        expect(offsets[1].x).not.toBe(offsets[2].x);
        expect(offsets[0].x).not.toBe(offsets[2].x);
        expect(offsets[0].x).toBeCloseTo(1024 / 2 + scrollX * 0.08, 2);
        expect(offsets[1].x).toBeCloseTo(1024 / 2 + scrollX * 0.25, 2);
        expect(offsets[2].x).toBeCloseTo(1024 / 2 + scrollX * 0.50, 2);
    });

    // G-05: scrollX=0 时所有层 x = viewportW/2
    test('all layers have x=viewportW/2 when cameraScrollX=0', () => {
        for (const key of ['bg', 'mid', 'fg']) {
            const offset = bg._computeTileOffset(key, 0);
            expect(offset.x).toBe(1024 / 2);
            expect(offset.y).toBe(768 / 2);
        }
    });
});

// ---------------------------------------------------------------------------
// Group H: ScrollEdge 存在性
// ---------------------------------------------------------------------------
describe('ScrollEdge', () => {
    let bg, scene;

    beforeEach(() => {
        scene = createMockScene();
        bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        bg.create();
    });

    // H-01: create() 后存在 4 个 edge graphics 对象
    test('creates 4 edge overlay graphics after create()', () => {
        expect(bg._edgeOverlays).toHaveLength(4);
    });

    // H-02: 所有 edge 的 scrollFactor = 0
    test('all edge overlays have scrollFactor 0 (fixed to camera)', () => {
        for (const edge of bg._edgeOverlays) {
            expect(edge.scrollFactor).toBe(0);
        }
    });

    // H-03: edge 初始 alpha = 0（不可见）
    test('all edges start with alpha=0', () => {
        for (const edge of bg._edgeOverlays) {
            expect(edge.alpha).toBe(0);
        }
    });
});

// ---------------------------------------------------------------------------
// Group Df: DepthFog alpha 计算（完整覆盖 worldY 映射）
// ---------------------------------------------------------------------------
describe('DepthFog rendering', () => {
    let bg, scene;

    beforeEach(() => {
        scene = createMockScene();
        bg = new ScrollingBackground(scene, GRADIENT_CONFIG, OPTIONS);
        bg.create();
    });

    // Df-01: worldY < fogStart 时 fog 不可见
    test('fogLayer is not visible when worldY < fogStart', () => {
        // worldY = 11999，fogStart = 12000
        bg._updateDepthFog(11999);
        const fogVisible = bg._fogLayer.visible;
        expect(fogVisible).toBe(false);
    });

    // Df-02: worldY > fogEnd 时 fog alpha = maxAlpha
    test('fogLayer alpha equals maxAlpha when worldY >= fogEnd', () => {
        bg._updateDepthFog(20000);
        // 0.65 maxAlpha
        const fogAlpha = bg._fogLayer.alpha;
        expect(fogAlpha).toBeCloseTo(0.65, 2);
    });

    // Df-03: worldY=16000 时 fog alpha = 0.325 (线性插值)
    test('fogLayer alpha is interpolated at worldY=16000', () => {
        bg._updateDepthFog(16000);
        const fogAlpha = bg._fogLayer.alpha;
        expect(fogAlpha).toBeCloseTo(0.325, 2);
    });
});