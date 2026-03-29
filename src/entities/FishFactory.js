/**
 * FishFactory - Creates fish graphics with actual fish shapes
 */
export class FishFactory {
    /**
     * Create player fish with enhanced visuals and glow
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {string} fishType - Type of fish
     * @param {number} size - Size of fish
     * @param {number} color - Color as number
     * @returns {Phaser.GameObjects.Graphics}
     */
    static createPlayerFish(scene, fishType, size, color) {
        // 1.1x size for player
        const playerSize = size * 1.1;
        const graphics = FishFactory.createFish(scene, fishType, playerSize, color);

        // Add player glow effect
        const glowGraphics = scene.add.graphics();
        glowGraphics.fillStyle(0xFFFFFF, 0.2);
        glowGraphics.fillEllipse(0, 0, playerSize * 2.5, playerSize * 1.8);
        glowGraphics.setDepth(-1);

        // Store glow reference
        graphics.glowGraphics = glowGraphics;

        return graphics;
    }

    /**
     * Draw a fish shape
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {string} fishType - Type of fish
     * @param {number} size - Size of fish
     * @param {number} color - Color as number
     * @returns {Phaser.GameObjects.Graphics}
     */
    static createFish(scene, fishType, size, color) {
        const graphics = scene.add.graphics();

        // Get color as hex string for some styling
        const colorObj = Phaser.Display.Color.ValueToColor(color);
        const darkerColor = Phaser.Display.Color.IntegerToColor(
            Phaser.Display.Color.GetColor(
                Math.floor(colorObj.r * 0.7),
                Math.floor(colorObj.g * 0.7),
                Math.floor(colorObj.b * 0.7)
            )
        );

        switch (fishType) {
            case 'clownfish':
                // Clownfish - orange with white stripes
                FishFactory.drawClownfish(graphics, size, color, darkerColor);
                break;
            case 'shrimp':
                // Shrimp - pink/coral, curved shape
                FishFactory.drawShrimp(graphics, size, color, darkerColor);
                break;
            case 'shark':
                // Shark - gray, streamlined
                FishFactory.drawShark(graphics, size, color, darkerColor);
                break;
            default:
                // Default fish shape
                FishFactory.drawDefaultFish(graphics, size, color, darkerColor);
        }

        return graphics;
    }

    /**
     * Draw clownfish (orange with white stripes)
     */
    static drawClownfish(graphics, size, color, darkerColor) {
        // Body (ellipse)
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, 0, size * 1.8, size * 1.2);

        // White stripes
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(-size * 0.5, -size * 0.8, size * 0.25, size * 1.6);
        graphics.fillRect(size * 0.25, -size * 0.6, size * 0.2, size * 1.2);

        // Glowing stripe effect (for player fish)
        graphics.fillStyle(0xFFFFFF, 0.3);
        graphics.fillRect(-size * 0.5, -size * 0.8, size * 0.25, size * 1.6);
        graphics.fillRect(size * 0.25, -size * 0.6, size * 0.2, size * 1.2);

        // Tail (triangle)
        graphics.fillStyle(darkerColor.color, 1);
        const tailPoints = [
            { x: -size * 0.9, y: 0 },
            { x: -size * 1.4, y: -size * 0.5 },
            { x: -size * 1.4, y: size * 0.5 }
        ];
        graphics.fillTriangle(
            tailPoints[0].x, tailPoints[0].y,
            tailPoints[1].x, tailPoints[1].y,
            tailPoints[2].x, tailPoints[2].y
        );

        // Dorsal fin
        graphics.fillStyle(color, 1);
        const finPoints = [
            { x: 0, y: -size * 0.6 },
            { x: -size * 0.3, y: -size * 1.1 },
            { x: size * 0.3, y: -size * 0.6 }
        ];
        graphics.fillTriangle(
            finPoints[0].x, finPoints[0].y,
            finPoints[1].x, finPoints[1].y,
            finPoints[2].x, finPoints[2].y
        );

        // Eye
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(size * 0.5, -size * 0.1, size * 0.15);
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(size * 0.53, -size * 0.15, size * 0.06);

