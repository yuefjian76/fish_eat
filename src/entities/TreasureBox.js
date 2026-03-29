/**
 * TreasureBox - Collectible treasure box that drops rewards
 */
export class TreasureBox {
    static TYPE = {
        COIN: 'coin',
        POTION: 'potion',
        SKILL_FRAGMENT: 'skillFragment'
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

        // Box body
        this.graphics.fillStyle(0x8B4513, 1); // Brown
        this.graphics.fillRect(-12, -8, 24, 16);

        // Box lid
        this.graphics.fillStyle(0xA0522D, 1); // Sienna
        this.graphics.fillRect(-14, -12, 28, 6);

        // Gold trim
        this.graphics.lineStyle(2, 0xFFD700, 1);
        this.graphics.strokeRect(-12, -8, 24, 16);
        this.graphics.strokeRect(-14, -12, 28, 6);

        // Glow effect
        this.glowGraphics = scene.add.graphics();
        this.glowGraphics.fillStyle(0xFFD700, 0.3);
        this.glowGraphics.fillCircle(0, 0, 20);

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
     * Create reward type label
     */
    createRewardLabel() {
        const labels = {
            [TreasureBox.TYPE.COIN]: `+${this.rewardAmount}`,
            [TreasureBox.TYPE.POTION]: 'HP',
            [TreasureBox.TYPE.SKILL_FRAGMENT]: 'SKILL'
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
