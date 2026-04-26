/**
 * FishFactory - Creates fish graphics with actual fish shapes
 */
export class FishFactory {
    /**
     * Fish type to frame key mapping
     */
    static FISH_FRAME_CONFIG = {
        // AI-generated frame animation (game art style)
        // All use transparent PNG files
        clownfish: { baseKey: 'transparent_clownfish', totalFrames: 4, isPlayer: true, useTransparent: true },
        small_fish: { baseKey: null, totalFrames: 0, isPlayer: false },
        shark: { baseKey: 'transparent_shark', totalFrames: 4, isPlayer: false, useTransparent: true },
        shrimp: { baseKey: 'transparent_shrimp', totalFrames: 4, isPlayer: false, useTransparent: true },
        jellyfish: { baseKey: 'transparent_jellyfish', totalFrames: 6, isPlayer: false, useTransparent: true },
        anglerfish: { baseKey: 'transparent_anglerfish', totalFrames: 6, isPlayer: false, useTransparent: true },
        seahorse: { baseKey: 'transparent_seahorse', totalFrames: 6, isPlayer: false, useTransparent: true },
        octopus: { baseKey: 'transparent_octopus', totalFrames: 4, isPlayer: false, useTransparent: true },
        eel: { baseKey: 'transparent_eel', totalFrames: 4, isPlayer: false, useTransparent: true },
        mutant_shark: { baseKey: 'transparent_mutant_shark', totalFrames: 4, isPlayer: false, useTransparent: true },
        giant_jellyfish: { baseKey: 'transparent_giant_jellyfish', totalFrames: 4, isPlayer: false, useTransparent: true },
        boss_squid: { baseKey: 'transparent_boss_squid', totalFrames: 4, isPlayer: false, useTransparent: true },
        boss_shark_king: { baseKey: 'transparent_shark_king', totalFrames: 4, isPlayer: false, useTransparent: true },
        boss_sea_dragon: { baseKey: 'transparent_boss_sea_dragon', totalFrames: 4, isPlayer: false, useTransparent: true },
    };

    /**
     * Create fish using AI-generated frame animation with Phaser sprite
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {string} fishType - Type of fish (clownfish, shark, shrimp, jellyfish)
     * @param {number} scale - Scale factor
     * @param {number} frame - Animation frame (unused, animation handles it)
     * @returns {Phaser.GameObjects.Sprite}
     */
    static createFishFromFrames(scene, fishType, scale = 1.0, frame = 0) {
        const config = FishFactory.FISH_FRAME_CONFIG[fishType];

        // Fall back to legacy sprite or procedural if no frames available
        if (!config || !config.baseKey) {
            // Try legacy sprite first
            if (fishType === 'clownfish' || fishType === 'shark') {
                return FishFactory.createEnemyFromSprite(scene, fishType === 'clownfish' ? 'fish' : 'fish_big', scale, frame);
            }
            // Procedural drawing fallback
            const color = FishFactory.getFishColor(fishType);
            const graphics = FishFactory.createFish(scene, fishType, 30 * scale, color);
            return graphics;
        }

        // Get the first frame texture to create the sprite
        // Naming: transparent_clownfish_1a (variant 1, pose a)
        // Randomly select variant based on available frames
        const maxVariants = config.totalFrames || 4;
        const variant = Math.floor(Math.random() * maxVariants) + 1; // 1 to maxVariants
        const firstFrameKey = `${config.baseKey}_${variant}a`;

        // Check if texture exists
        const textureManager = scene.textures;
        if (!textureManager.exists(firstFrameKey)) {
            console.warn(`FishFactory: Frame texture '${firstFrameKey}' not found for '${fishType}', using fallback`);
            // Fall back to procedural drawing
            const fallbackColor = FishFactory.getFishColor(fishType);
            const fallbackGraphics = FishFactory.createFish(scene, fishType, 30 * scale, fallbackColor);
            fallbackGraphics.setDepth(config.isPlayer ? 100 : 30);
            return fallbackGraphics;
        }

        // Create sprite with first frame
        // 512x512 sprite should display at `scale * 30` pixels (matching fish size unit)
        // So: aiScale = (scale * 30) / 512
        const aiScale = (scale * 30) / 512;
        const sprite = scene.add.sprite(0, 0, firstFrameKey);
        sprite.setScale(aiScale);
        // Transparent PNGs use full opacity; JPG backgrounds use 0.85 for blending
        sprite.setAlpha(config.useTransparent ? 1.0 : 0.85);
        sprite.setDepth(config.isPlayer ? 100 : 30);

        // Store fish type for animation lookup
        sprite.fishType = fishType;
        sprite.variant = variant; // Store selected variant
        sprite.animKey = `${config.baseKey}`; // e.g., 'transparent_clownfish'
        sprite.useTransparent = config.useTransparent;

        // Play animation for selected variant (e.g., clownfish_swim_1, clownfish_swim_2, or clownfish_swim_3)
        const animKey = `${fishType}_swim_${variant}`;
        if (sprite.anims && sprite.anims.exists(animKey)) {
            sprite.play(animKey);
        }

        // Add glow for player fish
        if (config.isPlayer) {
            const glowGraphics = scene.add.graphics();
            glowGraphics.fillStyle(0xFFFF88, 0.25);
            glowGraphics.fillEllipse(0, 0, 60 * aiScale, 40 * aiScale);
            glowGraphics.setDepth(99);
            sprite.glowGraphics = glowGraphics;
        }

        return sprite;
    }

