import { LuckSystem } from '../LuckSystem.js';

describe('LuckSystem', () => {
    let luckSystem;

    beforeEach(() => {
        luckSystem = new LuckSystem(0);
    });

    describe('constructor', () => {
        test('initializes with given luck value', () => {
            const system = new LuckSystem(10);
            expect(system.getLuck()).toBe(10);
        });

        test('defaults to 0 luck', () => {
            const system = new LuckSystem();
            expect(system.getLuck()).toBe(0);
        });
    });

    describe('getLuck', () => {
        test('returns current luck', () => {
            luckSystem.luck = 25;
            expect(luckSystem.getLuck()).toBe(25);
        });
    });

    describe('addLuck', () => {
        test('adds to luck and returns new value', () => {
            expect(luckSystem.addLuck(5)).toBe(5);
            expect(luckSystem.getLuck()).toBe(5);
        });

        test('handles negative amounts', () => {
            luckSystem.luck = 10;
            expect(luckSystem.addLuck(-3)).toBe(7);
        });
    });

    describe('setLuck', () => {
        test('sets luck to specific value', () => {
            luckSystem.setLuck(50);
            expect(luckSystem.getLuck()).toBe(50);
        });
    });

    describe('reset', () => {
        test('resets luck to base value', () => {
            luckSystem.luck = 25;
            luckSystem.baseLuck = 10;
            luckSystem.reset();
            expect(luckSystem.getLuck()).toBe(10);
        });
    });

    describe('calculateGoodChance', () => {
        test('returns base chance when luck is 0', () => {
            const chance = luckSystem.calculateGoodChance(50, {});
            expect(chance).toBe(50);
        });

        test('increases chance with positive luck using goodBonusPerLuck', () => {
            luckSystem.luck = 10;
            const chance = luckSystem.calculateGoodChance(50, { goodBonusPerLuck: 0.5 });
            expect(chance).toBe(55);
        });

        test('uses fallback 2 when luckInfluence is empty (backward compatible)', () => {
            luckSystem.luck = 10;
            const chance = luckSystem.calculateGoodChance(50, {});
            expect(chance).toBe(70);
        });

        test('caps at 95', () => {
            luckSystem.luck = 100;
            const chance = luckSystem.calculateGoodChance(50, { goodBonusPerLuck: 0.5 });
            expect(chance).toBe(95);
        });

        test('floors at 5', () => {
            luckSystem.luck = -90;
            const chance = luckSystem.calculateGoodChance(50, { goodBonusPerLuck: 0.5 });
            expect(chance).toBe(5);
        });
    });

    describe('modifyWeight', () => {
        test('increases good effect weight with luck', () => {
            luckSystem.luck = 10;
            const result = luckSystem.modifyWeight(10, true, { goodBonusPerLuck: 0.5 });
            expect(result).toBe(15);
        });

        test('decreases bad effect weight with luck', () => {
            luckSystem.luck = 10;
            const result = luckSystem.modifyWeight(10, false, { badReductionPerLuck: 0.3 });
            expect(result).toBe(7);
        });

        test('minimum weight is 1', () => {
            luckSystem.luck = 100;
            const result = luckSystem.modifyWeight(5, false, { badReductionPerLuck: 1 });
            expect(result).toBe(1);
        });
    });
});
