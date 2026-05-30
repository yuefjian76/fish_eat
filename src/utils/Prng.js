/**
 * Prng — 确定性伪随机数生成器
 *
 * 使用 mulberry32 算法，相同种子产生相同序列。
 * 用于程序化装饰系统的确定性生成（DecorationPool 依赖）。
 */

export class Prng {
    /**
     * 创建 RNG 实例
     * @param {number} seed — 32 位整数种子
     * @returns {{ next: () => number }} — 返回 { next() } 接口
     */
    static create(seed) {
        let s = seed >>> 0; // 转为无符号 32 位
        return {
            next() {
                s = (s + 0x6D2B79F5) >>> 0;
                let t = Math.imul(s ^ (s >>> 15), 1 | s);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            }
        };
    }

    /**
     * 根据 chunk 坐标生成确定性种子
     * @param {number} chunkX
     * @param {number} chunkY
     * @returns {number} 整数种子
     */
    static chunkSeed(chunkX, chunkY) {
        // 使用简单的哈希组合：chunkX * 73856093 ^ chunkY * 19349663
        // 这是常见的空间哈希技巧，保证不同坐标产生不同整数
        const h = (chunkX * 73856093) ^ (chunkY * 19349663);
        // 折合到 32 位正整数范围
        return Math.abs(h) >>> 0;
    }
}