    /**
     * Get fish color by type
     */
    static getFishColor(fishType) {
        const colors = {
            clownfish: 0xFF6B6B,
            shark: 0x666666,
            shrimp: 0xFFB6C1,
            jellyfish: 0xADD8E6,
            anglerfish: 0x8B008B,
            seahorse: 0xFFD700,
            octopus: 0x9370DB,
            eel: 0xFFD700,
            mutant_shark: 0xDC143C,
            giant_jellyfish: 0x00CED1,
            boss_squid: 0x8B0000,
            boss_shark_king: 0xFFD700,
            boss_sea_dragon: 0x4169E1,
        };
        return colors[fishType] || 0xFF6B6B;
    }

    /**
     * Create player fish using sprite image (from asset pack)
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {number} scale - Scale factor for the sprite
     * @param {number} frame - Animation frame (0-6 for swimming)
     * @returns {Phaser.GameObjects.Sprite}
     */
    static createPlayerFishFromSprite(scene, scale = 1.0, frame = 0) {
        // Try AI-generated clownfish frames first (check frame 1, not 0)
        if (scene.textures.exists('clownfish_swim_1')) {
            return FishFactory.createFishFromFrames(scene, 'clownfish', scale, frame);
        }

        const spriteKey = `player_swim_0`;

        // Check if texture exists
        const textureManager = scene.textures;
        if (!textureManager.exists(spriteKey)) {
            console.warn(`FishFactory: Player texture '${spriteKey}' not found, using fallback`);
            // Fall back to procedural drawing
            const fallbackGraphics = FishFactory.createFish(scene, 'clownfish', 30, 0xFF6B6B);
            fallbackGraphics.scale = scale;
            fallbackGraphics.setDepth(100); // Player at top
            return fallbackGraphics;
        }

        const sprite = scene.add.sprite(0, 0, spriteKey);
        sprite.setScale(scale);
        sprite.setDepth(50); // Player at depth 50, above all entities

        // Add glow effect (bright yellow/orange to stand out) - no transparency
        const glowGraphics = scene.add.graphics();
        glowGraphics.fillStyle(0xFFFF88, 0.4);
        glowGraphics.fillEllipse(0, 0, 100 * scale, 70 * scale);
        glowGraphics.setDepth(49); // Just below player
        glowGraphics.setPosition(0, 0);
        sprite.glowGraphics = glowGraphics;

        // Store animation key for later use
        sprite.animKey = 'player_swim';

        return sprite;
    }

