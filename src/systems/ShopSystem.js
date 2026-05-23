/**
 * ShopSystem - In-game shop logic for purchasing upgrades
 * Handles currency, purchases, upgrade levels, and localStorage persistence
 */
export class ShopSystem {
    constructor(upgradesData = null) {
        this.upgradesData = upgradesData;
        this.upgradeLevels = {};
        this.CURRENCY_KEY = 'fishEat_currency';
        this.UPGRADES_KEY = 'fishEat_upgrades';
    }

    /**
     * Load shop state from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.UPGRADES_KEY);
            if (stored) {
                this.upgradeLevels = JSON.parse(stored);
            } else {
                this.upgradeLevels = {};
            }
        } catch (e) {
            console.warn('Failed to load shop upgrades:', e);
            this.upgradeLevels = {};
        }
    }

    /**
     * Save upgrade levels to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.UPGRADES_KEY, JSON.stringify(this.upgradeLevels));
        } catch (e) {
            console.warn('Failed to save shop upgrades:', e);
        }
    }

    /**
     * Get current currency from localStorage
     * @returns {number} Current currency
     */
    getCurrency() {
        try {
            const stored = localStorage.getItem(this.CURRENCY_KEY);
            return stored ? parseInt(stored, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Set currency in localStorage
     * @param {number} amount - Currency amount
     */
    setCurrency(amount) {
        try {
            localStorage.setItem(this.CURRENCY_KEY, String(amount));
        } catch (e) {
            console.warn('Failed to save currency:', e);
        }
    }

    /**
     * Add currency to current amount
     * @param {number} amount - Amount to add
     */
    addCurrency(amount) {
        const current = this.getCurrency();
        this.setCurrency(current + amount);
    }

    /**
     * Check if player can afford an upgrade
     * @param {string} upgradeKey - Key of the upgrade
     * @returns {boolean} True if can afford
     */
    canAfford(upgradeKey) {
        if (!this.upgradesData || !this.upgradesData[upgradeKey]) {
            return false;
        }
        const upgrade = this.upgradesData[upgradeKey];
        const currentLevel = this.upgradeLevels[upgradeKey] || 0;
        if (currentLevel >= upgrade.maxLevel) {
            return false;
        }
        const cost = this.getUpgradeCost(upgradeKey);
        return this.getCurrency() >= cost;
    }

    /**
     * Get the cost for the next level of an upgrade
     * @param {string} upgradeKey - Key of the upgrade
     * @returns {number} Cost in currency, or 0 if maxed
     */
    getUpgradeCost(upgradeKey) {
        if (!this.upgradesData || !this.upgradesData[upgradeKey]) {
            return 0;
        }
        const upgrade = this.upgradesData[upgradeKey];
        const currentLevel = this.upgradeLevels[upgradeKey] || 0;
        if (currentLevel >= upgrade.maxLevel) {
            return 0;
        }
        return upgrade.costPerLevel * (currentLevel + 1);
    }

    /**
     * Get current upgrade level
     * @param {string} upgradeKey - Key of the upgrade
     * @returns {number} Current level (0 if not purchased)
     */
    getUpgradeLevel(upgradeKey) {
        return this.upgradeLevels[upgradeKey] || 0;
    }

    /**
     * Check if an upgrade is at max level
     * @param {string} upgradeKey - Key of the upgrade
     * @returns {boolean} True if maxed
     */
    isMaxed(upgradeKey) {
        if (!this.upgradesData || !this.upgradesData[upgradeKey]) {
            return false;
        }
        const upgrade = this.upgradesData[upgradeKey];
        const currentLevel = this.upgradeLevels[upgradeKey] || 0;
        return currentLevel >= upgrade.maxLevel;
    }

    /**
     * Purchase an upgrade
     * @param {string} upgradeKey - Key of the upgrade to purchase
     * @returns {boolean} True if purchase was successful
     */
    purchaseUpgrade(upgradeKey) {
        if (!this.canAfford(upgradeKey)) {
            return false;
        }

        const cost = this.getUpgradeCost(upgradeKey);
        const newLevel = (this.upgradeLevels[upgradeKey] || 0) + 1;

        this.upgradeLevels[upgradeKey] = newLevel;
        this.setCurrency(this.getCurrency() - cost);
        this.saveToStorage();

        this.applyUpgrade(upgradeKey, newLevel);

        return true;
    }

    /**
     * Apply upgrade effect and return the effect data
     * @param {string} upgradeKey - Key of the upgrade
     * @param {number} level - Level to apply
     * @returns {object|null} Effect object or null
     */
    applyUpgrade(upgradeKey, level) {
        if (!this.upgradesData || !this.upgradesData[upgradeKey]) {
            return null;
        }

        const upgrade = this.upgradesData[upgradeKey];
        const effect = upgrade.effect;

        // Calculate actual value based on level
        let value;
        switch (effect.type) {
            case 'max_hp_bonus':
            case 'speed_bonus':
            case 'damage_bonus':
            case 'hp_regen':
                value = effect.value * level;
                break;
            case 'exp_bonus':
            case 'luck_bonus':
                value = effect.value * level;
                break;
            default:
                value = effect.value;
        }

        return {
            type: effect.type,
            value: value
        };
    }

    /**
     * Get all upgrades with current state
     * @returns {Array} Array of upgrade info objects
     */
    getAllUpgrades() {
        if (!this.upgradesData) {
            return [];
        }

        const currency = this.getCurrency();
        const upgrades = [];

        for (const key of Object.keys(this.upgradesData)) {
            const data = this.upgradesData[key];
            const currentLevel = this.upgradeLevels[key] || 0;
            const isMaxed = currentLevel >= data.maxLevel;
            const nextCost = isMaxed ? 0 : data.costPerLevel * (currentLevel + 1);
            const canAfford = currency >= nextCost && !isMaxed;

            upgrades.push({
                key,
                name: data.name,
                description: data.description,
                currentLevel,
                maxLevel: data.maxLevel,
                nextCost,
                isMaxed,
                canAfford,
                effect: data.effect
            });
        }

        return upgrades;
    }

    /**
     * Reset all upgrade levels
     */
    resetShop() {
        this.upgradeLevels = {};
        this.saveToStorage();
    }
}

export default ShopSystem;