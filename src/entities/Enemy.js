/**
 * Enemy - Fish enemy with AI behavior (wander, chase, attack)
 */
import { logger } from '../systems/DebugLogger.js';
import { FishFactory } from './FishFactory.js';

export class Enemy {
    static STATE = {
        WANDERING: 'wandering',
        CHASING: 'chasing',
        ATTACKING: 'attacking',
        FLEEING: 'fleeing',
        FISHING: 'fishing'
    };

    constructor(scene, x, y, fishConfig, fishType, aiLevel = 1.0) {
        this.scene = scene;
        this.fishConfig = fishConfig;
        this.fishType = fishType;
        this.aiLevel = aiLevel;

        // Create fish graphics using FishFactory (sprite-based if available)
        // Use actual fishType for sprite selection, not mapped 'fish'/'fish_big'
        this.graphics = FishFactory.createEnemyFromSprite(scene, fishType, fishConfig.size / 30, 0);
        this.graphics.x = x;
        this.graphics.y = y;

        // Animation is already started in FishFactory.createFishFromFrames()
        // No need to replay here - sprite.animKey is the texture base key, not the anim key

        // Create shadow underneath fish (for depth effect)
        const shadowScale = (fishConfig.size / 30) * 0.4;
        this.shadow = scene.add.graphics();
        this.shadow.fillStyle(0x000000, 0.2);
        this.shadow.fillEllipse(0, 0, 60 * shadowScale, 20 * shadowScale);
        this.shadow.setDepth(29); // Fixed depth: always below enemy (depth=30)

        // Breathing/floating animation state
        this._breathOffset = Math.random() * Math.PI * 2; // Random start phase
        this._breathBaseY = y; // Visual base Y that follows physics movement

        // Enable physics - use a circle hitbox for simplicity
        scene.physics.world.enable(this.graphics);
        const hitRadius = fishConfig.size * 0.8;
        this.graphics.body.setCircle(hitRadius);
        this.graphics.body.setOffset(-hitRadius, -hitRadius);
        this.graphics.body.setBounce(0.3);
        this.graphics.body.setCollideWorldBounds(true);

        // Store fish data on graphics object
        this.graphics.fishType = fishType;
        this.graphics.fishData = { ...fishConfig };
        this.graphics.isEnemy = true;

        // AI State - adjusted by aiLevel
        this.state = Enemy.STATE.WANDERING;
        this.visionRange = Math.floor(200 * aiLevel);
        this.attackRange = Math.floor(50 * aiLevel);
        this.attackCooldown = Math.floor(800 / aiLevel); // Higher AI = faster attacks
        this.lastAttackTime = 0;
        this.wanderTimer = 0;
        this.wanderInterval = Math.floor(2000 / aiLevel); // Higher AI = more active

        // Movement - adjusted by aiLevel
        this.baseSpeed = fishConfig.speed;
        this.chaseSpeedMultiplier = 1.5 * aiLevel;
        this.speedMultiplier = 1.0; // For enrage mechanic

        // Chain lightning
        this.chainLightningRange = 150;
        this.chainLightningTimer = 0;

        // Health
        this.hp = fishConfig.hp;
        this.maxHp = fishConfig.hp;

        // Experience drop
        this.expValue = fishConfig.exp || 10;

        // Health bar
        this.healthBarWidth = fishConfig.size * 2;
        this.healthBarHeight = 4;
        this.healthBar = scene.add.graphics();
        this.healthBar.setDepth(11); // Health bar above fish
        this.updateHealthBar();

        // Flee state
        this.fleeTimer = 0;
        this.fleeDuration = 3000; // 3 seconds
        this.attacker = null;

        // ── Hate / Aggro system ──────────────────────────────────────────
        this.hateTarget = null;       // Who this enemy hates (player who attacked it)
        this.hateTimer = 0;            // Time since hate was set
        this.hateDuration = 8000;      // Hate lasts 8 seconds
        this.hateRange = 400;          // Chase target up to this distance when hating
        this.lastHateTarget = null;    // Track who we last hated (for grace period)
        this.hateGracePeriod = 3000;   // 3 second grace period after hate expires

        // Fishing state
        this.fishingTarget = null;
        this.fishingChancePerSecond = 0.05; // 5% per second
        this.fishingVisionRange = 300;

        // ── Special behavior states ───────────────────────────────────────────
        this._initSpecialBehaviors();

        // Add to physics group
        scene.fishes.add(this.graphics);

        // Start wandering
        this.setRandomWanderDirection();
    }

