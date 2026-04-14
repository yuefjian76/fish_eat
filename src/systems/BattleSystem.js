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
     * Check if attacker can deal damage to target (considers type advantage)
     * @param {string} attackerType - Type of attacking fish
     * @param {string} targetType - Type of target fish
     * @returns {boolean} True if attacker can deal damage
     */
    canAttack(attackerType, targetType) {
        const attackerConfig = this.fishData[attackerType];
        const targetConfig = this.fishData[targetType];
        if (!attackerConfig) return false;

        // If attacker is strong against target (target is attacker's prey), attacker CAN attack
        if (attackerConfig.strongAgainst && attackerConfig.strongAgainst.includes(targetType)) {
            return true;
        }

        // If target is strong against attacker (attacker is target's prey), attacker CANNOT attack
        if (targetConfig && targetConfig.strongAgainst && targetConfig.strongAgainst.includes(attackerType)) {
            return false;
        }

        return true;
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
