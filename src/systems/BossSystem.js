import { Enemy } from '../entities/Enemy.js';

/** Boss type → save/progress key used by GameScene.bossDefeated. */
export const BOSS_KEY_MAP = {
    boss_squid: 'squid',
    boss_shark_king: 'sharkKing',
    boss_sea_dragon: 'seaDragon',
};

/**
 * Single source of truth for the type → key mapping.
 * Falls back to stripping the "boss_" prefix so an unknown boss still gets a stable key.
 */
export function getBossKey(bossType) {
    if (!bossType) return '';
    return BOSS_KEY_MAP[bossType] || String(bossType).replace(/^boss_/, '');
}

/**
 * Build the runtime boss config from its fish.json entry.
 *
 * Keeps HP/damage/cadence resolution in the (pure, unit-testable) system layer:
 * GameScene passes the result straight to BossEnemy. Defaults exist so a boss can
 * never end up with an undefined `size` — that produced NaN physics bodies and an
 * invisible, untouchable boss before feat-054.
 *
 * `sizeScale` 让 Boss 随玩家体型一起长大（feat-055）：不缩放时满级玩家会比
 * 最终 Boss 还大，Boss 会被"一口吃掉"。
 */
export function buildBossConfig(bossData = {}, playerLevel = 1, sizeScale = 1) {
    const scale = Number.isFinite(sizeScale) && sizeScale > 0 ? sizeScale : 1;
    const baseSize = Number.isFinite(bossData.size) ? bossData.size : 120;
    return {
        ...bossData,
        size: Math.floor(baseSize * scale),
        hp: calculateBossHp(bossData, playerLevel),
        damage: Number.isFinite(bossData.damage) ? bossData.damage : 30,
        attackInterval: Number.isFinite(bossData.attackInterval) ? bossData.attackInterval : 1500,
        name: bossData.name || 'BOSS',
    };
}

/**
 * Boss HP at the level the fight happens.
 * Formula: baseHp + hpPerLevel * max(0, playerLevel - triggerLevel)
 *
 * The boss is meant to be fought at `triggerLevel`, so HP is exactly baseHp there;
 * the (small) level term only kicks in if the player keeps levelling mid-fight.
 * The old formula multiplied hpPerLevel by the absolute level, which made the
 * level-5 squid a 600 HP sponge against 25 damage per 3s (feat-054).
 */
export function calculateBossHp(config, playerLevel) {
    const base = Number.isFinite(config?.baseHp) ? config.baseHp : 0;
    const perLevel = Number.isFinite(config?.hpPerLevel) ? config.hpPerLevel : 0;
    const triggerLevel = Number.isFinite(config?.triggerLevel) ? config.triggerLevel : 1;
    const level = Number.isFinite(playerLevel) ? playerLevel : triggerLevel;
    return Math.floor(base + perLevel * Math.max(0, level - triggerLevel));
}

export class BossSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentBoss = null;
        this.inBossFight = false;
        this.bossConfig = null;
    }

    /** Calculate boss HP (see calculateBossHp() above). */
    calculateBossHp(config, playerLevel) {
        return calculateBossHp(config, playerLevel);
    }

    /** Progress key for a boss type (squid / sharkKing / seaDragon). */
    getBossKey(bossType) {
        return getBossKey(bossType);
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
                if (enemy !== boss && enemy.setState) {
                    enemy.setState(Enemy.STATE.FLEEING, boss);
                }
            });
        }
    }

    /**
     * End boss fight
     */
    endBossFight() {
        // Reset all FLEEING enemies back to WANDERING
        if (this.scene.enemies) {
            this.scene.enemies.forEach(enemy => {
                if (enemy.state === Enemy.STATE.FLEEING) {
                    enemy.setState(Enemy.STATE.WANDERING);
                    enemy.attacker = null;
                }
            });
        }
        this.currentBoss = null;
        this.inBossFight = false;
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