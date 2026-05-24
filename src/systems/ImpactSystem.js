/**
 * ImpactSystem - Hit feedback system providing knockback and screen shake
 */
export const MAX_KNOCKBACK_VELOCITY = 450;

/**
 * Apply knockback force to a target based on attacker's position
 * @param {Object} target - Target entity with body and graphics
 * @param {Object} source - Source position (attacker) with x, y
 * @param {number} damage - Damage dealt (scales knockback magnitude)
 */
export function applyKnockback(target, source, damage) {
    if (!target || !target.body) return;

    const dx = target.graphics.x - source.x;
    const dy = target.graphics.y - source.y;
    const dist = Math.hypot(dx, dy) || 1;

    const magnitude = Math.min(damage * 15, MAX_KNOCKBACK_VELOCITY);

    target.body.setVelocity(
        (dx / dist) * magnitude,
        (dy / dist) * magnitude
    );
}

/**
 * Apply screen shake effect to a camera
 * @param {Object} camera - Phaser camera with shake(intensity, duration) method
 * @param {number} intensity - Shake intensity (0.001 - 0.05 typical)
 * @param {number} duration - Shake duration in milliseconds
 */
export function screenShake(camera, intensity, duration) {
    camera.shake(intensity, duration);
}

export const ImpactSystem = {
    applyKnockback,
    screenShake
};

export default ImpactSystem;