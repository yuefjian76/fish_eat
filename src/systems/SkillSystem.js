// SkillSystem - Manages skill cooldowns and effects
import { logger } from './DebugLogger.js';

export class SkillSystem {
    /**
     * @param {object} skillsData - Skills configuration from skills.json
     */
    constructor(skillsData) {
        this.skillsData = skillsData;
        this.cooldowns = {};
        this.activeEffects = {};
        this.player = null;
        this.scene = null;

        // Initialize cooldowns and active effects
        for (const skillId in skillsData) {
            this.cooldowns[skillId] = 0;
            this.activeEffects[skillId] = null;
        }
    }

    /**
     * Set the player and scene reference
     * @param {object} player - Player graphics object
     * @param {object} scene - Phaser scene reference
     */
    setPlayer(player, scene) {
        this.player = player;
        this.scene = scene;
    }

    /**
     * Check if a skill is on cooldown
     * @param {string} skillId - Skill identifier
     * @returns {boolean} True if on cooldown
     */
    isOnCooldown(skillId) {
        return this.cooldowns[skillId] > 0;
    }

    /**
     * Check if a skill is currently active (buff/shield)
     * @param {string} skillId - Skill identifier
     * @returns {boolean} True if active
     */
    isActive(skillId) {
        return this.activeEffects[skillId] !== null;
    }

    /**
     * Use a skill by key
     * @param {string} key - Key pressed (Q/W/E/R)
     * @returns {object|null} Result of skill use
     */
    useSkill(key) {
        // Find skill by key
        let skillId = null;
        let skill = null;

        for (const id in this.skillsData) {
            if (this.skillsData[id].key === key) {
                skillId = id;
                skill = this.skillsData[id];
                break;
            }
        }

        if (!skill || !this.player) {
            return null;
        }

        // Check cooldown
        if (this.isOnCooldown(skillId)) {
            return { success: false, reason: 'cooldown' };
        }

        // Execute skill effect
        let result = null;

        switch (skill.type) {
            case 'damage':
                result = this.executeDamageSkill(skillId, skill);
                break;
            case 'defense':
                result = this.executeDefenseSkill(skillId, skill);
                break;
            case 'buff':
                result = this.executeBuffSkill(skillId, skill);
                break;
            case 'heal':
                result = this.executeHealSkill(skillId, skill);
                break;
        }

        if (result && result.success) {
            // Start cooldown
            this.cooldowns[skillId] = skill.cooldown;
            logger.info(`Skill used: ${skillId} (${skill.name}), cooldown=${skill.cooldown}s`);
            logger.debug(`Cooldown started for ${skillId}: ${skill.cooldown}s`);
        }

        return result;
    }

    /**
     * Execute damage skill (bite)
     */
    executeDamageSkill(skillId, skill) {
        const player = this.player;
        const scene = this.scene;

        // Find enemies in range
        const enemies = scene.enemies || [];
        const playerX = player.x;
        const playerY = player.y;
        const range = skill.range;

        let hitEnemy = null;
        let maxDamage = 0;

        for (const enemy of enemies) {
            if (!enemy.graphics || !enemy.graphics.active) continue;

            const dx = enemy.graphics.x - playerX;
            const dy = enemy.graphics.y - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Check if enemy is in range (no directional restriction)
            if (distance <= range + (enemy.fishData?.size || 20)) {
                const damage = skill.damage;
                if (damage > maxDamage) {
                    maxDamage = damage;
                    hitEnemy = enemy;
                }
            }
        }

        if (hitEnemy) {
            // Deal damage to enemy
            const died = hitEnemy.takeDamage(skill.damage);

            // If enemy died from the damage
            if (died) {
                // Add experience using GrowthSystem
                const expGain = hitEnemy.getExpValue();
                const expResult = this.scene.growthSystem.addExperience(expGain, this.scene.time.now, this.scene.luckSystem);
                this.scene.exp = this.scene.growthSystem.getExp();
                this.scene.level = this.scene.growthSystem.getLevel();
                this.scene.score += expResult.expGained * 10;

                // Remove from enemies array
                const enemyIndex = this.scene.enemies.findIndex(e => e === hitEnemy);
                if (enemyIndex !== -1) {
                    this.scene.enemies.splice(enemyIndex, 1);
                }

                // Destroy enemy graphics
                hitEnemy.destroy();

                // Level up check
                if (expResult.leveledUp) {
                    this.scene.onLevelUp();
                }

                // Update UI
                const expForNextLevel = this.scene.growthSystem.getExpForLevel(this.scene.level + 1);
                this.scene.scene.get('UIScene').updateUI(this.scene.score, this.scene.exp, this.scene.level, this.scene.hp, this.scene.maxHp, expForNextLevel);
            }

            return { success: true, skillId, type: skill.type, damage: skill.damage, target: hitEnemy, killed: died };
        }

        return { success: false, reason: 'no_target' };
    }

