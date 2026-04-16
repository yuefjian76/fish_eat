/**
 * ComboSystem - Tracks consecutive fish-eating combos
 * Config from levels.json: { timeWindow: 3, bonusMultiplier: 0.2 }
 *
 * - combo count increments on each eat within timeWindow (seconds)
 * - if no eat happens within timeWindow, combo resets to 0
 * - bonus score multiplier: 1.0 + count * bonusMultiplier (only when count > 1)
 */
export class ComboSystem {
    /**
     * @param {object} comboConfig - { timeWindow: number (seconds), bonusMultiplier: number }
     */
    constructor(comboConfig = {}) {
        this.timeWindow = (comboConfig.timeWindow || 3) * 1000; // convert to ms
        this.bonusMultiplier = comboConfig.bonusMultiplier || 0.2;
        this.count = 0;
        this.lastEatTime = -Infinity;
        this.onComboChange = null; // callback for UI updates
    }

    /**
     * Call when player eats a fish
     * @param {number} now - current time in ms (Phaser time.now)
     * @returns {number} bonus multiplier (1.0 = no bonus)
     */
    onEat(now) {
        this.count++;
        this.lastEatTime = now;
        if (this.onComboChange) this.onComboChange(this.count);
        return this.getBonusMultiplier();
    }

    /**
     * Call every frame to check if combo expired
     * @param {number} now - current time in ms
     */
    update(now) {
        if (this.count > 0 && now - this.lastEatTime > this.timeWindow) {
            this.count = 0;
            this.lastEatTime = -Infinity;
            if (this.onComboChange) this.onComboChange(0);
        }
    }

    /**
     * Get current score bonus multiplier
     * @returns {number} 1.0 when no combo, 1.0 + count * bonusMultiplier when combo active
     */
    getBonusMultiplier() {
        if (this.count <= 1) return 1.0;
        return 1.0 + this.count * this.bonusMultiplier;
    }

    /**
     * Force reset the combo (e.g. on damage taken)
     */
    reset() {
        this.count = 0;
        this.lastEatTime = -Infinity;
        if (this.onComboChange) this.onComboChange(0);
    }

    /**
     * Register a callback for UI updates
     * @param {function} callback - called with (count) on combo change
     */
    setOnComboChange(callback) {
        this.onComboChange = callback;
    }
}
