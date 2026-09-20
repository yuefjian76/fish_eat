import { jest } from '@jest/globals';
import { Enemy } from '../Enemy.js';

/**
 * attackPlayer() damage resolution for bosses (feat-054).
 *
 * The method only touches plain entity fields, so it can be exercised on a bare
 * object instead of a full Phaser scene. Regression target: a boss config without
 * `size` used to produce NaN damage (Math.log(undefined) -> NaN), which poisoned
 * player HP and broke the health bar / death check.
 */
function makeEnemy({ fishConfig, aiLevel = 1, now = 100000 }) {
    return {
        scene: { time: { now }, battleSystem: null },
        fishConfig,
        fishType: fishConfig.type || 'boss_squid',
        aiLevel,
        state: 'wandering',
        attackCooldown: 1000,
        lastAttackTime: 0,
        attackRange: 50,
        graphics: { x: 0, y: 0 },
    };
}

const player = { fishType: 'clownfish', x: 0, y: 0 };

describe('Enemy.attackPlayer damage (feat-054)', () => {
    test('boss damage comes from the configured value, not from size', () => {
        const enemy = makeEnemy({
            fishConfig: { boss: true, size: 200, damage: 18, strongAgainst: [], weakTo: [] },
        });

        expect(Enemy.prototype.attackPlayer.call(enemy, player)).toBe(18);
    });

    test('never returns NaN when a boss has no size', () => {
        const enemy = makeEnemy({
            fishConfig: { boss: true, damage: 22, strongAgainst: [], weakTo: [] },
        });

        const damage = Enemy.prototype.attackPlayer.call(enemy, player);
        expect(Number.isFinite(damage)).toBe(true);
        expect(damage).toBe(22);
    });

    test('never returns NaN for a size-less normal fish either', () => {
        const enemy = makeEnemy({ fishConfig: { strongAgainst: [], weakTo: [] } });

        const damage = Enemy.prototype.attackPlayer.call(enemy, player);
        expect(Number.isFinite(damage)).toBe(true);
        expect(damage).toBeGreaterThanOrEqual(5);
    });

    test('falls back to 30 damage for a boss without a damage value', () => {
        const enemy = makeEnemy({ fishConfig: { boss: true, size: 200, strongAgainst: [], weakTo: [] } });

        expect(Enemy.prototype.attackPlayer.call(enemy, player)).toBe(30);
    });

    test('normal fish keep the size-based formula', () => {
        const enemy = makeEnemy({ fishConfig: { size: 45, strongAgainst: [], weakTo: [] } });

        // 2 + floor(log(45) * 3) = 2 + floor(11.4) = 13
        expect(Enemy.prototype.attackPlayer.call(enemy, player)).toBe(13);
    });

    test('respects the attack cooldown', () => {
        const enemy = makeEnemy({
            fishConfig: { boss: true, size: 200, damage: 18, strongAgainst: [], weakTo: [] },
            now: 10500,
        });
        enemy.lastAttackTime = 10000;
        enemy.attackCooldown = 1600;

        expect(Enemy.prototype.attackPlayer.call(enemy, player)).toBe(0);
    });
});
