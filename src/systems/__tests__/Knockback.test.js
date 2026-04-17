// src/systems/__tests__/Knockback.test.js
describe('Knockback system', () => {
    test('knockback direction is away from attacker', () => {
        const result = calculateKnockback(100, 100, 200, 100, 10);
        // Player at (100,100), enemy at (200,100) → knockback should be negative X
        expect(result.vx).toBeLessThan(0);
        expect(result.vy).toBe(0);
    });

    test('knockback magnitude scales with damage', () => {
        const light = calculateKnockback(100, 100, 200, 100, 5);
        const heavy = calculateKnockback(100, 100, 200, 100, 20);
        // Heavier damage = stronger knockback
        expect(Math.abs(heavy.vx)).toBeGreaterThan(Math.abs(light.vx));
    });

    test('knockback works from all directions', () => {
        // Enemy below player
        const below = calculateKnockback(100, 100, 100, 200, 10);
        expect(below.vy).toBeLessThan(0);

        // Enemy above player
        const above = calculateKnockback(100, 100, 100, 0, 10);
        expect(above.vy).toBeGreaterThan(0);

        // Enemy left of player
        const left = calculateKnockback(100, 100, 0, 100, 10);
        expect(left.vx).toBeGreaterThan(0);

        // Enemy right of player
        const right = calculateKnockback(100, 100, 200, 100, 10);
        expect(right.vx).toBeLessThan(0);
    });

    test('knockback is diagonal when enemy is at an angle', () => {
        const diag = calculateKnockback(100, 100, 200, 200, 10);
        expect(diag.vx).toBeLessThan(0);
        expect(diag.vy).toBeLessThan(0);
    });

    test('knockback magnitude capped at maxVelocity', () => {
        // Very high damage should still respect velocity cap
        const result = calculateKnockback(100, 100, 200, 100, 100);
        const magnitude = Math.hypot(result.vx, result.vy);
        expect(magnitude).toBeLessThanOrEqual(450);
    });
});

const MAX_KNOCKBACK_VELOCITY = 450;

/**
 * Calculate knockback velocity from attacker position to target.
 * @param {number} targetX - Target (player) X
 * @param {number} targetY - Target (player) Y
 * @param {number} attackerX - Attacker (enemy) X
 * @param {number} attackerY - Attacker (enemy) Y
 * @param {number} damage - Damage dealt (scales knockback)
 * @returns {{vx: number, vy: number}} Knockback velocity
 */
function calculateKnockback(targetX, targetY, attackerX, attackerY, damage) {
    const dx = targetX - attackerX;
    const dy = targetY - attackerY;
    const dist = Math.hypot(dx, dy) || 1;

    // Base knockback: damage * 15, capped
    const baseMagnitude = Math.min(damage * 15, MAX_KNOCKBACK_VELOCITY);

    // Normalize direction and apply magnitude
    const vx = (dx / dist) * baseMagnitude;
    const vy = (dy / dist) * baseMagnitude;

    return { vx, vy };
}
