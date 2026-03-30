import { DriftBottleSystem } from '../DriftBottleSystem.js';
import { LuckSystem } from '../LuckSystem.js';

describe('DriftBottleSystem', () => {
    let driftBottleSystem;
    let externalLuck;
    const mockDriftBottleData = {
        effects: [
            { id: 'full_health', name: 'Full Health', type: 'instant', good: true, weight: 10 },
            { id: 'double_coins', name: '2x Coins', type: 'buff', good: true, weight: 5, duration: 30000 },
            { id: 'speed_down', name: 'Slow', type: 'debuff', good: false, weight: 3, duration: 10000 }
        ],
        luckInfluence: {
            baseGoodChance: 70,
            goodBonusPerLuck: 2,
            badReductionPerLuck: 1
        }
    };

    beforeEach(() => {
        driftBottleSystem = new DriftBottleSystem(mockDriftBottleData);
        externalLuck = new LuckSystem(10);
    });

    describe('constructor', () => {
        test('initializes with luck system', () => {
            expect(driftBottleSystem.luckSystem instanceof LuckSystem).toBe(true);
        });

        test('initializes with double coins inactive', () => {
            expect(driftBottleSystem.isDoubleCoinsActive()).toBe(false);
        });

        test('initializes with cooldown accel inactive', () => {
            expect(driftBottleSystem.isCooldownAccelActive()).toBe(false);
        });
    });

    describe('setLuckSystem', () => {
        test('sets external luck system', () => {
            driftBottleSystem.setLuckSystem(externalLuck);
            expect(driftBottleSystem.luckSystem).toBe(externalLuck);
        });
    });

    describe('isDoubleCoinsActive', () => {
        test('returns false initially', () => {
            expect(driftBottleSystem.isDoubleCoinsActive()).toBe(false);
        });
    });

    describe('isCooldownAccelActive', () => {
        test('returns false initially', () => {
            expect(driftBottleSystem.isCooldownAccelActive()).toBe(false);
        });
    });

    describe('getCooldownMultiplier', () => {
        test('returns 1 when not active', () => {
            expect(driftBottleSystem.getCooldownMultiplier()).toBe(1);
        });

        test('returns 0.5 when active', () => {
            driftBottleSystem.cooldownAccelActive = true;
            expect(driftBottleSystem.getCooldownMultiplier()).toBe(0.5);
        });
    });

    describe('reset', () => {
        test('resets luck system', () => {
            driftBottleSystem.luckSystem.baseLuck = 0;
            driftBottleSystem.luckSystem.luck = 20;
            driftBottleSystem.reset();
            expect(driftBottleSystem.luckSystem.getLuck()).toBe(0);
        });

        test('clears active effects', () => {
            driftBottleSystem.doubleCoinsActive = true;
            driftBottleSystem.reset();
            expect(driftBottleSystem.doubleCoinsActive).toBe(false);
        });
    });

    describe('selectEffect', () => {
        test('selects from good effects when luck is high', () => {
            driftBottleSystem.luckSystem.setLuck(20);
            const effect = driftBottleSystem.selectEffect();
            expect(effect.good).toBe(true);
        });

        test('selects from bad effects when luck is very low', () => {
            driftBottleSystem.luckSystem.setLuck(-30);
            const effect = driftBottleSystem.selectEffect();
            expect(effect.good).toBe(false);
        });
    });
});