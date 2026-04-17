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
import { ComboSystem } from '../systems/ComboSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { AchievementSystem } from '../systems/AchievementSystem.js';
import { DailyChallengeSystem } from '../systems/DailyChallengeSystem.js';
import { logger } from '../systems/DebugLogger.js';

/** @param {'player_damage'|'enemy_damage'|'heal'|'exp'|string} type */
function getFloatingTextColor(type) {
    switch (type) {
        case 'player_damage': return 0xff3333;
        case 'enemy_damage': return 0x00ff44;
        case 'critical': return 0xffd700;
        case 'heal': return 0x44aaff;
        case 'exp': return 0x00ff44;
        default: return 0xffffff;
    }
}

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
        this.fishType = data.fishType || 'clownfish';
        this.spawnTimer = null;
        // Stats tracking
        this.killCount = 0;
        this.gameStartTime = Date.now();
        // Anglerfish projectile tracking
        this.anglerProjectiles = [];

        // Apply permanent upgrades
        this._applyUpgrades();
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

        // Daily challenge
        if (data.dailyChallenge) {
            try {
                const challengeData = JSON.parse(localStorage.getItem('fishEat_dailyChallenge') || '{}');
                this.dailyChallenge = challengeData;

                // Apply to stats
                if (challengeData.id === 'speed_freak') this.speed *= 1.5;
                if (challengeData.id === 'turtle') this.speed *= 0.6;
                if (challengeData.modifier?.id === 'half_hp') { this.maxHp *= 0.5; this.hp = this.maxHp; }
                if (challengeData.modifier?.id === 'double_hp') { this.maxHp *= 2; this.hp = this.maxHp; }

                // Apply to enemy spawning (pass to spawnFish)
                this._challengeEnemySizeMultiplier = (challengeData.id === 'giant_mode') ? 1.5 :
                                                     (challengeData.id === 'tiny_mode') ? 0.7 : 1.0;
                this._challengeEnemySpeedMultiplier = (challengeData.id === 'ninja') ? 1.8 : 1.0;
            } catch (e) { /* ignore */ }
        }

        // Load drops configuration
        this.dropsData = this.cache.json.get('dropsData');

        // Create treasure boxes group
        this.treasureBoxes = this.physics.add.group();

        // Initialize audio system (Web Audio, no files needed)
        this.audioSystem = new AudioSystem();

        // Initialize achievement system
        this.achievementSystem = new AchievementSystem(this);

        // Initialize combo system
        this.comboSystem = new ComboSystem(this.levelsData.combo || {});
        this.comboSystem.setOnComboChange((count) => {
            this.scene.get('UIScene').updateCombo(count);
            this.achievementSystem.checkCombo(count);
        });

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

        // Start background music (map theme name: undersea→deep, polar→arctic)
        const bgmTheme = this.backgroundSystem.theme === 'polar' ? 'arctic' : this.backgroundSystem.theme;
        if (this.audioSystem) this.audioSystem.startBGM(bgmTheme, this.difficulty);

        // Create fish group
        this.fishes = this.physics.add.group();

        // Create player fish
        this.createPlayer();

        // 3-second spawn invincibility
        this._spawnInvincible = true;
        this._spawnInvincibleTimer = 3000; // 3 seconds
        this._spawnFlashTimer = 0;
        this._spawnFlashInterval = 100; // flash every 100ms

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

        // Setup ESC key for pause
        this.isPaused = false;
        this.input.keyboard.on('keydown-ESC', () => {
            this._togglePause();
        });

        // Spawn initial fish based on difficulty
        const initialSpawnCount = Phaser.Math.Between(this.enemyCountMin, this.enemyCountMax);
        for (let i = 0; i < initialSpawnCount; i++) {
            this.spawnFish();
        }

        // Mouse control (alternative to arrow keys)
        // Store mouse target for smooth chasing in update()
        this.mouseTarget = null;
        this.isMouseActive = false;
        this.input.on('pointermove', (pointer) => {
            this.mouseTarget = { x: pointer.x, y: pointer.y };
            this.isMouseActive = true;
        });
        // Disable mouse control when clicking (avoid accidental mouse drift)
        this.input.on('pointerdown', (pointer) => {
            this.mouseTarget = { x: pointer.x, y: pointer.y };
            this.isMouseActive = true;
        });

        // Collision detection — stored so we can re-register after level-up
        this._eatOverlap = this.physics.add.overlap(
            this.player,
            this.fishes,
            this.checkEat,
            null,
            this
        );

        // Treasure box collision
        this._boxOverlap = this.physics.add.overlap(
            this.player,
            this.treasureBoxes,
            this.collectTreasureBox,
            null,
            this
        );

        // Wave spawn system
        this._waveState = 'calm'; // 'calm' | 'surge' | 'peak'
        this._waveTimer = 0;
        this._baseSpawnInterval = 2000; // Normal spawn interval in calm
        this._surgeSpawnInterval = 400; // Fast spawn interval during surge
        this._currentSpawnInterval = this._baseSpawnInterval;
        this._spawnTimer = 0;

        // Wave indicator graphics
        this._waveGraphics = this.add.graphics();

        logger.info(`Game started - Difficulty: ${this.difficulty}, Enemy count: ${initialSpawnCount}-${this.enemyCountMax}`);
    }

    createPlayer() {
        const playerConfig = this.fishData[this.fishType] || this.fishData.clownfish;

        // Use FishFactory to draw the player fish with enhanced visuals
        this.player = FishFactory.createPlayerFish(this, this.fishType, playerConfig.size, playerConfig.color);
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

        this.player.playerData = { ...playerConfig, fishType: this.fishType };
        this.player.isPlayer = true;

        // Set HP - based on fish type, increased by level
        this.maxHp = playerConfig.hp + (this.level - 1) * 10;
        this.hp = this.maxHp;

        // Set base speed based on fish type
        this.speed = playerConfig.speed;

        // Player health bar
        this.playerHealthBarWidth = playerConfig.size * 2;
        this.playerHealthBarHeight = 6;
        this.playerHealthBar = this.add.graphics();
        this.playerHealthBar.setDepth(20);
        this.updatePlayerHealthBar();

        // Glow layer for size-hint circles (green=edible, red=danger)
        this._glowLayer = this.add.graphics();
        this._glowLayer.setDepth(9);
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
     * Calculate enemy level based on distribution and player progress.
     * Higher player levels → more high-level enemies appear.
     * Survival time also increases difficulty.
     * @param {number} playerLevel - Current player level
     * @returns {number} Enemy level
     */
    calculateEnemyLevel(playerLevel) {
        // Progressive difficulty: higher levels get harder enemy distribution
        const survivalMinutes = Math.floor((Date.now() - this.gameStartTime) / 60000);
        const bonusRoll = Math.min(survivalMinutes * 0.05, 0.2); // Up to +20% harder

        const roll = Math.random() - bonusRoll;
        if (roll < 0.70) {
            return playerLevel;                     // 70% same level
        } else if (roll < 0.88) {
            return Math.max(1, playerLevel - 1);   // 18% lower level
        } else {
            return playerLevel + 1;                // 12% higher level
        }
    }

    /**
     * Get progressive difficulty multiplier based on player level and survival time.
     * Affects enemy stats and spawn rates.
     * @returns {number} Difficulty multiplier (1.0 = normal)
     */
    _getDifficultyMultiplier() {
        const levelBonus = Math.max(0, this.level - 5) * 0.05; // +5% per level above 5
        const survivalBonus = Math.min((Date.now() - this.gameStartTime) / 120000, 0.3); // max +30% at 2 min
        return 1.0 + levelBonus + survivalBonus;
    }

    /**
     * Apply permanent upgrades from shop (loaded from localStorage).
     */
    _applyUpgrades() {
        try {
            const levels = JSON.parse(localStorage.getItem('fishEat_upgrades') || '{}');

            // starting_hp: +20 HP per level
            const startingHpLevel = levels['starting_hp'] || 0;
            this.maxHp += startingHpLevel * 20;
            this.hp = this.maxHp;

            // starting_speed: +15 speed per level
            const startingSpeedLevel = levels['starting_speed'] || 0;
            this.speed += startingSpeedLevel * 15;

            // hp_regen: +0.2% per level
            const hpRegenLevel = levels['hp_regen'] || 0;
            this.healthRegenRate += hpRegenLevel * 0.002;
        } catch (e) { /* ignore */ }
    }

    /**
     * Get spawn weights for a given player level.
     * Early levels: mostly clownfish/shrimp; later levels unlock tougher fish.
     */
    _getSpawnWeights(level) {
        if (level <= 3) return { clownfish: 0.4, shrimp: 0.35, shark: 0.15, jellyfish: 0.1 };
        if (level <= 6) return { clownfish: 0.2, shrimp: 0.2, shark: 0.2, jellyfish: 0.15, seahorse: 0.15, octopus: 0.1 };
        if (level <= 10) return { clownfish: 0.1, shrimp: 0.1, shark: 0.15, anglerfish: 0.15, jellyfish: 0.1, seahorse: 0.15, octopus: 0.15, eel: 0.1 };
        return { shark: 0.2, anglerfish: 0.2, jellyfish: 0.15, seahorse: 0.1, octopus: 0.15, eel: 0.2 };
    }

    /**
     * Select a fish type using weighted random.
     */
    _selectFishByWeight(weights) {
        const valid = Object.entries(weights).filter(([, w]) => w > 0);
        const r = Math.random();
        let cumulative = 0;
        for (const [type, weight] of valid) {
            cumulative += weight;
            if (r <= cumulative) return type;
        }
        return valid[0][0];
    }

    /**
     * Get glow color hint for a fish relative to player.
     * Green = edible (player significantly larger), Red = dangerous (fish larger), null = similar size.
     */
    _getGlowColor(playerSize, fishSize, fishIsStrongAgainstPlayer = false) {
        if (fishIsStrongAgainstPlayer) return null;
        if (playerSize > fishSize * 1.2) return 0x00ff44;
        if (fishSize > playerSize * 1.2) return 0xff3333;
        return null;
    }

    spawnFish() {
        // Weighted spawn based on player level (prevents early-game difficulty spikes)
        const weights = this._getSpawnWeights(this.level);
        const type = this._selectFishByWeight(weights);
        const baseFishConfig = this.fishData[type];

        // Calculate enemy level based on distribution
        const enemyLevel = this.calculateEnemyLevel(this.level);

        // Scale fish config based on enemy level + progressive difficulty
        const levelDiff = enemyLevel - this.level;
        const difficultyMult = this._getDifficultyMultiplier();
        const scaleFactor = (1 + (levelDiff * 0.15)) * difficultyMult; // 15% scaling per level diff + progressive

        const fishConfig = {
            ...baseFishConfig,
            hp: Math.floor(baseFishConfig.hp * scaleFactor),
            size: Math.floor(baseFishConfig.size * scaleFactor * (this._challengeEnemySizeMultiplier || 1)),
            speed: Math.floor(baseFishConfig.speed * scaleFactor * (this._challengeEnemySpeedMultiplier || 1)),
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
            this.scene.get('UIScene').showBossWarning('squid');
            this.time.delayedCall(3000, () => this.spawnBoss('boss_squid', 400, 700));
        } else if (level === 10 && !this.bossDefeated.sharkKing) {
            this.scene.get('UIScene').showBossWarning('sharkKing');
            this.time.delayedCall(3000, () => this.spawnBoss('boss_shark_king', -100, 384));
        } else if (level === 15 && !this.bossDefeated.seaDragon) {
            this.scene.get('UIScene').showBossWarning('seaDragon');
            this.time.delayedCall(3000, () => this.spawnBoss('boss_sea_dragon', 400, 700));
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

        // Show boss UI
        const uiScene = this.scene.get('UIScene');
        if (uiScene && uiScene.showBossHealthBar) {
            uiScene.showBossHealthBar('深海霸主', boss.maxHp || 500);
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

            // Screen shake on eat (small positive feedback)
            this.cameras.main.shake(50, 0.003);

            // Create eat particle burst effect
            this.createEatParticles(fish.x, fish.y);

            // Play eat sound (bigger fish = deeper sound)
            const isBig = fishSize >= 40;
            if (this.audioSystem) this.audioSystem.play(isBig ? 'eat_big' : 'eat');

            // Update combo
            const comboMultiplier = this.comboSystem.onEat(this.time.now);

            // Add experience using GrowthSystem
            const expGain = fish.fishData.exp;
            const expResult = this.growthSystem.addExperience(expGain, this.time.now, this.luckSystem);
            this.exp = this.growthSystem.getExp();
            this.level = this.growthSystem.getLevel();
            this.score += Math.floor(expResult.expGained * 10 * comboMultiplier);
            this.achievementSystem.checkScore(this.score);
            this.uiDirty = true;

            // Show floating EXP text
            this._showFloatingText(fish.x, fish.y, expResult.expGained, 'exp');

            // Track kill count
            this.killCount++;
            this.achievementSystem.checkFishEaten(this.killCount);

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

            // Check if player is spawn-invincible
            if (this._spawnInvincible) {
                return; // Skip damage
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
                this.scene.start('GameOverScene', { score: this.score, level: this.level, difficulty: this.difficulty, kills: this.killCount, survivalTime: Math.floor((Date.now() - this.gameStartTime) / 1000) });
            }
        }
    }

    update(time, delta) {
        // Handle spawn invincibility flashing
        if (this._spawnInvincible) {
            this._spawnFlashTimer += this.game.loop.delta;
            if (this._spawnFlashTimer >= this._spawnFlashInterval) {
                this._spawnFlashTimer = 0;
                if (this.player.graphics && this.player.graphics.list[0]) {
                    const currentAlpha = this.player.graphics.list[0].alpha;
                    this.player.graphics.list[0].setAlpha(currentAlpha > 0.5 ? 0.3 : 1.0);
                }
                // Also flash the player container
                const currentPlayerAlpha = this.player.alpha;
                this.player.setAlpha(currentPlayerAlpha > 0.5 ? 0.3 : 1.0);
            }

            this._spawnInvincibleTimer -= this.game.loop.delta;
            if (this._spawnInvincibleTimer <= 0) {
                this._spawnInvincible = false;
                // Restore full opacity
                if (this.player.graphics && this.player.playerData) {
                    this.player.graphics.list[0]?.setAlpha(1.0);
                }
                this.player.setAlpha(1.0);
            }
        }

        // Current speed (base + acceleration if shift pressed, or speed_up buff)
        let currentSpeed = this.shiftKey.isDown ? this.speed * 1.8 : this.speed;
        if (this.skillSystem && this.skillSystem.isActive('speed_up')) {
            currentSpeed = this.speed * 1.8;
        }

        // Keyboard takes priority over mouse
        const keyboardActive = this.cursors.left.isDown || this.cursors.right.isDown ||
                               this.cursors.up.isDown || this.cursors.down.isDown;

        if (keyboardActive) {
            // Keyboard mode: disable mouse control while keys are held
            this.isMouseActive = false;

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
        } else if (this.isMouseActive && this.mouseTarget) {
            // Mouse chasing mode: smooth movement with dead zone + easing
            const DEAD_ZONE = 8;
            const EASE_ZONE = 80;
            const dx = this.mouseTarget.x - this.player.x;
            const dy = this.mouseTarget.y - this.player.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= DEAD_ZONE) {
                // Within dead zone — stop to prevent jitter
                this.player.body.setVelocityX(0);
                this.player.body.setVelocityY(0);
            } else {
                // Scale speed down in ease zone for smooth approach
                const scale = dist < EASE_ZONE ? dist / EASE_ZONE : 1.0;
                const effectiveSpeed = currentSpeed * scale;
                this.player.body.setVelocityX((dx / dist) * effectiveSpeed);
                this.player.body.setVelocityY((dy / dist) * effectiveSpeed);
            }
        } else {
            this.player.body.setVelocityX(0);
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

        // Invincibility flashing effect
        if (this.isInvincible) {
            // Flash between visible and semi-transparent
            this.player.alpha = this.player.alpha === 1 ? 0.4 : 1;
            this.playerHealthBar.alpha = this.player.alpha;
        } else {
            this.player.alpha = 1;
            this.playerHealthBar.alpha = 1;
        }

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

        // Draw size-hint glow around each enemy (green=edible, red=danger)
        this._glowLayer.clear();
        this.enemies.forEach(enemy => {
            if (!enemy.graphics || !enemy.graphics.active) return;
            const glow = this._getGlowColor(
                this.player.playerData.size,
                enemy.graphics.fishData.size,
                enemy.fishConfig.strongAgainst?.includes('clownfish')
            );
            if (!glow) return;
            const r = enemy.graphics.fishData.size + 2;
            this._glowLayer.lineStyle(2, glow, 0.7);
            this._glowLayer.strokeCircle(enemy.graphics.x, enemy.graphics.y, r);
        });

        // Process anglerfish projectile hits
        if (this.anglerProjectiles && this.anglerProjectiles.length > 0) {
            this.anglerProjectiles = this.anglerProjectiles.filter(p => {
                if (!p.proj || !p.proj.active) return false;
                p.hitCallback();
                return p.proj.active;
            });
        }

        // Update combo system (check expiry)
        if (this.comboSystem) {
            this.comboSystem.update(time);
        }

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

        // Check survival time achievements
        const survivalSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.achievementSystem.checkSurvivalTime(survivalSeconds);

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

                    // Resume normal enemy spawning with gradual recovery (5 fish over 3s)
                    if (this.spawnTimer) {
                        this.spawnTimer.paused = false;
                        // Immediately spawn a few fish, then resume normal rate
                        let recovered = 0;
                        const recoverInterval = setInterval(() => {
                            if (recovered >= 5) {
                                clearInterval(recoverInterval);
                                return;
                            }
                            if (this.enemies.length < this.enemyCountMax) {
                                this.spawnFish();
                                recovered++;
                            }
                        }, 600);
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

                    // Hide boss health bar
                    const uiScene = this.scene.get('UIScene');
                    if (uiScene && uiScene.hideBossHealthBar) {
                        uiScene.hideBossHealthBar();
                    }
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

        // Wave spawn system
        this._waveTimer += this.game.loop.delta;

        if (this._waveState === 'calm') {
            this._currentSpawnInterval = this._baseSpawnInterval;
            if (this._waveTimer >= 8000) { // 8 seconds calm
                this._waveState = 'surge';
                this._waveTimer = 0;
            }
        } else if (this._waveState === 'surge') {
            this._currentSpawnInterval = this._surgeSpawnInterval;
            if (this._waveTimer >= 4000) { // 4 seconds surge
                this._waveState = 'peak';
                this._waveTimer = 0;
            }
        } else if (this._waveState === 'peak') {
            this._currentSpawnInterval = this._baseSpawnInterval;
            if (this._waveTimer >= 3000) { // 3 seconds peak then back to calm
                this._waveState = 'calm';
                this._waveTimer = 0;
            }
        }

        // Spawn fish based on wave interval
        this._spawnTimer += this.game.loop.delta;
        if (this._spawnTimer >= this._currentSpawnInterval) {
            this._spawnTimer = 0;
            // Highlander challenge: only 1 enemy allowed
            if (this.dailyChallenge?.id === 'highlander' && this.enemies.length >= 1) {
                // Skip spawning
            } else {
                this.spawnFish();
            }
        }

        // Draw wave indicator
        this._waveGraphics.clear();
        const waveColors = { calm: 0x00aa00, surge: 0xffaa00, peak: 0xff4400 };
        const waveAlpha = { calm: 0.3, surge: 0.5, peak: 0.7 };
        const barWidth = 60;
        const barHeight = 6;
        const waveDuration = this._waveState === 'calm' ? 8000 : this._waveState === 'surge' ? 4000 : 3000;
        this._waveGraphics.fillStyle(waveColors[this._waveState], waveAlpha[this._waveState]);
        this._waveGraphics.fillRect(900, 150, barWidth * (this._waveTimer / waveDuration), barHeight);
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
        // Check if player is spawn-invincible
        if (this._spawnInvincible) {
            return;
        }

        // Apply damage to player with difficulty multiplier
        const actualDamage = Math.floor(damage * this.enemyDamageMultiplier);
        this.outOfCombatTimer = 0; // Reset out-of-combat timer on damage
        this.hp -= actualDamage;
        logger.debug(`HP change: -${actualDamage}, currentHP=${this.hp}/${this.maxHp}`);
        if (this.hp < 0) this.hp = 0;
        this.uiDirty = true;

        // Screen shake on damage
        this.cameras.main.shake(100, 0.005);

        // Play hurt sound
        if (this.audioSystem) this.audioSystem.play('hurt');

        // Update player health bar
        this.updatePlayerHealthBar();

        // Apply knockback - push player away from enemy
        this._applyKnockback(enemy, actualDamage);

        // Show floating damage text
        this._showFloatingText(this.player.x, this.player.y - 20, actualDamage, 'player_damage');

        // Check game over
        if (this.hp <= 0) {
            this.scene.start('GameOverScene', { score: this.score, level: this.level, difficulty: this.difficulty, kills: this.killCount, survivalTime: Math.floor((Date.now() - this.gameStartTime) / 1000) });
        }
    }

    /**
     * Apply knockback to player when hit by enemy.
     * @param {Enemy} enemy - The enemy that hit the player
     * @param {number} damage - Damage dealt (scales knockback strength)
     */
    _applyKnockback(enemy, damage) {
        if (!enemy || !enemy.graphics || !this.player || !this.player.body) return;
        const MAX_KNOCKBACK_VELOCITY = 450;
        const dx = this.player.x - enemy.graphics.x;
        const dy = this.player.y - enemy.graphics.y;
        const dist = Math.hypot(dx, dy) || 1;
        const magnitude = Math.min(damage * 15, MAX_KNOCKBACK_VELOCITY);
        this.player.body.setVelocity(
            (dx / dist) * magnitude,
            (dy / dist) * magnitude
        );
    }

    /**
     * Toggle pause state.
     */
    _togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.scene.pause();
            this.scene.get('UIScene').showPauseMenu();
        } else {
            this.scene.resume();
            this.scene.get('UIScene').hidePauseMenu();
        }
    }

    /**
     * Show floating damage/heal text at a position.
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string|number} value - Numeric value to display
     * @param {string} type - 'player_damage'|'enemy_damage'|'heal'|'exp'
     */
    _showFloatingText(x, y, value, type = 'enemy_damage') {
        const color = getFloatingTextColor(type);
        const text = type === 'exp' ? `+${value}` : `-${value}`;
        const floatText = this.add.text(x, y, text, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: `#${color.toString(16).padStart(6, '0')}`,
            stroke: '#000000',
            strokeThickness: 3
        });
        floatText.setOrigin(0.5);
        floatText.setDepth(50);

        // Tween: rise upward and fade out
        this.tweens.add({
            targets: floatText,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => floatText.destroy()
        });
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

        // Re-register collision overlaps with the new player object
        if (this._eatOverlap) this._eatOverlap.destroy();
        this._eatOverlap = this.physics.add.overlap(
            this.player, this.fishes, this.checkEat, null, this
        );
        if (this._boxOverlap) this._boxOverlap.destroy();
        this._boxOverlap = this.physics.add.overlap(
            this.player, this.treasureBoxes, this.collectTreasureBox, null, this
        );

        // Update skill system to use new player reference
        if (this.skillSystem) {
            this.skillSystem.setPlayer(this.player, this);
        }

        // Update player health bar position and display
        this.updatePlayerHealthBar();

        // Destroy old graphics
        oldPlayer.destroy();

        // Level-up visual effects: shockwave + level text popup
        this.playLevelUpEffects(oldX, oldY);

        // Play level-up sound
        if (this.audioSystem) this.audioSystem.play('level_up');

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

        // Check achievements for level up
        this.achievementSystem.checkLevelUp(this.level);

        // Trigger drift bottle effect
        if (this.driftBottleSystem) {
            const driftResult = this.driftBottleSystem.trigger();
            logger.info(`Level up - Drift bottle triggered: ${driftResult.message}`);
            // Check drift bottle achievement
            this.driftBottleCount = (this.driftBottleCount || 0) + 1;
            this.achievementSystem.checkDriftBottles(this.driftBottleCount);
            // Show drift bottle visual effect
            if (this.showDriftBottleEffect) {
                const effectData = driftResult.effect;
                this.showDriftBottleEffect(
                    effectData.name || '漂流瓶',
                    effectData.description || ''
                );
            }
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
     * Play level-up visual effects: expanding shockwave rings + floating level text
     * @param {number} x - Player X position
     * @param {number} y - Player Y position
     */
    playLevelUpEffects(x, y) {
        // 1. Flash the camera white briefly
        this.cameras.main.flash(300, 255, 255, 200, false);

        // 2. Three expanding shockwave rings with staggered delays
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 100, () => {
                const ring = this.add.graphics();
                ring.lineStyle(3 - i, 0xFFD700, 1);
                ring.strokeCircle(0, 0, 10);
                ring.x = x;
                ring.y = y;
                ring.setDepth(150);

                this.tweens.add({
                    targets: ring,
                    scaleX: 8 + i * 3,
                    scaleY: 8 + i * 3,
                    alpha: 0,
                    duration: 600,
                    ease: 'Quad.easeOut',
                    onComplete: () => ring.destroy()
                });
            });
        }

        // 3. Floating "LEVEL UP!" text
        const levelText = this.add.text(x, y - 30, `LEVEL ${this.level}!`, {
            fontSize: '28px',
            fontFamily: 'Arial Black, Arial',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        levelText.setOrigin(0.5);
        levelText.setDepth(200);
        levelText.setScale(0.5);

        this.tweens.add({
            targets: levelText,
            y: y - 100,
            scale: 1.2,
            alpha: 0,
            duration: 1200,
            ease: 'Quad.easeOut',
            onComplete: () => levelText.destroy()
        });

        // 4. Gold star particles burst
        for (let i = 0; i < 12; i++) {
            this.time.delayedCall(50, () => {
                const star = this.add.text(x, y, '★', {
                    fontSize: `${12 + Math.random() * 10}px`,
                    color: `hsl(${45 + Math.random() * 30}, 100%, 60%)`
                });
                star.setOrigin(0.5);
                star.setDepth(149);

                const angle = (i / 12) * Math.PI * 2;
                const dist = 50 + Math.random() * 40;
                this.tweens.add({
                    targets: star,
                    x: x + Math.cos(angle) * dist,
                    y: y + Math.sin(angle) * dist,
                    alpha: 0,
                    scale: 0.3,
                    duration: 700,
                    ease: 'Quad.easeOut',
                    onComplete: () => star.destroy()
                });
            });
        }
    }

    /**
     * Show drift bottle effect with dramatic animation
     * @param {string} bottleName - Name of the drift bottle effect
     * @param {string} effectText - Description of the effect
     */
    showDriftBottleEffect(bottleName, effectText) {
        const W = this.scale.width;
        const H = this.scale.height;

        // Full screen overlay
        const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x112244, 0.85);
        overlay.setDepth(250);
        overlay.setAlpha(0);

        // Bottle icon (using text emoji)
        const bottleIcon = this.add.text(W / 2, H / 2 + 80, '\uD83C\uDF76', {
            fontSize: '64px'
        });
        bottleIcon.setOrigin(0.5);
        bottleIcon.setDepth(251);
        bottleIcon.setScale(0);

        // Effect name
        const nameText = this.add.text(W / 2, H / 2 - 60, bottleName, {
            fontSize: '36px',
            fontFamily: 'Arial Black, Arial',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        nameText.setOrigin(0.5);
        nameText.setDepth(251);
        nameText.setAlpha(0);

        // Effect description
        const descText = this.add.text(W / 2, H / 2 + 20, effectText, {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#ffffff',
            align: 'center'
        });
        descText.setOrigin(0.5);
        descText.setDepth(251);
        descText.setAlpha(0);

        // Timeline animation
        const timeline = this.tweens.createTimeline();

        timeline.add({
            targets: overlay,
            alpha: 1,
            duration: 300,
            ease: 'Quad.easeOut'
        });

        timeline.add({
            targets: [nameText, bottleIcon],
            alpha: 1,
            scale: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });

        timeline.add({
            targets: descText,
            alpha: 1,
            duration: 300,
            delay: 200
        });

        timeline.add({
            targets: [overlay, nameText, bottleIcon, descText],
            alpha: 0,
            duration: 400,
            delay: 1500,
            ease: 'Quad.easeIn',
            onComplete: () => {
                overlay.destroy();
                nameText.destroy();
                bottleIcon.destroy();
                descText.destroy();
            }
        });

        timeline.play();
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
     * Create eat particle burst effect at position
     * @param {number} x - X position
     * @param {number} y - Y position
     */
    createEatParticles(x, y) {
        const particleCount = 8;
        const colors = [0xFFD700, 0xFFA500, 0xFF6347, 0xFFFF00]; // Gold, orange, tomato, yellow

        for (let i = 0; i < particleCount; i++) {
            const particle = this.add.graphics();
            const size = Phaser.Math.Between(3, 6);
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.fillStyle(color, 1);
            particle.fillCircle(size, size, size);
            particle.x = x;
            particle.y = y;
            particle.setDepth(50);

            // Animate outward in random direction
            const angle = (i / particleCount) * Math.PI * 2 + Phaser.Math.Between(-0.3, 0.3);
            const distance = Phaser.Math.Between(30, 60);
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance;

            this.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                scale: 0.3,
                duration: 400,
                ease: 'Quad.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
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

        // Play collect sound
        if (this.audioSystem) this.audioSystem.play('collect');

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

        // Check achievements for treasure opened
        this.treasureOpenedCount = (this.treasureOpenedCount || 0) + 1;
        this.achievementSystem.checkTreasureOpened(this.treasureOpenedCount);
        this.achievementSystem.checkScore(this.score);

        // Mark UI dirty - update will be called in next update loop
        this.uiDirty = true;
    }

    /**
     * Clean up resources when the scene shuts down (scene restart / game over).
     * Prevents anglerfish projectile timers from firing into a dead scene.
     */
    shutdown() {
        if (this.anglerProjectiles) {
            this.anglerProjectiles.forEach(p => {
                if (p.destroyProj) p.destroyProj();
                else if (p.proj?.active) p.proj.destroy();
            });
            this.anglerProjectiles = [];
        }
        if (this.audioSystem) this.audioSystem.stopBGM();
    }
}

export default GameScene;
