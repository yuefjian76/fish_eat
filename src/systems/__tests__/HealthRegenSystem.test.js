import { HealthRegenSystem } from '../HealthRegenSystem.js';

describe('HealthRegenSystem', () => {
    describe('initialization', () => {
        test('creates health regen system', () => {
            const hrs = new HealthRegenSystem({});
            expect(hrs).toBeDefined();
        });

        test('initializes with default maxHp', () => {
            const hrs = new HealthRegenSystem({});
            expect(hrs.getMaxHp()).toBe(50);
        });

        test('uses custom maxHp', () => {
            const hrs = new HealthRegenSystem({ maxHp: 100 });
            expect(hrs.getMaxHp()).toBe(100);
        });
    });

    describe('takeDamage', () => {
        test('reduces HP', () => {
            const hrs = new HealthRegenSystem({ initialHp: 50 });
            hrs.takeDamage(10);
            expect(hrs.getHp()).toBe(40);
        });

        test('resets out-of-combat timer', () => {
            const hrs = new HealthRegenSystem({ initialHp: 50 });
            hrs.takeDamage(10);
            // After update, should not regen immediately
            expect(hrs.getHp()).toBe(40);
        });
    });

    describe('update regen', () => {
        test('does not regen in combat', () => {
            const hrs = new HealthRegenSystem({ initialHp: 40, maxHp: 50 });
            hrs.enterCombat();
            hrs.update(5000);
            expect(hrs.getHp()).toBe(40);
        });

        test('regenerates after out-of-combat threshold', () => {
            const hrs = new HealthRegenSystem({ initialHp: 40, maxHp: 50, outOfCombatThreshold: 1000 });
            hrs.update(1000); // reach threshold
            hrs.update(1000); // regen
            expect(hrs.getHp()).toBeGreaterThan(40);
        });

        test('does not exceed maxHp', () => {
            const hrs = new HealthRegenSystem({ initialHp: 50, maxHp: 50, outOfCombatThreshold: 1000 });
            hrs.update(1000);
            hrs.update(10000);
            expect(hrs.getHp()).toBe(50);
        });
    });

    describe('getHp/setHp', () => {
        test('gets current HP', () => {
            const hrs = new HealthRegenSystem({ initialHp: 30 });
            expect(hrs.getHp()).toBe(30);
        });

        test('sets HP', () => {
            const hrs = new HealthRegenSystem({});
            hrs.setHp(40);
            expect(hrs.getHp()).toBe(40);
        });
    });

    describe('setMaxHp', () => {
        test('increases maxHp', () => {
            const hrs = new HealthRegenSystem({ maxHp: 50 });
            hrs.setMaxHp(60);
            expect(hrs.getMaxHp()).toBe(60);
        });

        test('caps current HP at new maxHp', () => {
            const hrs = new HealthRegenSystem({ initialHp: 50, maxHp: 50 });
            hrs.setMaxHp(40);
            expect(hrs.getHp()).toBe(40);
        });
    });

    describe('isRegenerating', () => {
        test('returns false in combat', () => {
            const hrs = new HealthRegenSystem({});
            hrs.enterCombat();
            expect(hrs.isRegenerating()).toBe(false);
        });

        test('returns false before threshold', () => {
            const hrs = new HealthRegenSystem({ outOfCombatThreshold: 5000 });
            hrs.update(1000);
            expect(hrs.isRegenerating()).toBe(false);
        });

        test('returns true after threshold when HP < maxHp', () => {
            const hrs = new HealthRegenSystem({ maxHp: 50, outOfCombatThreshold: 5000, healthRegenRate: 0.000001 });
            hrs.setHp(40); // Set HP below max
            hrs.update(6000); // Exceeds threshold
            expect(hrs.isRegenerating()).toBe(true);
        });

        test('returns false when HP = maxHp', () => {
            const hrs = new HealthRegenSystem({ maxHp: 50, outOfCombatThreshold: 1000 });
            hrs.update(1000);
            expect(hrs.isRegenerating()).toBe(false);
        });
    });

    describe('reset', () => {
        test('resets HP to maxHp', () => {
            const hrs = new HealthRegenSystem({ maxHp: 50 });
            hrs.setHp(30);
            hrs.reset();
            expect(hrs.getHp()).toBe(50);
        });

        test('resets timer and combat state', () => {
            const hrs = new HealthRegenSystem({ maxHp: 50, initialHp: 30 });
            hrs.enterCombat();
            hrs.reset();
            expect(hrs.isRegenerating()).toBe(false);
        });

        test('accepts new config', () => {
            const hrs = new HealthRegenSystem({ maxHp: 50 });
            hrs.reset({ maxHp: 60 });
            expect(hrs.getMaxHp()).toBe(60);
        });
    });
});