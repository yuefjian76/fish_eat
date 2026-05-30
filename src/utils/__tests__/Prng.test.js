import { Prng } from '../Prng.js';

// ---------------------------------------------------------------------------
// Group I: PRNG 确定性
// ---------------------------------------------------------------------------
describe('Prng mulberry32', () => {
    // I-01: 相同种子输出相同序列
    test('same seed produces same sequence', () => {
        const seq1 = [];
        const seq2 = [];
        const rng1 = Prng.create(42);
        const rng2 = Prng.create(42);
        for (let i = 0; i < 10; i++) {
            seq1.push(rng1.next());
            seq2.push(rng2.next());
        }
        expect(seq1).toEqual(seq2);
    });

    // I-02: 不同种子输出不同序列
    test('different seeds produce different sequences', () => {
        const rng1 = Prng.create(42);
        const rng2 = Prng.create(99);
        const seq1 = [rng1.next(), rng1.next(), rng1.next()];
        const seq2 = [rng2.next(), rng2.next(), rng2.next()];
        expect(seq1).not.toEqual(seq2);
    });

    // I-03: 输出范围 [0, 1)
    test('output is always in [0, 1)', () => {
        const rng = Prng.create(12345);
        for (let i = 0; i < 100; i++) {
            const v = rng.next();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    // I-04: 序列均匀分布（简单统计：均值约 0.5）
    test('output distribution is roughly uniform (mean ~0.5)', () => {
        const rng = Prng.create(777);
        const N = 10000;
        let sum = 0;
        for (let i = 0; i < N; i++) sum += rng.next();
        const mean = sum / N;
        expect(mean).toBeGreaterThan(0.45);
        expect(mean).toBeLessThan(0.55);
    });
});

// ---------------------------------------------------------------------------
// Group J: chunkSeed 确定性
// ---------------------------------------------------------------------------
describe('chunkSeed', () => {
    // J-01: _chunkSeed 确定性
    test('same (chunkX, chunkY) always returns same seed', () => {
        const s1 = Prng.chunkSeed(3, 5);
        const s2 = Prng.chunkSeed(3, 5);
        expect(s1).toBe(s2);
    });

    // J-02: 不同 chunk 种子不同
    test('adjacent chunks produce different seeds', () => {
        const c = Prng.chunkSeed(3, 5);
        expect(Prng.chunkSeed(3, 5)).toBe(c);
        expect(Prng.chunkSeed(3, 6)).not.toBe(c);
        expect(Prng.chunkSeed(4, 5)).not.toBe(c);
        expect(Prng.chunkSeed(2, 5)).not.toBe(c);
        expect(Prng.chunkSeed(3, 4)).not.toBe(c);
    });

    // J-03: 种子为整数（不含浮点误差）
    test('_chunkSeed returns integer', () => {
        const seed = Prng.chunkSeed(7, 11);
        expect(Number.isInteger(seed)).toBe(true);
        expect(seed).toBeGreaterThan(0);
    });

    // J-04: 相同 world 坐标映射到相同 chunk seed
    test('same world coords map to same chunk seed', () => {
        const CHUNK_W = 1024, CHUNK_H = 768;
        const worldX = 5500, worldY = 8200;
        const cx = Math.floor(worldX / CHUNK_W);
        const cy = Math.floor(worldY / CHUNK_H);
        const s1 = Prng.chunkSeed(cx, cy);
        const s2 = Prng.chunkSeed(cx, cy);
        expect(s1).toBe(s2);
    });
});