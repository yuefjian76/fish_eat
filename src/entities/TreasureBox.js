/**
 * TreasureBox - Collectible treasure box that drops rewards
 */
export class TreasureBox {
    static TYPE = {
        COIN: 'coin',
        POTION: 'potion',
        SKILL_FRAGMENT: 'skillFragment',
        EXP: 'exp',
        COOLDOWN_REDUCTION: 'cooldownReduction',
        INVINCIBILITY: 'invincibility',
        TELEPORT: 'teleport',
        DOUBLE_REWARDS: 'doubleRewards'
    };

    constructor(scene, x, y, rewardType, rewardAmount) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.rewardType = rewardType;
        this.rewardAmount = rewardAmount;
        this.isCollected = false;

        // Create treasure box graphics (glowing chest)
        this.graphics = scene.add.graphics();

        // Create exquisite chest with type-specific glow
        this.createExquisiteChest();

        this.graphics.x = x;
        this.graphics.y = y;
        this.glowGraphics.x = x;
        this.glowGraphics.y = y;

        // Enable physics
        scene.physics.world.enable(this.graphics);
        this.graphics.body.setSize(24, 20);
        this.graphics.body.setOffset(-12, -10);
        this.graphics.body.setImmovable(true);

        // Set depth for proper layering
        this.graphics.setDepth(5);
        this.glowGraphics.setDepth(4);

        // Add to treasure boxes group if it exists
        if (scene.treasureBoxes) {
            scene.treasureBoxes.add(this.graphics);
        }

        // Store reference to this TreasureBox instance on graphics
        this.graphics.treasureBoxData = this;

        // Floating animation
        this.floatTween = scene.tweens.add({
            targets: [this.graphics, this.glowGraphics],
            y: y - 5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Glow pulse animation
        scene.tweens.add({
            targets: this.glowGraphics,
            alpha: 0.5,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Label text
        this.createRewardLabel();
    }

    /**
     * Draw exquisite chest with type-specific glow
     */
    createExquisiteChest() {
        const typeColors = {
            [TreasureBox.TYPE.COIN]: { body: 0xFFD700, glow: 0xFFFF00 },
            [TreasureBox.TYPE.POTION]: { body: 0xFF4444, glow: 0xFF69B4 },
            [TreasureBox.TYPE.SKILL_FRAGMENT]: { body: 0x4488FF, glow: 0x88CCFF },
            [TreasureBox.TYPE.EXP]: { body: 0xAA44FF, glow: 0xCC88FF },
            [TreasureBox.TYPE.COOLDOWN_REDUCTION]: { body: 0x44FFFF, glow: 0x88FFFF },
            [TreasureBox.TYPE.INVINCIBILITY]: { body: 0xFFFFFF, glow: 0xFFD700 },
            [TreasureBox.TYPE.TELEPORT]: { body: 0xFF8800, glow: 0xFFAA44 },
            [TreasureBox.TYPE.DOUBLE_REWARDS]: { body: 0x44FF44, glow: 0x88FF88 }
        };

        const colors = typeColors[this.rewardType] || typeColors[TreasureBox.TYPE.COIN];

        // Glow effect (larger, semi-transparent) - create before body so body renders on top
        this.glowGraphics = this.scene.add.graphics();
        this.glowGraphics.fillStyle(colors.glow, 0.3);
        this.glowGraphics.fillCircle(0, 0, 25);

        // Box body (3D effect with gradient)
        this.graphics.fillStyle(colors.body, 1);
        this.graphics.fillRect(-12, -8, 24, 16);

        // Box lid (rounded top with lighter color)
        const lidColor = Phaser.Display.Color.IntegerToColor(
            Phaser.Display.Color.GetColor(
                Math.floor(Phaser.Display.Color.ValueToColor(colors.body).r * 1.2),
                Math.floor(Phaser.Display.Color.ValueToColor(colors.body).g * 1.2),
                Math.floor(Phaser.Display.Color.ValueToColor(colors.body).b * 1.2)
            )
        ).color;
        this.graphics.fillStyle(lidColor, 1);
        this.graphics.fillRect(-14, -14, 28, 8);

        // Gold trim
        this.graphics.lineStyle(2, 0xFFD700, 1);
        this.graphics.strokeRect(-12, -8, 24, 16);
        this.graphics.strokeRect(-14, -14, 28, 8);
    }

    /**
     * Create reward type label
     */
    createRewardLabel() {
        const labels = {
            [TreasureBox.TYPE.COIN]: `+${this.rewardAmount}`,
            [TreasureBox.TYPE.POTION]: 'HP',
            [TreasureBox.TYPE.SKILL_FRAGMENT]: 'SKILL',
            [TreasureBox.TYPE.EXP]: '+EXP',
            [TreasureBox.TYPE.COOLDOWN_REDUCTION]: 'CD-3s',
            [TreasureBox.TYPE.INVINCIBILITY]: '无敌',
            [TreasureBox.TYPE.TELEPORT]: '传送',
            [TreasureBox.TYPE.DOUBLE_REWARDS]: 'x2'
        };

        this.label = this.scene.add.text(this.x, this.y - 20, labels[this.rewardType], {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.label.setOrigin(0.5);
        this.label.setDepth(10);
    }

    /**
     * Collect the treasure box
     * @param {object} player - Player object
     * @returns {object} Reward info
     */
    collect(player) {
        if (this.isCollected) return null;
        this.isCollected = true;

        // Stop animations
        if (this.floatTween) {
            this.floatTween.stop();
        }

        // Collection effect
        this.scene.tweens.add({
            targets: [this.graphics, this.glowGraphics, this.label],
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => this.destroy()
        });

        // Return reward info
        return {
            type: this.rewardType,
            amount: this.rewardAmount
        };
    }

    /**
     * Destroy the treasure box
     */
    destroy() {
        if (this.floatTween) {
            this.floatTween.stop();
        }
        if (this.graphics) {
            this.graphics.destroy();
        }
        if (this.glowGraphics) {
            this.glowGraphics.destroy();
        }
        if (this.label) {
            this.label.destroy();
        }
    }
}

export default TreasureBox;
