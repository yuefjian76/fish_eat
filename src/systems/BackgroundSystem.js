/**
 * BackgroundSystem - Underwater decoration system
 * Creates beautiful underwater backgrounds using real image assets
 * Supports multiple themes: undersea, tropical, polar (via color tinting)
 */
export class BackgroundSystem {
    /**
     * Theme configurations
     * Each theme has its own image assets and color settings
     *
     * Note: Tropical and Polar themes currently use the same base images
     * with color tinting. When proper themed assets are available,
     * update the 'images' keys to use theme-specific assets.
     */
    static THEME_CONFIG = {
        undersea: {
            name: 'Undersea',
            tint: 0xFFFFFF,      // No tint - original deep blue colors
            bubbleColor: 0xAADDFF,
            backgrounds: ['bg_undersea_theme', 'background_undersea_theme2', 'background_undersea_theme3'],
            images: {
                background: 'bg_undersea_theme',
                far: 'far',
                midground: 'midground_undersea_theme',
                sand: 'sand',
                foreground: 'foreground_undersea_theme'
            }
        },
        tropical: {
            name: 'Tropical',
            tint: 0xFFFFFF,      // No tint - use original vibrant tropical colors
            bubbleColor: 0xAAFFDD,
            backgrounds: ['bg_tropical_theme', 'background_tropical_theme', 'background_tropical_theme3'],
            images: {
                background: 'bg_tropical_theme',
                far: 'far',
                midground: 'midground_tropical_theme',
                sand: 'sand',
                foreground: 'foreground_tropical_theme'
            }
        },
        polar: {
            name: 'Polar',
            tint: 0xCCEEFF,      // Subtle ice-blue tint
            bubbleColor: 0xCCEEFF,
            backgrounds: ['bg_polar_theme', 'background_polar_theme2', 'background_polar_theme3'],
            images: {
                background: 'bg_polar_theme',
                far: 'far',
                midground: 'midground_polar_theme',
                sand: 'sand',
                foreground: 'foreground_polar_theme'
            }
        }
    };

    static THEMES = ['undersea', 'tropical', 'polar'];

    /**
     * @param {object} scene - Phaser scene reference
     * @param {number} screenWidth - Screen width (default 1024)
     * @param {number} screenHeight - Screen height (default 768)
     */
    constructor(scene, screenWidth = 1024, screenHeight = 768) {
        this.scene = scene;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.bubbleRespawnY = screenHeight + 50;
        this.bubbles = [];
        this.bgImages = {};
        this.bubbleFrames = [];
        this.currentBubbleFrame = 0;
        this.lastBubbleFrameTime = 0;

        // Select random theme for this game session
        this.theme = BackgroundSystem.THEMES[Phaser.Math.Between(0, BackgroundSystem.THEMES.length - 1)];
        this.themeConfig = BackgroundSystem.THEME_CONFIG[this.theme];
        // Select random background variation from available backgrounds
        const backgrounds = this.themeConfig.backgrounds;
        this.selectedBackground = backgrounds[Phaser.Math.Between(0, backgrounds.length - 1)];
    }

    /**
     * Create the full underwater background using real images
     */
    createBackground() {
        this._loadBackgroundImages();
        this._createBubbleAnimation();
    }

