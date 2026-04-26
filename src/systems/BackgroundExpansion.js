/**
 * BackgroundExpansion - Infinite background system extending BackgroundSystem
 * Supports dynamic chunk loading, world coordinate transformation,
 * procedural decorative elements, and zone transitions
 */
import BackgroundSystem from './BackgroundSystem.js';

export class BackgroundExpansion extends BackgroundSystem {
    /**
     * @param {object} scene - Phaser scene reference
     * @param {number} screenWidth - Screen width (default 1024)
     * @param {number} screenHeight - Screen height (default 768)
     */
    constructor(scene, screenWidth = 1024, screenHeight = 768) {
        super(scene, screenWidth, screenHeight);

        // Infinite background configuration
        this.tileSize = 1024;
        this.renderDistance = 2048;

        // Chunk management for infinite background
        this.loadedChunks = new Map();
        this.activeChunks = new Set();

        // Zone system for world division
        this.currentZone = 'undersea';
        this.zoneBounds = {
            undersea: { startX: 0, endX: 3000 },
            tropical: { startX: 3000, endX: 6000 },
            polar: { startX: 6000, endX: 9000 }
        };

        // Decorative elements
        this.seaweeds = [];
        this.decorativeBubbles = [];

        // Transition state
        this.isTransitioning = false;
        this.transitionOverlay = null;
    }

    /**
     * Initialize infinite background with chunk preloading
     */
    initInfiniteBackground() {
        this.createBackground();
        this._initProceduralDecorations();
        this._preloadInitialChunks();
    }

    /**
     * Preload initial chunks around origin
     * @private
     */
    _preloadInitialChunks() {
        const centerChunk = this._worldToChunk(0, 0);
        const chunksToLoad = [
            `${centerChunk.chunkX - 1}_${centerChunk.chunkY}`,
            `${centerChunk.chunkX}_${centerChunk.chunkY}`,
            `${centerChunk.chunkX + 1}_${centerChunk.chunkY}`
        ];

        chunksToLoad.forEach(chunkKey => {
            if (!this.loadedChunks.has(chunkKey)) {
                this._loadChunk(chunkKey);
            }
        });
    }

    /**
     * Convert world coordinates to chunk coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {object} Chunk coordinates {chunkX, chunkY}
     */
    _worldToChunk(worldX, worldY) {
        return {
            chunkX: Math.floor(worldX / this.tileSize),
            chunkY: Math.floor(worldY / this.tileSize)
        };
    }

    /**
     * Get chunk key from chunk coordinates
     * @param {number} chunkX - Chunk X coordinate
     * @param {number} chunkY - Chunk Y coordinate
     * @returns {string} Chunk key
     */
    _getChunkKey(chunkX, chunkY) {
        return `${chunkX}_${chunkY}`;
    }

    /**
     * Load a background chunk
     * @param {string} chunkKey - Chunk identifier
     * @private
     */
    _loadChunk(chunkKey) {
        if (this.loadedChunks.has(chunkKey)) return;

        const [chunkX, chunkY] = chunkKey.split('_').map(Number);

        // Create chunk container
        const chunkContainer = this.scene.add.container(
            chunkX * this.tileSize,
            chunkY * this.tileSize
        );
        chunkContainer.setDepth(0);

        // Determine zone for this chunk
        const zone = this._getZoneForChunk(chunkX);

        // Get theme config for this zone
        const themeConfig = BackgroundSystem.THEME_CONFIG[zone];
        const themeTint = themeConfig.tint;

        // Create tiled background for this chunk
        // We tile the background image across the chunk
        const tilesX = 1; // Since tileSize matches our screen width design
        const tilesY = 1;

        for (let tx = 0; tx < tilesX; tx++) {
            for (let ty = 0; ty < tilesY; ty++) {
                const tileX = tx * this.tileSize;
                const tileY = ty * this.tileSize;

                // Background layer
                const bg = this.scene.add.image(
                    tileX + this.tileSize / 2,
                    tileY + this.tileSize / 2,
                    themeConfig.images.background
                );
                bg.setDisplaySize(this.tileSize, this.tileSize);
                bg.setTint(themeTint);
                bg.setDepth(0);
                chunkContainer.add(bg);

                // Far parallax layer
                const far = this.scene.add.image(
                    tileX + this.tileSize / 2,
                    tileY + this.tileSize / 2,
                    themeConfig.images.far
                );
                far.setDisplaySize(this.tileSize, this.tileSize);
                far.setAlpha(0.6);
                far.setTint(themeTint);
                far.setDepth(1);
                chunkContainer.add(far);
            }
        }

        this.loadedChunks.set(chunkKey, chunkContainer);
    }

    /**
     * Determine zone based on chunk X coordinate
     * @param {number} chunkX - Chunk X coordinate
     * @returns {string} Zone name
     */
    _getZoneForChunk(chunkX) {
        const worldX = chunkX * this.tileSize;
        for (const [zone, bounds] of Object.entries(this.zoneBounds)) {
            if (worldX >= bounds.startX && worldX < bounds.endX) {
                return zone;
            }
        }
        return 'undersea'; // Default zone
    }

