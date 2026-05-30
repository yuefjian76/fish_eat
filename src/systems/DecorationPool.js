/**
 * DecorationPool — 程序化装饰对象池
 *
 * 职责:
 *   - 根据相机视口位置，维护视口附近的装饰对象
 *   - 使用确定性 PRNG（mulberry32）按 chunk 坐标生成装饰
 *   - 超出视口 + buffer 的装饰自动回收入池
 *   - 依深度区域选择装饰类型
 *
 * 不负责:
 *   - 渲染细节（通过 Phaser scene.add.* 创建对象）
 *   - 颜色梯度（由 ScrollingBackground 负责）
 */
import { Prng } from '../utils/Prng.js';
import { DepthColorMapper } from './DepthColorMapper.js';

export class DecorationPool {
    // =======================================================================
    // 静态配置
    // =======================================================================
    static CHUNK_W = 1024;
    static CHUNK_H = 768;
    static MAX_POOL_SIZE = 200;
    static BUFFER_CHUNKS = 2; // 视口外保留 2 个 chunk 缓冲

    // =======================================================================
    // 构造
    // =======================================================================
    /**
     * @param {object} scene         — Phaser Scene 实例
     * @param {object} gradientConfig — DepthColorMapper 配置
     * @param {object} options        — { worldWidth, worldHeight, viewportW, viewportH }
     */
    constructor(scene, gradientConfig, options = {}) {
        this.scene    = scene;
        this.config   = gradientConfig || DepthColorMapper.getGradientConfig();
        this.options  = {
            worldWidth:  options.worldWidth  || 20000,
            worldHeight: options.worldHeight || 20000,
            viewportW:   options.viewportW   || 1024,
            viewportH:   options.viewportH   || 768,
        };

        this._created    = false;
        this._activeCount = 0;

        // 活跃 chunk 映射: chunkKey → { graphics, chunkX, chunkY }
        this._chunks = new Map();

        // 对象池（预分配）
        this._pool = [];
    }

    // =======================================================================
    // 公开方法
    // =======================================================================

    create() {
        if (this._created) return;
        this._created = true;
    }

    /**
     * 每帧更新
     * @param {number} cameraScrollX
     * @param {number} cameraScrollY
     * @param {number} playerWorldY
     */
    update(cameraScrollX, cameraScrollY, playerWorldY) {
        if (!this._created) return;

        const { viewportW, viewportH } = this.options;

        // 计算当前视口覆盖的 chunk 范围
        const bufferW  = DecorationPool.BUFFER_CHUNKS * DecorationPool.CHUNK_W;
        const bufferH  = DecorationPool.BUFFER_CHUNKS * DecorationPool.CHUNK_H;

        const minCX = Math.floor((cameraScrollX - bufferW)  / DecorationPool.CHUNK_W);
        const maxCX = Math.floor((cameraScrollX + viewportW + bufferW) / DecorationPool.CHUNK_W);
        const minCY = Math.floor((cameraScrollY - bufferH)  / DecorationPool.CHUNK_H);
        const maxCY = Math.floor((cameraScrollY + viewportH + bufferH) / DecorationPool.CHUNK_H);

        // 需要激活的 chunk 集合
        const neededKeys = new Set();

        for (let cy = minCY; cy <= maxCY; cy++) {
            for (let cx = minCX; cx <= maxCX; cx++) {
                const key = this._getChunkKey(cx, cy);
                neededKeys.add(key);

                if (!this._chunks.has(key)) {
                    if (this._activeCount >= DecorationPool.MAX_POOL_SIZE) {
                        // 池已满，跳过
                        continue;
                    }
                    this._activateChunk(cx, cy, playerWorldY);
                }
            }
        }

        // 回收不在视口范围内的 chunk
        this._recycleDistantChunks(minCX, maxCX, minCY, maxCY);
    }

    destroy() {
        if (!this._created) return;
        this._created = false;

        for (const chunk of this._chunks.values()) {
            if (chunk.graphics) chunk.graphics.destroy();
        }
        this._chunks.clear();
        this._activeCount = 0;

        for (const obj of this._pool) {
            if (obj) obj.destroy();
        }
        this._pool = [];
    }

    // =======================================================================
    // 内部方法 — 纯函数（可单元测试）
    // =======================================================================

    /**
     * 将 worldY 映射为深度区域 ID（委托 DepthColorMapper）
     * @param {number} worldY
     * @returns {'surface'|'shallow'|'mid'|'deep'|'abyss'}
     */
    static worldYToZone(worldY) {
        return DepthColorMapper.worldYToDepthZone(worldY);
    }

    _getChunkKey(chunkX, chunkY) {
        return `${chunkX}:${chunkY}`;
    }

    _chunkSeed(chunkX, chunkY) {
        return Prng.chunkSeed(chunkX, chunkY);
    }

    // =======================================================================
    // 私有方法
    // =======================================================================

    _activateChunk(chunkX, chunkY, playerWorldY) {
        const key  = this._getChunkKey(chunkX, chunkY);
        const seed = this._chunkSeed(chunkX, chunkY);
        const rng  = Prng.create(seed);
        const zone = DecorationPool.worldYToZone(playerWorldY);

        // 在 chunk 内随机位置生成装饰
        const localX = chunkX * DecorationPool.CHUNK_W + rng.next() * DecorationPool.CHUNK_W;
        const localY = chunkY * DecorationPool.CHUNK_H + rng.next() * DecorationPool.CHUNK_H;

        // 获取/创建 graphics 对象
        const graphics = this._pool.pop() || this.scene.add.graphics();

        // 根据 zone 绘制不同装饰（程序化）
        this._drawDecoration(graphics, zone, localX, localY, rng);

        graphics.setDepth(0);
        graphics.setScrollFactor(0, 0);
        graphics.setVisible(true);

        this._chunks.set(key, { graphics, chunkX, chunkY });
        this._activeCount++;
    }