    /**
     * Create enemy fish using sprite image (from asset pack) with Phaser animation
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {string} type - Enemy type ('fish', 'fish_big', or specific fish type like 'shark', 'shrimp')
     * @param {number} scale - Scale factor for the sprite
     * @param {number} frame - Animation frame (unused, animation handles it)
     * @returns {Phaser.GameObjects.Sprite}
     */
    static createEnemyFromSprite(scene, type = 'fish', scale = 1.0, frame = 0) {
        // Map legacy types to fish types
        const typeMapping = {
            'fish': 'shrimp',     // small fish uses shrimp sprites
            'fish_big': 'shark',  // big fish uses shark sprites
        };

        const fishType = typeMapping[type] || type;
        const frameConfig = FishFactory.FISH_FRAME_CONFIG[fishType];

        // Try AI-generated frames first
        if (frameConfig && frameConfig.baseKey) {
            // Check for frame with variant 1, pose 'a': transparent_shrimp_1a
            const firstFrameKey = `${frameConfig.baseKey}_1a`;

            if (scene.textures.exists(firstFrameKey)) {
                // Select random variant for variety
                const maxVariants = frameConfig.totalFrames || 4;
                const variant = Math.floor(Math.random() * maxVariants) + 1;
                const selectedFrameKey = `${frameConfig.baseKey}_${variant}a`;

                const aiScale = scale * 0.1; // Much smaller for balanced gameplay
                const sprite = scene.add.sprite(0, 0, selectedFrameKey);
                sprite.setScale(aiScale);
                sprite.setAlpha(frameConfig.useTransparent ? 1.0 : 0.85);
                sprite.setDepth(30);
                sprite.fishType = fishType;
                sprite.variant = variant;
                // Animation key is fishType_swim_variant (e.g., 'shrimp_swim_1')
                const animKey = `${fishType}_swim_${variant}`;
                sprite.animKey = animKey;
                if (sprite.anims && sprite.anims.exists(animKey)) {
                    sprite.play(animKey);
                }
                return sprite;
            } else {
                console.warn(`FishFactory: Texture '${firstFrameKey}' not found for '${fishType}', using fallback`);
            }
        }

        // Fall back to procedural drawing
        console.warn(`FishFactory: Falling back to procedural for '${fishType}'`);
        const fishColor = FishFactory.getFishColor(fishType);
        const graphics = FishFactory.createFish(scene, fishType, 30 * scale, fishColor);
        graphics.setDepth(30);
        return graphics;
    }

    /**
     * Create player fish with enhanced visuals and glow
     * @param {Phaser.Scene} scene - Phaser scene
     * @param {string} fishType - Type of fish (clownfish, shrimp, shark)
     * @param {number} size - Size of fish
     * @param {number} color - Color as number
     * @returns {Phaser.GameObjects.Sprite}
     */
    static createPlayerFish(scene, fishType, size, color) {
        // Player is 2x larger than same-level enemies for visibility
        const playerSize = size * 2;
        const visualScale = 2; // Extra 2x scale multiplier for visual size

        // Try to use AI-generated frames if available for the fish type
        const frameConfig = FishFactory.FISH_FRAME_CONFIG[fishType];
        // Check for first variant's first pose: transparent_clownfish_1a
        const hasFrames = frameConfig && frameConfig.baseKey && scene.textures.exists(`${frameConfig.baseKey}_1a`);

        if (hasFrames) {
            // Use frame-based rendering with Phaser sprite
            const sprite = FishFactory.createFishFromFrames(scene, fishType, playerSize / 30, 0);
            // Double the visual size of the sprite
            sprite.setScale(sprite.scale * visualScale);
            // Add player glow (sized relative to player sprite)
            const glowGraphics = scene.add.graphics();
            glowGraphics.fillStyle(0xFFFF88, 0.25);
            glowGraphics.fillEllipse(0, 0, playerSize * 2, playerSize * 1.5);
            glowGraphics.setDepth(99);
            glowGraphics.setScale(visualScale);
            sprite.glowGraphics = glowGraphics;
            return sprite;
        } else {
            // Fall back to procedural drawing
            const graphics = FishFactory.createFish(scene, fishType, playerSize, color);

            const glowGraphics = scene.add.graphics();
            glowGraphics.fillStyle(0xFFFF88, 0.25);
            glowGraphics.fillEllipse(0, 0, playerSize * 2.5, playerSize * 1.8);
            glowGraphics.setDepth(99);

            graphics.glowGraphics = glowGraphics;
            return graphics;
        }
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
            case 'anglerfish':
                FishFactory.drawAnglerfish(graphics, size, color, darkerColor);
                break;
            case 'jellyfish':
                FishFactory.drawJellyfish(graphics, size, color, darkerColor);
                break;
            case 'seahorse':
                FishFactory.drawSeahorse(graphics, size, color, darkerColor);
                break;
            case 'octopus':
                FishFactory.drawOctopus(graphics, size, color, darkerColor);
                break;
            case 'eel':
                FishFactory.drawEel(graphics, size, color, darkerColor);
                break;
            case 'mutant_shark':
                FishFactory.drawMutantShark(graphics, size, color, darkerColor);
                break;
            case 'giant_jellyfish':
                FishFactory.drawGiantJellyfish(graphics, size, color, darkerColor);
                break;
            case 'boss_squid':
                FishFactory.drawBossSquid(graphics, size, color, darkerColor);
                break;
            case 'boss_shark_king':
                FishFactory.drawBossSharkKing(graphics, size, color, darkerColor);
                break;
            case 'boss_sea_dragon':
                FishFactory.drawBossSeaDragon(graphics, size, color, darkerColor);
                break;
            default:
                // Default fish shape
                FishFactory.drawDefaultFish(graphics, size, color, darkerColor);
        }

