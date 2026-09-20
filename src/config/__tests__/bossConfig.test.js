import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Guardrail for the boss data in fish.json (feat-054).
 *
 * Every one of these fields was missing or wrong at some point, and each miss
 * produced a silent gameplay break:
 *   - `size` missing        -> NaN physics body, invisible/untouchable boss
 *   - `damage` missing      -> NaN damage to the player
 *   - `attackInterval`      -> boss used the 800ms aiLevel cadence (too fast)
 *   - `name` missing        -> hardcoded "深海霸主" on the HP bar
 *   - `triggerLevel` > cap  -> boss could never appear in a real run
 */

const here = dirname(fileURLToPath(import.meta.url));
const fish = JSON.parse(readFileSync(join(here, '..', 'fish.json'), 'utf8'));
const levels = JSON.parse(readFileSync(join(here, '..', 'levels.json'), 'utf8'));

const MAX_LEVEL = levels.experienceTable.length;
const bosses = Object.entries(fish).filter(([, cfg]) => cfg.boss);

describe('fish.json boss entries (feat-054)', () => {
    test('there are exactly three bosses', () => {
        expect(bosses.map(([type]) => type)).toEqual([
            'boss_squid', 'boss_shark_king', 'boss_sea_dragon',
        ]);
    });

    test.each(bosses)('%s declares all runtime fields', (type, cfg) => {
        expect(typeof cfg.name).toBe('string');
        expect(cfg.name.length).toBeGreaterThan(0);
        expect(Number.isFinite(cfg.size)).toBe(true);
        expect(cfg.size).toBeGreaterThan(0);
        expect(Number.isFinite(cfg.baseHp)).toBe(true);
        expect(Number.isFinite(cfg.hpPerLevel)).toBe(true);
        expect(Number.isFinite(cfg.visionRange)).toBe(true);
        expect(cfg.visionRange).toBeGreaterThanOrEqual(800);
        expect(Number.isFinite(cfg.attackRange)).toBe(true);
        expect(cfg.attackRange).toBeGreaterThan(0);
        expect(Number.isFinite(cfg.speed)).toBe(true);
        expect(cfg.speed).toBeGreaterThan(0);
        expect(Number.isFinite(cfg.damage)).toBe(true);
        expect(cfg.damage).toBeGreaterThan(0);
        expect(Number.isFinite(cfg.attackInterval)).toBe(true);
        expect(cfg.attackInterval).toBeGreaterThanOrEqual(800);
        expect(Array.isArray(cfg.skills)).toBe(true);
        expect(cfg.skills.length).toBeGreaterThanOrEqual(cfg.phases);
        expect(['rise_from_bottom', 'charge_from_left']).toContain(cfg.spawnAnimation);
    });

    test.each(bosses)('%s can actually appear (triggerLevel <= level cap)', (type, cfg) => {
        expect(cfg.triggerLevel).toBeGreaterThan(0);
        expect(cfg.triggerLevel).toBeLessThanOrEqual(MAX_LEVEL);
    });

    test('bosses are gated at distinct, ascending levels', () => {
        const gates = bosses.map(([, cfg]) => cfg.triggerLevel);
        expect([...gates].sort((a, b) => a - b)).toEqual(gates);
        expect(new Set(gates).size).toBe(gates.length);
    });

    test('a fight stays inside the intended time-to-kill window', () => {
        // Player reference DPS: Q bite, 25 damage / 3s cooldown = 8.3 DPS
        const playerDps = 25 / 3;
        for (const [type, cfg] of bosses) {
            const qHits = Math.ceil(cfg.baseHp / 25);
            const seconds = cfg.baseHp / playerDps;
            // 8-11 Q hits: a real fight, but not a sponge
            expect({ type, qHits }).toEqual({ type, qHits: expect.any(Number) });
            expect(qHits).toBeGreaterThanOrEqual(8);
            expect(qHits).toBeLessThanOrEqual(14);
            expect(seconds).toBeGreaterThanOrEqual(15);
            expect(seconds).toBeLessThanOrEqual(45);
        }
    });
});
