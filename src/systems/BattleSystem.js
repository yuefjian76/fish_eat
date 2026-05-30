/**
 * BattleSystem - Handles damage calculation and fish type advantages
 */
export class BattleSystem {
    constructor(fishData) {
        this.fishData = fishData;
        this.baseDamage = 10;
    }

    /**
     * Calculate damage from attacker to target
     * @param {string} attackerType - Type of attacking fish
     * @param {string} targetType - Type of target fish
     * @returns {number} Calculated damage
     */
    calculateDamage(attacker, defender, baseDamage) {
        // Add level bonus: +5 per level
        const levelBonus = ((attacker.level || 1) - 1) * 5;
        const actualDamage = baseDamage + levelBonus;

        return Math.floor(actualDamage);
    }

    calculateDefense(defender) {
        // Defense = (level - 1) * 3
        return ((defender.level || 1) - 1) * 3;
    }

    /**
     * Get type effectiveness multiplier for attacker vs defender
     * @param {string} attackerType - Type of attacking fish
     * @param {string} defenderType - Type of defending fish
     * @returns {number} Multiplier: 2.0 if strongAgainst, 0.5 if weakTo, 1.0 otherwise
     */
    getTypeMultiplier(attackerType, defenderType) {
        const attackerData = this.fishData[attackerType];
        if (!attackerData) return 1.0;
        if (attackerData.strongAgainst?.includes(defenderType)) return 2.0;
        if (attackerData.weakTo?.includes(defenderType)) return 0.5;
        return 1.0;
    }

    /**
     * Calculate enemy damage to player based on size and level
     * @param {object} enemyConfig - Enemy fish configuration
     * @param {number} aiLevel - AI level of enemy
     * @param {number} typeMultiplier - Type effectiveness multiplier (default 1.0)
     * @returns {number} Calculated damage
     */
    calculateEnemyDamage(enemyConfig, aiLevel, typeMultiplier = 1.0) {
        const sizeDamage = 2 + Math.floor(Math.log(enemyConfig.size) * 3);
        const levelMultiplier = 1 + ((aiLevel || 1) - 1) * 0.5;
        return Math.max(5, Math.min(Math.floor(sizeDamage * levelMultiplier * typeMultiplier), 30));
    }

    /**
     * Heal an entity by specified amount
     * @param {number} currentHp - Current HP
     * @param {number} maxHp - Maximum HP
     * @param {number} amount - Amount to heal
     * @returns {object} New HP and heal amount
     */
    heal(currentHp, maxHp, amount) {
        const oldHp = currentHp;
        const newHp = Math.min(currentHp + amount, maxHp);
        const actualHeal = newHp - oldHp;
        return { newHp, actualHeal };
    }

    /**
     * Apply damage to an entity
     * @param {number} currentHp - Current HP
     * @param {number} damage - Damage to apply
     * @returns {object} New HP and damage taken
     */
    applyDamage(currentHp, damage) {
        const newHp = Math.max(currentHp - damage, 0);
        return { newHp, actualDamage: currentHp - newHp };
    }

    /**
     * Check if entity is dead
     * @param {number} hp - Current HP
     * @returns {boolean} True if dead
     */
    isDead(hp) {
        return hp <= 0;
    }
}

export default BattleSystem;
