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

        // Create bubble with procedural drawing
        const bubble = this.scene.add.graphics();
        bubble.fillStyle(0xAADDFF, baseAlpha);
        bubble.fillCircle(size/2, size/2, size/2);
        bubble.lineStyle(1, 0xCCEEFF, baseAlpha * 0.8);
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
        ripple.lineStyle(2, 0xAADDFF, 0.6);
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
