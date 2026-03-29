/**
 * BackgroundSystem - Procedural underwater decoration system
 * Creates bubbles, coral, and seaweed for海底 (underwater) backgrounds
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
        this.bubbleRespawnY = screenHeight + 20; // Slightly below screen
        this.bubbles = [];
        this.corals = [];
        this.seaweeds = [];
    }

    /**
     * Create rising bubble particles
     * @param {number} count - Number of bubbles to create
     */
    createBubbles(count = 10) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.screenWidth;
            const y = Math.random() * this.screenHeight + 50;
            const size = 2 + Math.random() * 6;

            // Create graphics for bubble
            const graphics = this.scene.add.graphics();
            graphics.setDepth(0);

            // Draw bubble (white/light blue circle with highlight)
            graphics.fillStyle(0xFFFFFF, 0.6);
            graphics.fillCircle(0, 0, size);
            graphics.fillStyle(0xAAEEFF, 0.4);
            graphics.fillCircle(-size * 0.3, -size * 0.3, size * 0.3);

            const bubble = {
                x,
                y,
                size,
                speed: 20 + Math.random() * 40, // 20-60 pixels/sec
                drift: (Math.random() - 0.5) * 20, // -10 to +10 horizontal drift
                graphics
            };

            graphics.setPosition(x, y);
            this.bubbles.push(bubble);
        }
    }

    /**
     * Create coral decoration
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Coral type: 'branch' | 'brain' | 'fan'
     * @param {number} color - RGB color value
     * @returns {object} Coral object
     */
    createCoral(x, y, type = 'branch', color = 0xFF6B6B) {
        const coral = {
            x,
            y,
            type,
            color,
            graphics: null
        };

        // Create graphics object for coral
        const graphics = this.scene.add.graphics();
        graphics.setDepth(1);

        // Draw coral based on type
        switch (type) {
            case 'branch':
                this._drawBranchCoral(graphics, x, y, color);
                break;
            case 'brain':
                this._drawBrainCoral(graphics, x, y, color);
                break;
            case 'fan':
                this._drawFanCoral(graphics, x, y, color);
                break;
            default:
                this._drawBranchCoral(graphics, x, y, color);
        }

        coral.graphics = graphics;
        this.corals.push(coral);

        return coral;
    }

    /**
     * Draw branch-style coral
     */
    _drawBranchCoral(graphics, x, y, color) {
        graphics.fillStyle(color, 1);
        graphics.lineStyle(2, color, 1);

        // Main stem
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x, y - 30);
        graphics.strokePath();

        // Branches
        graphics.beginPath();
        graphics.moveTo(x, y - 15);
        graphics.lineTo(x - 15, y - 35);
        graphics.moveTo(x, y - 20);
        graphics.lineTo(x + 12, y - 40);
        graphics.moveTo(x, y - 25);
        graphics.lineTo(x - 10, y - 45);
        graphics.strokePath();

        // Branch tips (small circles)
        graphics.fillStyle(color, 1);
        graphics.fillCircle(x - 15, y - 35, 4);
        graphics.fillCircle(x + 12, y - 40, 4);
        graphics.fillCircle(x - 10, y - 45, 4);
    }

    /**
     * Draw brain-style coral (rounded, bumpy)
     */
    _drawBrainCoral(graphics, x, y, color) {
        graphics.fillStyle(color, 1);

        // Main brain shape - oval
        graphics.fillEllipse(x, y - 15, 40, 25);

        // Add bumpy texture lines
        graphics.lineStyle(1, 0xFFFFFF, 0.3);
        graphics.beginPath();
        graphics.arc(x - 10, y - 18, 6, 0, Math.PI * 2);
        graphics.strokePath();
        graphics.beginPath();
        graphics.arc(x + 8, y - 15, 7, 0, Math.PI * 2);
        graphics.strokePath();
        graphics.beginPath();
        graphics.arc(x - 2, y - 20, 5, 0, Math.PI * 2);
        graphics.strokePath();
    }

    /**
     * Draw fan-style coral
     */
    _drawFanCoral(graphics, x, y, color) {
        graphics.fillStyle(color, 0.8);
        graphics.lineStyle(2, color, 1);

        // Fan shape using arc
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x - 25, y - 50);
        graphics.lineTo(x + 25, y - 50);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();

        // Fan ribs
        graphics.lineStyle(1, 0xFFFFFF, 0.2);
        for (let i = -20; i <= 20; i += 10) {
            graphics.beginPath();
            graphics.moveTo(x, y);
            graphics.lineTo(x + i, y - 48);
            graphics.strokePath();
        }
    }

    /**
     * Create swaying seaweed
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} height - Height of seaweed (default 100)
     * @param {number} color - RGB color value (default green)
     * @returns {object} Seaweed object
     */
    createSeaweed(x, y, height = 100, color = 0x2ECC71) {
        const seaweed = {
            x,
            y,
            height,
            color,
            graphics: null,
            tween: null
        };

        // Create graphics for seaweed
        const graphics = this.scene.add.graphics();
        graphics.setDepth(2);

        // Draw seaweed blade
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(x - 5, y); // Base left
        graphics.lineTo(x - 3, y - height); // Top left (slight curve)
        graphics.lineTo(x + 3, y - height); // Top right (slight curve)
        graphics.lineTo(x + 5, y); // Base right
        graphics.closePath();
        graphics.fillPath();

        // Add highlight
        graphics.fillStyle(0xFFFFFF, 0.2);
        graphics.beginPath();
        graphics.moveTo(x - 2, y);
        graphics.lineTo(x - 1, y - height + 10);
        graphics.lineTo(x + 1, y - height + 10);
        graphics.lineTo(x + 2, y);
        graphics.closePath();
        graphics.fillPath();

        seaweed.graphics = graphics;

        // Add sway animation using tween
        const tween = this.scene.tweens.add({
            targets: graphics,
            angle: { from: -5, to: 5 },
            duration: 1500 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        seaweed.tween = tween;
        this.seaweeds.push(seaweed);

        return seaweed;
    }

    /**
     * Update bubble positions
     * @param {number} delta - Time delta in ms
     */
    update(delta) {
        const deltaSec = delta / 1000; // Convert to seconds

        for (const bubble of this.bubbles) {
            // Move bubble up
            bubble.y -= bubble.speed * deltaSec;

            // Apply horizontal drift
            bubble.x += bubble.drift * deltaSec;

            // Keep within screen bounds horizontally
            if (bubble.x < 0) bubble.x = this.screenWidth;
            if (bubble.x > this.screenWidth) bubble.x = 0;

            // Update graphics position
            if (bubble.graphics && bubble.graphics.active) {
                bubble.graphics.setPosition(bubble.x, bubble.y);
            }

            // Respawn at bottom if bubble goes off top
            if (bubble.y < -10) {
                bubble.y = this.bubbleRespawnY;
                bubble.x = Math.random() * this.screenWidth;
            }
        }
    }

    /**
     * Clean up all graphics and animations
     */
    destroy() {
        // Destroy bubble graphics
        for (const bubble of this.bubbles) {
            if (bubble.graphics) {
                bubble.graphics.destroy();
            }
        }
        this.bubbles = [];

        // Destroy coral graphics
        for (const coral of this.corals) {
            if (coral.graphics) {
                coral.graphics.destroy();
            }
        }
        this.corals = [];

        // Destroy seaweed graphics and tweens
        for (const seaweed of this.seaweeds) {
            if (seaweed.tween) {
                seaweed.tween.stop();
            }
            if (seaweed.graphics) {
                seaweed.graphics.destroy();
            }
        }
        this.seaweeds = [];
    }
}

export default BackgroundSystem;