        // Mouth
        graphics.lineStyle(2, 0x000000, 0.5);
        graphics.beginPath();
        graphics.arc(size * 0.8, size * 0.1, size * 0.15, 0.2, Math.PI * 0.8, false);
        graphics.strokePath();
    }

    /**
     * Draw shrimp (curved, pink)
     */
    static drawShrimp(graphics, size, color, darkerColor) {
        // Body segments (curved line of circles)
        const segments = 5;
        for (let i = 0; i < segments; i++) {
            const x = -size * 0.6 + i * size * 0.35;
            const y = Math.sin(i * 0.8) * size * 0.2;
            const segSize = size * 0.4 - i * 0.03 * size;
            graphics.fillStyle(i % 2 === 0 ? color : darkerColor.color, 1);
            graphics.fillCircle(x, y, segSize);
        }

        // Tail fan
        graphics.fillStyle(darkerColor.color, 1);
        for (let i = -2; i <= 2; i++) {
            graphics.fillTriangle(
                size * 0.6, 0,
                size * 0.9, i * size * 0.2,
                size * 0.9, i * size * 0.2 + size * 0.15
            );
        }

        // Antennae (using simple lines instead of curves)
        graphics.lineStyle(2, darkerColor.color, 1);
        graphics.lineBetween(size * 0.3, -size * 0.2, size * 0.6, -size * 0.7);
        graphics.lineBetween(size * 0.6, -size * 0.7, size * 0.85, -size * 0.5);
        graphics.lineBetween(size * 0.3, size * 0.2, size * 0.6, size * 0.7);
        graphics.lineBetween(size * 0.6, size * 0.7, size * 0.85, size * 0.5);

        // Eyes
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(size * 0.1, -size * 0.1, size * 0.1);
        graphics.fillCircle(size * 0.1, size * 0.1, size * 0.1);
    }

    /**
     * Draw shark (gray, streamlined)
     */
    static drawShark(graphics, size, color, darkerColor) {
        // Main body (elongated ellipse)
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, 0, size * 2.5, size * 0.8);

        // Snout (cone)
        const snoutPoints = [
            { x: size * 1.2, y: 0 },
            { x: size * 1.8, y: 0 },
            { x: size * 1.2, y: size * 0.3 }
        ];
        graphics.fillTriangle(
            snoutPoints[0].x, snoutPoints[0].y,
            snoutPoints[1].x, snoutPoints[1].y,
            snoutPoints[2].x, snoutPoints[2].y
        );

        // Tail (heterocercal - top bigger than bottom)
        graphics.fillStyle(darkerColor.color, 1);
        // Upper lobe
        const tailTop = [
            { x: -size * 1.2, y: 0 },
            { x: -size * 2.0, y: -size * 0.9 },
            { x: -size * 1.5, y: 0 }
        ];
        graphics.fillTriangle(
            tailTop[0].x, tailTop[0].y,
            tailTop[1].x, tailTop[1].y,
            tailTop[2].x, tailTop[2].y
        );
        // Lower lobe
        const tailBottom = [
            { x: -size * 1.2, y: 0 },
            { x: -size * 1.6, y: size * 0.4 },
            { x: -size * 1.5, y: 0 }
        ];
        graphics.fillTriangle(
            tailBottom[0].x, tailBottom[0].y,
            tailBottom[1].x, tailBottom[1].y,
            tailBottom[2].x, tailBottom[2].y
        );

        // Dorsal fin
        const dorsalFin = [
            { x: -size * 0.2, y: -size * 0.4 },
            { x: -size * 0.5, y: -size * 1.2 },
            { x: size * 0.3, y: -size * 0.4 }
        ];
        graphics.fillTriangle(
            dorsalFin[0].x, dorsalFin[0].y,
            dorsalFin[1].x, dorsalFin[1].y,
            dorsalFin[2].x, dorsalFin[2].y
        );

        // Pectoral fin
        graphics.fillStyle(Phaser.Display.Color.IntegerToColor(
            Phaser.Display.Color.GetColor(
                Math.floor(Phaser.Display.Color.ValueToColor(color).r * 0.8),
                Math.floor(Phaser.Display.Color.ValueToColor(color).g * 0.8),
                Math.floor(Phaser.Display.Color.ValueToColor(color).b * 0.8)
            )
        ).color, 1);
        const pectoralFin = [
            { x: size * 0.2, y: size * 0.3 },
            { x: size * 0.5, y: size * 0.9 },
            { x: size * 0.6, y: size * 0.3 }
        ];
        graphics.fillTriangle(
            pectoralFin[0].x, pectoralFin[0].y,
            pectoralFin[1].x, pectoralFin[1].y,
            pectoralFin[2].x, pectoralFin[2].y
        );

        // Eye
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(size * 0.9, -size * 0.1, size * 0.12);

        // Gill slits
        graphics.lineStyle(2, darkerColor.color, 0.8);
        for (let i = 0; i < 3; i++) {
            graphics.beginPath();
            graphics.moveTo(size * 0.5 - i * size * 0.15, -size * 0.25);
            graphics.lineTo(size * 0.5 - i * size * 0.15, size * 0.1);
            graphics.strokePath();
        }

        // Teeth (in mouth)
        graphics.fillStyle(0xffffff, 1);
        for (let i = 0; i < 5; i++) {
            graphics.fillTriangle(
                size * 1.3 + i * size * 0.08, size * 0.05,
                size * 1.35 + i * size * 0.08, size * 0.15,
                size * 1.25 + i * size * 0.08, size * 0.05
            );
        }
    }

    /**
     * Draw default simple fish
     */
    static drawDefaultFish(graphics, size, color, darkerColor) {
        // Body
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, 0, size * 1.6, size);

        // Tail
        graphics.fillStyle(darkerColor.color, 1);
        graphics.fillTriangle(
            -size * 0.8, 0,
            -size * 1.3, -size * 0.5,
            -size * 1.3, size * 0.5
        );

        // Dorsal fin
        graphics.fillStyle(color, 1);
        graphics.fillTriangle(
            0, -size * 0.5,
            -size * 0.3, -size * 0.9,
            size * 0.3, -size * 0.5
        );

        // Eye
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(size * 0.4, -size * 0.1, size * 0.15);
    }
}

export default FishFactory;
