/**
 * BackgroundExpansion - Player-centric radial background system
 * Replaces chunk-based background with procedural decorations
 */
import BackgroundSystem from './BackgroundSystem.js';
import { THEME_CONFIG, getTheme, getRandomTheme } from '../constants/ThemeConfig.js';

export class BackgroundExpansion extends BackgroundSystem {
    /**
     * @param {object} scene - Phaser scene reference
     * @param {number} screenWidth - Screen width (default 1024)
     * @param {number} screenHeight - Screen height (default 768)
     */
    constructor(scene, screenWidth = 1024, screenHeight = 768) {
        super(scene, screenWidth, screenHeight);

        // Theme configuration
        this.currentThemeId = 'deep_sea';
        this.themeConfig = THEME_CONFIG.deep_sea;

        // Decoration elements
        this.bubbles = [];
        this.jellyfish = [];
        this.lightSpots = [];

        // Decoration graphics objects
        this.bubbleGraphics = [];
        this.jellyfishGraphics = [];
        this.lightSpotGraphics = [];

        // Spawn timers
        this.lastBubbleSpawn = 0;
        this.lastJellyfishSpawn = 0;

        // Transition state
        this.isTransitioning = false;
        this.transitionOverlay = null;
    }

    /**
     * Create background with gradient and decorations
     */
    createBackground() {
        // Create gradient background using graphics
        this.bgGraphics = this.scene.add.graphics();
        this.bgGraphics.setDepth(0);
        this._drawGradientBackground(this.themeConfig.gradientColors);

        // Create decoration container
        this.decorationContainer = this.scene.add.container(0, 0);
        this.decorationContainer.setDepth(1);

        // Initialize light spots (static,随视角移动)
        this._initLightSpots();
    }

    /**
     * Draw gradient background
     * @param {number[]} colors - [top, mid, bottom] color values
     */
    _drawGradientBackground(colors) {
        const w = this.screenWidth;
        const h = this.screenHeight;
        const segmentHeight = h / (colors.length - 1);

        for (let i = 0; i < colors.length - 1; i++) {
            const topColor = colors[i];
            const bottomColor = colors[i + 1];
            const y1 = i * segmentHeight;
            const y2 = (i + 1) * segmentHeight;

            this.bgGraphics.fillStyle(topColor, 1);
            this.bgGraphics.fillRect(0, y1, w, segmentHeight + 1);
        }
    }

