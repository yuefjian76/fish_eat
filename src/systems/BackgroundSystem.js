/**
 * BackgroundSystem - Underwater decoration system
 * Creates beautiful underwater backgrounds with canvas-generated textures
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
        this.bubbleRespawnY = screenHeight + 20;
        this.bubbles = [];
        this.corals = [];
        this.seaweeds = [];
        this.bgGraphics = null;
    }

    /**
     * Create the full underwater background with gradient, light rays, and particles
     */
    createBackground() {
        // Create background graphics layer
        this.bgGraphics = this.scene.add.graphics();
        this.bgGraphics.setDepth(0);

        // Draw gradient background
        this._drawGradientBackground();

        // Draw light rays from top
        this._drawLightRays();

        // Draw underwater particles (sand, dust)
        this._drawUnderwaterParticles();

        // Create bubbles with proper graphics
        this.createBubbles(25);

        // Create multiple corals with better visuals
        this._createCoralField();

        // Create seaweed with better visuals
        this._createSeaweedField();
    }

    /**
     * Draw gradient underwater background
     */
    _drawGradientBackground() {
        const graphics = this.bgGraphics;
        const height = this.screenHeight;
        const width = this.screenWidth;

        // Deep sea gradient colors
        const colors = [
            { y: 0, color: [20, 60, 100] },      // Top - lighter blue
            { y: 0.3, color: [10, 40, 80] },    // Upper middle
            { y: 0.6, color: [5, 30, 60] },     // Lower middle
            { y: 1.0, color: [2, 15, 40] }      // Bottom - deep blue
        ];

        // Draw gradient segments
        const segmentHeight = height / 100;
        for (let i = 0; i < 100; i++) {
            const ratio = i / 100;
            let color;
            for (let j = 0; j < colors.length - 1; j++) {
                if (ratio >= colors[j].y && ratio < colors[j + 1].y) {
                    const localRatio = (ratio - colors[j].y) / (colors[j + 1].y - colors[j].y);
                    color = this._interpolateColor(colors[j].color, colors[j + 1].color, localRatio);
                    break;
                }
            }

            const r = Math.floor(color[0]);
            const g = Math.floor(color[1]);
            const b = Math.floor(color[2]);
            const phaserColor = (r << 16) | (g << 8) | b;

            graphics.fillStyle(phaserColor, 1);
            graphics.fillRect(0, i * segmentHeight, width, segmentHeight + 1);
        }
    }

    /**
     * Interpolate between two colors
     */
    _interpolateColor(c1, c2, ratio) {
        return [
            c1[0] + (c2[0] - c1[0]) * ratio,
            c1[1] + (c2[1] - c1[1]) * ratio,
            c1[2] + (c2[2] - c1[2]) * ratio
        ];
    }

    /**
     * Draw light rays from surface
     */
    _drawLightRays() {
        const graphics = this.bgGraphics;

        // Draw 5 light rays
        const rayPositions = [150, 350, 550, 750, 900];
        for (const x of rayPositions) {
            // Ray gradient
            for (let i = 0; i < 20; i++) {
                const alpha = 0.03 * (1 - i / 20);
                const rayWidth = 30 + i * 4;
                const color = Phaser.Display.Color.GetColor(100, 150, 200);
                graphics.fillStyle(color, alpha);
                graphics.fillTriangle(
                    x, 0,
                    x - rayWidth, this.screenHeight * 0.7,
                    x + rayWidth, this.screenHeight * 0.7
                );
            }
        }
    }

    /**
     * Draw floating particles (sand, dust, plankton)
     */
    _drawUnderwaterParticles() {
        const graphics = this.bgGraphics;

        // Add some floating particles
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.screenWidth;
            const y = Math.random() * this.screenHeight;
            const size = 1 + Math.random() * 2;
            const alpha = 0.1 + Math.random() * 0.2;

            graphics.fillStyle(0xFFFFFF, alpha);
            graphics.fillCircle(x, y, size);
        }
    }

    /**
     * Create a field of corals
     */
    _createCoralField() {
        // Branch coral positions
        const branchPositions = [
            { x: 50, y: 720, scale: 1.2 },
            { x: 120, y: 740, scale: 0.8 },
            { x: 200, y: 730, scale: 1.0 },
            { x: 780, y: 725, scale: 1.1 },
            { x: 880, y: 745, scale: 0.9 },
            { x: 960, y: 735, scale: 1.0 }
        ];

        for (const pos of branchPositions) {
            this.createCoral(pos.x, pos.y, 'branch', 0xFF6B6B, pos.scale);
        }

        // Brain coral positions
        const brainPositions = [
            { x: 300, y: 750, scale: 1.0 },
            { x: 600, y: 755, scale: 0.8 },
            { x: 700, y: 745, scale: 1.2 }
        ];

        for (const pos of brainPositions) {
            this.createCoral(pos.x, pos.y, 'brain', 0xFF8888, pos.scale);
        }

        // Fan coral positions
        const fanPositions = [
            { x: 400, y: 760, scale: 1.0 },
            { x: 500, y: 755, scale: 0.9 }
        ];

        for (const pos of fanPositions) {
            this.createCoral(pos.x, pos.y, 'fan', 0xFFAA88, pos.scale);
        }
    }

    /**
     * Create a field of seaweed
     */
    _createSeaweedField() {
        const positions = [
            { x: 30, y: 768, height: 180, color: 0x228B22 },
            { x: 80, y: 768, height: 150, color: 0x32CD32 },
            { x: 250, y: 768, height: 170, color: 0x228B22 },
            { x: 420, y: 768, height: 160, color: 0x32CD32 },
            { x: 580, y: 768, height: 190, color: 0x228B22 },
            { x: 750, y: 768, height: 140, color: 0x32CD32 },
            { x: 850, y: 768, height: 175, color: 0x228B22 },
            { x: 990, y: 768, height: 155, color: 0x32CD32 }
        ];

        for (const pos of positions) {
            this.createSeaweed(pos.x, pos.y, pos.height, pos.color);
        }
    }

    /**
     * Create rising bubble particles with improved visuals
     */
    createBubbles(count = 20) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.screenWidth;
            const y = Math.random() * this.screenHeight + 50;
            const size = 3 + Math.random() * 8; // 3-11 pixels

            // Create graphics for bubble
            const graphics = this.scene.add.graphics();
            graphics.setDepth(3);

            // Draw bubble with gradient effect
            // Outer bubble
            graphics.fillStyle(0xFFFFFF, 0.4);
            graphics.fillCircle(0, 0, size);

            // Inner highlight
            graphics.fillStyle(0xAAFFFF, 0.3);
            graphics.fillCircle(-size * 0.3, -size * 0.3, size * 0.5);

            // Small reflection
            graphics.fillStyle(0xFFFFFF, 0.7);
            graphics.fillCircle(-size * 0.4, -size * 0.4, size * 0.15);

            const bubble = {
                x,
                y,
                size,
                speed: 15 + Math.random() * 35, // 15-50 pixels/sec
                drift: (Math.random() - 0.5) * 15,
                wobbleOffset: Math.random() * Math.PI * 2,
                wobbleSpeed: 1 + Math.random() * 2,
                graphics
            };

            graphics.setPosition(x, y);
            this.bubbles.push(bubble);
        }
    }

    /**
     * Create coral decoration with improved visuals
     */
    createCoral(x, y, type = 'branch', color = 0xFF6B6B, scale = 1.0) {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(2);

        switch (type) {
            case 'branch':
                this._drawBranchCoral(graphics, x, y, color, scale);
                break;
            case 'brain':
                this._drawBrainCoral(graphics, x, y, color, scale);
                break;
            case 'fan':
                this._drawFanCoral(graphics, x, y, color, scale);
                break;
        }

        this.corals.push({ x, y, type, color, scale, graphics });
        return { x, y, type, color, scale, graphics };
    }

    /**
     * Draw branch-style coral with better visuals
     */
    _drawBranchCoral(graphics, x, y, color, scale) {
        const s = scale;
        graphics.fillStyle(color, 1);

        // Main stem
        graphics.lineStyle(6 * s, color, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x, y - 50 * s);
        graphics.strokePath();

        // Branches
        graphics.lineStyle(4 * s, color, 1);
        graphics.beginPath();
        graphics.moveTo(x, y - 20 * s);
        graphics.lineTo(x - 20 * s, y - 55 * s);
        graphics.moveTo(x, y - 30 * s);
        graphics.lineTo(x + 15 * s, y - 60 * s);
        graphics.moveTo(x, y - 40 * s);
        graphics.lineTo(x - 12 * s, y - 70 * s);
        graphics.moveTo(x, y - 35 * s);
        graphics.lineTo(x + 18 * s, y - 75 * s);
        graphics.strokePath();

        // Branch tips (polyp balls)
        graphics.fillStyle(color, 1);
        const tips = [
            { dx: -20, dy: -55, r: 6 },
            { dx: 15, dy: -60, r: 5 },
            { dx: -12, dy: -70, r: 5 },
            { dx: 18, dy: -75, r: 6 },
            { dx: 0, dy: -50, r: 4 }
        ];
        for (const tip of tips) {
            graphics.fillCircle(x + tip.dx * s, y + tip.dy * s, tip.r * s);
        }

        // Add highlight
        graphics.fillStyle(0xFFFFFF, 0.2);
        graphics.fillCircle(x - 2 * s, y - 30 * s, 3 * s);
    }

    /**
     * Draw brain-style coral
     */
    _drawBrainCoral(graphics, x, y, color, scale) {
        const s = scale;

        // Main brain shape
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(x, y - 20 * s, 50 * s, 35 * s);

        // Add ridges
        graphics.lineStyle(2 * s, 0xFFFFFF, 0.3);
        for (let i = -20; i <= 20; i += 8) {
            graphics.beginPath();
            graphics.arc(x + i * s, y - 20 * s, 15 * s, Math.PI * 0.8, Math.PI * 2);
            graphics.strokePath();
        }

        // Base
        const baseColor = Phaser.Display.Color.ValueToColor(color);
        const darkColor = Phaser.Display.Color.GetColor(
            Math.floor(baseColor.r * 0.7),
            Math.floor(baseColor.g * 0.7),
            Math.floor(baseColor.b * 0.7)
        );
        graphics.fillStyle(darkColor, 1);
        graphics.fillRect(x - 25 * s, y - 5 * s, 50 * s, 10 * s);
    }

    /**
     * Draw fan-style coral
     */
    _drawFanCoral(graphics, x, y, color, scale) {
        const s = scale;

        // Fan shape
        graphics.fillStyle(color, 0.9);

        // Draw fan with ribs
        const fanWidth = 60 * s;
        const fanHeight = 80 * s;

        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x - fanWidth / 2, y - fanHeight);
        graphics.lineTo(x + fanWidth / 2, y - fanHeight);
        graphics.closePath();
        graphics.fillPath();

        // Fan ribs
        graphics.lineStyle(2 * s, 0xFFFFFF, 0.25);
        for (let i = -25; i <= 25; i += 10) {
            const topX = x + i * s;
            const topY = y - fanHeight + (Math.abs(i) / 25) * 20 * s;
            graphics.beginPath();
            graphics.moveTo(x, y - 5 * s);
            graphics.lineTo(topX, topY);
            graphics.strokePath();
        }

        // Stem
        graphics.lineStyle(4 * s, color, 1);
        graphics.beginPath();
        graphics.moveTo(x, y);
        graphics.lineTo(x, y - 10 * s);
        graphics.strokePath();
    }

    /**
     * Create seaweed with improved visuals
     */
    createSeaweed(x, y, height = 100, color = 0x2ECC71) {
        const graphics = this.scene.add.graphics();
        graphics.setDepth(2);

        // Draw seaweed blade
        const baseWidth = 12;
        const topWidth = 4;

        // Main blade with gradient effect
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(x - baseWidth / 2, y);
        graphics.quadraticCurveTo(x - baseWidth / 3, y - height / 2, x, y - height);
        graphics.quadraticCurveTo(x + baseWidth / 3, y - height / 2, x + baseWidth / 2, y);
        graphics.closePath();
        graphics.fillPath();

        // Highlight on blade
        graphics.fillStyle(0xFFFFFF, 0.15);
        graphics.beginPath();
        graphics.moveTo(x - 2, y);
        graphics.quadraticCurveTo(x - 1, y - height / 2, x, y - height);
        graphics.quadraticCurveTo(x + 1, y - height / 2, x + 2, y);
        graphics.closePath();
        graphics.fillPath();

        // Add secondary blades
        const secColor = Phaser.Display.Color.ValueToColor(color);
        const secDarkColor = Phaser.Display.Color.GetColor(
            Math.floor(secColor.r * 0.6),
            Math.floor(secColor.g * 0.6),
            Math.floor(secColor.b * 0.6)
        );
        graphics.fillStyle(secDarkColor, 0.8);
        for (let i = 1; i <= 2; i++) {
            const offset = i * 8;
            const bladeHeight = height * (0.6 - i * 0.1);
            graphics.beginPath();
            graphics.moveTo(x + offset, y);
            graphics.quadraticCurveTo(x + offset + 5, y - bladeHeight / 2, x + offset + 3, y - bladeHeight);
            graphics.quadraticCurveTo(x + offset + 2, y - bladeHeight / 2, x + offset + 5, y);
            graphics.closePath();
            graphics.fillPath();
        }

        // Sway animation
        const tween = this.scene.tweens.add({
            targets: graphics,
            angle: { from: -4, to: 4 },
            duration: 2000 + Math.random() * 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.seaweeds.push({ x, y, height, color, graphics, tween });
        return { x, y, height, color, graphics, tween };
    }

    /**
     * Update bubble positions
     */
    update(delta) {
        const deltaSec = delta / 1000;
        const time = this.scene.time.now / 1000;

        for (const bubble of this.bubbles) {
            // Move bubble up
            bubble.y -= bubble.speed * deltaSec;

            // Apply wobble effect
            const wobble = Math.sin(time * bubble.wobbleSpeed + bubble.wobbleOffset) * 2;
            const newX = bubble.x + bubble.drift * deltaSec + wobble;

            // Keep within screen bounds horizontally
            if (newX < 0) {
                bubble.x = this.screenWidth;
            } else if (newX > this.screenWidth) {
                bubble.x = 0;
            } else {
                bubble.x = newX;
            }

            // Update graphics position
            if (bubble.graphics && bubble.graphics.active) {
                bubble.graphics.setPosition(bubble.x, bubble.y);
            }

            // Respawn at bottom if bubble goes off top
            if (bubble.y < -15) {
                bubble.y = this.bubbleRespawnY;
                bubble.x = Math.random() * this.screenWidth;
            }
        }
    }

    /**
     * Clean up all graphics and animations
     */
    destroy() {
        if (this.bgGraphics) {
            this.bgGraphics.destroy();
        }

        for (const bubble of this.bubbles) {
            if (bubble.graphics) {
                bubble.graphics.destroy();
            }
        }
        this.bubbles = [];

        for (const coral of this.corals) {
            if (coral.graphics) {
                coral.graphics.destroy();
            }
        }
        this.corals = [];

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
