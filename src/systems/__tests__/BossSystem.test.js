import { jest } from '@jest/globals';
import { BossSystem, buildBossConfig, calculateBossHp, getBossKey } from '../BossSystem.js';

describe('BossSystem', () => {
    let bossSystem;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            level: 5,
            enemies: [],
            physics: { moveTo: jest.fn() },
            time: { now: 1000 }
        };
        bossSystem = new BossSystem(mockScene);
    });

    describe('calculateBossHp (feat-054)', () => {
        const config = { baseHp: 240, hpPerLevel: 40, triggerLevel: 5 };

        test('equals baseHp at the trigger level', () => {
            // The fight happens at triggerLevel, so HP must not be inflated by it
            expect(bossSystem.calculateBossHp(config, 5)).toBe(240);
        });

        test('grows linearly above the trigger level', () => {
            expect(bossSystem.calculateBossHp(config, 6)).toBe(280);
            expect(bossSystem.calculateBossHp(config, 8)).toBe(360);
        });

        test('never drops below baseHp below the trigger level', () => {
            expect(bossSystem.calculateBossHp(config, 1)).toBe(240);
            expect(bossSystem.calculateBossHp(config, 4)).toBe(240);
        });

        test('treats a missing/NaN level as the trigger level', () => {
            expect(bossSystem.calculateBossHp(config, undefined)).toBe(240);
            expect(bossSystem.calculateBossHp(config, NaN)).toBe(240);
        });

        test('defaults triggerLevel to 1 when absent', () => {
            expect(bossSystem.calculateBossHp({ baseHp: 100, hpPerLevel: 50 }, 3)).toBe(200);
        });

        test('returns a finite number for a degenerate config', () => {
            expect(bossSystem.calculateBossHp({}, 5)).toBe(0);
            expect(Number.isFinite(bossSystem.calculateBossHp(null, 5))).toBe(true);
        });
    });

    describe('buildBossConfig (feat-054)', () => {
        const squid = { name: '大王乌贼', baseHp: 240, hpPerLevel: 40, triggerLevel: 5, size: 200, damage: 18, attackInterval: 1600 };

        test('resolves HP from the level formula', () => {
            expect(buildBossConfig(squid, 5).hp).toBe(240);
            expect(buildBossConfig(squid, 7).hp).toBe(320);
        });

        test('keeps size (root cause of the invisible boss)', () => {
            const cfg = buildBossConfig(squid, 5);
            expect(cfg.size).toBe(200);
            expect(Number.isFinite(cfg.size)).toBe(true);
        });

        test('fills in safe defaults', () => {
            const cfg = buildBossConfig({ baseHp: 100 }, 3);
            expect(cfg.name).toBe('BOSS');
            expect(cfg.damage).toBe(30);
            expect(cfg.attackInterval).toBeGreaterThan(0);
        });

        test('does not mutate the source data', () => {
            const source = { ...squid };
            buildBossConfig(source, 9);
            expect(source.hp).toBeUndefined();
        });
    });

    describe('boss progress keys (feat-054)', () => {
        test('maps every boss type to the key GameScene stores', () => {
            expect(getBossKey('boss_squid')).toBe('squid');
            expect(getBossKey('boss_shark_king')).toBe('sharkKing');
            expect(getBossKey('boss_sea_dragon')).toBe('seaDragon');
        });

        test('falls back to stripping the boss_ prefix', () => {
            expect(getBossKey('boss_unknown')).toBe('unknown');
            expect(getBossKey('')).toBe('');
            expect(getBossKey(undefined)).toBe('');
        });

        test('is exposed on the system instance too', () => {
            expect(bossSystem.getBossKey('boss_shark_king')).toBe('sharkKing');
        });
    });

    test('triggers 1v1 mode when boss spawns', () => {
        const mockEnemy = { graphics: { x: 400, y: 400 }, destroy: jest.fn() };
        bossSystem.triggerBossFight(mockEnemy);
        expect(bossSystem.inBossFight).toBe(true);
    });

    test('other enemies flee when boss appears', () => {
        const otherEnemy = { setState: jest.fn() };
        mockScene.enemies = [otherEnemy];
        const boss = {};
        bossSystem.triggerBossFight(boss);
        expect(otherEnemy.setState).toHaveBeenCalledWith('fleeing', boss);
    });

    test('ends boss fight and resumes normal spawning', () => {
        bossSystem.endBossFight();
        expect(bossSystem.inBossFight).toBe(false);
    });

    test('isBossActive returns true when boss HP > 0', () => {
        const mockBoss = { hp: 100 };
        bossSystem.currentBoss = mockBoss;
        expect(bossSystem.isBossActive()).toBe(true);
    });

    test('isBossActive returns false when boss HP <= 0', () => {
        const mockBoss = { hp: 0 };
        bossSystem.currentBoss = mockBoss;
        expect(bossSystem.isBossActive()).toBe(false);
    });
});