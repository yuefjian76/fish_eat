import { Enemy } from './Enemy.js';
import { logger } from '../systems/DebugLogger.js';

export class BossEnemy extends Enemy {
    constructor(scene, x, y, bossType, config, playerLevel = 1) {
        // Calculate HP based on player level
        const scaledHp = config.baseHp + (playerLevel * config.hpPerLevel);

        // Create scaled config
        const scaledConfig = {
            ...config,
            hp: scaledHp,
            damage: config.damage || 30
        };

        super(scene, x, y, scaledConfig, bossType, 1.0);

        // Boss-specific properties
        this.bossType = bossType;
        this.phases = config.phases || 2;
        this.phase = 1;
        this.bossConfig = config;

        // Skills per phase
        this.skills = config.skills || ['attack'];

        // Phase transition callback
        this.onPhaseChange = null;

        logger.debug(`BossEnemy created: ${bossType} with ${scaledHp} HP, ${this.phases} phases`);
    }

    /**
     * Get the HP threshold for current phase
     */
    getPhaseThreshold() {
        // Phase 1: 100% to 50%, Phase 2: 50% to 0%
        return Math.floor(this.maxHp * (1 - this.phase / this.phases));
    }

    /**
     * Get the current phase's skill
     */
    getCurrentSkill() {
        return this.skills[this.phase - 1] || 'attack';
    }

    /**
     * Override takeDamage to check for phase transitions
     */
    takeDamage(damage, attacker = null) {
        const prevPhase = this.phase;
        const died = super.takeDamage(damage, attacker);

        // Check for phase transition
        if (!died && this.hp <= this.getPhaseThreshold() && this.phase < this.phases) {
            this.phase++;
            logger.debug(`Boss ${this.bossType} entered phase ${this.phase}`);

            if (this.onPhaseChange) {
                this.onPhaseChange(this.phase);
            }
        }

        return died;
    }

    /**
     * Execute current phase skill
     */
    executeSkill(player) {
        const skill = this.getCurrentSkill();

        switch (skill) {
            case 'tentacle_slap':
            case 'dash':
            case 'fire_breath':
                return this.attackPlayer(player);
            case 'ink_blind':
            case 'stun':
                return 0; // Status effect, handled elsewhere
            case 'summon':
            case 'earthquake':
                return 0; // Special, handled elsewhere
            default:
                return this.attackPlayer(player);
        }
    }
}

export default BossEnemy;