    /**
     * Initialize light spots (static decorations)
     */
    _initLightSpots() {
        const count = this.themeConfig.decoration.lightSpot.count;
        const flickerSpeed = this.themeConfig.decoration.lightSpot.flickerSpeed;

        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.screenWidth;
            const y = Math.random() * this.screenHeight;
            const size = 5 + Math.random() * 15;
            const baseAlpha = 0.1 + Math.random() * 0.3;

            const spot = this.scene.add.graphics();
            spot.fillStyle(this.themeConfig.bubbleColor, baseAlpha);
            spot.fillCircle(size / 2, size / 2, size / 2);
            spot.x = x;
            spot.y = y;
            spot.setDepth(2);
            this.lightSpots.push({ graphics: spot, baseX: x, baseY: y, baseAlpha });
            this.lightSpotGraphics.push(spot);

            // Flicker animation
            this.scene.tweens.add({
                targets: spot,
                alpha: { from: baseAlpha, to: baseAlpha * 0.3 },
                duration: flickerSpeed + Math.random() * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    /**
     * Generate a bubble at random position around player
     * @param {number} playerX - Player world X
     * @param {number} playerY - Player world Y
     * @returns {object|null} Bubble data or null if at limit
     */
    generateBubble(playerX, playerY) {
        const maxBubbles = this.themeConfig.decoration.bubble.count;
        if (this.bubbles.length >= maxBubbles) {
            return null;
        }

        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 300;
        const x = playerX + Math.cos(angle) * distance;
        const y = playerY + Math.sin(angle) * distance;
        const size = this.themeConfig.decoration.bubble.sizeRange[0] +
            Math.random() * (this.themeConfig.decoration.bubble.sizeRange[1] - this.themeConfig.decoration.bubble.sizeRange[0]);

        return { x, y, size, angle, speed: this.themeConfig.decoration.bubble.speed };
    }

    /**
     * Generate a jellyfish at outer ring
     * @param {number} playerX - Player world X
     * @param {number} playerY - Player world Y
     * @returns {object|null} Jellyfish data or null if at limit
     */
    generateJellyfish(playerX, playerY) {
        const maxJellyfish = this.themeConfig.decoration.jellyfish.count;
        if (this.jellyfish.length >= maxJellyfish) {
            return null;
        }

        const angle = Math.random() * Math.PI * 2;
        const distance = 600 + Math.random() * 400;
        const x = playerX + Math.cos(angle) * distance;
        const y = playerY + Math.sin(angle) * distance;
        const size = this.themeConfig.decoration.jellyfish.sizeRange[0] +
            Math.random() * (this.themeConfig.decoration.jellyfish.sizeRange[1] - this.themeConfig.decoration.jellyfish.sizeRange[0]);

        return {
            x, y, size,
            vx: (Math.random() - 0.5) * 2,
            vy: -this.themeConfig.decoration.jellyfish.speed * 0.3,
            pulsePhase: Math.random() * Math.PI * 2
        };
    }

    /**
     * Get next theme excluding current
     * @returns {string} Next theme id
     */
    getNextTheme() {
        return getRandomTheme(this.currentThemeId);
    }

    /**
     * Transition to new theme with animation
     * @param {string} newThemeId - Theme to transition to
     * @param {number} duration - Transition duration in ms
     */
    transitionToNewTheme(newThemeId, duration = 1500) {
        if (this.isTransitioning) return;
        if (newThemeId === this.currentThemeId) return;

        this.isTransitioning = true;
        const oldTheme = this.themeConfig;
        const newTheme = getTheme(newThemeId);

        // Fade out decorations
        this.bubbleGraphics.forEach(g => {
            this.scene.tweens.add({
                targets: g,
                alpha: 0,
                duration: 200,
                onComplete: () => g.destroy()
            });
        });
        this.jellyfishGraphics.forEach(g => {
            this.scene.tweens.add({
                targets: g,
                alpha: 0,
                duration: 200,
                onComplete: () => g.destroy()
            });
        });
        this.bubbleGraphics = [];
        this.jellyfishGraphics = [];

        // Create transition overlay
        this.transitionOverlay = this.scene.add.graphics();
        this.transitionOverlay.setDepth(100);
        this.transitionOverlay.setAlpha(0);
        this.transitionOverlay.fillStyle(0x000000, 1);
        this.transitionOverlay.fillRect(0, 0, this.screenWidth, this.screenHeight);

        // Fade to black
        this.scene.tweens.add({
            targets: this.transitionOverlay,
            alpha: 1,
            duration: duration / 2,
            ease: 'Sine.easeIn',
            onComplete: () => {
                // Switch theme
                this.currentThemeId = newThemeId;
                this.themeConfig = newTheme;
                this._drawGradientBackground(newTheme.gradientColors);

                // Fade from black
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
     * Update decorations - spawn and move
     * @param {number} delta - Delta time in ms
     * @param {number} playerX - Player world X
     * @param {number} playerY - Player world Y
     */
    updateDecorations(delta, playerX, playerY) {
        const bubbleInterval = this.themeConfig.decoration.bubble.spawnInterval;
        const jellyfishInterval = this.themeConfig.decoration.jellyfish.spawnInterval;

        // Spawn bubbles
        this.lastBubbleSpawn += delta;
        if (this.lastBubbleSpawn >= bubbleInterval) {
            const bubble = this.generateBubble(playerX, playerY);
            if (bubble) {
                const g = this.scene.add.graphics();
                g.fillStyle(this.themeConfig.bubbleColor, 0.6);
                g.fillCircle(bubble.size / 2, bubble.size / 2, bubble.size / 2);
                g.x = bubble.x;
                g.y = bubble.y;
                g.setDepth(3);
                this.bubbleGraphics.push(g);
                this.bubbles.push({ ...bubble, graphics: g });
            }
            this.lastBubbleSpawn = 0;
        }

        // Spawn jellyfish
        this.lastJellyfishSpawn += delta;
        if (this.lastJellyfishSpawn >= jellyfishInterval) {
            const jelly = this.generateJellyfish(playerX, playerY);
            if (jelly) {
                const g = this.scene.add.graphics();
                g.fillStyle(this.themeConfig.bubbleColor, 0.4);
                g.fillCircle(jelly.size / 2, jelly.size / 2, jelly.size / 2);
                // Add tentacle lines
                g.lineStyle(1, this.themeConfig.bubbleColor, 0.3);
                for (let i = 0; i < 4; i++) {
                    const tx = jelly.size / 2 + (Math.random() - 0.5) * 10;
                    g.lineBetween(jelly.size / 2, jelly.size / 2, tx, jelly.size + 10);
                }
                g.x = jelly.x;
                g.y = jelly.y;
                g.setDepth(3);
                this.jellyfishGraphics.push(g);
                this.jellyfish.push({ ...jelly, graphics: g });
            }
            this.lastJellyfishSpawn = 0;
        }

        // Update bubble positions (drift outward)
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.x += Math.cos(b.angle) * b.speed * (delta / 1000);
            b.y += Math.sin(b.angle) * b.speed * (delta / 1000);
            if (b.graphics) {
                b.graphics.x = b.x;
                b.graphics.y = b.y;
            }
            // Remove if too far from player
            const dx = b.x - playerX;
            const dy = b.y - playerY;
            if (Math.sqrt(dx * dx + dy * dy) > 1500) {
                if (b.graphics) b.graphics.destroy();
                this.bubbles.splice(i, 1);
                this.bubbleGraphics.splice(i, 1);
            }
        }

        // Update jellyfish positions
        for (let i = this.jellyfish.length - 1; i >= 0; i--) {
            const j = this.jellyfish[i];
            j.x += j.vx;
            j.y += j.vy;
            j.pulsePhase += delta * 0.003;
            if (j.graphics) {
                j.graphics.x = j.x;
                j.graphics.y = j.y;
                j.graphics.alpha = 0.3 + Math.sin(j.pulsePhase) * 0.2;
            }
            // Remove if too far from player
            const dx = j.x - playerX;
            const dy = j.y - playerY;
            if (Math.sqrt(dx * dx + dy * dy) > 2000) {
                if (j.graphics) j.graphics.destroy();
                this.jellyfish.splice(i, 1);
                this.jellyfishGraphics.splice(i, 1);
            }
        }
    }

    /**
     * Override parent update for decoration support
     * @param {number} delta - Delta time
     */
    update(delta) {
        super.update(delta);
    }

    /**
     * Clean up
     */
    destroy() {
        this.bubbles = [];
        this.jellyfish = [];
        this.lightSpots = [];
        this.bubbleGraphics.forEach(g => g.destroy());
        this.jellyfishGraphics.forEach(g => g.destroy());
        this.lightSpotGraphics.forEach(g => g.destroy());
        this.bubbleGraphics = [];
        this.jellyfishGraphics = [];
        this.lightSpotGraphics = [];
        if (this.transitionOverlay) this.transitionOverlay.destroy();
        super.destroy();
    }
}

export default BackgroundExpansion;