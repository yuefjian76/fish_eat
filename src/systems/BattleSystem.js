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
    calculateDamage(attackerType, targetType) {
        let damage = this.baseDamage;

        const attackerConfig = this.fishData[attackerType];
        const targetConfig = this.fishData[targetType];

        if (!attackerConfig || !targetConfig) {
            console.warn(`BattleSystem: Unknown fish type - attacker: ${attackerType}, target: ${targetType}`);
            return damage;
        }

        // Check if attacker is strong against target
        if (attackerConfig.strongAgainst && attackerConfig.strongAgainst.includes(targetType)) {
            damage *= 1.5;
        }

        // Check if attacker is weak to target
        if (attackerConfig.weakTo && attackerConfig.weakTo.includes(targetType)) {
            damage *= 0.5;
        }

        return Math.floor(damage);
    }

    /**
     * Check if attacker can deal damage to target (considers type advantage)
     * @param {string} attackerType - Type of attacking fish
     * @param {string} targetType - Type of target fish
     * @returns {boolean} True if attacker can deal damage
     */
    canAttack(attackerType, targetType) {
        const attackerConfig = this.fishData[attackerType];
        if (!attackerConfig) return false;

        // Check if target is strong against attacker (attacker cannot deal damage)
        if (attackerConfig.strongAgainst && attackerConfig.strongAgainst.includes(targetType)) {
            return false;
        }

        return true;
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
