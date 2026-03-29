// GameScene - Core game scene with arrow key and mouse movement
import { Enemy } from '../entities/Enemy.js';
import { TreasureBox } from '../entities/TreasureBox.js';
import { FishFactory } from '../entities/FishFactory.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { GrowthSystem } from '../systems/GrowthSystem.js';
import { DriftBottleSystem } from '../systems/DriftBottleSystem.js';
import { LuckSystem } from '../systems/LuckSystem.js';
import { SkillBar } from '../ui/SkillBar.js';
import { logger } from '../systems/DebugLogger.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.player = null;
        this.fishes = null;
        this.fishData = null;
        this.skillsData = null;
        this.levelsData = null;
        this.difficultyData = null;
        this.score = 0;
        this.exp = 0;
        this.level = 1;
        this.cursors = null;
        this.speed = 200;
        this.hp = 100;
        this.maxHp = 100;
        this.shiftKey = null;
        this.enemies = [];
        this.skillSystem = null;
        this.growthSystem = null;
        this.driftBottleSystem = null;
        this.luckSystem = null;
        this.skillBar = null;
        this.skillKeys = null;
        this.driftBottleData = null;
        this.mapsData = null;
        this.backgroundGraphics = null;
        this.difficulty = 'easy';
        this.difficultyConfig = null;
        this.enemyCountMin = 3;
        this.enemyCountMax = 5;
        this.aiLevel = 0.8;
        this.dropsData = null;
        this.treasureBoxes = null;
        this.isInvincible = false;
        this.doubleRewardsActive = false;
    }

    init(data) {
        this.score = 0;
        this.exp = 0;
        this.level = 1;
        this.hp = 100;
        this.maxHp = 100;
        this.difficulty = data.difficulty || 'easy';
    }

    preload() {
        // Load fish data from JSON
        this.load.json('fishData', 'src/config/fish.json');
        // Load skills data from JSON
        this.load.json('skillsData', 'src/config/skills.json');
        // Load levels data from JSON
        this.load.json('levelsData', 'src/config/levels.json');
        // Load drift bottle data from JSON
        this.load.json('driftBottleData', 'src/config/driftBottle.json');
        // Load maps data from JSON
        this.load.json('mapsData', 'src/config/maps.json');
        // Load difficulty data from JSON
        this.load.json('difficultyData', 'src/config/difficulty.json');
        // Load drops data from JSON
        this.load.json('dropsData', 'src/config/drops.json');
    }

    create() {
        // Load fish configuration
        this.fishData = this.cache.json.get('fishData');

        // Load skills configuration
        this.skillsData = this.cache.json.get('skillsData');

        // Load levels configuration
        this.levelsData = this.cache.json.get('levelsData');

        // Load drift bottle configuration
        this.driftBottleData = this.cache.json.get('driftBottleData');

        // Load maps configuration
        this.mapsData = this.cache.json.get('mapsData');

        // Load difficulty configuration
        this.difficultyData = this.cache.json.get('difficultyData');
        this.difficultyConfig = this.difficultyData.difficulties[this.difficulty];
        this.enemyCountMin = this.difficultyConfig.enemyCount.min;
        this.enemyCountMax = this.difficultyConfig.enemyCount.max;
        this.aiLevel = this.difficultyConfig.aiLevel;
        this.enemyDamageMultiplier = this.difficultyConfig.enemyDamageMultiplier || 1.0;
        this.playerHpMultiplier = this.difficultyConfig.playerHpMultiplier || 1.0;

        // Load drops configuration
        this.dropsData = this.cache.json.get('dropsData');

        // Create treasure boxes group
        this.treasureBoxes = this.physics.add.group();

        // Initialize growth system
        this.growthSystem = new GrowthSystem(this.levelsData);

        // Initialize luck system
        this.luckSystem = new LuckSystem(0);

        // Initialize drift bottle system
        this.driftBottleSystem = new DriftBottleSystem(this.driftBottleData);
        this.driftBottleSystem.setScene(this);
        this.driftBottleSystem.setLuckSystem(this.luckSystem);

        // Initialize skill system
        this.skillSystem = new SkillSystem(this.skillsData);

        // Create gradient background based on current level
        this.createBackground();

        // Create fish group
        this.fishes = this.physics.add.group();

        // Create player fish
        this.createPlayer();

        // Setup skill system with player reference
        this.skillSystem.setPlayer(this.player, this);

        // Create skill bar UI
        this.skillBar = new SkillBar(this, this.skillsData, this.skillSystem);
        this.skillBar.create();

        // Setup arrow key controls
        this.cursors = this.input.keyboard.createCursorKeys();

        // Setup shift key for acceleration
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // Setup skill keys (Q/W/E/R)
        this.skillKeys = {
            Q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            R: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
        };

        // Setup skill key listeners
        this.setupSkillKeys();

        // Spawn initial fish based on difficulty
        const initialSpawnCount = Phaser.Math.Between(this.enemyCountMin, this.enemyCountMax);
        for (let i = 0; i < initialSpawnCount; i++) {
            this.spawnFish();
        }

        // Mouse control (alternative to arrow keys)
        this.input.on('pointermove', (pointer) => {
            const targetX = pointer.x;
            const targetY = pointer.y;
            const angle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y, targetX, targetY
            );
            this.player.rotation = angle;
            this.physics.moveTo(this.player, targetX, targetY, 200);
        });

        // Collision detection
        this.physics.add.overlap(
            this.player,
            this.fishes,
            this.checkEat,
            null,
            this
        );

        // Treasure box collision
        this.physics.add.overlap(
            this.player,
            this.treasureBoxes,
            this.collectTreasureBox,
            null,
            this
        );

        // Spawn timer
        this.time.addEvent({
            delay: 2000,
            callback: this.spawnFish,
            callbackScope: this,
            loop: true
        });

        logger.info(`Game started - Difficulty: ${this.difficulty}, Enemy count: ${initialSpawnCount}-${this.enemyCountMax}`);
    }

    createPlayer() {
        const playerConfig = this.fishData.clownfish;

        // Use FishFactory to draw the player as a clownfish
        this.player = FishFactory.createFish(this, 'clownfish', playerConfig.size, playerConfig.color);
        this.player.x = 512;
        this.player.y = 384;

        // Enable physics
        this.physics.world.enable(this.player);
        const hitRadius = playerConfig.size * 0.8;
        this.player.body.setCircle(hitRadius);
        this.player.body.setOffset(-hitRadius, -hitRadius);
        this.player.body.setBounce(0.3);
        this.player.body.setCollideWorldBounds(true);

        this.player.playerData = { ...playerConfig };
        this.player.isPlayer = true;

        // Set HP from config with difficulty multiplier
        this.maxHp = Math.floor(playerConfig.hp * this.playerHpMultiplier);
        this.hp = this.maxHp;

        // Player health bar
        this.playerHealthBarWidth = playerConfig.size * 2;
        this.playerHealthBarHeight = 6;
        this.playerHealthBar = this.add.graphics();
        this.updatePlayerHealthBar();
    }

    /**
     * Update player health bar display
     */
    updatePlayerHealthBar() {
        if (!this.player || !this.player.playerData) return;

        this.playerHealthBar.clear();

        const barOffsetY = -this.player.playerData.size - 15;

        // Background (dark)
        this.playerHealthBar.fillStyle(0x333333, 0.8);
        this.playerHealthBar.fillRect(-this.playerHealthBarWidth / 2, barOffsetY, this.playerHealthBarWidth, this.playerHealthBarHeight);

        // Health (green to red based on percentage)
        const hpPercent = this.hp / this.maxHp;
        const hpColor = hpPercent > 0.5 ? 0x00ff00 : (hpPercent > 0.25 ? 0xffff00 : 0xff0000);
        this.playerHealthBar.fillStyle(hpColor, 1);
        this.playerHealthBar.fillRect(-this.playerHealthBarWidth / 2, barOffsetY, this.playerHealthBarWidth * hpPercent, this.playerHealthBarHeight);

        // Border
        this.playerHealthBar.lineStyle(1, 0x000000, 0.5);
        this.playerHealthBar.strokeRect(-this.playerHealthBarWidth / 2, barOffsetY, this.playerHealthBarWidth, this.playerHealthBarHeight);
    }

    spawnFish() {
        const fishTypes = ['clownfish', 'shrimp', 'shark'];
        const type = Phaser.Utils.Array.GetRandom(fishTypes);
        const fishConfig = this.fishData[type];

        // Spawn at edge
        let x, y;
        const side = Phaser.Math.Between(0, 3);
        switch (side) {
            case 0: x = 0; y = Phaser.Math.Between(0, 768); break;
            case 1: x = 1024; y = Phaser.Math.Between(0, 768); break;
            case 2: x = Phaser.Math.Between(0, 1024); y = 0; break;
            case 3: x = Phaser.Math.Between(0, 1024); y = 768; break;
        }

        // Create Enemy instance with AI level
        const enemy = new Enemy(this, x, y, fishConfig, type, this.aiLevel);
        this.enemies.push(enemy);
        logger.debug(`Enemy spawned: type=${type}, x=${x}, y=${y}, aiLevel=${this.aiLevel}`);
    }

    checkEat(player, fish) {
        if (fish.getData('eaten')) return;

        const playerSize = this.player.playerData.size;
        const fishSize = fish.fishData.size;
        const fishType = fish.fishType;

        // Can eat smaller fish (player > enemy * 1.2)
        if (playerSize > fishSize * 1.2) {
            // Check strong against / weak to
            const playerType = 'clownfish'; // Player is always clownfish for now

            const fishWeakness = this.fishData[fishType].weakTo;
            const fishStrength = this.fishData[fishType].strongAgainst;

            logger.debug(`Eat check: playerSize=${playerSize}, fishSize=${fishSize}, fishType=${fishType}`);

            // Can eat if not strong against player
            if (fishStrength && fishStrength.includes(playerType)) {
                logger.debug(`Eat check result: cannot eat ${fishType} (strong against player)`);
                return; // Cannot eat
            }

            logger.debug(`Eat check result: can eat ${fishType}`);
            fish.setData('eaten', true);

            // Add experience using GrowthSystem
            const expGain = fish.fishData.exp;
            const expResult = this.growthSystem.addExperience(expGain, this.time.now, this.luckSystem);
            this.exp = this.growthSystem.getExp();
            this.level = this.growthSystem.getLevel();
            this.score += expResult.expGained * 10;

            // Remove fish from enemies array if it's an enemy
            const enemyIndex = this.enemies.findIndex(e => e.graphics === fish);
            if (enemyIndex !== -1) {
                logger.debug(`Enemy death: type=${fishType}, x=${fish.x}, y=${fish.y}`);
                const enemy = this.enemies[enemyIndex];
                // Destroy health bar first
                if (enemy && enemy.healthBar) {
                    enemy.healthBar.destroy();
                }
                this.enemies.splice(enemyIndex, 1);
            }

            // Spawn treasure box with drop chance
            this.spawnTreasureBox(fish.x, fish.y);

            // Remove fish
            fish.destroy();

            // Level up check
            if (expResult.leveledUp) {
                this.onLevelUp();
            }

            // Update UI
            this.scene.get('UIScene').updateUI(this.score, this.exp, this.level, this.hp, this.maxHp, this.growthSystem.getExpForLevel(this.level + 1));
        }
        // Take damage from larger fish (fish > player * 1.2)
        else if (fishSize > playerSize * 1.2) {
            // Check if fish is weak to player (player strong against fish)
            const fishWeakness = this.fishData[fishType].weakTo;
            if (fishWeakness && fishWeakness.includes('clownfish')) {
                return; // Player is strong against this fish, no damage
            }

            // Take damage (fish deals damage equal to fish size / 4)
            const damage = Math.floor(fishSize / 4);
            logger.debug(`Damage dealt to player: ${damage} (fishSize=${fishSize})`);
            this.hp -= damage;
            if (this.hp < 0) this.hp = 0;

            // Update player health bar
            this.updatePlayerHealthBar();

            // Update UI
            this.scene.get('UIScene').updateUI(this.score, this.exp, this.level, this.hp, this.maxHp, this.growthSystem.getExpForLevel(this.level + 1));

            // Check game over
            if (this.hp <= 0) {
                this.scene.start('GameOverScene', { score: this.score, level: this.level, difficulty: this.difficulty });
            }
        }
    }

    update(time, delta) {
        // Current speed (base + acceleration if shift pressed, or speed_up buff)
        let currentSpeed = this.shiftKey.isDown ? this.speed * 1.8 : this.speed;
        if (this.skillSystem && this.skillSystem.isActive('speed_up')) {
            currentSpeed = this.speed * 1.8;
        }

        // Arrow key movement
        if (this.cursors.left.isDown) {
            this.player.body.setVelocityX(-currentSpeed);
            logger.debug(`Player movement: left, speed=${currentSpeed}`);
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(currentSpeed);
            logger.debug(`Player movement: right, speed=${currentSpeed}`);
        } else {
            this.player.body.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-currentSpeed);
            logger.debug(`Player movement: up, speed=${currentSpeed}`);
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(currentSpeed);
            logger.debug(`Player movement: down, speed=${currentSpeed}`);
        } else {
            this.player.body.setVelocityY(0);
        }

        // Update player rotation based on movement direction
        if (this.player.body.velocity.x !== 0 || this.player.body.velocity.y !== 0) {
            this.player.rotation = Math.atan2(this.player.body.velocity.y, this.player.body.velocity.x);
        }

        // Keep player in bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 20, 1004);
        this.player.y = Phaser.Math.Clamp(this.player.y, 20, 748);

        // Update player health bar position
        this.playerHealthBar.x = this.player.x;
        this.playerHealthBar.y = this.player.y;

        // Remove fish that are too far off screen
        this.fishes.getChildren().forEach(fish => {
            if (fish.x < -100 || fish.x > 1124 || fish.y < -100 || fish.y > 868) {
                fish.destroy();
            }
        });

        // Update UI with current HP
        this.scene.get('UIScene').updateUI(this.score, this.exp, this.level, this.hp, this.maxHp, this.growthSystem.getExpForLevel(this.level + 1));

        // Update all enemies
        this.enemies.forEach(enemy => {
            enemy.update(this.player, this.time.now);
        });

        // Remove dead enemies from the array
        this.enemies = this.enemies.filter(enemy => enemy.graphics.active);

        // Update skill system (cooldowns)
        if (this.skillSystem) {
            this.skillSystem.update(delta);
        }

        // Update skill bar UI
        if (this.skillBar) {
            this.skillBar.update();
        }
    }

    /**
     * Callback when enemy attacks player
     * @param {Enemy} enemy - The enemy that attacked
     * @param {number} damage - Damage dealt
     */
    onEnemyAttack(enemy, damage) {
        // Check if player has shield
        if (this.skillSystem && this.skillSystem.isPlayerShielded()) {
            // Shield blocks damage
            return;
        }
        if (this.isInvincible) {
            return;
        }

        // Apply damage to player with difficulty multiplier
        const actualDamage = Math.floor(damage * this.enemyDamageMultiplier);
        this.hp -= actualDamage;
        logger.debug(`HP change: -${actualDamage}, currentHP=${this.hp}/${this.maxHp}`);
        if (this.hp < 0) this.hp = 0;

        // Update player health bar
        this.updatePlayerHealthBar();

        // Update UI
        this.scene.get('UIScene').updateUI(this.score, this.exp, this.level, this.hp, this.maxHp, this.growthSystem.getExpForLevel(this.level + 1));

        // Check game over
        if (this.hp <= 0) {
            this.scene.start('GameOverScene', { score: this.score, level: this.level, difficulty: this.difficulty });
        }
    }

    /**
     * Setup skill key listeners
     */
    setupSkillKeys() {
        // Q key - Bite (damage)
        this.skillKeys.Q.on('down', () => {
            const result = this.skillSystem.useSkill('Q');
            if (result) {
                this.skillBar.showFeedback('bite', result.success);
                if (result.success) {
                    // Show damage indicator
                    if (result.target) {
                        this.showDamageIndicator(result.target.graphics, result.damage);
                    }
                }
            }
        });

        // W key - Shield (defense)
        this.skillKeys.W.on('down', () => {
            const result = this.skillSystem.useSkill('W');
            if (result) {
                this.skillBar.showFeedback('shield', result.success);
            }
        });

        // E key - Speed Up (buff)
        this.skillKeys.E.on('down', () => {
            const result = this.skillSystem.useSkill('E');
            if (result) {
                this.skillBar.showFeedback('speed_up', result.success);
            }
        });

        // R key - Heal
        this.skillKeys.R.on('down', () => {
            const result = this.skillSystem.useSkill('R');
            if (result) {
                this.skillBar.showFeedback('heal', result.success);
            }
        });
    }

    /**
     * Handle level up event
     */
    onLevelUp() {
        // Store old player data
        const oldPlayer = this.player;
        const oldX = oldPlayer.x;
        const oldY = oldPlayer.y;
        const oldPlayerData = { ...oldPlayer.playerData };
        oldPlayerData.size += 2;

        // Increase max HP per level (+10 HP per level)
        const hpPerLevel = 10;
        const oldMaxHp = this.maxHp;
        this.maxHp = Math.floor(this.maxHp) + hpPerLevel;
        // Also heal by the same amount (add to current HP)
        this.hp = this.hp + hpPerLevel;
        logger.info(`Level up HP: ${oldMaxHp} -> ${this.maxHp}`);

        // Update health bar width based on new size
        this.playerHealthBarWidth = oldPlayerData.size * 2;

        // Recreate player fish graphics with new size
        this.player = FishFactory.createFish(this, 'clownfish', oldPlayerData.size, oldPlayerData.color);
        this.player.x = oldX;
        this.player.y = oldY;
        this.player.playerData = oldPlayerData;

        // Enable physics for new graphics
        this.physics.world.enable(this.player);
        const hitRadius = oldPlayerData.size * 0.8;
        this.player.body.setCircle(hitRadius);
        this.player.body.setOffset(-hitRadius, -hitRadius);
        this.player.body.setBounce(0.3);
        this.player.body.setCollideWorldBounds(true);
        this.player.isPlayer = true;

        // Update skill system to use new player reference
        if (this.skillSystem) {
            this.skillSystem.setPlayer(this.player, this);
        }

        // Update player health bar position and display
        this.updatePlayerHealthBar();

        // Destroy old graphics
        oldPlayer.destroy();

        // Check for newly unlocked skills
        const newlyUnlocked = this.growthSystem.getNewlyUnlockedSkills(this.level - 1);
        if (newlyUnlocked.length > 0) {
            logger.info(`Level ${this.level} reached! Unlocked: ${newlyUnlocked.join(', ')}`);
            // Notify UI of skill unlock
            this.scene.get('UIScene').showSkillUnlock(newlyUnlocked);
        }

        // Trigger drift bottle effect
        if (this.driftBottleSystem) {
            const driftResult = this.driftBottleSystem.trigger();
            logger.info(`Level up - Drift bottle triggered: ${driftResult.message}`);
        }

        // Update background if theme changed
        const previousTheme = this.getThemeForLevel(this.level - 1);
        const currentTheme = this.getThemeForLevel(this.level);
        if (previousTheme !== currentTheme) {
            this.createBackground();
        }
    }

    /**
     * Show damage indicator on target
     * @param {object} target - Target graphics object
     * @param {number} damage - Damage dealt
     */
    showDamageIndicator(target, damage) {
        const text = this.add.text(target.x, target.y - 20, `-${damage}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 2
        });
        text.setOrigin(0.5);
        text.setDepth(100);

        this.tweens.add({
            targets: text,
            alpha: 0,
            y: target.y - 50,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Get theme key for a given level
     * @param {number} level - Player level
     * @returns {string} Theme key
     */
    getThemeForLevel(level) {
        // Handle level 10+ cycling
        if (level >= 10) {
            const cyclePosition = ((level - 1) % 9) + 1; // Maps 10->1, 11->2, ..., 18->9, 19->1
            return this.mapsData.levelMapping[cyclePosition.toString()];
        }
        return this.mapsData.levelMapping[level.toString()];
    }

    /**
     * Create gradient background based on current level theme
     */
    createBackground() {
        const themeKey = this.getThemeForLevel(this.level);
        const theme = this.mapsData.themes[themeKey];
        const colors = theme.colors;

        // Remove existing background if present
        if (this.backgroundGraphics) {
            this.backgroundGraphics.destroy();
        }

        // Create graphics object for gradient
        this.backgroundGraphics = this.add.graphics();

        const gameHeight = 768;
        const segmentHeight = gameHeight / (colors.length - 1);

        // Draw gradient using horizontal rectangles
        for (let i = 0; i < colors.length - 1; i++) {
            const topColor = colors[i];
            const bottomColor = colors[i + 1];

            // Draw multiple thin rectangles for smooth gradient
            const gradientSteps = 20;
            const stepHeight = segmentHeight / gradientSteps;

            for (let j = 0; j < gradientSteps; j++) {
                const ratio = j / gradientSteps;
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.ValueToColor(topColor),
                    Phaser.Display.Color.ValueToColor(bottomColor),
                    100,
                    ratio * 100
                );
                const finalColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);

                this.backgroundGraphics.fillStyle(finalColor, 1);
                this.backgroundGraphics.fillRect(0, i * segmentHeight + j * stepHeight, 1024, stepHeight + 1);
            }
        }
    }

    /**
     * Spawn a treasure box at the given position based on drop chance
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    spawnTreasureBox(x, y) {
        if (!this.dropsData) return;

        // Roll for drop chance
        if (Math.random() > this.dropsData.dropChance) return;

        // Select reward type based on weights
        const rewards = this.dropsData.rewards;
        const totalWeight = rewards.coin.weight + rewards.potion.weight + rewards.skillFragment.weight;
        const roll = Math.random() * totalWeight;

        let rewardType;
        let rewardAmount;

        if (roll < rewards.coin.weight) {
            rewardType = TreasureBox.TYPE.COIN;
            rewardAmount = Phaser.Math.Between(rewards.coin.minAmount, rewards.coin.maxAmount);
        } else if (roll < rewards.coin.weight + rewards.potion.weight) {
            rewardType = TreasureBox.TYPE.POTION;
            rewardAmount = rewards.potion.healAmount;
        } else {
            rewardType = TreasureBox.TYPE.SKILL_FRAGMENT;
            rewardAmount = rewards.skillFragment.amount;
        }

        // Create treasure box
        const treasureBox = new TreasureBox(this, x, y, rewardType, rewardAmount);
        logger.info(`Treasure box spawned: type=${rewardType}, amount=${rewardAmount}, x=${x}, y=${y}`);

        // Auto despawn after 10 seconds
        this.time.delayedCall(this.dropsData.autoDespawnTime || 10000, () => {
            if (treasureBox && !treasureBox.treasureBoxData?.isCollected) {
                treasureBox.destroy();
            }
        });
    }

    /**
     * Collect a treasure box when player overlaps with it
     * @param {object} player - Player object
     * @param {object} treasureBoxGraphics - Treasure box graphics object
     */
    collectTreasureBox(player, treasureBoxGraphics) {
        // Find the treasure box instance
        const treasureBox = this.treasureBoxes.getChildren().find(
            tb => tb === treasureBoxGraphics
        );

        if (!treasureBox || !treasureBox.treasureBoxData || treasureBox.treasureBoxData.isCollected) {
            return;
        }

        const reward = treasureBox.treasureBoxData.collect(player);
        if (!reward) return;

        // Apply reward
        switch (reward.type) {
            case TreasureBox.TYPE.COIN:
                this.score += reward.amount;
                logger.info(`Treasure collected: COIN, amount=${reward.amount}`);
                break;
            case TreasureBox.TYPE.POTION:
                this.hp += reward.amount;
                if (this.hp > this.maxHp) this.hp = this.maxHp;
                this.updatePlayerHealthBar();
                logger.info(`Treasure collected: POTION, amount=${reward.amount}`);
                break;
            case TreasureBox.TYPE.SKILL_FRAGMENT:
                // Skill fragment adds to score (for now)
                this.score += reward.amount * 100;
                logger.info(`Skill fragment collected! +${reward.amount * 100} score`);
                break;
            case TreasureBox.TYPE.EXP:
                const expForNextLevel = this.growthSystem.getExpForLevel(this.level + 1);
                const expGain = Math.floor(expForNextLevel * 0.1);
                const expResult = this.growthSystem.addExperience(expGain, this.time.now, this.luckSystem);
                this.exp = this.growthSystem.getExp();
                this.level = this.growthSystem.getLevel();
                if (this.doubleRewardsActive) {
                    this.score += expResult.expGained * 20;
                } else {
                    this.score += expResult.expGained * 10;
                }
                logger.info(`Treasure collected: EXP, amount=${expGain}`);
                break;
            case TreasureBox.TYPE.COOLDOWN_REDUCTION:
                if (this.skillSystem) {
                    this.skillSystem.reduceAllCooldowns(3);
                }
                logger.info('Treasure collected: COOLDOWN REDUCTION -3s');
                break;
            case TreasureBox.TYPE.INVINCIBILITY:
                this.isInvincible = true;
                this.time.delayedCall(3000, () => {
                    this.isInvincible = false;
                    logger.info('Invincibility ended');
                });
                logger.info('Treasure collected: INVINCIBILITY 3s');
                break;
            case TreasureBox.TYPE.TELEPORT:
                this.player.x = Phaser.Math.Between(100, 900);
                this.player.y = Phaser.Math.Between(100, 600);
                logger.info('Treasure collected: TELEPORT');
                break;
            case TreasureBox.TYPE.DOUBLE_REWARDS:
                this.doubleRewardsActive = true;
                this.time.delayedCall(15000, () => {
                    this.doubleRewardsActive = false;
                    logger.info('Double rewards ended');
                });
                logger.info('Treasure collected: DOUBLE REWARDS 15s');
                break;
        }

        // Update UI
        this.scene.get('UIScene').updateUI(this.score, this.exp, this.level, this.hp, this.maxHp, this.growthSystem.getExpForLevel(this.level + 1));
    }
}

export default GameScene;