    /**
     * Load all background images with consistent sizing
     * Uses theme-specific image assets
     */
    _loadBackgroundImages() {
        // Background layers should have depth 0-5
        // Fish and entities should have depth 10+
        // Player should have depth 15+

        const themeTint = this.themeConfig.tint;
        const themeImages = this.themeConfig.images;
        const targetWidth = this.screenWidth;
        const targetHeight = this.screenHeight;

        // Load background layers - use setDisplaySize for consistent sizing
        this.bgImages.background = this.scene.add.image(512, 384, this.selectedBackground);
        this.bgImages.background.setDepth(0);
        this.bgImages.background.setDisplaySize(targetWidth, targetHeight);
        if (themeTint !== 0xFFFFFF) {
            this.bgImages.background.setTint(themeTint);
        }

        // Far parallax layer - more transparent for smooth blending with background
        this.bgImages.far = this.scene.add.image(512, 384, themeImages.far);
        this.bgImages.far.setDepth(1);
        this.bgImages.far.setAlpha(0.6);
        this.bgImages.far.setDisplaySize(targetWidth, targetHeight);
        if (themeTint !== 0xFFFFFF) {
            this.bgImages.far.setTint(themeTint);
        }

        // Midground - centered, same size as background
        this.bgImages.midground = this.scene.add.image(512, 384, themeImages.midground);
        this.bgImages.midground.setDepth(2);
        this.bgImages.midground.setAlpha(0.5);
        this.bgImages.midground.setDisplaySize(targetWidth, targetHeight);
        if (themeTint !== 0xFFFFFF) {
            this.bgImages.midground.setTint(themeTint);
        }

        // Sand floor at bottom - stays at bottom
        this.bgImages.sand = this.scene.add.image(512, 760, themeImages.sand);
        this.bgImages.sand.setDepth(3);
        this.bgImages.sand.setDisplaySize(targetWidth, targetHeight);
        if (themeTint !== 0xFFFFFF) {
            this.bgImages.sand.setTint(themeTint);
        }

        // Foreground - centered, same size as background
        this.bgImages.foreground = this.scene.add.image(512, 384, themeImages.foreground);
        this.bgImages.foreground.setDepth(3);
        this.bgImages.foreground.setAlpha(0.3);
        this.bgImages.foreground.setDisplaySize(targetWidth, targetHeight);
        if (themeTint !== 0xFFFFFF) {
            this.bgImages.foreground.setTint(themeTint);
        }

        // Store original positions for parallax
        this.parallaxBase = {
            far: { x: 512, y: 384 },
            midground: { x: 512, y: 384 }
        };
    }

    /**
     * Apply theme tint to all background images
     * @param {number} tint - RGB tint color
     * @param {number} bubbleColor - Bubble color for this theme
     */
    _applyThemeTint(tint, bubbleColor) {
        const images = ['background', 'far', 'midground', 'sand', 'foreground'];
        images.forEach(key => {
            if (this.bgImages[key]) {
                if (tint !== 0xFFFFFF) {
                    this.bgImages[key].setTint(tint);
                } else {
                    this.bgImages[key].clearTint();
                }
            }
        });
        // Update bubble color for new theme
        this.themeConfig.bubbleColor = bubbleColor;
    }

    /**
     * Transition to a new theme with a smooth fade effect
     * @param {string} newTheme - Theme key to transition to
     * @param {number} duration - Transition duration in ms (default 1000)
     */
    transitionToTheme(newTheme, duration = 1000) {
        if (!BackgroundSystem.THEME_CONFIG[newTheme]) {
            console.warn(`Unknown theme: ${newTheme}`);
            return;
        }

        const oldTint = this.themeConfig.tint;
        const newTint = BackgroundSystem.THEME_CONFIG[newTheme].tint;

        // If same tint, no transition needed
        if (oldTint === newTint) return;

        this.theme = newTheme;
        this.themeConfig = BackgroundSystem.THEME_CONFIG[newTheme];

        // Create overlay for fade transition
        const overlay = this.scene.add.graphics();
        overlay.setDepth(100); // Above all background layers

        // Fade to black/white then to new tint
        this.scene.tweens.add({
            targets: overlay,
            alpha: 1,
            duration: duration / 2,
            ease: 'Sine.easeIn',
            onComplete: () => {
                // Change tint at midpoint
                this._applyThemeTint(newTint, this.themeConfig.bubbleColor);

                // Fade back
                this.scene.tweens.add({
                    targets: overlay,
                    alpha: 0,
                    duration: duration / 2,
                    ease: 'Sine.easeOut',
                    onComplete: () => {
                        overlay.destroy();
                    }
                });
            }
        });

        // Draw overlay (black with transparency for fade effect)
        overlay.fillStyle(0x000000, 1);
        overlay.fillRect(0, 0, this.screenWidth, this.screenHeight);
        overlay.setAlpha(0);
    }

