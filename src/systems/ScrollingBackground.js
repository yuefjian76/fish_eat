/**
 * ScrollingBackground — 无限滚动背景系统
 *
 * 替代 BackgroundExpansion，管理深度颜色渐变、3层 TileSprite 视差层、
 * 深度雾效、卷轴边缘效果、气泡池。
 *
 * 纯函数逻辑委托给 DepthColorMapper 工具类。
 */
import { DepthColorMapper } from './DepthColorMapper.js';
import { BackgroundSystem } from './BackgroundSystem.js';

export class ScrollingBackground {
    // =======================================================================
    // 静态配置
    // =======================================================================
    static LAYER_CONFIG = {
        bg:  { parallaxX: 0.08, parallaxY: 0.05, alpha: 0.55, depth: 1  },
        mid: { parallaxX: 0.25, parallaxY: 0.15, alpha: 0.40, depth: 2  },
        fg:  { parallaxX: 0.50, parallaxY: 0.30, alpha: 0.22, depth: 3  },
    };

    static EDGE_WIDTH   = 120;   // 卷轴边缘宽度 px
    static EDGE_ALPHA  = 0.4;   // 边缘最大 alpha
    static BUBBLE_POOL_SIZE = 40;

    // =======================================================================
    // 构造
    // =======================================================================
    /**
     * @param {object} scene        — Phaser Scene 实例
     * @param {object} gradientConfig — 深度梯度配置（来自 depth_gradient.json）
     * @param {object} options       — { worldWidth, worldHeight, viewportW, viewportH, theme }
     */
    constructor(scene, gradientConfig, options = {}) {
        this.scene    = scene;
        this.config   = gradientConfig || DepthColorMapper.getGradientConfig();
        this.options  = {
            worldWidth:  options.worldWidth  || 20000,
            worldHeight: options.worldHeight || 20000,
            viewportW:   options.viewportW   || 1024,
            viewportH:   options.viewportH   || 768,
            theme:       options.theme       || 'undersea',
        };

        this._created = false;

        // Phaser 对象（由 create() 创建）
        this._gradientLayer  = null; // Graphics — 深度渐变底色
        this._tileLayers    = {};    // { bg, mid, fg } TileSprites
        this._fogLayer      = null;  // Graphics — 深度雾
        this._edgeOverlays  = [];    // Graphics[4] — 卷轴四边
        this._bubblePool    = [];     // Graphics[]   — 气泡对象池

        // 当前主题
        this._currentTheme  = this.options.theme;

        // DepthColorMapper 代理（保持接口兼容）
        this._mapper = DepthColorMapper;
    }

    // =======================================================================
    // 公开方法
    // =======================================================================

    /**
     * 创建所有 Phaser 游戏对象
     */
    create() {
        if (this._created) return;
        this._created = true;

        this._createDepthGradient();
        this._createTileLayers();
        this._createDepthFog();
        this._createScrollEdge();
        this._createBubblePool();
    }

    /**
     * 每帧更新
     * @param {number} cameraScrollX
     * @param {number} cameraScrollY
     * @param {number} delta — delta time (ms)
     */
    update(cameraScrollX, cameraScrollY, delta) {
        if (!this._created) return;

        const playerWorldY = cameraScrollY + this.options.viewportH / 2;

        this._updateDepthGradient(playerWorldY);
        this._updateTileLayers(cameraScrollX);
        this._updateDepthFog(playerWorldY);
        this._updateBubbles(cameraScrollX, cameraScrollY, delta);
    }

    /**
     * 切换主题
     * @param {string} themeKey — 'undersea' | 'tropical' | 'polar'
     * @param {number} _transitionMs — 未使用（兼容性存根）
     */
    setTheme(themeKey, _transitionMs = 0) {
        const validThemes = ['undersea', 'tropical', 'polar'];
        if (!validThemes.includes(themeKey)) {
            console.warn(`[ScrollingBackground] Unknown theme: ${themeKey}`);
            return;
        }
        this._currentTheme = themeKey;
        // TileSprite 纹理切换暂未实现（feat-047）
    }

