export class BossSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentBoss = null;
        this.inBossFight = false;
        this.bossConfig = null;
    }

    /**
     * Calculate boss HP with player level scaling
     * Formula: baseHp + (playerLevel * hpPerLevel)
     */
    calculateBossHp(config, playerLevel) {
        return config.baseHp + (playerLevel * config.hpPerLevel);
    }

    /**
     * Trigger boss fight - 1v1 mode
     * All other enemies flee
     */
    triggerBossFight(boss) {
        this.currentBoss = boss;
        this.inBossFight = true;

        // Make other enemies flee
        if (this.scene.enemies) {
            this.scene.enemies.forEach(enemy => {
                if (enemy !== boss && enemy.flee) {
                    enemy.flee();
                }
            });
        }
    }

    /**
     * End boss fight
     */
    endBossFight() {
        this.currentBoss = null;
        this.inBossFight = false;
        this.bossConfig = null;
    }

    /**
     * Check if boss is still active
     */
    isBossActive() {
        return this.currentBoss !== null && this.currentBoss.hp > 0;
    }

    /**
     * Get current boss
     */
    getCurrentBoss() {
        return this.currentBoss;
    }

    /**
     * Check if in boss fight
     */
    isInBossFight() {
        return this.inBossFight;
    }
}

export default BossSystem;