    /**
     * Update background based on player position in world coordinates
     * @param {number} worldX - Player world X coordinate
     * @param {number} worldY - Player world Y coordinate
     * @param {string} zone - Current zone name
     */
    updateBackground(worldX, worldY, zone) {
        // Update parallax offset based on world position
        this.playerX = worldX;
        this.playerY = worldY;

        // Determine required chunks based on render distance
        const centerChunk = this._worldToChunk(worldX, worldY);
        const chunksInView = Math.ceil(this.renderDistance / this.tileSize);

        // Load new chunks and unload distant ones
        this._updateLoadedChunks(centerChunk, chunksInView);

        // Update decorative elements
        this._updateDecorations(worldX, worldY);

        // Check for zone change
        const newZone = this._getZoneFromWorldX(worldX);
        if (newZone !== zone && newZone !== this.currentZone) {
            this.transitionToZone(newZone, 1500);
        }
    }

    /**
     * Get zone from world X coordinate
     * @param {number} worldX - World X coordinate
     * @returns {string} Zone name
     */
    _getZoneFromWorldX(worldX) {
        for (const [zone, bounds] of Object.entries(this.zoneBounds)) {
            if (worldX >= bounds.startX && worldX < bounds.endX) {
                return zone;
            }
        }
        return this.currentZone;
    }

    /**
     * Update loaded chunks based on player position
     * @param {object} centerChunk - Current chunk coordinates
     * @param {number} chunksInView - Number of chunks visible
     * @private
     */
    _updateLoadedChunks(centerChunk, chunksInView) {
        const neededChunks = new Set();

        // Calculate required chunks
        for (let dx = -chunksInView; dx <= chunksInView; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const chunkX = centerChunk.chunkX + dx;
                const chunkY = centerChunk.chunkY + dy;
                const chunkKey = this._getChunkKey(chunkX, chunkY);
                neededChunks.add(chunkKey);
            }
        }

        // Load missing chunks
        for (const chunkKey of neededChunks) {
            if (!this.loadedChunks.has(chunkKey)) {
                this._loadChunk(chunkKey);
            }
        }

        // Track active chunks for cleanup
        this.activeChunks = neededChunks;

