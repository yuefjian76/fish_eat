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
     * Calculate chance of getting a good effect
     * @param {number} baseChance - Base chance (0-100)
     * @param {object} luckInfluence - Luck influence config
     * @returns {number} Modified chance (0-100)
     */
    calculateGoodChance(baseChance, luckInfluence) {
        // Luck increases chance of good effects
        const luckBonus = this.luck * 2;
        return Math.min(95, Math.max(5, baseChance + luckBonus));
    }
}

export default LuckSystem;
