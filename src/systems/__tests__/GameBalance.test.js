import {
    calculateMaxHpPure,
    calculateShieldCooldownPure,
    canEatFishBySizePure,
    calculateEnemyDamagePure
} from '../GameBalance.js';

describe('GameBalanceSystem - Pure Functions', () => {
    describe('calculateMaxHpPure', () => {
        test('level 1 has base HP', () => {
            expect(calculateMaxHpPure(50, 1, 10)).toBe(50);
        });

        test('each level adds HP per level', () => {
            // Level 1: 50, Level 2: 60, Level 3: 70
            expect(calculateMaxHpPure(50, 2, 10)).toBe(60);
            expect(calculateMaxHpPure(50, 3, 10)).toBe(70);
            expect(calculateMaxHpPure(50, 10, 10)).toBe(140);
        });

        test('works with different base HP', () => {
            expect(calculateMaxHpPure(100, 1, 15)).toBe(100);
            expect(calculateMaxHpPure(100, 5, 15)).toBe(160);
        });

        test('level 1 with 0 base returns 0', () => {
            expect(calculateMaxHpPure(0, 1, 10)).toBe(0);
        });
    });

    describe('calculateShieldCooldownPure', () => {
        test('shield cooldown is 15 seconds', () => {
            expect(calculateShieldCooldownPure()).toBe(15);
        });

        test('shield cooldown is configurable', () => {
            expect(calculateShieldCooldownPure(20)).toBe(20);
            expect(calculateShieldCooldownPure(12)).toBe(12);
        });
    });

    describe('canEatFishBySizePure', () => {
        test('player size 20 can eat shrimp size 12', () => {
            // 20 > 12 * 1.2 = 14.4
            expect(canEatFishBySizePure(20, 12)).toBe(true);
        });

        test('player size 20 cannot eat clownfish size 20', () => {
            // 20 > 20 * 1.2 = 24? No
            expect(canEatFishBySizePure(20, 20)).toBe(false);
        });

        test('player size 25 can eat clownfish size 20', () => {
            // 25 > 20 * 1.2 = 24? Yes
            expect(canEatFishBySizePure(25, 20)).toBe(true);
        });

        test('player size 49 cannot eat shark size 40', () => {
            // 49 > 40 * 1.2 = 48? No
            expect(canEatFishBySizePure(49, 40)).toBe(false);
        });

        test('player size 50 can eat shark size 40', () => {
            // 50 > 40 * 1.2 = 48? Yes
            expect(canEatFishBySizePure(50, 40)).toBe(true);
        });
    });

    describe('calculateEnemyDamagePure', () => {
        test('shrimp (size 12) deals 3 damage base', () => {
            expect(calculateEnemyDamagePure(12, 1.0)).toBe(3);
        });

        test('clownfish (size 20) deals 5 damage base', () => {
            expect(calculateEnemyDamagePure(20, 1.0)).toBe(5);
        });

        test('shark (size 40) deals 10 damage base', () => {
            expect(calculateEnemyDamagePure(40, 1.0)).toBe(10);
        });

        test('easy mode multiplier reduces damage', () => {
            // Shark 40 / 4 * 0.3 = 3
            expect(calculateEnemyDamagePure(40, 0.3)).toBe(3);
        });

        test('hard mode multiplier increases damage', () => {
            // Shark 40 / 4 * 1.0 = 10
            expect(calculateEnemyDamagePure(40, 1.0)).toBe(10);
        });

        test('floors the result', () => {
            // Size 15 / 4 * 1.0 = 3.75 -> 3
            expect(calculateEnemyDamagePure(15, 1.0)).toBe(3);
        });
    });
});
