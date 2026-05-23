/**
 * HealthRegenSystem - Out of combat HP regeneration
 *
 * Tracks time out of combat and regenerates HP.
 *
 * Usage:
 *   const healthRegen = new HealthRegenSystem({
 *     maxHp: 50,
 *     outOfCombatThreshold: 3000,
 *     healthRegenRate: 0.005
 *   });
 *
 *   // In game loop:
 *   healthRegen.update(delta);
 */
export class HealthRegenSystem {
    /**
     * @param {object} config - Configuration object
     * @param {number} [config.maxHp=50] - Maximum HP
     * @param {number} [config.outOfCombatThreshold=3000] - Time in ms before regen starts
     * @param {number} [config.healthRegenRate=0.005] - HP regen rate per ms (fraction of maxHp)
     */
    constructor(config) {
        this._maxHp = config.maxHp ?? 50;
        this._hp = config.initialHp ?? this._maxHp;
        this._outOfCombatThreshold = config.outOfCombatThreshold ?? 3000;
        this._healthRegenRate = config.healthRegenRate ?? 0.005;
        this._outOfCombatTimer = 0;
        this._inCombat = false;
    }

    /**
     * Update health regen - call every frame
     * @param {number} delta - Time since last update in ms
     */
    update(delta) {
        if (this._inCombat) {
            this._outOfCombatTimer = 0;
            this._inCombat = false;
        } else {
            this._outOfCombatTimer += delta;
            if (this._outOfCombatTimer >= this._outOfCombatThreshold) {
                // Regen HP
                const regenAmount = this._maxHp * this._healthRegenRate * delta;
                this._hp = Math.min(this._hp + regenAmount, this._maxHp);
            }
        }
    }

    /**
     * Call when player takes damage
     * @param {number} amount - Damage amount
     */
    takeDamage(amount) {
        this._hp = Math.max(this._hp - amount, 0);
        this._outOfCombatTimer = 0;
        this._inCombat = false;
    }

    /**
     * Get current HP
     * @returns {number} Current HP
     */
    getHp() {
        return this._hp;
    }

    /**
     * Set current HP (for initialization)
     * @param {number} hp - HP value
     */
    setHp(hp) {
        this._hp = hp;
    }

    /**
     * Get max HP
     * @returns {number} Max HP
     */
    getMaxHp() {
        return this._maxHp;
    }

    /**
     * Set max HP (on level up)
     * @param {number} maxHp - New max HP
     */
    setMaxHp(maxHp) {
        this._maxHp = maxHp;
        this._hp = Math.min(this._hp, maxHp);
    }

    /**
     * Enter combat state (resets out-of-combat timer)
     */
    enterCombat() {
        this._inCombat = true;
        this._outOfCombatTimer = 0;
    }

    /**
     * Check if currently regenerating
     * @returns {boolean}
     */
    isRegenerating() {
        return !this._inCombat && this._outOfCombatTimer > this._outOfCombatThreshold && this._hp < this._maxHp;
    }

    /**
     * Reset health regen system
     * @param {object} config - New configuration (optional)
     */
    reset(config) {
        this._hp = config?.initialHp ?? this._maxHp;
        this._outOfCombatTimer = 0;
        this._inCombat = false;
        if (config) {
            this._maxHp = config.maxHp ?? this._maxHp;
            this._outOfCombatThreshold = config.outOfCombatThreshold ?? this._outOfCombatThreshold;
            this._healthRegenRate = config.healthRegenRate ?? this._healthRegenRate;
        }
    }
}

export default HealthRegenSystem;