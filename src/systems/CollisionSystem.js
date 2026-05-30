/**
 * CollisionSystem - Eat/fish collision detection
 *
 * Detects when player fish collides with enemy fish and determines if the player can eat it.
 * Returns structured result for GameScene to handle side effects.
 *
 * Usage:
 *   const collisionSystem = new CollisionSystem({
 *     scene: gameScene,
 *     player: player,
 *     fishData: fishData,
 *     onCollisionResult: (result) => { ... }  // callback for side effects
 *   });
 *
 *   // In game loop:
 *   collisionSystem.update(delta);
 */
export class CollisionSystem {
    /**
     * @param {object} config - Configuration object
     * @param {Phaser.Scene} config.scene - Phaser scene reference
     * @param {object} config.player - Player object with playerData
     * @param {object} config.fishData - Fish configuration data
     * @param {function} config.onCollisionResult - Callback with result object
     */
    constructor(config) {
        this._scene = config.scene;
        this._player = config.player;
        this._fishData = config.fishData;
        this.onCollisionResult = config.onCollisionResult || (() => {});

        // Register collision overlap
        this._overlap = null;
    }

    /**
     * Register the collision overlap with physics world
     * @param {Phaser.GameObjects.Group} fishes - Fish group
     * @param {function} checkEat - Collision callback
     */
    register(fishes, checkEat) {
        this._overlap = this._scene.physics.add.overlap(
            this._player,
            fishes,
            checkEat,
            null,
            this._scene
        );
        return this._overlap;
    }

    /**
     * Check collision between player and fish
     * Returns structured result for GameScene to handle side effects
     * @param {object} player - Player object
     * @param {object} fish - Fish object
     * @returns {object} Collision result {type, fish, expGain, comboMultiplier, score, isLevelUp, canEat, damage}
     */
    checkCollision(player, fish) {
        if (fish.getData('eaten')) {
            return { type: 'already_eaten', fish, canEat: false };
        }

        const playerSize = player.playerData.size;
        const fishSize = fish.fishData.size;
        const fishType = fish.fishType;

        // Read playerType dynamically from player object (supports both player.fishType and player.playerData.fishType)
        const playerType = player.fishType || player.playerData?.fishType || 'clownfish';

        // Look up fish and player type data
        const fishData = this._fishData[fishType];
        const playerData = this._fishData[playerType];

        // Determine type relationships
        const fishStrongAgainstPlayer = fishData?.strongAgainst?.includes(playerType) ?? false;
        const playerStrongAgainstFish = playerData?.strongAgainst?.includes(fishType) ?? false;

        // Determine size threshold based on type relationship
        let sizeThreshold = 1.2;
        let damageMultiplier = 1.0;

        if (fishStrongAgainstPlayer) {
            sizeThreshold = fishData.sizeThresholdVsStrong ?? 1.5;
        } else if (playerStrongAgainstFish) {
            sizeThreshold = playerData.sizeThresholdVsWeak ?? 1.2;
            damageMultiplier = playerData.damageMultiplierVsStrong ?? 2.0;
        }

        // If fish strongAgainst player, block all interactions with strong_against reason
        if (fishStrongAgainstPlayer) {
            return {
                type: 'blocked',
                fish,
                canEat: false,
                reason: 'strong_against'
            };
        }

        // Normal path: player can eat fish
        if (playerSize > fishSize * sizeThreshold) {
            // Apply type multiplier to exp
            return {
                type: 'eat',
                fish,
                canEat: true,
                expGain: fish.fishData.exp * damageMultiplier,
                fishSize: fishSize
            };
        }
        // Fish is larger than player
        else if (fishSize > playerSize * sizeThreshold) {
            // Take damage
            return {
                type: 'damaged',
                fish,
                canEat: false,
                damage: Math.floor(fishSize / 4)
            };
        }

        // Similar size - no interaction
        return { type: 'blocked', fish, canEat: false, reason: 'similar_size' };
    }

    /**
     * Reset collision system
     */
    reset() {
        // No persistent state to reset
    }
}

export default CollisionSystem;