    /**
     * Initialise all special-behavior state variables once.
     * Keeps constructor lean and behaviors encapsulated.
     */
    _initSpecialBehaviors() {
        const cfg = this.fishConfig;

        // ── Eel dash ────────────────────────────────────────────────────────
        if (cfg.dash) {
            this.dashCooldown    = 3000;   // ms between dashes
            this.dashDuration    = 350;    // ms a single dash lasts
            this.dashSpeed       = this.baseSpeed * 4;
            this.lastDashTime    = -this.dashCooldown; // ready immediately
            this.dashTimer       = 0;
            this.isDashing       = false;
        }

        // ── Octopus stealth ────────────────────────────────────────────────
        if (cfg.stealth) {
            this.stealthCooldown  = 5000;
            this.stealthDuration  = 2500;
            this.stealthActive    = false;
            this.stealthTimer     = 0;
            this.lastStealthTime  = -this.stealthCooldown;
        }

        // ── Seahorse evasive ───────────────────────────────────────────────
        if (cfg.evasive) {
            this.evasionTriggerRange    = 180;
            this.evasionSpeedMultiplier = 2.2;
            this.isEvading              = false;
            this.evasionTimer           = 0;
            this.evasionDuration        = 1200; // ms per evasion burst
        }

        // ── Jellyfish AOE sting ─────────────────────────────────────────────
        if (cfg.aoe) {
            this.aoeCooldown   = 4000;
            this.aoeRadius     = 100;
            this.aoeDamage     = cfg.damage || 8;
            this.lastAoeTime   = -this.aoeCooldown;
        }

        // ── Anglerfish ranged lure ──────────────────────────────────────────
        if (cfg.range || cfg.behavior === 'ranged') {
            this.rangedAttackRange = cfg.range || 200;
            this.rangedCooldown    = 2500;
            this.projectileSpeed   = 300;
            this.rangedDamage      = cfg.damage || 10;
            this.lastRangedTime    = -this.rangedCooldown;
            // Preferred stand-off: keep at ~60% of ranged range
            this.standOffRange     = this.rangedAttackRange * 0.65;
        }
    }

    /**
     * Update health bar display
     */
    updateHealthBar() {
        this.healthBar.clear();

        // Background (dark)
        this.healthBar.fillStyle(0x333333, 0.8);
        this.healthBar.fillRect(-this.healthBarWidth / 2, -this.fishConfig.size - 12, this.healthBarWidth, this.healthBarHeight);

        // Health (green to red based on percentage)
        const hpPercent = this.hp / this.maxHp;
        const hpColor = hpPercent > 0.5 ? 0x00ff00 : (hpPercent > 0.25 ? 0xffff00 : 0xff0000);
        this.healthBar.fillStyle(hpColor, 1);
        this.healthBar.fillRect(-this.healthBarWidth / 2, -this.fishConfig.size - 12, this.healthBarWidth * hpPercent, this.healthBarHeight);

        // Border
        this.healthBar.lineStyle(1, 0x000000, 0.5);
        this.healthBar.strokeRect(-this.healthBarWidth / 2, -this.fishConfig.size - 12, this.healthBarWidth, this.healthBarHeight);
    }

    /**
     * Update enrage state for mutant shark - doubles speed when HP < 30%
     */
    updateEnrage() {
        if (this.hp < this.maxHp * 0.3) {
            this.speedMultiplier = 2.0;
            this.chaseSpeedMultiplier = 2.0; // Also increase chase speed
        }
    }

    /**
     * Set random direction for wandering
     */
    setRandomWanderDirection() {
        if (!this.scene || !this.scene.physics || !this.graphics || !this.graphics.active) {
            return;
        }
        const angle = Phaser.Math.Between(0, 360);
        const distance = 200;
        const targetX = this.graphics.x + Math.cos(angle) * distance;
        const targetY = this.graphics.y + Math.sin(angle) * distance;
        this.scene.physics.moveTo(this.graphics, targetX, targetY, this.baseSpeed);
        this.targetX = targetX;
        this.targetY = targetY;
    }

    /**
     * Check if player is within vision range.
     * Stealthed octopus uses reduced vision range (hiding = not hunting).
     * @param {object} player - Player graphics object
     * @returns {boolean} True if player is in vision range
     */
    isPlayerInVision(player) {
        if (!player) return false;
        const distance = Phaser.Math.Distance.Between(
            this.graphics.x, this.graphics.y,
            player.x, player.y
        );
        // Stealthed octopus has reduced vision (it's hiding, not hunting)
        const effectiveRange = (this.stealthActive)
            ? this.visionRange * 0.4
            : this.visionRange;
        return distance <= effectiveRange;
    }

