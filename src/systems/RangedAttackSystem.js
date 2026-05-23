/**
 * RangedAttackSystem - Anglerfish projectile collision handling
 *
 * Handles anglerfish projectile collision with player.
 *
 * Usage:
 *   const rangedSystem = new RangedAttackSystem({
 *     onHit: (enemy, damage) => { ... }  // callback for side effects
 *   });
 */
export class RangedAttackSystem {
    /**
     * @param {object} config - Configuration object
     * @param {function} config.onHit - Callback when projectile hits player (enemy, damage)
     */
    constructor(config) {
        this.onHit = config.onHit || (() => {});
        this._hitCount = 0;
    }

    /**
     * Check hit collision between player and projectile
     * @param {object} player - Player object
     * @param {object} proj - Projectile object with enemyRef and rangedDamage
     * @returns {boolean} Whether the hit was processed
     */
    checkHit(player, proj) {
        if (!proj.active) return false;

        const enemy = proj.enemyRef;
        const damage = proj.rangedDamage;

        if (this.onHit && enemy) {
            this.onHit(enemy, damage);
        }

        proj.destroy();
        this._hitCount++;
        return true;
    }

    /**
     * Get hit count
     * @returns {number} Number of times player was hit
     */
    getHitCount() {
        return this._hitCount;
    }

    /**
     * Reset ranged attack system
     */
    reset() {
        this._hitCount = 0;
    }
}

export default RangedAttackSystem;