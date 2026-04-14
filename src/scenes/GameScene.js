// GameScene - Core game scene with arrow key and mouse movement
import { Enemy } from '../entities/Enemy.js';
import { BossEnemy } from '../entities/BossEnemy.js';
import { TreasureBox } from '../entities/TreasureBox.js';
import { FishFactory } from '../entities/FishFactory.js';
import { SkillSystem } from '../systems/SkillSystem.js';
import { GrowthSystem } from '../systems/GrowthSystem.js';
import { DriftBottleSystem } from '../systems/DriftBottleSystem.js';
import { LuckSystem } from '../systems/LuckSystem.js';
import { BackgroundSystem } from '../systems/BackgroundSystem.js';
import { BossSystem } from '../systems/BossSystem.js';
import { BossAnimation } from '../systems/BossAnimation.js';
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
        this.hp = 50;
        this.maxHp = 50;
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
        // Boss system
        this.bossSystem = new BossSystem(this);
        this.bossDefeated = { squid: false, sharkKing: false, seaDragon: false };
    }

    init(data) {
        this.score = 0;
        this.exp = 0;
        this.level = 1;
        this.hp = 50;
        this.maxHp = 50;
        this.outOfCombatTimer = 0;
        this.uiDirty = false;
        this.outOfCombatThreshold = 3000; // 3 seconds
        this.healthRegenRate = 0.005; // 0.5% of max HP per second (slower regen)
        this.difficulty = data.difficulty || 'easy';
        this.spawnTimer = null;
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

        // Initialize BackgroundSystem and create full underwater background
        this.backgroundSystem = new BackgroundSystem(this, 1024, 768);
        this.backgroundSystem.createBackground(); // Creates gradient + light rays + particles + bubbles + corals + seaweed

        // Update UI with theme name
        this.scene.get('UIScene').updateTheme(this.backgroundSystem.themeConfig.name);

        // Create fish group
        this.fishes = this.physics.add.group();

        // Create player fish
        this.createPlayer();

        // Setup skill system with player reference
        this.skillSystem.setPlayer(this.player, this);

        // Create skill bar UI
        this.skillBar = new SkillBar(this, this.skillsData, this.skillSystem);
        this.skillBar.create();
        this.skillBar.setPlayerLevel(this.level);

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
        this.spawnTimer = this.time.addEvent({
            delay: 2000,
            callback: this.spawnFish,
            callbackScope: this,
            loop: true
        });

        logger.info(`Game started - Difficulty: ${this.difficulty}, Enemy count: ${initialSpawnCount}-${this.enemyCountMax}`);
    }

    createPlayer() {
        const playerConfig = this.fishData.clownfish;

        // Use FishFactory to draw the player as a clownfish with enhanced visuals
        this.player = FishFactory.createPlayerFish(this, 'clownfish', playerConfig.size, playerConfig.color);
        this.player.x = 512;
        this.player.y = 384;
        this.player.setDepth(100); // Player at top layer

        // Enable physics
        this.physics.world.enable(this.player);
        const hitRadius = playerConfig.size * 0.8;
        this.player.body.setCircle(hitRadius);
        this.player.body.setOffset(-hitRadius, -hitRadius);
        this.player.body.setBounce(0.3);
        this.player.body.setCollideWorldBounds(true);

        this.player.playerData = { ...playerConfig };
        this.player.isPlayer = true;

        // Set HP - base 50, increased by level
        this.maxHp = 50 + (this.level - 1) * 10;
        this.hp = this.maxHp;

        // Player health bar
        this.playerHealthBarWidth = playerConfig.size * 2;
        this.playerHealthBarHeight = 6;
        this.playerHealthBar = this.add.graphics();
        this.playerHealthBar.setDepth(20);
        this.updatePlayerHealthBar();
    }

    /**
     * Update player health bar display
     */
    updatePlayerHealthBar() {
        if (!this.player || !this.player.playerData) return;

        this.playerHealthBar.clear();

        const barOffsetY = -this.player.playerData.size - 15;

        // Subtle outer glow
        this.playerHealthBar.fillStyle(0xFFAA00, 0.2);
        this.playerHealthBar.fillRect(-this.playerHealthBarWidth / 2 - 0.5, barOffsetY - 0.5, this.playerHealthBarWidth + 1, this.playerHealthBarHeight + 1);

        // Background (dark)
        this.playerHealthBar.fillStyle(0x333333, 0.8);
        this.playerHealthBar.fillRect(-this.playerHealthBarWidth / 2, barOffsetY, this.playerHealthBarWidth, this.playerHealthBarHeight);

        // Health (green to red based on percentage)
        const hpPercent = Math.floor(this.hp) / Math.floor(this.maxHp);
        const hpColor = hpPercent > 0.5 ? 0x00ff00 : (hpPercent > 0.25 ? 0xffff00 : 0xff0000);
        this.playerHealthBar.fillStyle(hpColor, 1);
        this.playerHealthBar.fillRect(-this.playerHealthBarWidth / 2, barOffsetY, this.playerHealthBarWidth * hpPercent, this.playerHealthBarHeight);

        // Border (white for visibility)
        this.playerHealthBar.lineStyle(1, 0xFFFFFF, 0.4);
        this.playerHealthBar.strokeRect(-this.playerHealthBarWidth / 2, barOffsetY, this.playerHealthBarWidth, this.playerHealthBarHeight);
    }

    /**
     * Calculate enemy level based on distribution
     * 70% same level, 20% lower, 10% higher
     * @param {number} playerLevel - Current player level
     * @returns {number} Enemy level
     */
    calculateEnemyLevel(playerLevel) {
        const roll = Math.random();
        if (roll < 0.80) {
            return playerLevel;                    // 80% same level
        } else if (roll < 0.92) {
            return Math.max(1, playerLevel - 1);  // 12% lower level
        } else {
            return playerLevel + 1;               // 8% higher level
        }
    }

    spawnFish() {
        // Expanded fish types for more variety (excluding bosses and elite types)
        const fishTypes = ['clownfish', 'shrimp', 'shark', 'anglerfish', 'jellyfish', 'seahorse', 'octopus', 'eel'];
        const type = Phaser.Utils.Array.GetRandom(fishTypes);
        const baseFishConfig = this.fishData[type];

        // Calculate enemy level based on distribution
        const enemyLevel = this.calculateEnemyLevel(this.level);

        // Scale fish config based on enemy level
        const levelDiff = enemyLevel - this.level;
        const scaleFactor = 1 + (levelDiff * 0.15); // 15% scaling per level difference

        const fishConfig = {
            ...baseFishConfig,
            hp: Math.floor(baseFishConfig.hp * scaleFactor),
            size: Math.floor(baseFishConfig.size * scaleFactor),
            speed: Math.floor(baseFishConfig.speed * scaleFactor),
            exp: Math.floor(baseFishConfig.exp * scaleFactor)
        };

        // Spawn at edge
        let x, y;
        const side = Phaser.Math.Between(0, 3);
        switch (side) {
            case 0: x = 0; y = Phaser.Math.Between(0, 768); break;
            case 1: x = 1024; y = Phaser.Math.Between(0, 768); break;
            case 2: x = Phaser.Math.Between(0, 1024); y = 0; break;
            case 3: x = Phaser.Math.Between(0, 1024); y = 768; break;
        }

        // Create Enemy instance with AI level and scaled fish config
        const enemy = new Enemy(this, x, y, fishConfig, type, this.aiLevel);
        this.enemies.push(enemy);
        logger.debug(`Enemy spawned: type=${type}, x=${x}, y=${y}, aiLevel=${this.aiLevel}, enemyLevel=${enemyLevel}`);
    }

    /**
     * Check if boss should spawn based on player level
     */
    checkBossSpawn() {
        const level = this.growthSystem.getLevel();

        // Boss spawn thresholds from design
        if (level === 5 && !this.bossDefeated.squid) {
            this.spawnBoss('boss_squid', 400, 700);
        } else if (level === 10 && !this.bossDefeated.sharkKing) {
            this.spawnBoss('boss_shark_king', -100, 384);
        } else if (level === 15 && !this.bossDefeated.seaDragon) {
            this.spawnBoss('boss_sea_dragon', 400, 700);
        }
    }

    /**
     * Spawn a boss enemy
     */
    spawnBoss(type, x, y) {
        // Boss configs
        const bossConfigs = {
            'boss_squid': { baseHp: 100, hpPerLevel: 100, phases: 2, damage: 40, skills: ['tentacle_slap', 'ink_blind'] },
            'boss_shark_king': { baseHp: 150, hpPerLevel: 150, phases: 3, damage: 50, skills: ['dash', 'summon', 'stun'] },
            'boss_sea_dragon': { baseHp: 200, hpPerLevel: 200, phases: 3, damage: 60, skills: ['fire_breath', 'earthquake', 'summon'] }
        };

        const config = bossConfigs[type];
        if (!config) return;

        // Get player level for HP scaling
        const playerLevel = this.growthSystem.getLevel();

        // Create boss
        const boss = new BossEnemy(this, x, y, type, config, playerLevel);

        // Add boss to enemies array
        this.enemies.push(boss);

        // Trigger boss fight (1v1 mode)
        this.bossSystem.triggerBossFight(boss);

        // Play entrance animation
        const animType = type === 'boss_shark_king' ? 'charge_from_left' : 'rise_from_bottom';
        this.bossAnimation = new BossAnimation(this);
        this.bossAnimation.play(animType, boss);

        // Pause normal enemy spawning
        if (this.spawnTimer) {
            this.spawnTimer.paused = true;
        }
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
            this.uiDirty = true;

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
            // Check if fish is strong against player (player is attacker's prey)
            const fishStrength = this.fishData[fishType].strongAgainst;
            if (fishStrength && fishStrength.includes('clownfish')) {
                return; // Fish is strong against player, no damage
            }

            // Take damage (fish deals damage equal to fish size / 4)
            const damage = Math.floor(fishSize / 4);
            logger.debug(`Damage dealt to player: ${damage} (fishSize=${fishSize})`);
            this.outOfCombatTimer = 0; // Reset out-of-combat timer on damage
            this.hp -= damage;
            if (this.hp < 0) this.hp = 0;
            this.uiDirty = true;

            // Update player health bar
            this.updatePlayerHealthBar();

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
        } else if (this.cursors.right.isDown) {
            this.player.body.setVelocityX(currentSpeed);
        } else {
            this.player.body.setVelocityX(0);
        }

        if (this.cursors.up.isDown) {
            this.player.body.setVelocityY(-currentSpeed);
        } else if (this.cursors.down.isDown) {
            this.player.body.setVelocityY(currentSpeed);
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

        // Update UI only when values change (set uiDirty flag when modifying score/exp/level/hp/maxHp)
        if (this.uiDirty) {
            this.scene.get('UIScene').updateUI(this.score, this.exp, this.level, this.hp, this.maxHp, this.growthSystem.getExpForLevel(this.level + 1));
            this.uiDirty = false;
        }

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

        // Update background decorations (bubbles animation)
        if (this.backgroundSystem) {
            this.backgroundSystem.update(delta);
        }

        // Update boss health bar position
        if (this.bossSystem.isInBossFight()) {
            const boss = this.bossSystem.getCurrentBoss();
            if (boss && boss.graphics) {
                boss.healthBar.x = boss.graphics.x;
                boss.healthBar.y = boss.graphics.y - (boss.bossConfig?.size || 100) - 20;

                // Check if boss is defeated (HP <= 0)
                if (boss.hp <= 0) {
                    const bossTypeKey = boss.bossType.replace('boss_', '');
                    this.bossDefeated[bossTypeKey] = true;
                    this.bossSystem.endBossFight();

                    // Resume normal enemy spawning
                    if (this.spawnTimer) {
                        this.spawnTimer.paused = false;
                    }

                    // Clean up boss visuals
                    if (boss.healthBar) {
                        boss.healthBar.destroy();
                    }
                    if (boss.graphics) {
                        boss.graphics.destroy();
                    }

                    // Remove boss from enemies array
                    const bossIndex = this.enemies.indexOf(boss);
                    if (bossIndex !== -1) {
                        this.enemies.splice(bossIndex, 1);
                    }

                    logger.info(`Boss defeated: ${boss.bossType}`);
                }
            }
        }

        // Health regeneration when out of combat
        if (this.outOfCombatTimer >= this.outOfCombatThreshold && this.hp < this.maxHp) {
            const regenAmount = this.maxHp * this.healthRegenRate * (delta / 1000);
            this.hp = Math.min(this.hp + regenAmount, this.maxHp);
        } else if (this.outOfCombatTimer < this.outOfCombatThreshold) {
            this.outOfCombatTimer += delta;
        }
    }

    /**
     * Callback when enemy attacks player
     * @param {Enemy} enemy - The enemy that attacked
     * @param {number} damage - Damage dealt
     */
    onEnemyAttack(enemy, damage) {
        // Check if player has shield - shield absorbs damage first
        if (this.skillSystem && this.skillSystem.isPlayerShielded()) {
            const remainingDamage = this.skillSystem.damageShield(damage);
            if (remainingDamage <= 0) {
                // Shield absorbed all damage
                return;
            }
            damage = remainingDamage;
        }
        if (this.isInvincible) {
            return;
        }

        // Apply damage to player with difficulty multiplier
        const actualDamage = Math.floor(damage * this.enemyDamageMultiplier);
        this.outOfCombatTimer = 0; // Reset out-of-combat timer on damage
        this.hp -= actualDamage;
        logger.debug(`HP change: -${actualDamage}, currentHP=${this.hp}/${this.maxHp}`);
        if (this.hp < 0) this.hp = 0;
        this.uiDirty = true;

        // Update player health bar
        this.updatePlayerHealthBar();

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

        // Increase max HP per level (+20 HP per level)
        const hpPerLevel = 20;
        const oldMaxHp = this.maxHp;
        this.maxHp = Math.floor(this.maxHp) + hpPerLevel;
        // Full heal on level up
        this.hp = this.maxHp;
        this.uiDirty = true;
        logger.info(`Level up HP: ${oldMaxHp} -> ${this.maxHp}`);

        // Health bar width stays at 80, just update it

        // Recreate player fish graphics with new size
        this.player = FishFactory.createFish(this, 'clownfish', oldPlayerData.size, oldPlayerData.color);
        this.player.x = oldX;
        this.player.y = oldY;
        this.player.playerData = oldPlayerData;
        this.player.setDepth(100); // Ensure player stays at top layer

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

        // Update skill bar with new player level
        if (this.skillBar) {
            this.skillBar.setPlayerLevel(this.level);
        }

        // Trigger drift bottle effect
        if (this.driftBottleSystem) {
            const driftResult = this.driftBottleSystem.trigger();
            logger.info(`Level up - Drift bottle triggered: ${driftResult.message}`);
        }

        // Check for boss spawn
        this.checkBossSpawn();

        // Update background if theme changed
        const previousTheme = this.getThemeForLevel(this.level - 1);
        const currentTheme = this.getThemeForLevel(this.level);
        if (previousTheme !== currentTheme) {
            this.createBackground();
            // Also recreate background decorations
            if (this.backgroundSystem) {
                this.backgroundSystem.destroy();
            }
            this.backgroundSystem = new BackgroundSystem(this, 1024, 768);
            this.backgroundSystem.createBackground();
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
        // Get treasure box data directly from bubbleGraphics
        const treasureBoxData = treasureBoxGraphics.treasureBoxData;

        if (!treasureBoxData || treasureBoxData.isCollected) {
            return;
        }

        const reward = treasureBoxData.collect(player);
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

        // Mark UI dirty - update will be called in next update loop
        this.uiDirty = true;
    }
}

export default GameScene;
