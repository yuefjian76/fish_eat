/**
 * SpawnSystem - Enemy fish spawning with wave-based interval
 *
 * Manages enemy spawning based on WaveSystem interval and player level.
 * Uses DI to query WaveSystem for current spawn interval.
 *
 * Usage:
 *   const spawnSystem = new SpawnSystem({
 *     scene: gameScene,  // Phaser scene reference
 *     waveSystem: waveSystem,  // DI: query interface
 *     onEnemyCreated: (enemy) => { ... },  // callback for post-creation side effects
 *     fishData: fishData,
 *     playerLevel: 1,
 *     aiLevel: 1,
 *     difficulty: 'easy',
 *     gameStartTime: Date.now(),
 *     getCurrentZone: () => mapExpansion?.getCurrentZone()
 *   });
 *
 *   // In game loop:
 *   spawnSystem.update(delta);
 */
export class SpawnSystem {
    /**
     * @param {object} config - Configuration object
     * @param {WaveSystem} config.waveSystem - WaveSystem DI reference
     * @param {function} config.onEnemyCreated - Callback when enemy is created (receives spawn params)
     * @param {object} config.fishData - Fish configuration data
     * @param {number} config.playerLevel - Current player level
     * @param {number} config.aiLevel - AI level
     * @param {string} config.difficulty - Game difficulty
     * @param {number} config.gameStartTime - Game start timestamp
     * @param {function} config.getCurrentZone - Function to get current zone
     * @param {object} [config.challengeMultipliers] - Challenge mode multipliers
     */
    constructor(config) {
        this._waveSystem = config.waveSystem;
        this.onEnemyCreated = config.onEnemyCreated || (() => {});

        // Game state dependencies
        this._fishData = config.fishData;
        this._playerLevel = config.playerLevel ?? 1;
        this._aiLevel = config.aiLevel ?? 1;
        this._difficulty = config.difficulty ?? 'easy';
        this._gameStartTime = config.gameStartTime ?? Date.now();
        this._getCurrentZone = config.getCurrentZone || (() => null);
        this._challengeMultipliers = config.challengeMultipliers || {};

        this._spawnTimer = 0;
    }

    /**
     * Update spawn system
     * @param {number} delta - Time since last update in ms
     */
    update(delta) {
        const interval = this._waveSystem.getSpawnInterval();
        this._spawnTimer += delta;

        if (this._spawnTimer >= interval) {
            this._spawnTimer = 0;
            const enemy = this._doSpawn();
            if (enemy) {
                this.onEnemyCreated(enemy);
            }
        }
    }

    /**
     * Internal spawn implementation - returns spawn params for callback to create enemy
     * @returns {object|null} Spawn params or null
     */
    _doSpawn() {
        // Weighted spawn based on player level
        const weights = this._getSpawnWeights(this._playerLevel);
        const type = this._selectFishByWeight(weights);
        const baseFishConfig = this._fishData[type];

        if (!baseFishConfig) return null;

        // Calculate enemy level
        const enemyLevel = this._calculateEnemyLevel(this._playerLevel);

        // Scale fish config
        const levelDiff = enemyLevel - this._playerLevel;
        const difficultyMult = this._getDifficultyMultiplier();
        const zone = this._getCurrentZone();
        const inAbyss = zone?.id === 'abyss';
        const abyssBonus = inAbyss ? 1.1 : 1.0;
        const scaleFactor = (1 + Math.max(0, levelDiff) * 0.15) * difficultyMult * abyssBonus;

        const fishConfig = {
            ...baseFishConfig,
            hp: Math.floor(baseFishConfig.hp * scaleFactor),
            size: Math.floor(baseFishConfig.size * scaleFactor * (this._challengeMultipliers.size || 1)),
            speed: Math.floor(baseFishConfig.speed * scaleFactor * (this._challengeMultipliers.speed || 1)),
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

        // Return spawn params - callback handles actual Enemy creation
        return {
            type,
            x,
            y,
            fishConfig,
            aiLevel: this._aiLevel,
            enemyLevel
        };
    }

    /**
     * Get spawn weights for a given player level
     * @param {number} level - Player level
     * @returns {object} Weight map
     */
    _getSpawnWeights(level) {
        if (level <= 3) return { clownfish: 0.4, shrimp: 0.35, shark: 0.15, jellyfish: 0.1 };
        if (level <= 6) return { clownfish: 0.2, shrimp: 0.2, shark: 0.2, jellyfish: 0.15, seahorse: 0.15, octopus: 0.1 };
        if (level <= 10) return { clownfish: 0.1, shrimp: 0.1, shark: 0.15, anglerfish: 0.15, jellyfish: 0.1, seahorse: 0.15, octopus: 0.15, eel: 0.1 };
        return { shark: 0.2, anglerfish: 0.2, jellyfish: 0.15, seahorse: 0.1, octopus: 0.15, eel: 0.2 };
    }

    /**
     * Select fish type using weighted random
     * @param {object} weights - Weight map
     * @returns {string} Fish type
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
     * Calculate enemy level based on player level and survival time
     * @param {number} playerLevel - Player level
     * @returns {number} Enemy level
     */
    _calculateEnemyLevel(playerLevel) {
        const [zoneMin, zoneMax] = [1, 3]; // Default range
        const clampedLevel = this._clamp(playerLevel, zoneMin, zoneMax);

        const survivalMinutes = Math.floor((Date.now() - this._gameStartTime) / 60000);
        const bonusRoll = Math.min(survivalMinutes * 0.05, 0.2);

        const roll = Math.random() - bonusRoll;
        if (roll < 0.70) {
            const sameMin = Math.max(zoneMin, clampedLevel - 1);
            const sameMax = Math.min(zoneMax, clampedLevel + 1);
            return this._clamp(this._randomInRange(sameMin, sameMax), zoneMin, zoneMax);
        } else if (roll < 0.88) {
            return this._clamp(this._randomInRange(clampedLevel + 1, zoneMax), zoneMin, zoneMax);
        } else {
            return this._clamp(this._randomInRange(clampedLevel + 2, zoneMax), zoneMin, zoneMax);
        }
    }

    /**
     * Clamp a value between min and max
     */
    _clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }

    /**
     * Random integer in range [min, max]
     */
    _randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Get progressive difficulty multiplier
     * @returns {number} Difficulty multiplier
     */
    _getDifficultyMultiplier() {
        const levelBonus = Math.max(0, this._playerLevel - 5) * 0.05;
        const survivalBonus = Math.min((Date.now() - this._gameStartTime) / 120000, 0.3);
        return 1.0 + levelBonus + survivalBonus;
    }

    /**
     * Set player level (called from GameScene)
     * @param {number} level - Player level
     */
    setPlayerLevel(level) {
        this._playerLevel = level;
    }

    /**
     * Reset spawn system to initial state
     * @param {object} config - New configuration (optional)
     */
    reset(config) {
        this._spawnTimer = 0;
        if (config) {
            this._playerLevel = config.playerLevel ?? this._playerLevel;
            this._aiLevel = config.aiLevel ?? this._aiLevel;
            this._difficulty = config.difficulty ?? this._difficulty;
            this._gameStartTime = config.gameStartTime ?? this._gameStartTime;
            if (config.challengeMultipliers) {
                this._challengeMultipliers = config.challengeMultipliers;
            }
        }
    }
}

export default SpawnSystem;