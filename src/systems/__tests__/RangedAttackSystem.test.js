import { RangedAttackSystem } from '../RangedAttackSystem.js';

// Mock projectile
const createMockProjectile = (active = true, damage = 10) => ({
    active,
    enemyRef: { name: 'anglerfish' },
    rangedDamage: damage,
    destroyed: false,
    destroy: function() {
        this.destroyed = true;
        this.active = false;
    }
});

describe('RangedAttackSystem', () => {
    describe('initialization', () => {
        test('creates ranged attack system', () => {
            const rs = new RangedAttackSystem({});
            expect(rs).toBeDefined();
        });

        test('initializes hit count to 0', () => {
            const rs = new RangedAttackSystem({});
            expect(rs.getHitCount()).toBe(0);
        });
    });

    describe('checkHit', () => {
        test('processes hit and calls onHit callback', () => {
            const hits = [];
            const rs = new RangedAttackSystem({
                onHit: (enemy, damage) => hits.push({ enemy, damage })
            });
            const proj = createMockProjectile(true, 15);
            rs.checkHit({}, proj);
            expect(hits.length).toBe(1);
            expect(hits[0].damage).toBe(15);
        });

        test('increments hit count', () => {
            const rs = new RangedAttackSystem({});
            const proj = createMockProjectile(true, 10);
            rs.checkHit({}, proj);
            expect(rs.getHitCount()).toBe(1);
        });

        test('destroys projectile', () => {
            const rs = new RangedAttackSystem({});
            const proj = createMockProjectile(true, 10);
            rs.checkHit({}, proj);
            expect(proj.destroyed).toBe(true);
        });

        test('returns false for inactive projectile', () => {
            const rs = new RangedAttackSystem({});
            const proj = createMockProjectile(false, 10);
            const result = rs.checkHit({}, proj);
            expect(result).toBe(false);
        });

        test('does not increment count for inactive projectile', () => {
            const rs = new RangedAttackSystem({});
            const proj = createMockProjectile(false, 10);
            rs.checkHit({}, proj);
            expect(rs.getHitCount()).toBe(0);
        });
    });

    describe('reset', () => {
        test('resets hit count to 0', () => {
            const rs = new RangedAttackSystem({});
            const proj = createMockProjectile(true, 10);
            rs.checkHit({}, proj);
            expect(rs.getHitCount()).toBe(1);
            rs.reset();
            expect(rs.getHitCount()).toBe(0);
        });
    });
});