/**
 * GrowthSystem - Manages experience, leveling up, and combo kill bonuses
 */
import { logger } from './DebugLogger.js';

export class GrowthSystem {
    /**
     * @param {object} levelsData - Levels configuration from levels.json
     */
    constructor(levelsData) {
        this.levelsData = levelsData;
        this.experienceTable = levelsData.experienceTable;
        this.skillUnlocks = levelsData.skillUnlocks;
        this.comboTimeWindow = levelsData.combo.timeWindow * 1000; // Convert to ms
        this.comboBonusMultiplier = levelsData.combo.bonusMultiplier;

        this.currentExp = 0;
        this.currentLevel = 1;
        this.comboCount = 0;
        this.lastKillTime = 0;
        this.unlockedSkills = new Set();

        // Unlock skills for initial level
        this.checkSkillUnlocks();
    }

    /**
     * Get the experience required for a specific level
     * @param {number} level - Target level
     * @returns {number} Experience required
     */
    getExpForLevel(level) {
        const index = level - 1;
        if (index < 0 || index >= this.experienceTable.length) {
            return this.experienceTable[this.experienceTable.length - 1] || 0;
        }
        return this.experienceTable[index];
    }

    /**
     * Get the maximum level
     * @returns {number} Maximum level based on experience table
     */
    getMaxLevel() {
        return this.experienceTable.length;
    }

    /**
     * Add experience and handle combo bonuses
     * @param {number} baseExp - Base experience to add
     * @param {number} currentTime - Current game time (ms)
     * @param {object} luckSystem - Optional LuckSystem for bonus exp
     * @returns {object} Result containing exp gained and combo info
     */
    addExperience(baseExp, currentTime, luckSystem = null) {
        // Check if this is a combo kill (within time window)
        const timeSinceLastKill = currentTime - this.lastKillTime;

        if (timeSinceLastKill <= this.comboTimeWindow && this.lastKillTime > 0) {
            // Continue combo
            this.comboCount++;
        } else {
            // Reset combo
            this.comboCount = 0;
        }

        this.lastKillTime = currentTime;

        // Calculate combo multiplier
        const comboMultiplier = 1 + (this.comboCount * this.comboBonusMultiplier);

        // Calculate luck bonus (base * luck/100 * random)
        let luckBonus = 0;
        if (luckSystem && luckSystem.getLuck && luckSystem.getLuck() > 0) {
            const luck = luckSystem.getLuck();
            // Luck adds 0-50% bonus based on luck value
            // At 10 luck = 0-5% bonus, at 50 luck = 0-25% bonus
            const maxLuckBonus = Math.min(luck / 50, 1) * 0.5;
            luckBonus = baseExp * Math.random() * maxLuckBonus;
        }

        const totalExp = Math.floor(baseExp * comboMultiplier + luckBonus);

        this.currentExp += totalExp;

        // Check for level up
        const oldLevel = this.currentLevel;
        const leveledUp = this.checkLevelUp();

        logger.info(`EXP gained: base=${baseExp}, combo=${comboMultiplier.toFixed(2)}, luck=${luckBonus.toFixed(0)}, total=${totalExp}, currentExp=${this.currentExp}, level=${this.currentLevel}`);

        if (leveledUp) {
            logger.info(`Level up: ${oldLevel} -> ${this.currentLevel}`);
        }

        if (this.comboCount > 0) {
            logger.debug(`Combo: count=${this.comboCount}, multiplier=${comboMultiplier.toFixed(2)}`);
        }

        return {
            expGained: totalExp,
            baseExp: baseExp,
            comboCount: this.comboCount,
            comboMultiplier: comboMultiplier,
            luckBonus: Math.floor(luckBonus),
            leveledUp: leveledUp,
            oldLevel: oldLevel,
            newLevel: this.currentLevel,
            skillsUnlocked: leveledUp ? this.getNewlyUnlockedSkills(oldLevel) : []
        };
    }

    /**
     * Check if player has leveled up
     * @returns {boolean} True if player leveled up
     */
    checkLevelUp() {
        const expForNextLevel = this.getExpForLevel(this.currentLevel + 1);

        if (this.currentExp >= expForNextLevel) {
            this.currentLevel++;
            return true;
        }
        return false;
    }

    /**
     * Check and update skill unlocks based on current level
     */
    checkSkillUnlocks() {
        for (const [skillId, requiredLevel] of Object.entries(this.skillUnlocks)) {
            if (this.currentLevel >= requiredLevel) {
                this.unlockedSkills.add(skillId);
            }
        }
    }

    /**
     * Get list of newly unlocked skills after leveling up
     * @param {number} oldLevel - Level before upgrade
     * @returns {string[]} Array of newly unlocked skill IDs
     */
    getNewlyUnlockedSkills(oldLevel) {
        const newlyUnlocked = [];
        for (const [skillId, requiredLevel] of Object.entries(this.skillUnlocks)) {
            if (requiredLevel > oldLevel && requiredLevel <= this.currentLevel) {
                if (!this.unlockedSkills.has(skillId)) {
                    this.unlockedSkills.add(skillId);
                    newlyUnlocked.push(skillId);
                }
            }
        }
        return newlyUnlocked;
    }

    /**
     * Check if a skill is unlocked
     * @param {string} skillId - Skill identifier
     * @returns {boolean} True if skill is unlocked
     */
    isSkillUnlocked(skillId) {
        return this.unlockedSkills.has(skillId);
    }

    /**
     * Get all unlocked skills
     * @returns {string[]} Array of unlocked skill IDs
     */
    getUnlockedSkills() {
        return Array.from(this.unlockedSkills);
    }

    /**
     * Get progress to next level (0-1)
     * @returns {number} Progress percentage
     */
    getLevelProgress() {
        const currentLevelExp = this.getExpForLevel(this.currentLevel);
        const nextLevelExp = this.getExpForLevel(this.currentLevel + 1);

        if (currentLevelExp === nextLevelExp) {
            return 1; // Max level
        }

        const expIntoLevel = this.currentExp - currentLevelExp;
        const expNeeded = nextLevelExp - currentLevelExp;

        return Math.min(1, Math.max(0, expIntoLevel / expNeeded));
    }

    /**
     * Get experience needed for next level
     * @returns {number} Experience needed (0 if max level)
     */
    getExpToNextLevel() {
        const nextLevelExp = this.getExpForLevel(this.currentLevel + 1);
        return Math.max(0, nextLevelExp - this.currentExp);
    }

    /**
     * Reset combo count (e.g., when taking damage)
     */
    resetCombo() {
        this.comboCount = 0;
        this.lastKillTime = 0;
    }

    /**
     * Get current combo count
     * @returns {number} Current combo count
     */
    getComboCount() {
        return this.comboCount;
    }

    /**
     * Get current level
     * @returns {number} Current level
     */
    getLevel() {
        return this.currentLevel;
    }

    /**
     * Get current experience
     * @returns {number} Current experience
     */
    getExp() {
        return this.currentExp;
    }

    /**
     * Reset the growth system for new game
     */
    reset() {
        this.currentExp = 0;
        this.currentLevel = 1;
        this.comboCount = 0;
        this.lastKillTime = 0;
        this.unlockedSkills = new Set();
        this.checkSkillUnlocks();
    }
}

export default GrowthSystem;
