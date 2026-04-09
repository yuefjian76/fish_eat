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
        const isBigFish = fishType === 'shark' || fishConfig.size > 40;
        this.enemyType = isBigFish ? 'fish_big' : 'fish';
        const frame = Math.floor(Math.random() * (isBigFish ? 5 : 4));
        this.graphics = FishFactory.createEnemyFromSprite(scene, this.enemyType, fishConfig.size / 30, frame);
        this.graphics.x = x;
        this.graphics.y = y;

        // Animation frame update timer
        this.frameTimer = 0;
        this.frameInterval = 200; // ms between frames

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
        this.attackCooldown = Math.floor(1500 / aiLevel); // Higher AI = faster attacks
        this.lastAttackTime = 0;
        this.wanderTimer = 0;
        this.wanderInterval = Math.floor(2000 / aiLevel); // Higher AI = more active

        // Movement - adjusted by aiLevel
        this.baseSpeed = fishConfig.speed;
        this.chaseSpeedMultiplier = 1.5 * aiLevel;
        this.speedMultiplier = 1.0; // For enrage mechanic

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

        // Fishing state
        this.fishingTarget = null;
        this.fishingChancePerSecond = 0.05; // 5% per second
        this.fishingVisionRange = 300;

        // Add to physics group
        scene.fishes.add(this.graphics);

        // Start wandering
        this.setRandomWanderDirection();
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
     * Check if player is within vision range
     * @param {object} player - Player graphics object
     * @returns {boolean} True if player is in vision range
     */
    isPlayerInVision(player) {
        if (!player) return false;
        const distance = Phaser.Math.Distance.Between(
            this.graphics.x, this.graphics.y,
            player.x, player.y
        );
        return distance <= this.visionRange;
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

        // Deal damage based on fish size
        const damage = Math.floor(this.fishConfig.size / 4);
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
     * Destroy this enemy
     */
    destroy() {
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

                // Base damage from size
                let damage = Math.floor(this.fishConfig.size / 4);

                // Size bonus: bigger fish vs smaller fish
                const targetSize = target.fishData ? target.fishData.size : 20;
                const sizeDiff = this.fishConfig.size - targetSize;
                if (sizeDiff > 10) {
                    // Significantly larger - extra damage
                    damage = Math.floor(damage * 1.15);
                } else if (sizeDiff > 5) {
                    damage = Math.floor(damage * 1.08);
                }

                if (target.fishData && target.takeDamage) {
                    const killed = target.takeDamage(damage);
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

        // Update health bar position
        this.healthBar.x = this.graphics.x;
        this.healthBar.y = this.graphics.y;

        // Check for enrage (mutant shark)
        if (this.fishConfig.enrage) {
            this.updateEnrage();
        }

        // Update animation frame
        this.frameTimer += this.scene.game.loop.delta;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            const totalFrames = this.enemyType === 'fish_big' ? 5 : 4;
            this.graphics.currentFrame = (this.graphics.currentFrame + 1) % totalFrames;
            const newKey = `${this.graphics.baseKey}_${this.graphics.currentFrame}`;
            // Only update texture if it exists
            if (this.scene.textures.exists(newKey)) {
                this.graphics.setTexture(newKey);
            }
        }

        // ALWAYS prioritize attacking player if in range
        const playerInVision = this.isPlayerInVision(player);
        const playerInAttackRange = this.isPlayerInAttackRange(player);

        if (playerInAttackRange) {
            // Attack if in range
            const prevState = this.state;
            this.state = Enemy.STATE.ATTACKING;
            if (prevState !== this.state) {
                logger.debug(`AI state change: ${this.fishType} ${prevState} -> ${this.state}`);
            }
            const damage = this.attackPlayer(player);
            if (damage > 0) {
                this.scene.onEnemyAttack(this, damage);
            }
        } else if (playerInVision) {
            // Chase player
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
            this.wanderTimer += this.scene.game.loop.delta;

            // Check for fishing transition (5% chance per second when player far)
            if (player) {
                const playerDistance = Phaser.Math.Distance.Between(
                    this.graphics.x, this.graphics.y,
                    player.x, player.y
                );
                if (playerDistance > this.fishingVisionRange) {
                    // 5% chance per second (roughly 0.083% per frame at 60fps)
                    const chanceThisFrame = this.fishingChancePerSecond * (this.scene.game.loop.delta / 1000);
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
    }
}

export default Enemy;
