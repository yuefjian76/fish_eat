/**
 * LuckSystem - Manages player's luck value affecting drift bottle outcomes
 */
export class LuckSystem {
    /**
     * @param {number} initialLuck - Initial luck value (default 0)
     */
    constructor(initialLuck = 0) {
        this.luck = initialLuck;
        this.baseLuck = initialLuck;
    }

    /**
     * Get current luck value
     * @returns {number} Current luck
     */
    getLuck() {
        return this.luck;
    }

    /**
     * Add to luck value
     * @param {number} amount - Amount to add (can be negative)
     * @returns {number} New luck value
     */
    addLuck(amount) {
        this.luck += amount;
        return this.luck;
    }

    /**
     * Set luck to specific value
     * @param {number} value - New luck value
     */
    setLuck(value) {
        this.luck = value;
    }

    /**
     * Reset luck to base value
     */
    reset() {
        this.luck = this.baseLuck;
    }

    /**
     * Calculate modified weight for an effect based on luck
     * @param {number} baseWeight - Base weight of the effect
     * @param {boolean} isGood - Whether the effect is good
     * @param {object} luckInfluence - Luck influence config
     * @returns {number} Modified weight
     */
    modifyWeight(baseWeight, isGood, luckInfluence) {
        if (isGood) {
            // Good effects get bonus weight based on luck
            const bonus = this.luck * luckInfluence.goodBonusPerLuck;
            return Math.max(1, baseWeight + bonus);
        } else {
            // Bad effects get reduced weight based on luck
            const reduction = this.luck * luckInfluence.badReductionPerLuck;
            return Math.max(1, baseWeight - reduction);
        }
    }

    /**
     * Modify weight based on luck value
     * @param {number} baseWeight - Base weight
     * @param {boolean} isGoodEffect - True if good effect
     * @param {object} luckInfluence - Luck influence config
     * @returns {number} Modified weight
     */
    modifyWeightPure(baseWeight, isGoodEffect, luckInfluence) {
        const luck = this.getLuck();
        if (isGoodEffect) {
            return Math.max(1, baseWeight + luck * (luckInfluence.goodBonusPerLuck || 0.5));
        } else {
            return Math.max(1, baseWeight - luck * (luckInfluence.badReductionPerLuck || 0.3));
        }
    }

    /**
     * Calculate chance of getting a good effect
     * @param {number} baseChance - Base chance (0-100)
     * @param {object} luckInfluence - Luck influence config
     * @returns {number} Modified chance (0-100)
     */
    calculateGoodChance(baseChance, luckInfluence) {
        // Luck increases chance of good effects
        // Use goodBonusPerLuck from config, fallback to 2 for backward compatibility
        const luckBonus = this.luck * (luckInfluence.goodBonusPerLuck ?? 2);
        return Math.min(95, Math.max(5, baseChance + luckBonus));
    }
}

export default LuckSystem;
