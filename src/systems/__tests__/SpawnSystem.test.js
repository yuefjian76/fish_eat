import { SpawnSystem } from '../SpawnSystem.js';

// Mock WaveSystem for testing
class MockWaveSystem {
    constructor(interval = 2000) {
        this._interval = interval;
    }
    getSpawnInterval() {
        return this._interval;
    }
}

// Mock fishData - include all fish types that could be selected
const mockFishData = {
    clownfish: { hp: 20, size: 30, speed: 100, exp: 10 },
    shrimp: { hp: 15, size: 25, speed: 120, exp: 8 },
    shark: { hp: 50, size: 50, speed: 80, exp: 30 },
    jellyfish: { hp: 10, size: 20, speed: 50, exp: 5 },
    seahorse: { hp: 25, size: 28, speed: 90, exp: 12 },
    octopus: { hp: 30, size: 35, speed: 70, exp: 15 },
    eel: { hp: 35, size: 40, speed: 85, exp: 18 },
    anglerfish: { hp: 40, size: 45, speed: 60, exp: 22 }
};

describe('SpawnSystem', () => {
    describe('initialization', () => {
        test('creates spawn system with default values', () => {
            const ws = new MockWaveSystem();
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData
            });
            expect(ss).toBeDefined();
        });

        test('uses waveSystem interval', () => {
            const ws = new MockWaveSystem(500);
            const spawns = [];
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                onEnemyCreated: (e) => spawns.push(e)
            });
            ss.update(500);
            expect(spawns.length).toBe(1);
        });
    });

    describe('update logic', () => {
        test('accumulates spawn timer', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData
            });
            ss.update(500);
            ss.update(500);
            // Should have spawned after 1000ms
            expect(ss._spawnTimer).toBe(0);
        });

        test('resets timer after spawn', () => {
            const ws = new MockWaveSystem(1000);
            const spawns = [];
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                onEnemyCreated: (e) => spawns.push(e)
            });
            ss.update(1000);
            expect(spawns.length).toBe(1);
            expect(ss._spawnTimer).toBe(0);
        });

        test('skips spawn when timer not reached', () => {
            const ws = new MockWaveSystem(1000);
            const spawns = [];
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                onEnemyCreated: (e) => spawns.push(e)
            });
            ss.update(500);
            expect(spawns.length).toBe(0);
        });
    });

    describe('_getSpawnWeights', () => {
        test('level 1-3 returns early weights', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData
            });
            const weights = ss._getSpawnWeights(2);
            expect(weights.clownfish).toBe(0.4);
            expect(weights.shrimp).toBe(0.35);
        });

        test('level 4-6 returns mid weights', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData
            });
            const weights = ss._getSpawnWeights(5);
            expect(weights.clownfish).toBe(0.2);
            expect(weights.shrimp).toBe(0.2);
        });

        test('level 7-10 returns late weights', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData
            });
            const weights = ss._getSpawnWeights(9);
            expect(weights.clownfish).toBe(0.1);
            expect(weights.anglerfish).toBe(0.15);
        });

        test('level 11+ returns endgame weights', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData
            });
            const weights = ss._getSpawnWeights(12);
            expect(weights.shark).toBe(0.2);
            expect(weights.anglerfish).toBe(0.2);
        });
    });

    describe('_selectFishByWeight', () => {
        test('returns valid fish type', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData
            });
            const weights = { clownfish: 0.6, shrimp: 0.4 };
            const type = ss._selectFishByWeight(weights);
            expect(['clownfish', 'shrimp']).toContain(type);
        });

        test('handles single weight', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData
            });
            const weights = { shark: 1.0 };
            const type = ss._selectFishByWeight(weights);
            expect(type).toBe('shark');
        });
    });

    describe('_calculateEnemyLevel', () => {
        test('returns level within zone bounds', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                gameStartTime: Date.now()
            });
            // Should return a number between 1 and 3 for default zone
            const level = ss._calculateEnemyLevel(2);
            expect(level).toBeGreaterThanOrEqual(1);
            expect(level).toBeLessThanOrEqual(3);
        });
    });

    describe('_getDifficultyMultiplier', () => {
        test('returns 1.0 for low level', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                playerLevel: 1,
                gameStartTime: Date.now()
            });
            const mult = ss._getDifficultyMultiplier();
            expect(mult).toBeGreaterThanOrEqual(1.0);
        });

        test('increases with level', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                playerLevel: 10,
                gameStartTime: Date.now()
            });
            const mult = ss._getDifficultyMultiplier();
            expect(mult).toBeGreaterThan(1.0);
        });
    });

    describe('setPlayerLevel', () => {
        test('updates player level', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                playerLevel: 1
            });
            ss.setPlayerLevel(5);
            expect(ss._playerLevel).toBe(5);
        });
    });

    describe('reset()', () => {
        test('resets spawn timer', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData
            });
            ss.update(500);
            ss.reset();
            expect(ss._spawnTimer).toBe(0);
        });

        test('accepts new config', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                playerLevel: 1
            });
            ss.reset({ playerLevel: 10 });
            expect(ss._playerLevel).toBe(10);
        });

        test('preserves existing values without config', () => {
            const ws = new MockWaveSystem(1000);
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                playerLevel: 5
            });
            ss.update(500);
            ss.reset();
            expect(ss._playerLevel).toBe(5);
        });
    });

    describe('edge cases', () => {
        test('handles zero delta', () => {
            const ws = new MockWaveSystem(1000);
            const spawns = [];
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                onEnemyCreated: (e) => spawns.push(e)
            });
            ss.update(0);
            expect(spawns.length).toBe(0);
        });

        test('handles very large delta', () => {
            const ws = new MockWaveSystem(1000);
            const spawns = [];
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: mockFishData,
                onEnemyCreated: (e) => spawns.push(e)
            });
            ss.update(10000);
            expect(spawns.length).toBeGreaterThan(0);
        });

        test('handles missing fish data gracefully', () => {
            const ws = new MockWaveSystem(1000);
            const spawns = [];
            const ss = new SpawnSystem({
                waveSystem: ws,
                fishData: {},  // empty
                onEnemyCreated: (e) => spawns.push(e)
            });
            ss.update(1000);
            // Should not crash - returns spawns as empty array
            expect(spawns.length).toBe(0);
        });
    });
});