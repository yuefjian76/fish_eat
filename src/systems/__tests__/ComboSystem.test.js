import { ComboSystem } from '../ComboSystem.js';

describe('ComboSystem', () => {
    let combo;

    beforeEach(() => {
        combo = new ComboSystem({ timeWindow: 3, bonusMultiplier: 0.2 });
    });

    describe('constructor', () => {
        test('initializes with count 0', () => {
            expect(combo.count).toBe(0);
        });

        test('converts timeWindow from seconds to ms', () => {
            expect(combo.timeWindow).toBe(3000);
        });

        test('uses default values when no config given', () => {
            const c = new ComboSystem();
            expect(c.timeWindow).toBe(3000);
            expect(c.bonusMultiplier).toBe(0.2);
        });
    });

    describe('onEat', () => {
        test('increments count on each eat', () => {
            combo.onEat(0);
            combo.onEat(500);
            combo.onEat(1000);
            expect(combo.count).toBe(3);
        });

        test('returns 1.0 multiplier on first eat (no bonus yet)', () => {
            const mult = combo.onEat(0);
            expect(mult).toBe(1.0);
        });

        test('returns bonus multiplier on subsequent eats', () => {
            combo.onEat(0);
            const mult = combo.onEat(500); // count=2 → 1.0 + 2*0.2 = 1.4
            expect(mult).toBeCloseTo(1.4, 5);
        });

        test('returns increasing multiplier as combo grows', () => {
            combo.onEat(0);   // count=1
            combo.onEat(100); // count=2
            combo.onEat(200); // count=3 → 1.0 + 3*0.2 = 1.6
            const mult = combo.onEat(300); // count=4 → 1.0 + 4*0.2 = 1.8
            expect(mult).toBeCloseTo(1.8, 5);
        });
    });

    describe('update - combo expiry', () => {
        test('combo resets when time window expires from last eat', () => {
            combo.onEat(0);
            combo.onEat(1000); // lastEatTime = 1000
            expect(combo.count).toBe(2);

            combo.update(1000 + 3001); // 3001ms past last eat → expired
            expect(combo.count).toBe(0);
        });

        test('combo does NOT reset within time window', () => {
            combo.onEat(0);
            combo.onEat(1000);
            combo.update(1000 + 2999); // still within window
            expect(combo.count).toBe(2);
        });

        test('combo window resets from last eat time, not first', () => {
            combo.onEat(0);
            combo.onEat(2500); // last eat at 2500
            combo.update(2500 + 2999); // within 3000ms of last eat
            expect(combo.count).toBe(2); // should still be active
        });

        test('combo stays at 0 if already 0', () => {
            combo.update(99999);
            expect(combo.count).toBe(0);
        });
    });

    describe('getBonusMultiplier', () => {
        test('returns 1.0 when count is 0', () => {
            expect(combo.getBonusMultiplier()).toBe(1.0);
        });

        test('returns 1.0 when count is 1 (no bonus for single kill)', () => {
            combo.onEat(0);
            expect(combo.getBonusMultiplier()).toBe(1.0);
        });

        test('returns correct multiplier for count=2', () => {
            combo.onEat(0);
            combo.onEat(100);
            expect(combo.getBonusMultiplier()).toBeCloseTo(1.4, 5);
        });

        test('returns correct multiplier for count=5', () => {
            for (let i = 0; i < 5; i++) combo.onEat(i * 100);
            expect(combo.getBonusMultiplier()).toBeCloseTo(2.0, 5); // 1.0 + 5*0.2
        });
    });

    describe('reset', () => {
        test('resets count to 0', () => {
            combo.onEat(0);
            combo.onEat(500);
            combo.reset();
            expect(combo.count).toBe(0);
        });

        test('bonus multiplier returns 1.0 after reset', () => {
            combo.onEat(0);
            combo.onEat(500);
            combo.reset();
            expect(combo.getBonusMultiplier()).toBe(1.0);
        });
    });

    describe('onComboChange callback', () => {
        test('callback called on eat with new count', () => {
            const spy = { called: false, lastCount: -1 };
            combo.setOnComboChange((count) => {
                spy.called = true;
                spy.lastCount = count;
            });
            combo.onEat(0);
            expect(spy.called).toBe(true);
            expect(spy.lastCount).toBe(1);
        });

        test('callback called with 0 on combo expiry', () => {
            const counts = [];
            combo.setOnComboChange((c) => counts.push(c));
            combo.onEat(0);
            combo.update(4000); // expire
            expect(counts).toContain(0);
        });

        test('callback called with 0 on reset', () => {
            const counts = [];
            combo.setOnComboChange((c) => counts.push(c));
            combo.onEat(0);
            combo.reset();
            expect(counts[counts.length - 1]).toBe(0);
        });
    });
});
