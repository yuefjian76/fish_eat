import { jest } from '@jest/globals';
import { BossSystem } from '../BossSystem.js';

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

    test('calculates boss HP with level scaling', () => {
        const bossConfig = { baseHp: 100, hpPerLevel: 100 };
        const hp = bossSystem.calculateBossHp(bossConfig, 5);
        expect(hp).toBe(600); // 100 + 5*100
    });

    test('triggers 1v1 mode when boss spawns', () => {
        const mockEnemy = { graphics: { x: 400, y: 400 }, destroy: jest.fn() };
        bossSystem.triggerBossFight(mockEnemy);
        expect(bossSystem.inBossFight).toBe(true);
    });

    test('other enemies flee when boss appears', () => {
        const otherEnemy = { flee: jest.fn() };
        mockScene.enemies = [otherEnemy];
        bossSystem.triggerBossFight({});
        expect(otherEnemy.flee).toHaveBeenCalled();
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