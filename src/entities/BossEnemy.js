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

        // Skill effect state
        this._stunTimer = 0;
        this._stunDuration = 1500; // ms
        this._inkBlindTimer = 0;
        this._inkBlindDuration = 3000; // ms
        this._skillCooldown = 0;
        this._skillCooldownTime = 5000; // ms between skill uses

        // Phase transition callback
        this.onPhaseChange = null;

        logger.debug(`BossEnemy created: ${bossType} with ${scaledHp} HP, ${this.phases} phases`);
    }

    /**
     * Override Enemy.update to execute boss skills on cooldown.
     */
    update(player, time) {
        super.update(player, time);

        const delta = this.scene?.game?.loop?.delta || 16;

        // Update stun timer
        if (this._stunTimer > 0) {
            this._stunTimer -= delta;
        }

        // Update ink blind timer
        if (this._inkBlindTimer > 0) {
            this._inkBlindTimer -= delta;
        }

        // Update skill cooldown
        if (this._skillCooldown > 0) {
            this._skillCooldown -= delta;
        }

        // Try to execute skill when off cooldown and in attack range
        if (this._skillCooldown <= 0 && this.isPlayerInAttackRange(player)) {
            this._skillCooldown = this._skillCooldownTime;
            this.executeSkill(player);
        }
    }

    /**
     * Get the HP threshold for current phase
     * Returns the HP percentage below which the boss enters the next phase
     */
    getPhaseThreshold() {
        // For 3-phase boss: Phase 1 enters phase 2 at 66.7%, Phase 2 enters phase 3 at 33.3%
        // Formula: (phases - phase) / phases gives the fraction of maxHp for entering next phase
        return Math.floor(this.maxHp * (this.phases - this.phase) / this.phases);
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
                // Apply ink blind to player (reduce hit chance) for 3s
                this._inkBlindTimer = this._inkBlindDuration;
                if (this.scene.onBossSkill) {
                    this.scene.onBossSkill(this, 'ink_blind');
                }
                return 0;
            case 'stun':
                // Stun player for 1.5s
                this._stunTimer = this._stunDuration;
                if (this.scene.onBossSkill) {
                    this.scene.onBossSkill(this, 'stun');
                }
                return 0;
            case 'summon':
                // Spawn 2-3 small fish near boss
                this._spawnMinions();
                return 0;
            case 'earthquake':
                // AOE damage to all enemies (including other boss enemies)
                this._earthquake();
                return 0;
            default:
                return this.attackPlayer(player);
        }
    }

    /**
     * Spawn small fish minions near the boss.
     */
    _spawnMinions() {
        if (!this.scene || !this.scene.spawnFish) return;
        const count = Phaser.Math.Between(2, 3);
        for (let i = 0; i < count; i++) {
            const offsetX = Phaser.Math.Between(-80, 80);
            const offsetY = Phaser.Math.Between(-80, 80);
            // Spawn weak clownfish near boss
            const fish = this.scene.spawnFish(this.graphics.x + offsetX, this.graphics.y + offsetY);
            if (fish) {
                // Make spawned fish smaller than player (so player can eat them)
                fish.fishData = fish.fishData || {};
                fish.fishData.size = 15;
                if (fish.graphics && fish.graphics.fishData) {
                    fish.graphics.fishData.size = 15;
                }
            }
        }
    }

    /**
     * Earthquake: AOE damage to all enemies including other boss enemies.
     */
    _earthquake() {
        if (!this.scene || !this.scene.enemies) return;
        const damage = Math.floor(this.fishConfig.damage * 0.5);
        this.scene.enemies.forEach(enemy => {
            if (!enemy || !enemy.graphics || !enemy.graphics.active) return;
            // Damage all enemies in range
            const dist = Phaser.Math.Distance.Between(
                this.graphics.x, this.graphics.y,
                enemy.graphics.x, enemy.graphics.y
            );
            if (dist < 200 && enemy.takeDamage) {
                enemy.takeDamage(damage);
            }
        });
        // Show visual effect
        this._spawnEarthquakePulse();
    }

    _spawnEarthquakePulse() {
        if (!this.scene || !this.scene.add) return;
        const ring = this.scene.add.graphics();
        ring.lineStyle(4, 0xffaa00, 0.8);
        ring.strokeCircle(0, 0, 20);
        ring.x = this.graphics.x;
        ring.y = this.graphics.y;
        ring.setDepth(20);
        const targetScale = 200 / 20;
        this.scene.tweens.add({
            targets: ring,
            scaleX: targetScale, scaleY: targetScale,
            alpha: 0, duration: 500,
            onComplete: () => ring.destroy()
        });
    }
}

export default BossEnemy;