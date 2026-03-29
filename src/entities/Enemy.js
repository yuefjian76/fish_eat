/**
 * Enemy - Fish enemy with AI behavior (wander, chase, attack)
 */
import { logger } from '../systems/DebugLogger.js';

export class Enemy {
    static STATE = {
        WANDERING: 'wandering',
        CHASING: 'chasing',
        ATTACKING: 'attacking'
    };

    constructor(scene, x, y, fishConfig, fishType, aiLevel = 1.0) {
        this.scene = scene;
        this.fishConfig = fishConfig;
        this.fishType = fishType;
        this.aiLevel = aiLevel;

        // Create graphics
        this.graphics = scene.add.graphics();
        this.graphics.fillStyle(Phaser.Display.Color.HexStringToColor(fishConfig.color).color, 1);
        this.graphics.fillCircle(0, 0, fishConfig.size);
        this.graphics.x = x;
        this.graphics.y = y;

        // Enable physics
        scene.physics.world.enable(this.graphics);
        this.graphics.body.setCircle(fishConfig.size);
        this.graphics.body.setOffset(-fishConfig.size, -fishConfig.size);
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

        // Health
        this.hp = fishConfig.hp;
        this.maxHp = fishConfig.hp;

        // Experience drop
        this.expValue = fishConfig.exp || 10;

        // Add to physics group
        scene.fishes.add(this.graphics);

        // Start wandering
        this.setRandomWanderDirection();
    }

    /**
     * Set random direction for wandering
     */
    setRandomWanderDirection() {
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
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.hp = 0;
            return true; // Enemy died
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
    }

    /**
     * Update enemy AI
     * @param {object} player - Player graphics object
     * @param {number} time - Current time
     */
    update(player, time) {
        // Check for player detection
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