    /**
     * 获取下一个主题（每2级切换时使用）
     */
    getNextTheme() {
        const cycle = ['undersea', 'tropical', 'polar'];
        const idx   = cycle.indexOf(this._currentTheme);
        return cycle[(idx + 1) % cycle.length];
    }

    /**
     * 销毁所有游戏对象
     */
    destroy() {
        if (!this._created) return;
        this._created = false;

        if (this._gradientLayer) {
            this._gradientLayer.destroy();
            this._gradientLayer = null;
        }

        for (const key of Object.keys(this._tileLayers)) {
            if (this._tileLayers[key]) {
                this._tileLayers[key].destroy();
                delete this._tileLayers[key];
            }
        }

        if (this._fogLayer) {
            this._fogLayer.destroy();
            this._fogLayer = null;
        }

        for (const edge of this._edgeOverlays) {
            edge.destroy();
        }
        this._edgeOverlays = [];

        for (const bubble of this._bubblePool) {
            bubble.destroy();
        }
        this._bubblePool = [];
    }

    // =======================================================================
    // 内部方法 — 代理到 DepthColorMapper（纯函数，可单元测试）
    // =======================================================================

    _computeDepthColor(worldY) {
        return this._mapper.computeDepthColor(worldY);
    }

    _interpolateColor(colorA, colorB, t) {
        return this._mapper.interpolateColor(colorA, colorB, t);
    }

    _worldYToDepthZone(worldY) {
        return this._mapper.worldYToDepthZone(worldY);
    }

    _computeFogAlpha(worldY) {
        return this._mapper.computeFogAlpha(worldY);
    }

    _bubbleConfigForDepth(worldY) {
        return this._mapper.bubbleConfigForDepth(worldY);
    }

    // =======================================================================
    // 私有方法 — 创建 Phaser 对象
    // =======================================================================

    _createDepthGradient() {
        this._gradientLayer = this.scene.add.graphics();
        this._gradientLayer.setDepth(0);
        this._gradientLayer.setScrollFactor(0); // 固定屏幕
    }

    _createTileLayers() {
        // 使用现有背景纹理创建视差层（scrollFactor 实现水平视差）
        const themeKey = this._currentTheme || 'undersea';
        const themeImages = BackgroundSystem.THEME_CONFIG[themeKey]?.images ||
            BackgroundSystem.THEME_CONFIG.undersea.images;

        const { viewportW, viewportH } = this.options;

        // BgLayer: 背景图，最慢视差
        const bgKey = themeImages.background;
        this._tileLayers.bg = this.scene.add.image(viewportW / 2, viewportH / 2, bgKey);
        this._tileLayers.bg.setDepth(1);
        this._tileLayers.bg.setScrollFactor(ScrollingBackground.LAYER_CONFIG.bg.parallaxX, ScrollingBackground.LAYER_CONFIG.bg.parallaxY);
        this._tileLayers.bg.setAlpha(ScrollingBackground.LAYER_CONFIG.bg.alpha);
        this._tileLayers.bg.setDisplaySize(viewportW * 4, viewportH);

        // MidLayer: 中景图，中速视差
        const midKey = themeImages.midground || 'midground_undersea_theme';
        this._tileLayers.mid = this.scene.add.image(viewportW / 2, viewportH / 2, midKey);
        this._tileLayers.mid.setDepth(2);
        this._tileLayers.mid.setScrollFactor(ScrollingBackground.LAYER_CONFIG.mid.parallaxX, ScrollingBackground.LAYER_CONFIG.mid.parallaxY);
        this._tileLayers.mid.setAlpha(ScrollingBackground.LAYER_CONFIG.mid.alpha);
        this._tileLayers.mid.setDisplaySize(viewportW * 4, viewportH);

        // FgLayer: 前景图，快速视差
        const fgKey = themeImages.foreground || 'foreground_undersea_theme';
        this._tileLayers.fg = this.scene.add.image(viewportW / 2, viewportH / 2, fgKey);
        this._tileLayers.fg.setDepth(3);
        this._tileLayers.fg.setScrollFactor(ScrollingBackground.LAYER_CONFIG.fg.parallaxX, ScrollingBackground.LAYER_CONFIG.fg.parallaxY);
        this._tileLayers.fg.setAlpha(ScrollingBackground.LAYER_CONFIG.fg.alpha);
        this._tileLayers.fg.setDisplaySize(viewportW * 4, viewportH);
    }