    /**
     * Create bubble animation using procedural drawing
     */
    _createBubbleAnimation() {
        const bubbleCount = 70;
        for (let i = 0; i < bubbleCount; i++) {
            this.createBubble();
        }
    }

    createBubble() {
        const rand = Math.random();
        const size = 3 + Math.pow(rand, 0.7) * 22; // 3-25 pixels
        const x = Math.random() * this.screenWidth;
        const y = Math.random() * this.screenHeight + 50;
        const baseAlpha = 0.2 + rand * 0.5; // 0.2-0.7
        const speed = 2000 + Math.random() * 6000; // 2-8 seconds

        // Use theme-specific bubble color
        const bubbleColor = this.themeConfig.bubbleColor;

        // Create bubble with procedural drawing
        const bubble = this.scene.add.graphics();
        bubble.fillStyle(bubbleColor, baseAlpha);
        bubble.fillCircle(size/2, size/2, size/2);
        bubble.lineStyle(1, bubbleColor, baseAlpha * 0.8);
        bubble.strokeCircle(size/2, size/2, size/2);
        bubble.fillStyle(0xFFFFFF, 0.5);
        bubble.fillCircle(size * 0.3, size * 0.3, size * 0.15);

        bubble.x = x;
        bubble.y = y;
        bubble.setDepth(6);

        const targetY = -50;
        const wobbleAmount = 30 + Math.random() * 50;
        const wobbleSpeed = 500 + Math.random() * 1000;
        const horizontalDrift = (25 - size) * 0.5;

        // Rising animation
        this.scene.tweens.add({
            targets: bubble,
            y: targetY,
            x: x + horizontalDrift * (Math.random() > 0.5 ? 1 : -1),
            alpha: { from: baseAlpha, to: 0 },
            duration: speed,
            ease: 'Sine.easeOut',
            onRepeat: () => {
                bubble.x = Math.random() * this.screenWidth;
                bubble.y = this.screenHeight + 20;
                bubble.alpha = baseAlpha;
                bubble.setScale(1);
                if (Math.random() < 0.05) {
                    this.createRipple(bubble.x, 50);
                }
            },
            repeat: -1
        });

        // Sine wave wobble
        this.scene.tweens.add({
            targets: bubble,
            x: `+=${wobbleAmount}`,
            duration: wobbleSpeed,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.bubbles.push(bubble);
    }

    createRipple(x, y) {
        const ripple = this.scene.add.graphics();
        ripple.x = x;
        ripple.y = y;
        ripple.setDepth(6);
        ripple.lineStyle(2, this.themeConfig.bubbleColor, 0.6);
        ripple.strokeCircle(0, 0, 5);

        this.scene.tweens.add({
            targets: ripple,
            scaleX: 4,
            scaleY: 0.3,
            alpha: 0,
            duration: 800,
            ease: 'Quad.easeOut',
            onComplete: () => ripple.destroy()
        });
    }

    /**
     * Update background - called every frame
     */
    update(delta) {
        // Simple parallax effect based on player position
        if (this.playerX !== undefined && this.parallaxBase) {
            const offsetX = (this.playerX - this.screenWidth / 2) * 0.02;

            if (this.bgImages.far) {
                this.bgImages.far.x = this.parallaxBase.far.x - offsetX * 0.3;
            }
            if (this.bgImages.midground) {
                this.bgImages.midground.x = this.parallaxBase.midground.x - offsetX * 0.5;
            }
        }
    }

    /**
     * Set player position for parallax effect
     */
    setPlayerPosition(x, y) {
        this.playerX = x;
        this.playerY = y;
    }

    /**
     * Clean up
     */
    destroy() {
        // Destroy all background images
        for (const key of Object.keys(this.bgImages)) {
            if (this.bgImages[key]) {
                this.bgImages[key].destroy();
            }
        }
        this.bgImages = {};

        // Destroy bubbles
        for (const bubble of this.bubbles) {
            if (bubble) bubble.destroy();
        }
        this.bubbles = [];
    }
}

export default BackgroundSystem;