    _drawDecoration(graphics, zone, x, y, rng) {
        graphics.clear();

        switch (zone) {
            case 'surface': {
                // 阳光光柱 + 小气泡
                const rayCount = 2 + Math.floor(rng.next() * 3);
                graphics.fillStyle(0xFFFFAA, 0.08 + rng.next() * 0.05);
                for (let i = 0; i < rayCount; i++) {
                    const rx = x + (rng.next() - 0.5) * 200;
                    const ry = y - 50;
                    graphics.fillRect(rx, ry, 6 + rng.next() * 10, 60 + rng.next() * 80);
                }
                // 小气泡群
                const bubbleCount = 3 + Math.floor(rng.next() * 5);
                graphics.fillStyle(0xAADDFF, 0.3 + rng.next() * 0.2);
                for (let i = 0; i < bubbleCount; i++) {
                    const bx = x + (rng.next() - 0.5) * 150;
                    const by = y + (rng.next() - 0.5) * 100;
                    const br = 2 + rng.next() * 5;
                    graphics.fillCircle(bx, by, br);
                }
                break;
            }
            case 'shallow': {
                // 珊瑚
                const coralCount = 2 + Math.floor(rng.next() * 3);
                const colors = [0xFF6B6B, 0xFF8E72, 0xE84A5F, 0xFFAAAA];
                for (let i = 0; i < coralCount; i++) {
                    const cx = x + (rng.next() - 0.5) * 180;
                    const cy = y + (rng.next() - 0.5) * 120;
                    const cr = 8 + rng.next() * 20;
                    graphics.fillStyle(colors[Math.floor(rng.next() * colors.length)], 0.7);
                    graphics.fillCircle(cx, cy, cr);
                }
                break;
            }
            case 'mid': {
                // 海草 + 岩石
                const seaweedCount = 3 + Math.floor(rng.next() * 4);
                graphics.lineStyle(2 + rng.next() * 3, 0x2D7D46, 0.6 + rng.next() * 0.3);
                for (let i = 0; i < seaweedCount; i++) {
                    const sx = x + (rng.next() - 0.5) * 200;
                    const sy = y + 30;
                    const height = 40 + rng.next() * 80;
                    graphics.fillStyle(0x2D7D46, 0.6 + rng.next() * 0.3);
                    graphics.fillRect(sx, sy, 3 + rng.next() * 4, height);
                }
                if (rng.next() > 0.5) {
                    const rx = x + (rng.next() - 0.5) * 150;
                    const ry = y + (rng.next() - 0.5) * 100;
                    const rw = 20 + rng.next() * 40;
                    const rh = 15 + rng.next() * 30;
                    graphics.fillStyle(0x5A5A6E, 0.8);
                    graphics.fillEllipse(rx, ry, rw, rh);
                }
                break;
            }
            case 'deep': {
                // 大岩石 + 暗礁
                const rockCount = 1 + Math.floor(rng.next() * 2);
                for (let i = 0; i < rockCount; i++) {
                    const rx = x + (rng.next() - 0.5) * 200;
                    const ry = y + (rng.next() - 0.5) * 150;
                    const rw = 30 + rng.next() * 50;
                    const rh = 20 + rng.next() * 35;
                    graphics.fillStyle(0x3A3A4A, 0.85);
                    graphics.fillEllipse(rx, ry, rw, rh);
                }
                // 稀疏大气泡
                if (rng.next() > 0.6) {
                    const bx = x + (rng.next() - 0.5) * 180;
                    const by = y + (rng.next() - 0.5) * 120;
                    const br = 8 + rng.next() * 12;
                    graphics.lineStyle(1, 0x88AACC, 0.4);
                    graphics.strokeCircle(bx, by, br);
                }
                break;
            }
            case 'abyss': {
                // 发光水母轮廓 / 生物发光粒子
                const glowCount = 2 + Math.floor(rng.next() * 5);
                for (let i = 0; i < glowCount; i++) {
                    const gx = x + (rng.next() - 0.5) * 250;
                    const gy = y + (rng.next() - 0.5) * 200;
                    const gr = 4 + rng.next() * 10;
                    graphics.fillStyle(0x00FFAA, 0.1 + rng.next() * 0.25);
                    graphics.fillCircle(gx, gy, gr);
                }
                break;
            }
            default:
                break;
        }
    }

    _recycleDistantChunks(minCX, maxCX, minCY, maxCY) {
        for (const [key, chunk] of this._chunks.entries()) {
            const { chunkX, chunkY, graphics } = chunk;
            if (chunkX < minCX - DecorationPool.BUFFER_CHUNKS ||
                chunkX > maxCX + DecorationPool.BUFFER_CHUNKS ||
                chunkY < minCY - DecorationPool.BUFFER_CHUNKS ||
                chunkY > maxCY + DecorationPool.BUFFER_CHUNKS) {
                // 回收
                graphics.setVisible(false);
                graphics.clear();
                this._pool.push(graphics);
                this._chunks.delete(key);
                this._activeCount--;
            }
        }
    }
}