        return graphics;
    }

    /**
     * Draw clownfish (orange with white stripes) - enhanced version
     */
    static drawClownfish(graphics, size, color, darkerColor) {
        // Draw body shadow first
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillEllipse(2, 2, size * 1.8, size * 1.2);

        // Main body (ellipse with gradient effect using multiple fills)
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, 0, size * 1.8, size * 1.2);

        // Body highlight (top)
        graphics.fillStyle(0xFFFFFF, 0.2);
        graphics.fillEllipse(-size * 0.2, -size * 0.3, size * 1.2, size * 0.5);

        // White stripes with black outline
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(-size * 0.52, -size * 0.82, size * 0.28, size * 1.64);
        graphics.fillRect(size * 0.23, -size * 0.62, size * 0.22, size * 1.24);

        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(-size * 0.5, -size * 0.8, size * 0.25, size * 1.6);
        graphics.fillRect(size * 0.25, -size * 0.6, size * 0.2, size * 1.2);

        // Glowing stripe effect (for player fish)
        graphics.fillStyle(0xFFFFAA, 0.4);
        graphics.fillRect(-size * 0.5, -size * 0.8, size * 0.25, size * 1.6);
        graphics.fillRect(size * 0.25, -size * 0.6, size * 0.2, size * 1.2);

        // Tail (triangle with gradient)
        graphics.fillStyle(darkerColor.color, 1);
        const tailPoints = [
            { x: -size * 0.9, y: 0 },
            { x: -size * 1.5, y: -size * 0.6 },
            { x: -size * 1.5, y: size * 0.6 }
        ];
        graphics.fillTriangle(
            tailPoints[0].x, tailPoints[0].y,
            tailPoints[1].x, tailPoints[1].y,
            tailPoints[2].x, tailPoints[2].y
        );

        // Tail highlight
        graphics.fillStyle(0xFFFFFF, 0.15);
        graphics.fillTriangle(
            -size * 0.85, -size * 0.1,
            -size * 1.3, -size * 0.4,
            -size * 1.3, 0
        );

        // Dorsal fin with detail
        graphics.fillStyle(darkerColor.color, 1);
        const finPoints = [
            { x: -size * 0.1, y: -size * 0.55 },
            { x: -size * 0.4, y: -size * 1.2 },
            { x: size * 0.3, y: -size * 0.55 }
        ];
        graphics.fillTriangle(
            finPoints[0].x, finPoints[0].y,
            finPoints[1].x, finPoints[1].y,
            finPoints[2].x, finPoints[2].y
        );

        // Pectoral fin
        graphics.fillStyle(color, 0.9);
        const pectFin = [
            { x: size * 0.1, y: size * 0.3 },
            { x: size * 0.4, y: size * 0.8 },
            { x: size * 0.5, y: size * 0.35 }
        ];
        graphics.fillTriangle(
            pectFin[0].x, pectFin[0].y,
            pectFin[1].x, pectFin[1].y,
            pectFin[2].x, pectFin[2].y
        );

        // Eye (large, expressive)
        // Outer eye (black)
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(size * 0.55, -size * 0.1, size * 0.18);
        // Iris
        graphics.fillStyle(0x222222, 1);
        graphics.fillCircle(size * 0.55, -size * 0.1, size * 0.14);
        // White highlight
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(size * 0.58, -size * 0.15, size * 0.06);
        // Small secondary highlight
        graphics.fillCircle(size * 0.52, -size * 0.08, size * 0.03);

        // Mouth with cute expression
        graphics.lineStyle(2, 0x000000, 0.7);
        graphics.beginPath();
        graphics.arc(size * 0.75, size * 0.15, size * 0.12, Math.PI * 0.3, Math.PI * 0.9, false);
        graphics.strokePath();

        // Gill line detail
        graphics.lineStyle(1, darkerColor.color, 0.5);
        graphics.beginPath();
        graphics.arc(0, 0, size * 0.5, -Math.PI * 0.4, Math.PI * 0.4, false);
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
     * Draw anglerfish with glowing lure
     */
    static drawAnglerfish(graphics, size, color, darkerColor) {
        // Body
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, 0, size * 1.5, size);
        // Glowing lure
        graphics.fillStyle(0xFFFF00, 0.8);
        graphics.fillEllipse(size * 0.5, -size * 0.8, size * 0.4, size * 0.3);
        // Eye
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(size * 0.4, -size * 0.1, size * 0.12);
    }

    /**
     * Draw jellyfish (floating with dome and tentacles)
     */
    static drawJellyfish(graphics, size, color, darkerColor) {
        // Dome (semi-transparent)
        graphics.fillStyle(color, 0.7);
        graphics.fillEllipse(0, 0, size * 1.2, size * 0.8);
        // Tentacles
        graphics.fillStyle(darkerColor.color, 0.5);
        for (let i = -2; i <= 2; i++) {
            graphics.fillTriangle(
                i * size * 0.2, size * 0.3,
                i * size * 0.15, size * 1.2,
                i * size * 0.25, size * 1.2
            );
        }
    }

    /**
     * Draw seahorse with curved body
     */
    static drawSeahorse(graphics, size, color, darkerColor) {
        // Curved body (using multiple ellipses)
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, 0, size * 0.8, size * 1.5);
        // Head
        graphics.fillCircle(size * 0.2, -size * 0.6, size * 0.35);
        // Snout
        graphics.fillEllipse(size * 0.5, -size * 0.5, size * 0.3, size * 0.2);
        // Tail curl
        graphics.fillStyle(darkerColor.color, 1);
        graphics.arc(-size * 0.2, size * 0.6, size * 0.3, Math.PI * 0.5, Math.PI * 1.5, false);
        graphics.strokePath();
    }

    /**
     * Draw octopus (stealthy with head dome and tentacles)
     */
    static drawOctopus(graphics, size, color, darkerColor) {
        // Head dome
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, -size * 0.2, size, size * 1.2);
        // Tentacles (8)
        graphics.fillStyle(darkerColor.color, 1);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const tx = Math.cos(angle) * size * 0.4;
            const ty = size * 0.4 + Math.sin(angle) * size * 0.2;
            graphics.fillTriangle(tx - size * 0.1, ty, tx + size * 0.1, ty, tx, ty + size * 0.5);
        }
        // Eyes
        graphics.fillStyle(0xFFFF00, 1);
        graphics.fillCircle(-size * 0.2, -size * 0.3, size * 0.1);
        graphics.fillCircle(size * 0.2, -size * 0.3, size * 0.1);
    }

    /**
     * Draw eel (elongated body for dash attacks)
     */
    static drawEel(graphics, size, color, darkerColor) {
        // Long body
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, 0, size * 2.5, size * 0.4);
        // Striped pattern
        graphics.fillStyle(darkerColor.color, 1);
        for (let i = 0; i < 5; i++) {
            graphics.fillRect(-size * 1 + i * size * 0.4, -size * 0.15, size * 0.1, size * 0.3);
        }
        // Tail fin
        graphics.fillTriangle(-size * 1.2, 0, -size * 1.8, -size * 0.4, -size * 1.8, size * 0.4);
        // Eye
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(size * 1, -size * 0.05, size * 0.08);
    }

    /**
     * Add elite enemy glow effect (used by mutant shark, giant jellyfish)
     */
    static eliteGlow(graphics, size, glowColor = 0xFF0000) {
        // Outer glow (semi-transparent)
        graphics.fillStyle(glowColor, 0.3);
        graphics.fillEllipse(0, 0, size * 2.5, size * 0.9);

        // Inner glow (brighter)
        graphics.fillStyle(glowColor, 0.5);
        graphics.fillEllipse(0, 0, size * 2.2, size * 0.7);
    }

    /**
     * Draw mutant shark with red glow effect (enrage elite)
     */
    static drawMutantShark(graphics, size, color, darkerColor) {
        // First draw regular shark
        FishFactory.drawShark(graphics, size, color, darkerColor);
        FishFactory.eliteGlow(graphics, size, 0xFF0000); // Red glow
    }

    /**
     * Draw giant jellyfish with electric glow effect (chain lightning elite)
     */
    static drawGiantJellyfish(graphics, size, color, darkerColor) {
        // First draw regular jellyfish
        FishFactory.drawJellyfish(graphics, size, color, darkerColor);
        FishFactory.eliteGlow(graphics, size, 0x00FFFF); // Cyan glow
    }

    /**
     * Draw Giant Squid Boss (深海大王乌贼)
     */
    static drawBossSquid(graphics, size, color, darkerColor) {
        // Main body (huge ellipse)
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, 0, size * 1.5, size * 2);

        // Head dome
        graphics.fillEllipse(0, -size * 0.8, size, size * 0.8);

        // Large eyes
        graphics.fillStyle(0xFF0000, 1); // Glowing red
        graphics.fillCircle(-size * 0.3, -size * 0.8, size * 0.15);
        graphics.fillCircle(size * 0.3, -size * 0.8, size * 0.15);

        // Tentacles (8 large ones)
        graphics.fillStyle(darkerColor.color, 1);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI - Math.PI / 2;
            const tx = Math.cos(angle) * size * 0.6;
            const ty = size * 0.5 + Math.sin(angle) * size * 0.3;
            graphics.fillTriangle(
                tx - size * 0.2, ty,
                tx + size * 0.2, ty,
                tx, ty + size * 1.2
            );
        }
    }

    /**
     * Draw Shark King Boss (鲨鱼之王)
     */
    static drawBossSharkKing(graphics, size, color, darkerColor) {
        // Draw base shark body
        FishFactory.drawShark(graphics, size, color, darkerColor);

        // Add golden crown
        graphics.fillStyle(0xFFD700, 1);
        const crownPoints = [
            { x: -size * 0.4, y: -size * 0.5 },
            { x: -size * 0.3, y: -size * 0.9 },
            { x: -size * 0.1, y: -size * 0.6 },
            { x: 0, y: -size * 1.0 },
            { x: size * 0.1, y: -size * 0.6 },
            { x: size * 0.3, y: -size * 0.9 },
            { x: size * 0.4, y: -size * 0.5 }
        ];
        graphics.fillTriangle(
            crownPoints[0].x, crownPoints[0].y,
            crownPoints[1].x, crownPoints[1].y,
            crownPoints[2].x, crownPoints[2].y
        );
        graphics.fillTriangle(
            crownPoints[2].x, crownPoints[2].y,
            crownPoints[3].x, crownPoints[3].y,
            crownPoints[4].x, crownPoints[4].y
        );
        graphics.fillTriangle(
            crownPoints[4].x, crownPoints[4].y,
            crownPoints[5].x, crownPoints[5].y,
            crownPoints[6].x, crownPoints[6].y
        );
    }

    /**
     * Draw Sea Dragon Boss (海底巨龙)
     */
    static drawBossSeaDragon(graphics, size, color, darkerColor) {
        // Dragon body (elongated)
        graphics.fillStyle(color, 1);
        graphics.fillEllipse(0, 0, size * 2, size * 0.8);

        // Dragon head
        graphics.fillEllipse(size * 1.2, 0, size * 0.8, size * 0.6);

        // Snout
        graphics.fillTriangle(
            size * 1.6, 0,
            size * 2.2, -size * 0.2,
            size * 2.2, size * 0.2
        );

        // Dorsal spikes
        graphics.fillStyle(darkerColor.color, 1);
        for (let i = 0; i < 6; i++) {
            graphics.fillTriangle(
                -size * 0.8 + i * size * 0.35, -size * 0.4,
                -size * 0.7 + i * size * 0.35, -size * 1.0,
                -size * 0.5 + i * size * 0.35, -size * 0.4
            );
        }

        // Tail spikes
        graphics.fillTriangle(
            -size * 1.2, 0,
            -size * 2.0, -size * 0.4,
            -size * 1.8, 0
        );

        // Eyes
        graphics.fillStyle(0xFFFF00, 1);
        graphics.fillCircle(size * 1.4, -size * 0.15, size * 0.1);
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