        // Unload distant chunks (outside render distance + buffer)
        const bufferChunks = chunksInView + 2;
        for (const [chunkKey, chunkContainer] of this.loadedChunks) {
            if (!neededChunks.has(chunkKey)) {
                this._unloadChunk(chunkKey, chunkContainer);
            }
        }
    }

    /**
     * Unload a chunk to free memory
     * @param {string} chunkKey - Chunk identifier
     * @param {object} chunkContainer - Chunk container to destroy
     * @private
     */
    _unloadChunk(chunkKey, chunkContainer) {
        if (chunkContainer) {
            chunkContainer.destroy();
        }
        this.loadedChunks.delete(chunkKey);
    }

    /**
     * Initialize procedural decorations (seaweed, extra bubbles)
     * @private
     */
    _initProceduralDecorations() {
        // Create seaweed decorations
        const seaweedCount = 15;
        for (let i = 0; i < seaweedCount; i++) {
            this._createSeaweed();
        }

        // Additional decorative bubbles
        const bubbleCount = 20;
        for (let i = 0; i < bubbleCount; i++) {
            this._createDecorativeBubble();
        }
    }

    /**
     * Create a seaweed decoration
     * @private
     */
    _createSeaweed() {
        const x = Math.random() * this.screenWidth;
        const y = this.screenHeight - 50 + Math.random() * 30;

        const seaweed = this.scene.add.graphics();
        seaweed.x = x;
        seaweed.y = y;
        seaweed.setDepth(4);

        // Draw seaweed with curves
        const segments = 5 + Math.floor(Math.random() * 5);
        const baseHeight = 50 + Math.random() * 100;

        seaweed.lineStyle(3, 0x228833, 0.7);

        // Simple procedural seaweed
        let currentY = 0;
        for (let i = 0; i < segments; i++) {
            const swayAmount = 20 + Math.random() * 30;
            const endX = (Math.random() - 0.5) * swayAmount;
            const endY = currentY - baseHeight / segments;
            seaweed.lineBetween(0, currentY, endX, endY);
            currentY = endY;
        }

        this.seaweeds.push({
            graphics: seaweed,
            baseX: x,
            swaySpeed: 1000 + Math.random() * 2000,
            swayAmount: 15 + Math.random() * 25
        });

        // Add sway animation
        this.scene.tweens.add({
            targets: seaweed,
            x: `+=${seaweed.swayAmount}`,
            duration: seaweed.swaySpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Create a decorative bubble that drifts differently
     * @private
     */
    _createDecorativeBubble() {
        const rand = Math.random();
        const size = 2 + rand * 15;
        const x = Math.random() * this.screenWidth;
        const y = Math.random() * this.screenHeight + 50;
        const baseAlpha = 0.15 + rand * 0.4;

        const bubble = this.scene.add.graphics();
        bubble.fillStyle(this.themeConfig.bubbleColor, baseAlpha);
        bubble.fillCircle(size / 2, size / 2, size / 2);
        bubble.lineStyle(1, this.themeConfig.bubbleColor, baseAlpha * 0.6);
        bubble.strokeCircle(size / 2, size / 2, size / 2);

        bubble.x = x;
        bubble.y = y;
        bubble.setDepth(5);

        const targetY = -50;
        const driftSpeed = 3000 + Math.random() * 5000;
        const horizontalDrift = (20 - size) * 0.8;

        this.scene.tweens.add({
            targets: bubble,
            y: targetY,
            x: x + (Math.random() > 0.5 ? 1 : -1) * horizontalDrift,
            alpha: { from: baseAlpha, to: 0 },
            duration: driftSpeed,
            ease: 'Sine.easeOut',
            onRepeat: () => {
                bubble.x = Math.random() * this.screenWidth;
                bubble.y = this.screenHeight + 20;
                bubble.alpha = baseAlpha;
            },
            repeat: -1
        });

        this.decorativeBubbles.push(bubble);
    }

    /**
     * Update decorations based on world position
     * @param {number} worldX - Player world X
     * @param {number} worldY - Player world Y
     * @private
     */
    _updateDecorations(worldX, worldY) {
        // Parallax effect for seaweed
        const parallaxFactor = 0.1;
        this.seaweeds.forEach((seaweed, index) => {
            if (seaweed.graphics) {
                // Subtle parallax based on world position
                const offsetX = (worldX * parallaxFactor) % 50;
                seaweed.graphics.x = seaweed.baseX - offsetX;
            }
        });
    }

    /**
     * Execute zone transition animation
     * @param {string} newZone - Zone to transition to
     * @param {number} duration - Transition duration in ms (default 1500)
     */
    transitionToZone(newZone, duration = 1500) {
        if (this.isTransitioning) return;
        if (!BackgroundSystem.THEME_CONFIG[newZone]) {
            console.warn(`Unknown zone: ${newZone}`);
            return;
        }

        this.isTransitioning = true;
        this.currentZone = newZone;

        const newThemeConfig = BackgroundSystem.THEME_CONFIG[newZone];

        // Create transition overlay
        this.transitionOverlay = this.scene.add.graphics();
        this.transitionOverlay.setDepth(100);
        this.transitionOverlay.setAlpha(0);

        // Draw overlay
        this.transitionOverlay.fillStyle(0x000000, 1);
        this.transitionOverlay.fillRect(0, 0, this.screenWidth, this.screenHeight);

        // Fade to black
        this.scene.tweens.add({
            targets: this.transitionOverlay,
            alpha: 1,
            duration: duration / 2,
            ease: 'Sine.easeIn',
            onComplete: () => {
                // At peak darkness, update zone and tint
                this.theme = newZone;
                this.themeConfig = newThemeConfig;
                this._applyThemeTint(newThemeConfig.tint, newThemeConfig.bubbleColor);

                // Reload chunks with new zone theme
                this._reloadChunksForZone(newZone);

                // Fade back
                this.scene.tweens.add({
                    targets: this.transitionOverlay,
                    alpha: 0,
                    duration: duration / 2,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        if (this.transitionOverlay) {
                            this.transitionOverlay.destroy();
                            this.transitionOverlay = null;
                        }
                        this.isTransitioning = false;
                    }
                });
            }
        });
    }

    /**
     * Reload all chunks when transitioning to a new zone
     * @param {string} zone - New zone name
     * @private
     */
    _reloadChunksForZone(zone) {
        // Destroy existing chunks
        for (const [chunkKey, chunkContainer] of this.loadedChunks) {
            if (chunkContainer) {
                chunkContainer.destroy();
            }
        }
        this.loadedChunks.clear();

        // Reload visible chunks with new zone theme
        this._preloadInitialChunks();
    }

    /**
     * Override parent update for infinite background support
     * @param {number} delta - Delta time
     */
    update(delta) {
        // Parent class handles base parallax
        super.update(delta);
    }

    /**
     * Clean up infinite background resources
     */
    destroy() {
        // Destroy all loaded chunks
        for (const [chunkKey, chunkContainer] of this.loadedChunks) {
            if (chunkContainer) {
                chunkContainer.destroy();
            }
        }
        this.loadedChunks.clear();

        // Destroy decorations
        for (const seaweed of this.seaweeds) {
            if (seaweed.graphics) {
                seaweed.graphics.destroy();
            }
        }
        this.seaweeds = [];

        for (const bubble of this.decorativeBubbles) {
            if (bubble) {
                bubble.destroy();
            }
        }
        this.decorativeBubbles = [];

        // Destroy transition overlay if exists
        if (this.transitionOverlay) {
            this.transitionOverlay.destroy();
            this.transitionOverlay = null;
        }

        // Call parent destroy
        super.destroy();
    }
}

export default BackgroundExpansion;