    /**
     * Execute defense skill (shield)
     */
    executeDefenseSkill(skillId, skill) {
        if (this.isActive(skillId)) {
            return { success: false, reason: 'already_active' };
        }

        const player = this.player;

        // Create shield effect - positioned at player center
        const shieldRadius = player.playerData.size + 15;
        const shieldGraphics = this.scene.add.graphics();
        shieldGraphics.setPosition(player.x, player.y);
        shieldGraphics.fillStyle(0x00aaff, 0.4);
        shieldGraphics.fillCircle(0, 0, shieldRadius);
        shieldGraphics.setDepth(5);

        // Make shield follow player
        const shieldUpdate = this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                if (shieldGraphics && !shieldGraphics.destroyed) {
                    shieldGraphics.setPosition(player.x, player.y);
                }
            },
            loop: true
        });

        // Store active effect
        this.activeEffects[skillId] = {
            graphics: shieldGraphics,
            updateEvent: shieldUpdate,
            startTime: this.scene.time.now,
            duration: skill.duration * 1000
        };

        // Mark player as shielded
        player.isShielded = true;
        player.shieldGraphics = shieldGraphics;

        // Remove shield after duration
        this.scene.time.delayedCall(skill.duration * 1000, () => {
            this.removeEffect(skillId);
        });

        logger.debug(`Buff/debuff applied: ${skillId} (${skill.name}), duration=${skill.duration}s`);

        return { success: true, skillId, type: skill.type, duration: skill.duration };
    }

    /**
     * Execute buff skill (speed_up)
     */
    executeBuffSkill(skillId, skill) {
        if (this.isActive(skillId)) {
            return { success: false, reason: 'already_active' };
        }

        const player = this.player;
        const originalSpeed = this.scene.speed;

        // Boost player speed
        this.scene.speed = originalSpeed * 1.8;
        player.setTint(0x00ff00); // Green tint for speed buff

        // Store active effect
        this.activeEffects[skillId] = {
            startTime: this.scene.time.now,
            duration: skill.duration * 1000,
            originalSpeed: originalSpeed
        };

        // Remove buff after duration
        this.scene.time.delayedCall(skill.duration * 1000, () => {
            this.removeEffect(skillId);
        });

        logger.debug(`Buff/debuff applied: ${skillId} (${skill.name}), duration=${skill.duration}s`);

        return { success: true, skillId, type: skill.type, duration: skill.duration };
    }

    /**
     * Execute heal skill
     */
    executeHealSkill(skillId, skill) {
        const player = this.player;
        const scene = this.scene;

        // Calculate heal amount
        const currentHp = scene.hp;
        const maxHp = scene.maxHp;
        const healAmount = skill.healAmount;
        const actualHeal = Math.min(healAmount, maxHp - currentHp);

        if (actualHeal <= 0) {
            return { success: false, reason: 'full_hp' };
        }

        // Apply heal
        scene.hp = currentHp + actualHeal;

        // Update player health bar
        if (scene.updatePlayerHealthBar) {
            scene.updatePlayerHealthBar();
        }

        // Show heal effect
        const healText = scene.add.text(player.x, player.y - 30, `+${actualHeal}`, {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        });
        healText.setOrigin(0.5);
        healText.setDepth(100);

        // Fade out and destroy
        scene.tweens.add({
            targets: healText,
            alpha: 0,
            y: player.y - 60,
            duration: 1000,
            onComplete: () => healText.destroy()
        });

        return { success: true, skillId, type: skill.type, healAmount: actualHeal };
    }

    /**
     * Remove an active effect
     * @param {string} skillId - Skill identifier
     */
    removeEffect(skillId) {
        const effect = this.activeEffects[skillId];
        if (!effect) return;

        const skill = this.skillsData[skillId];

        // Clean up based on skill type
        if (skill.type === 'defense') {
            if (effect.graphics) effect.graphics.destroy();
            if (effect.updateEvent) effect.updateEvent.remove();
            if (this.player) {
                this.player.isShielded = false;
                this.player.shieldGraphics = null;
            }
        } else if (skill.type === 'buff') {
            if (this.scene) this.scene.speed = effect.originalSpeed;
            if (this.player) this.player.clearTint();
        }

        this.activeEffects[skillId] = null;
    }

    /**
     * Update cooldowns and effects
     * @param {number} delta - Time delta in ms
     */
    update(delta) {
        // Update cooldowns
        for (const skillId in this.cooldowns) {
            if (this.cooldowns[skillId] > 0) {
                this.cooldowns[skillId] -= delta / 1000;
                if (this.cooldowns[skillId] < 0) {
                    this.cooldowns[skillId] = 0;
                    logger.debug(`Cooldown ended for ${skillId}`);
                }
            }
        }

        // Check expired effects
        const currentTime = this.scene?.time.now || 0;
        for (const skillId in this.activeEffects) {
            const effect = this.activeEffects[skillId];
            if (effect && effect.duration) {
                const elapsed = currentTime - effect.startTime;
                if (elapsed >= effect.duration) {
                    this.removeEffect(skillId);
                }
            }
        }
    }

    /**
     * Get cooldown remaining for a skill
     * @param {string} skillId - Skill identifier
     * @returns {number} Cooldown remaining in seconds
     */
    getCooldownRemaining(skillId) {
        return Math.max(0, this.cooldowns[skillId] || 0);
    }

    /**
     * Get cooldown percentage for UI display
     * @param {string} skillId - Skill identifier
     * @returns {number} Cooldown percentage (0-1)
     */
    getCooldownPercent(skillId) {
        const skill = this.skillsData[skillId];
        if (!skill) return 0;
        const remaining = this.getCooldownRemaining(skillId);
        return remaining / skill.cooldown;
    }

    /**
     * Reduce cooldown for all skills
     * @param {number} seconds - Seconds to reduce
     */
    reduceAllCooldowns(seconds) {
        for (const skillId in this.cooldowns) {
            if (this.cooldowns[skillId] > 0) {
                this.cooldowns[skillId] = Math.max(0, this.cooldowns[skillId] - seconds);
            }
        }
        logger.info(`All skill cooldowns reduced by ${seconds}s`);
    }

    /**
     * Check if player is shielded
     * @returns {boolean} True if shield is active
     */
    isPlayerShielded() {
        return this.activeEffects['shield'] !== null;
    }

    /**
     * Check if player has speed buff
     * @returns {boolean} True if speed buff is active
     */
    isPlayerSpeedBuffed() {
        return this.activeEffects['speed_up'] !== null;
    }
}

export default SkillSystem;