    /**
     * Check if player is in attack range
     * @param {object} player - Player graphics object
     * @returns {boolean} True if player is in attack range
     */
    isPlayerInAttackRange(player) {
        if (!player) return false;
        const distance = Phaser.Math.Distance.Between(
            this.graphics.x, this.graphics.y,
            player.x, player.y
        );
        return distance <= this.attackRange;
    }

    /**
     * Chase the player
     * @param {object} player - Player graphics object
     */
    chasePlayer(player) {
        const angle = Phaser.Math.Angle.Between(
            this.graphics.x, this.graphics.y,
            player.x, player.y
        );
        const speed = this.baseSpeed * this.chaseSpeedMultiplier;
        this.scene.physics.moveTo(this.graphics, player.x, player.y, speed);
        this.graphics.rotation = angle;
    }

    /**
     * Attack the player
     * @param {object} player - Player graphics object
     * @returns {number} Damage dealt (0 if on cooldown)
     */
    attackPlayer(player) {
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return 0;
        }

        this.lastAttackTime = currentTime;
        this.state = Enemy.STATE.ATTACKING;

        // Calculate type multiplier (if fish is strong against player, deal more damage)
        let typeMultiplier = 1.0;
        if (this.fishConfig.strongAgainst?.includes('clownfish')) {
            typeMultiplier = 1.5; // Fish deals 50% more damage to player
        } else if (this.fishConfig.weakTo?.includes('clownfish')) {
            typeMultiplier = 0.5; // Fish deals 50% less damage to player
        }

