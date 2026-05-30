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
            if (skillId === 'synergies') continue; // Skip synergies block
            this.cooldowns[skillId] = 0;
            this.activeEffects[skillId] = null;
        }

        // Synergy system
        this.synergies = this._loadSynergies();
        this.recentSkillQueue = []; // { skillId, timestamp }
        this._synergyWindowMs = 3000;
        this.lastDamageHit = null; // { enemy, damage } for synergy effects
    }

    /**
     * Load synergy definitions from skillsData
     * @returns {object} Synergy definitions keyed by synergy id
     */
    _loadSynergies() {
        return this.skillsData?.synergies || {};
    }

    /**
     * Remove skills older than _synergyWindowMs from recentSkillQueue
     */
    _cleanSkillQueue() {
        const now = this.scene?.time?.now || Date.now();
        this.recentSkillQueue = this.recentSkillQueue.filter(
            entry => now - entry.timestamp < this._synergyWindowMs
        );
    }

    /**
     * Check if the most recent skill completes any synergy pattern
     * @param {string} latestSkillId - The skill just used
     * @returns {object|null} The synergy object if matched, null otherwise
     */
    _checkSynergy(latestSkillId) {
        this._cleanSkillQueue();

        const now = this.scene?.time?.now || Date.now();
        this.recentSkillQueue.push({ skillId: latestSkillId, timestamp: now });

        // Build current pattern from queue
        const currentPattern = this.recentSkillQueue.map(e => e.skillId);

        // Check each synergy for pattern match
        for (const [synergyId, synergy] of Object.entries(this.synergies)) {
            const pattern = synergy.pattern;
            if (currentPattern.length < pattern.length) continue;

            // Check if the last `pattern.length` entries match the pattern
            const recentEntries = this.recentSkillQueue.slice(-pattern.length);
            const recentPattern = recentEntries.map(e => e.skillId);

            if (JSON.stringify(recentPattern) === JSON.stringify(pattern)) {
                // Synergy matched! Clear the queue to prevent re-trigger
                this.recentSkillQueue = [];
                return synergy;
            }
        }

        return null;
    }

    /**
     * Execute synergy effects
     * @param {object} synergy - The synergy object to execute
     */
    _executeSynergy(synergy) {
        logger.info(`Synergy activated: ${synergy.name}`);

        // Show floating text for synergy
        this.scene?.floatingTextSystem?.showSynergyName?.(synergy.name);

        const effects = synergy.effects;

        // rush_bite: damage x2 + knockback
        if (synergy.name === 'Rush Bite' && this.lastDamageHit?.enemy) {
            // Apply extra damage equal to original
            const extraDamage = this.lastDamageHit.damage;
            this.lastDamageHit.enemy.takeDamage(extraDamage);

            // Knockback via ImpactSystem
            this.scene?.impactSystem?.applyKnockback?.(this.lastDamageHit.enemy, this.player);
        }

        // storm_slash: cooldown reset + bonus bites
        if (synergy.name === 'Storm Slash') {
            // Reset Q (bite) cooldown
            if (this.cooldowns['bite'] !== undefined) {
                this.cooldowns['bite'] = 0;
            }

            // Queue bonus bites
            const bonusBites = (effects.bonusBites || 3) - 1; // -1 because first bite already happened
            for (let i = 0; i < bonusBites; i++) {
                this._queueBonusBite(i * 150); // Stagger by 150ms each
            }
        }
    }

    /**
     * Queue a bonus bite to be executed after short delay
     * @param {number} delay - Delay in ms before executing
     */
    _queueBonusBite(delay) {
        if (!this.scene) return;

        this.scene.time.delayedCall(delay, () => {
            const enemies = this.scene.enemies || [];
            if (!this.player || enemies.length === 0) return;

            // Find nearest enemy
            let nearest = null;
            let nearestDist = Infinity;
            const px = this.player.x;
            const py = this.player.y;

            for (const enemy of enemies) {
                if (!enemy.graphics || !enemy.graphics.active) continue;
                const dx = enemy.graphics.x - px;
                const dy = enemy.graphics.y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist && dist <= 150) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            }

            if (nearest) {
                nearest.takeDamage(25); // Base bite damage
            }
        });
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
     * Check if a skill is unlocked at given level
     * @param {string} skillId - Skill identifier
     * @param {number} playerLevel - Current player level
     * @returns {boolean} True if unlocked
     */
    isSkillUnlocked(skillId, playerLevel) {
        const skill = this.skillsData[skillId];
        if (!skill) return false;
        return playerLevel >= (skill.unlockLevel || 1);
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
     * @param {number} [levelOverride] - Optional level override for testing
     * @returns {object|null} Result of skill use
     */
    useSkill(key, levelOverride) {
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

        // Check if skill is unlocked (use override level if provided, else use scene level)
        const playerLevel = levelOverride !== undefined ? levelOverride : (this.scene?.level || 1);
        if (!this.isSkillUnlocked(skillId, playerLevel)) {
            return { success: false, reason: 'locked' };
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

            // Check for synergy activation
            const synergy = this._checkSynergy(skillId);
            if (synergy) {
                this._executeSynergy(synergy);
            }
        }

        return result;
    }

    /**
     * Execute damage skill (bite)
     */
    executeDamageSkill(skillId, skill) {
        const player = this.player;
        const scene = this.scene;

        // Collect ALL enemies in range (AOE hit, not single-target)
        const enemies = scene.enemies || [];
        const playerX = player.x;
        const playerY = player.y;
        const range = skill.range;

        const enemiesInRange = [];
        for (const enemy of enemies) {
            if (!enemy.graphics || !enemy.graphics.active) continue;
            const dx = enemy.graphics.x - playerX;
            const dy = enemy.graphics.y - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= range + (enemy.fishData?.size || 20)) {
                enemiesInRange.push(enemy);
            }
        }

        if (enemiesInRange.length === 0) {
            return { success: false, reason: 'no_target' };
        }

        // Freeze frame once for the whole AOE hit
        if (scene && scene.time && typeof scene.time.pause === 'function') {
            scene.time.pause();
            setTimeout(() => {
                if (scene && scene.time && typeof scene.time.resume === 'function') scene.time.resume();
            }, 50);
        }

        const playerType = 'clownfish';
        let totalKilled = 0;
        let primaryTarget = enemiesInRange[0]; // for return value

        for (const hitEnemy of enemiesInRange) {
            // Apply type advantage per enemy
            const enemyConfig = hitEnemy.fishConfig;
            let typeMultiplier = 1.0;
            if (enemyConfig) {
                if (enemyConfig.weakTo?.includes(playerType)) {
                    typeMultiplier = 1.5;
                } else if (enemyConfig.strongAgainst?.includes(playerType)) {
                    typeMultiplier = 0.6;
                }
            }
            const finalDamage = Math.floor(skill.damage * typeMultiplier);

            // Flash enemy white
            if (hitEnemy.graphics && hitEnemy.graphics.list && hitEnemy.graphics.list[0]) {
                hitEnemy.graphics.list[0].setTint(0xffffff);
                setTimeout(() => {
                    if (hitEnemy.graphics && hitEnemy.graphics.list && hitEnemy.graphics.list[0]) {
                        hitEnemy.graphics.list[0].clearTint();
                    }
                }, 80);
            }

            const died = hitEnemy.takeDamage(finalDamage);

            if (died) {
                totalKilled++;
                const expGain = hitEnemy.getExpValue();
                const expResult = this.scene.growthSystem.addExperience(expGain, this.scene.time.now, this.scene.luckSystem);
                this.scene.exp = this.scene.growthSystem.getExp();
                this.scene.level = this.scene.growthSystem.getLevel();
                this.scene.score += expResult.expGained * 10;

                const enemyIndex = this.scene.enemies.findIndex(e => e === hitEnemy);
                if (enemyIndex !== -1) {
                    this.scene.enemies.splice(enemyIndex, 1);
                }
                hitEnemy.destroy();

                if (expResult.leveledUp) {
                    this.scene.onLevelUp();
                }
            }
        }

        // Single UI update after all hits processed
        const expForNextLevel = this.scene.growthSystem.getExpForLevel(this.scene.level + 1);
        this.scene.scene.get('UIScene').updateUI(
            this.scene.score, this.scene.exp, this.scene.level,
            this.scene.hp, this.scene.maxHp, expForNextLevel
        );

        // Track last damage hit for synergy effects
        this.lastDamageHit = {
            enemy: primaryTarget,
            damage: primaryTarget ? this._getFinalDamage(skill, primaryTarget) : skill.damage
        };

        return {
            success: true,
            skillId,
            type: skill.type,
            damage: skill.damage,
            hitCount: enemiesInRange.length,
            killed: totalKilled,
            target: primaryTarget
        };
    }

    /**
     * Execute defense skill (shield)
     */
    executeDefenseSkill(skillId, skill) {
        if (this.isActive(skillId)) {
            return { success: false, reason: 'already_active' };
        }

        const player = this.player;

        // Calculate shield HP (20% of max HP)
        const maxHp = this.scene.maxHp || 50;
        const shieldHp = Math.floor(maxHp * (skill.shieldHpPercent || 0.2));

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

        // Store active effect with shield HP
        this.activeEffects[skillId] = {
            graphics: shieldGraphics,
            updateEvent: shieldUpdate,
            startTime: this.scene.time.now,
            duration: skill.duration * 1000,
            hp: shieldHp,
            maxHp: shieldHp
        };

        // Mark player as shielded
        player.isShielded = true;
        player.shieldGraphics = shieldGraphics;

        // Remove shield after duration
        this.scene.time.delayedCall(skill.duration * 1000, () => {
            this.removeEffect(skillId);
        });

        logger.debug(`Buff/debuff applied: ${skillId} (${skill.name}), duration=${skill.duration}s, shieldHp=${shieldHp}`);

        return { success: true, skillId, type: skill.type, duration: skill.duration, shieldHp };
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

        // Boost player speed - use config speedMultiplier, default 1.2
        const multiplier = skill.speedMultiplier || 1.2;
        this.scene.speed = originalSpeed * multiplier;

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
     * Supports both healPercent (fraction of maxHp, e.g. 0.15) and
     * legacy healAmount (fixed number). healPercent takes priority.
     */
    executeHealSkill(skillId, skill) {
        const player = this.player;
        const scene = this.scene;

        // Calculate heal amount — percent-based or fixed fallback
        const currentHp = scene.hp;
        const maxHp = scene.maxHp;
        const healAmount = skill.healPercent != null
            ? Math.floor(maxHp * skill.healPercent)
            : (skill.healAmount || 0);
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
     * @returns {boolean} True if shield is active with HP > 0
     */
    isPlayerShielded() {
        const shield = this.activeEffects['shield'];
        return shield !== null && shield.hp > 0;
    }

    /**
     * Damage the shield
     * @param {number} damage - Damage amount to absorb
     * @returns {number} Remaining damage after shield absorption
     */
    damageShield(damage) {
        const shield = this.activeEffects['shield'];
        if (!shield || shield.hp <= 0) {
            return damage;
        }

        const remainingDamage = Math.max(0, damage - shield.hp);
        shield.hp = Math.max(0, shield.hp - damage);

        // Update shield visual (reduce opacity based on remaining HP)
        if (shield.graphics && !shield.graphics.destroyed) {
            const hpPercent = shield.hp / shield.maxHp;
            shield.graphics.clear();
            shield.graphics.fillStyle(0x00aaff, 0.4 * hpPercent);
            const player = this.player;
            const shieldRadius = (player.playerData.size + 15) * hpPercent;
            shield.graphics.fillCircle(player.x, player.y, shieldRadius);
        }

        // Break shield if HP depleted
        if (shield.hp <= 0) {
            this.removeEffect('shield');
        }

        return remainingDamage;
    }

    /**
     * Check if player has speed buff
     * @returns {boolean} True if speed buff is active
     */
    isPlayerSpeedBuffed() {
        return this.activeEffects['speed_up'] !== null;
    }

    /**
     * Calculate final damage for a skill against an enemy (including type multiplier)
     * @param {object} skill - Skill configuration
     * @param {object} enemy - Enemy object with fishConfig
     * @returns {number} Final damage value
     */
    _getFinalDamage(skill, enemy) {
        const playerType = this.player?.fishType || 'clownfish';
        let typeMultiplier = 1.0;
        const enemyConfig = enemy?.fishConfig;
        if (enemyConfig) {
            if (enemyConfig.weakTo?.includes(playerType)) {
                typeMultiplier = 1.5;
            } else if (enemyConfig.strongAgainst?.includes(playerType)) {
                typeMultiplier = 0.6;
            }
        }
        return Math.floor(skill.damage * typeMultiplier);
    }
}

export default SkillSystem;
