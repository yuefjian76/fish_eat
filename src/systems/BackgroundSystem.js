/**
 * BackgroundSystem - Underwater decoration system
 * Creates beautiful underwater backgrounds using real image assets
 */
export class BackgroundSystem {
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
    }

    /**
     * Create the full underwater background using real images
     */
    createBackground() {
        this._loadBackgroundImages();
        this._createBubbleAnimation();
    }

    /**
     * Load all background images
     */
    _loadBackgroundImages() {
        // Background layers should have depth 0-5
        // Fish and entities should have depth 10+
        // Player should have depth 15+

        // Load background layers
        this.bgImages.background = this.scene.add.image(512, 384, 'bg_undersea');
        this.bgImages.background.setDepth(0);
        this.bgImages.background.setScale(1.6); // Scale to cover 1024x768

        // Far parallax layer
        this.bgImages.far = this.scene.add.image(512, 384, 'far');
        this.bgImages.far.setDepth(1);
        this.bgImages.far.setAlpha(0.8);
        this.bgImages.far.setScale(1.6);

        // Midground with coral/vegetation
        this.bgImages.midground = this.scene.add.image(512, 450, 'midground');
        this.bgImages.midground.setDepth(2);
        this.bgImages.midground.setScale(1.6);

        // Sand floor at bottom
        this.bgImages.sand = this.scene.add.image(512, 760, 'sand');
        this.bgImages.sand.setDepth(3);
        this.bgImages.sand.setScale(1.6);

        // Foreground merged (coral and seaweed combined) - slightly transparent to see fish behind
        this.bgImages.foreground = this.scene.add.image(512, 700, 'foreground');
        this.bgImages.foreground.setDepth(4);
        this.bgImages.foreground.setAlpha(0.9);
        this.bgImages.foreground.setScale(1.6);

        // Store original positions for parallax
        this.parallaxBase = {
            far: { x: 512, y: 384 },
            midground: { x: 512, y: 450 }
        };
    }

    /**
     * Create bubble animation using sprite sheet
     */
    _createBubbleAnimation() {
        // Bubbles at depth 6, above background but below fish
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.screenWidth;
            const y = Math.random() * this.screenHeight + 50;
            const scale = 0.5 + Math.random() * 1.0;

            // Create bubble sprite
            const bubble = this.scene.add.image(x, y, 'bubbles');
            bubble.setDepth(6);
            bubble.setScale(scale);
            bubble.setAlpha(0.7);

            // Animate bubble
            this.scene.tweens.add({
                targets: bubble,
                y: -50,
                x: x + (Math.random() - 0.5) * 100,
                alpha: 0,
                scale: scale * 1.5,
                duration: 5000 + Math.random() * 5000,
                repeat: -1,
                yoyo: false,
                onRepeat: () => {
                    bubble.x = Math.random() * this.screenWidth;
                    bubble.y = this.screenHeight + 20;
                    bubble.alpha = 0.7;
                    bubble.setScale(0.5 + Math.random() * 1.0);
                }
            });

            this.bubbles.push(bubble);
        }
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