        // Deal damage based on fish size AND level - logarithmic scale for balanced gameplay
        // Same level enemies have consistent damage, high level enemies hit much harder
        // Level 1: base damage, Level 2: ~1.5x, Level 3: ~2x, Level 4+: ~2.5x+
        const sizeDamage = 2 + Math.floor(Math.log(this.fishConfig.size) * 3);
        const levelMultiplier = 1 + ((this.aiLevel || 1) - 1) * 0.5; // 50% more damage per level
        const damage = Math.max(5, Math.min(Math.floor(sizeDamage * levelMultiplier * typeMultiplier), 30));
        return damage;
    }

    /**
     * Apply damage to this enemy
     * @param {number} damage - Damage amount
     * @returns {boolean} True if enemy died
     */
    takeDamage(damage, attacker = null) {
        this.hp -= damage;
        this.updateHealthBar();
        if (this.hp <= 0) {
            this.hp = 0;
            return true; // Enemy died
        }

        // Set hate target when attacked — enemy will chase attacker
        if (attacker && attacker.active) {
            // Only reset hate if it's a NEW attacker (prevents timer reset on repeated attacks)
            if (this.hateTarget !== attacker) {
                this.lastHateTarget = null;  // Reset grace period when switching targets
                this.hateTarget = attacker;
                this.hateTimer = 0;
                logger.debug(`${this.fishType} gained hate on attacker`);
            }
        }

        // Check for flee (HP < 30% with 50% chance)
        if (attacker && this.hp < this.maxHp * 0.3 && Math.random() < 0.5) {
            this.setState(Enemy.STATE.FLEEING, attacker);
        }
        return false;
    }

    /**
     * Get experience value for dropping
     * @returns {number} Experience value
     */
    getExpValue() {
        return this.expValue;
    }

    /**
     * Destroy this enemy — resets visual state before destroying GameObjects
     * to avoid tween callbacks targeting destroyed/stale objects.
     */
    destroy() {
        if (this.graphics && this.graphics.active) {
            // Reset any in-progress special-behavior visuals
            if (this.stealthActive) this.graphics.setAlpha(1.0);
            if (this.isDashing || this.isEvading) this.graphics.setTint(0xFFFFFF);
        }
        // Clear hate target to avoid memory leaks
        this.hateTarget = null;
        this.fishingTarget = null;
        this.graphics.destroy();
        this.healthBar.destroy();
    }

    /**
     * Set AI state with logging
     * @param {string} newState - New state to transition to
     * @param {object} context - Optional context (attacker for FLEEING, target for FISHING)
     */
    setState(newState, context = null) {
        const prevState = this.state;
        this.state = newState;
        logger.debug(`AI state change: ${this.fishType} ${prevState} -> ${newState}`);

        if (newState === Enemy.STATE.FLEEING && context) {
            this.attacker = context;
            this.fleeTimer = 0;
        } else if (newState === Enemy.STATE.FISHING) {
            this.fishingTarget = null; // Will be selected in updateFishing
        }
    }

    /**
     * Update fleeing behavior - move away from attacker
     * @param {number} delta - Time delta in ms
     */
    updateFleeing(delta) {
        if (!this.attacker || !this.graphics.active) {
            this.state = Enemy.STATE.WANDERING;
            return;
        }

        // Move away from attacker at speed * 1.5
        const angle = Phaser.Math.Angle.Between(
            this.attacker.x, this.attacker.y,
            this.graphics.x, this.graphics.y
        );
        const speed = this.baseSpeed * 1.5;
        this.scene.physics.moveTo(
            this.graphics,
            this.graphics.x + Math.cos(angle) * 100,
            this.graphics.y + Math.sin(angle) * 100,
            speed
        );
        this.graphics.rotation = angle;

        // Track flee duration
        this.fleeTimer += delta;
        if (this.fleeTimer >= this.fleeDuration) {
            this.state = Enemy.STATE.WANDERING;
            this.attacker = null;
            this.fleeTimer = 0;
        }
    }

    /**
     * Execute chain lightning attack - damages all nearby entities
     */
    executeChainLightning() {
        if (!this.fishConfig.chain_lightning) return;

        const range = this.chainLightningRange || 150;
        // Use centralized damage calculation (no type multiplier for AOE)
        const damage = this.scene.battleSystem
            ? this.scene.battleSystem.calculateEnemyDamage(this.fishConfig, this.aiLevel, 1.0)
            : Math.max(5, Math.min(2 + Math.floor(Math.log(this.fishConfig.size) * 3), 15));

        // Get all entities in range
        const enemies = this.scene.fishes.getChildren();
        enemies.forEach(enemy => {
            if (enemy === this.graphics || !enemy.active) return;

            const dist = Phaser.Math.Distance.Between(
                this.graphics.x, this.graphics.y,
                enemy.x, enemy.y
            );

            if (dist <= range && enemy.takeDamage) {
                enemy.takeDamage(damage);
            }
        });
    }

    /**
     * Update fishing behavior - hunt smaller enemies
     * @param {number} delta - Time delta in ms
     */
    updateFishing(delta) {
        // If no target, find one
        if (!this.fishingTarget || !this.fishingTarget.graphics || !this.fishingTarget.graphics.active) {
            // Find smaller enemies
            const enemies = this.scene.fishes.getChildren();
            const selfSize = this.fishConfig.size;

            for (const enemy of enemies) {
                if (enemy === this.graphics || !enemy.active) continue;
                if (enemy.fishData && enemy.fishData.size < selfSize * 0.9) {
                    // Found a valid target
                    this.fishingTarget = enemy;
                    break;
                }
            }

            // No target found, return to wandering
            if (!this.fishingTarget) {
                this.state = Enemy.STATE.WANDERING;
                return;
            }
        }

        // Chase and attack the target
        const target = this.fishingTarget;
        const distance = Phaser.Math.Distance.Between(
            this.graphics.x, this.graphics.y,
            target.x, target.y
        );

        if (distance <= this.attackRange) {
            // Attack the target
            const currentTime = this.scene.time.now;
            if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                this.lastAttackTime = currentTime;

                // Base damage using centralized formula
                const damage = this.scene.battleSystem
                    ? this.scene.battleSystem.calculateEnemyDamage(this.fishConfig, this.aiLevel, 1.0)
                    : Math.max(5, Math.min(2 + Math.floor(Math.log(this.fishConfig.size) * 3), 15));

                // Size bonus: bigger fish vs smaller fish
                const targetSize = target.fishData ? target.fishData.size : 20;
                const sizeDiff = this.fishConfig.size - targetSize;
                let finalDamage = damage;
                if (sizeDiff > 10) {
                    // Significantly larger - extra damage
                    finalDamage = Math.floor(damage * 1.15);
                } else if (sizeDiff > 5) {
                    finalDamage = Math.floor(damage * 1.08);
                }

                if (target.fishData && target.takeDamage) {
                    const killed = target.takeDamage(finalDamage);
                    if (killed) {
                        // Gain 50% of target's exp
                        const expGained = Math.floor((target.expValue || 10) * 0.5);
                        this.expValue += expGained;
                        logger.debug(`${this.fishType} gained ${expGained} exp from fishing`);
                        this.fishingTarget = null;
                        this.state = Enemy.STATE.WANDERING;
                    }
                }
            }
        } else {
            // Chase the target
            const angle = Phaser.Math.Angle.Between(
                this.graphics.x, this.graphics.y,
                target.x, target.y
            );
            const speed = this.baseSpeed * this.chaseSpeedMultiplier;
            this.scene.physics.moveTo(this.graphics, target.x, target.y, speed);
            this.graphics.rotation = angle;
        }
    }

    // ════════════════════════════════════════════════════════════════════════
    // Special Behavior Updates
    // ════════════════════════════════════════════════════════════════════════

    /**
     * Eel: dash toward player when off cooldown.
     * While dashing the eel is visually tinted and moves at 4× speed.
     */
    updateDash(player, delta) {
        if (!this.fishConfig.dash || !player || !this.graphics.active) return;
        const now = this.scene.time.now;

        if (this.isDashing) {
            this.dashTimer += delta;
            if (this.dashTimer >= this.dashDuration) {
                // Dash finished
                this.isDashing = false;
                this.graphics.setTint(0xFFFFFF);
                this.graphics.body.setVelocity(0, 0);
            }
            // During dash, velocity was already set — let physics carry it
        } else {
            // Check if we should start a new dash
            if (now - this.lastDashTime >= this.dashCooldown) {
                const dist = Phaser.Math.Distance.Between(
                    this.graphics.x, this.graphics.y,
                    player.x, player.y
                );
                if (dist <= this.visionRange && dist > this.attackRange) {
                    // Launch dash
                    this.isDashing = true;
                    this.dashTimer = 0;
                    this.lastDashTime = now;

                    const dx = player.x - this.graphics.x;
                    const dy = player.y - this.graphics.y;
                    const len = Math.hypot(dx, dy) || 1;
                    this.graphics.body.setVelocity(
                        (dx / len) * this.dashSpeed,
                        (dy / len) * this.dashSpeed
                    );
                    // Visual feedback: yellow tint while dashing
                    this.graphics.setTint(0xFFEE00);
                    this._spawnDashTrail();
                }
            }
        }
    }

    /** Spawn brief particle trail for dash visual */
    _spawnDashTrail() {
        if (!this.scene.add) return;
        for (let i = 0; i < 4; i++) {
            this.scene.time.delayedCall(i * 60, () => {
                if (!this.graphics || !this.graphics.active) return;
                const spark = this.scene.add.graphics();
                spark.fillStyle(0xFFEE00, 0.7);
                spark.fillCircle(0, 0, 5);
                spark.x = this.graphics.x;
                spark.y = this.graphics.y;
                spark.setDepth(9);
                this.scene.tweens.add({
                    targets: spark, alpha: 0, scaleX: 0, scaleY: 0,
                    duration: 300, onComplete: () => spark.destroy()
                });
            });
        }
    }

    /**
     * Octopus: toggle stealth (go semi-transparent) to avoid player detection.
     * While stealthed, the octopus is not in vision range calculations.
     */
    updateStealth(delta) {
        if (!this.fishConfig.stealth || !this.graphics.active) return;
        const now = this.scene.time.now;

        if (this.stealthActive) {
            this.stealthTimer += delta;
            if (this.stealthTimer >= this.stealthDuration) {
                // Come out of stealth
                this.stealthActive = false;
                this.stealthTimer = 0;
                this.lastStealthTime = now;
                this.graphics.setAlpha(1.0);
            }
        } else {
            // Try to enter stealth when player is approaching
            if (now - this.lastStealthTime >= this.stealthCooldown) {
                const player = this.scene.player;
                if (player) {
                    const dist = Phaser.Math.Distance.Between(
                        this.graphics.x, this.graphics.y,
                        player.x, player.y
                    );
                    // Activate stealth when player gets within 250px
                    if (dist < 250) {
                        this.stealthActive = true;
                        this.stealthTimer = 0;
                        this.graphics.setAlpha(0.2);
                        // Small ripple effect at activation
                        this._spawnStealthRipple();
                    }
                }
            }
        }
    }

    /** Ripple effect when going stealthy */
    _spawnStealthRipple() {
        if (!this.scene.add) return;
        const ripple = this.scene.add.graphics();
        ripple.lineStyle(2, 0x8B008B, 0.8);
        ripple.strokeCircle(0, 0, this.fishConfig.size);
        ripple.x = this.graphics.x;
        ripple.y = this.graphics.y;
        ripple.setDepth(10);
        this.scene.tweens.add({
            targets: ripple, scaleX: 3, scaleY: 3, alpha: 0,
            duration: 500, onComplete: () => ripple.destroy()
        });
    }

    /**
     * Seahorse: flee when the player gets too close.
     * Uses a burst-of-speed evasion perpendicular to the threat vector.
     */
    updateEvasive(player, delta) {
        if (!this.fishConfig.evasive || !player || !this.graphics.active) return;

        const dx = player.x - this.graphics.x;
        const dy = player.y - this.graphics.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.evasionTriggerRange) {
            // Move directly away from the player at boosted speed
            this.isEvading = true;
            const len = dist || 1;
            const speed = this.baseSpeed * this.evasionSpeedMultiplier;
            this.graphics.body.setVelocity(
                -(dx / len) * speed,
                -(dy / len) * speed
            );
            this.graphics.setTint(0xFFD700);
        } else if (this.isEvading) {
            this.isEvading = false;
            this.graphics.setTint(0xFFFFFF);
        }
    }

    /**
     * Jellyfish: AOE sting every 4 s — damages ALL entities (player + enemies) within radius.
     */
    updateAoe(player) {
        if (!this.fishConfig.aoe || !this.graphics.active) return;
        const now = this.scene.time.now;
        if (now - this.lastAoeTime < this.aoeCooldown) return;

        const player2 = this.scene.player || player;
        if (!player2) return;

        // Check if player is in range first to gate the cooldown
        const distToPlayer = Phaser.Math.Distance.Between(
            this.graphics.x, this.graphics.y,
            player2.x, player2.y
        );
        if (distToPlayer > this.aoeRadius) return;

        this.lastAoeTime = now;
        // Visual pulse ring
        this._spawnAoePulse();

        // Get all entities in range and damage each one
        const enemies = this.scene.fishes.getChildren();
        const damage = this.aoeDamage;
        enemies.forEach(enemy => {
            if (enemy === this.graphics || !enemy.active) return;
            const dist = Phaser.Math.Distance.Between(
                this.graphics.x, this.graphics.y,
                enemy.x, enemy.y
            );
            if (dist <= this.aoeRadius && enemy.takeDamage) {
                enemy.takeDamage(damage);
            }
        });
    }

    /** Expanding ring visual for AOE attack */
    _spawnAoePulse() {
        if (!this.scene.add) return;
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, 0xADD8E6, 0.9);
        ring.strokeCircle(0, 0, 20);
        ring.x = this.graphics.x;
        ring.y = this.graphics.y;
        ring.setDepth(12);
        const targetScale = this.aoeRadius / 20;
        this.scene.tweens.add({
            targets: ring,
            scaleX: targetScale, scaleY: targetScale,
            alpha: 0, duration: 600,
            onComplete: () => ring.destroy()
        });
    }

    /**
     * Anglerfish: ranged lure attack.
     * Keeps distance; fires a slow-moving projectile toward the player.
     */
    updateRanged(player, delta) {
        if ((!this.fishConfig.range && this.fishConfig.behavior !== 'ranged') ||
            !player || !this.graphics.active) return;

        const dx = player.x - this.graphics.x;
        const dy = player.y - this.graphics.y;
        const dist = Math.hypot(dx, dy);

        // Maintain stand-off distance
        if (dist < this.standOffRange) {
            // Back away
            const len = dist || 1;
            const speed = this.baseSpeed;
            this.graphics.body.setVelocity(-(dx / len) * speed, -(dy / len) * speed);
        } else if (dist > this.rangedAttackRange) {
            // Too far — approach slowly
            const len = dist || 1;
            const speed = this.baseSpeed * 0.6;
            this.graphics.body.setVelocity((dx / len) * speed, (dy / len) * speed);
        } else {
            // In sweet-spot range — hover & shoot
            this.graphics.body.setVelocity(0, 0);
            const now = this.scene.time.now;
            if (now - this.lastRangedTime >= this.rangedCooldown) {
                this.lastRangedTime = now;
                this._fireProjectile(player);
            }
        }
    }

    /** Spawn a lure projectile aimed at the player */
    _fireProjectile(player) {
        if (!this.scene.add) return;
        const dx = player.x - this.graphics.x;
        const dy = player.y - this.graphics.y;
        const len = Math.hypot(dx, dy) || 1;
        const vx = (dx / len) * this.projectileSpeed;
        const vy = (dy / len) * this.projectileSpeed;

        // Ensure projectile group exists
        if (!this.scene.anglerProjectileGroup) {
            this.scene.anglerProjectileGroup = this.scene.physics.add.group();
        }

        // Visual projectile
        const proj = this.scene.add.graphics();
        proj.fillStyle(0x9400D3, 1);
        proj.fillCircle(0, 0, 7);
        proj.x = this.graphics.x;
        proj.y = this.graphics.y;
        proj.setDepth(15);

        // Enable physics on projectile
        this.scene.physics.world.enable(proj);
        proj.body.setVelocity(vx, vy);
        proj.body.setAllowGravity(false);

        // Add to physics group for collision detection
        this.scene.anglerProjectileGroup.add(proj);

        // Store enemy reference and damage for hit callback
        proj.enemyRef = this;
        proj.rangedDamage = this.rangedDamage;

        // Tween a slight glow/bob so it's clearly identifiable
        this.scene.tweens.add({
            targets: proj, scaleX: 1.3, scaleY: 1.3,
            yoyo: true, duration: 200, repeat: -1
        });

        // Auto-destroy after 2 seconds (Phaser stops tweens automatically on destroy)
        this.scene.time.delayedCall(2000, () => {
            if (proj.active) proj.destroy();
        });
    }

    /**
     * Update enemy AI
     * @param {object} player - Player graphics object
     * @param {number} time - Current time
     */
    update(player, time) {
        // Skip if graphics is destroyed
        if (!this.graphics || !this.graphics.active) {
            return;
        }

        const delta = this.scene.game.loop.delta;

        // Update health bar position
        this.healthBar.x = this.graphics.x;
        this.healthBar.y = this.graphics.y;

        // ── Special behaviors (run first so they can override velocity) ──────
        this.updateDash(player, delta);
        this.updateStealth(delta);
        this.updateEvasive(player, delta);
        this.updateAoe(player);
        this.updateRanged(player, delta);

        // Check for enrage (mutant shark) — runs for all fish types
        if (this.fishConfig.enrage) {
            this.updateEnrage();
        }

        // Check for chain lightning attack (periodic) — runs for all fish types
        if (this.fishConfig.chain_lightning) {
            this.chainLightningTimer = (this.chainLightningTimer || 0) + delta;
            if (this.chainLightningTimer >= 2000) { // Every 2 seconds
                this.chainLightningTimer = 0;
                this.executeChainLightning();
            }
        }

        // Animation is handled by Phaser (sprite.play calls in constructor)
        // No manual frame switching needed

        // Ranged / evasive fish manage their own movement — skip normal chase/wander AI
        if (this.fishConfig.behavior === 'ranged' || this.fishConfig.range) return;
        if (this.isEvading) return;

        // ── Hate / Aggro system ───────────────────────────────────────
        // If we have a hate target, always prioritize it over normal AI
        if (this.hateTarget && this.hateTarget.active) {
            const hateDistance = Phaser.Math.Distance.Between(
                this.graphics.x, this.graphics.y,
                this.hateTarget.x, this.hateTarget.y
            );

            // Check if hate expired (timeout or out of range)
            this.hateTimer = Math.min(this.hateTimer + delta, this.hateDuration); // Clamp to prevent overflow
            if (this.hateTimer >= this.hateDuration || hateDistance > this.hateRange) {
                logger.debug(`${this.fishType} lost hate on target`);
                this.lastHateTarget = this.hateTarget;  // Remember who we hated
                this.hateTarget = null;
                this.hateTimer = 0;
                this.state = Enemy.STATE.WANDERING; // Reset state when hate expires
            } else {
                // Chase and attack the hate target even beyond vision range
                const hateInAttackRange = hateDistance <= this.attackRange;

                if (hateInAttackRange) {
                    // Attack hate target
                    if (this.state !== Enemy.STATE.ATTACKING) {
                        logger.debug(`AI state change: ${this.fishType} ${this.state} -> ATTACKING (hate)`);
                        this.state = Enemy.STATE.ATTACKING;
                    }
                    const damage = this.attackPlayer(this.hateTarget);
                    if (damage > 0) {
                        this.scene.onEnemyAttack(this, damage);
                    }
                } else {
                    // Chase hate target at increased speed
                    if (this.state !== Enemy.STATE.CHASING) {
                        logger.debug(`AI state change: ${this.fishType} ${this.state} -> CHASING (hate)`);
                        this.state = Enemy.STATE.CHASING;
                    }
                    this.chasePlayer(this.hateTarget);
                }
                return; // Skip normal AI when have hate
            }
        }

        // ── Normal AI behavior ─────────────────────────────────────────
        // Only BOSS enemies can attack/chase player - normal enemies just wander
        const isBoss = this.fishConfig.boss === true;
        const playerInVision = this.isPlayerInVision(player);
        const playerInAttackRange = this.isPlayerInAttackRange(player);

        // Check if player is in grace period after losing hate (bosses only)
        const inGracePeriod = isBoss && this.lastHateTarget === player &&
                              this.hateTimer < this.hateGracePeriod;

        if (isBoss && playerInAttackRange && !inGracePeriod) {
            // Boss attacks player if in range
            const prevState = this.state;
            this.state = Enemy.STATE.ATTACKING;
            if (prevState !== this.state) {
                logger.debug(`AI state change: ${this.fishType} ${prevState} -> ${this.state}`);
            }
            const damage = this.attackPlayer(player);
            if (damage > 0) {
                this.scene.onEnemyAttack(this, damage);
            }
        } else if (isBoss && playerInVision && !inGracePeriod) {
            // Boss chases player if in vision
            const prevState = this.state;
            this.state = Enemy.STATE.CHASING;
            if (prevState !== this.state) {
                logger.debug(`AI state change: ${this.fishType} ${prevState} -> ${this.state}`);
            }
            this.chasePlayer(player);
        } else {
            // Wander
            const prevState = this.state;
            this.state = Enemy.STATE.WANDERING;
            if (prevState !== this.state) {
                logger.debug(`AI state change: ${this.fishType} ${prevState} -> ${this.state}`);
            }
            this.wanderTimer += delta;

            // Check for fishing transition (5% chance per second when player far)
            if (player) {
                const playerDistance = Phaser.Math.Distance.Between(
                    this.graphics.x, this.graphics.y,
                    player.x, player.y
                );
                if (playerDistance > this.fishingVisionRange) {
                    // 5% chance per second (roughly 0.083% per frame at 60fps)
                    const chanceThisFrame = this.fishingChancePerSecond * (delta / 1000);
                    if (Math.random() < chanceThisFrame) {
                        this.setState(Enemy.STATE.FISHING);
                        return;
                    }
                }
            }

            if (this.wanderTimer >= this.wanderInterval) {
                this.wanderTimer = 0;
                this.setRandomWanderDirection();
            }

            // Check if reached wander target
            const distToTarget = Phaser.Math.Distance.Between(
                this.graphics.x, this.graphics.y,
                this.targetX, this.targetY
            );
            if (distToTarget < 20) {
                this.setRandomWanderDirection();
            }
        }

        // Update shadow position (always follows fish)
        if (this.shadow) {
            this.shadow.x = this.graphics.x;
            this.shadow.y = this.graphics.y + (this.fishConfig.size * 0.3);
        }

        // Update marker position (debug marker for procedural fallback fish)
        if (this.graphics.label) {
            this.graphics.label.x = this.graphics.x;
            this.graphics.label.y = this.graphics.y - (this.fishConfig.size * 1.2);
        }

        // Breathing/floating animation - gentle up-down movement
        // Skip when evading: evasion uses velocity-based physics and must not be overridden
        // Use delta-based approach to smoothly add breathing without overriding physics Y movement
        if (!this.isEvading) {
            this._breathOffset += delta * 0.003;
            const breathY = Math.sin(this._breathOffset) * 3;

            // Compute physics movement this frame (how much body moved in Y)
            const physicsDeltaY = this.graphics.body.y - this.graphics.y;
            // Update visual base to follow physics
            this._breathBaseY += physicsDeltaY;
            // Apply breathing as visual offset from the updated base (no accumulation)
            this.graphics.y = this._breathBaseY + breathY * 0.1;
        }

        // Distance-based transparency (simulate water depth effect)
        if (player && this.graphics) {
            const dist = Phaser.Math.Distance.Between(
                this.graphics.x, this.graphics.y,
                player.x, player.y
            );
            // Further = more transparent (min 0.3, max 1.0)
            const maxDist = 600;
            const alpha = Math.max(0.3, Math.min(1.0, 1 - (dist / maxDist) * 0.5));
            this.graphics.setAlpha(alpha * 0.85); // Also apply base transparency
        }
    }
}

export default Enemy;