    _createDepthFog() {
        this._fogLayer = this.scene.add.graphics();
        this._fogLayer.setDepth(0);
        this._fogLayer.setScrollFactor(0);
        this._fogLayer.setVisible(false); // 初始隐藏，worldY>fogStart 时显示
    }

    _createScrollEdge() {
        // 四边各一个 overlay（上下左右）
        for (let i = 0; i < 4; i++) {
            const edge = this.scene.add.graphics();
            edge.setDepth(0);
            edge.setScrollFactor(0);
            edge.setAlpha(0);
            this._edgeOverlays.push(edge);
        }
    }

    _createBubblePool() {
        for (let i = 0; i < ScrollingBackground.BUBBLE_POOL_SIZE; i++) {
            const bubble = this.scene.add.graphics();
            bubble.setDepth(1);
            bubble.setVisible(false);
            this._bubblePool.push(bubble);
        }
    }

    // =======================================================================
    // 私有方法 — 每帧更新
    // =======================================================================

    /**
     * 更新深度渐变层：根据玩家 worldY 绘制全屏底色
     * @param {number} playerWorldY
     */
    _updateDepthGradient(playerWorldY) {
        const { viewportW, viewportH } = this.options;
        const color = this._computeDepthColor(playerWorldY);

        this._gradientLayer.clear();
        this._gradientLayer.fillStyle(color, 1);
        this._gradientLayer.fillRect(0, 0, viewportW, viewportH);
    }

    /**
     * 更新 3 层视差层（no-op：Phaser scrollFactor 自动处理）
     *
     * 历史 Bug: 这里曾用 setPosition(viewportW/2 + scrollX*parallax, ...)
     * 配合 setScrollFactor(parallax, 0). Phaser 公式
     *   screenX = worldX - cameraScrollX * scrollFactorX
     * 代入后两个 parallax 项相消，layer 永远在屏幕中央 512，
     * 玩家移出 viewport 时背景不滚动。
     *
     * 修复后: 不再每帧 setPosition. Layer 在创建时被 setPosition 到
     * 屏幕中心 + setScrollFactor(parallaxX, parallaxY), Phaser 在
     * 绘制时按 camera 偏移自动实现视差。
     *
     * @param {number} cameraScrollX — 仅保留参数以保持调用点不变
     */
    _updateTileLayers(cameraScrollX) {
        // Intentionally empty: Phaser's per-draw scrollFactor handles parallax.
    }

    /**
     * 计算指定层的视差偏移量（纯函数，便于测试）
     * @param {string} key — 'bg' | 'mid' | 'fg'
     * @param {number} cameraScrollX
     * @returns {{ x: number, y: number }}
     */
    _computeTileOffset(key, cameraScrollX) {
        const cfg = ScrollingBackground.LAYER_CONFIG[key];
        if (!cfg) return { x: 0, y: 0 };
        const centerX = this.options.viewportW / 2 + cameraScrollX * cfg.parallaxX;
        const centerY = this.options.viewportH / 2;
        return { x: centerX, y: centerY };
    }

    /**
     * 更新深度雾层
     * @param {number} playerWorldY
     */
    _updateDepthFog(playerWorldY) {
        const alpha = this._computeFogAlpha(playerWorldY);
        const { viewportW, viewportH } = this.options;

        this._fogLayer.clear();
        if (alpha > 0) {
            this._fogLayer.setVisible(true);
            this._fogLayer.setAlpha(alpha);
            // 雾色：深蓝黑 0x010818
            this._fogLayer.fillStyle(0x010818, 1);
            this._fogLayer.fillRect(0, 0, viewportW, viewportH);
        } else {
            this._fogLayer.setVisible(false);
        }
    }

    /**
     * 更新气泡池（暂不激活，feat-047 实现完整逻辑）
     */
    _updateBubbles(cameraScrollX, cameraScrollY, delta) {
        // feat-047: 根据 playerWorldY 参数化气泡配置并激活
    }
}