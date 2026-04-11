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

    static STATE = {
        RISING: 'rising',
        WANDERING: 'wandering',
        BURSTING: 'bursting'
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

        // Bubble properties
        this.state = TreasureBox.STATE.RISING;
        this.bubbleRadius = 30 + Math.random() * 10;
        this.risingTargetY = 100; // Top threshold
        this.wanderDirection = 1;
        this.wanderTimer = 0;
        this.wanderInterval = Phaser.Math.Between(2000, 3000);

        // Create bubble graphics (drawn programmatically)
        this.createBubble();

        // Rising animation
        this.startRising();

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

    createBubble() {
        this.bubbleGraphics = this.scene.add.graphics();
        this.bubbleGraphics.setDepth(7);
        this.bubbleGraphics.x = this.x;
        this.bubbleGraphics.y = this.y;

        // Draw bubble
        this.drawBubble();

        // Add to physics
        this.scene.physics.world.enable(this.bubbleGraphics);
        this.bubbleGraphics.body.setSize(this.bubbleRadius * 2, this.bubbleRadius * 2);
        this.bubbleGraphics.body.setOffset(-this.bubbleRadius, -this.bubbleRadius);
        this.bubbleGraphics.body.setImmovable(true);
    }

    drawBubble() {
        const g = this.bubbleGraphics;
        const r = this.bubbleRadius;

        // Bubble outline
        g.lineStyle(2, 0xAADDFF, 0.8);
        g.strokeCircle(0, 0, r);

        // Bubble fill (semi-transparent)
        g.fillStyle(0xAADDFF, 0.2);
        g.fillCircle(0, 0, r);

        // Highlight reflection
        g.fillStyle(0xFFFFFF, 0.4);
        g.fillCircle(-r * 0.3, -r * 0.3, r * 0.2);
    }

    startRising() {
        this.riseTween = this.scene.tweens.add({
            targets: [this.graphics, this.glowGraphics, this.bubbleGraphics],
            y: this.risingTargetY,
            duration: Phaser.Math.Between(3000, 5000),
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.state = TreasureBox.STATE.WANDERING;
                this.startWandering();
            }
        });
    }

    startWandering() {
        this.wanderTween = this.scene.tweens.add({
            targets: [this.graphics, this.glowGraphics, this.bubbleGraphics],
            x: this.x + this.wanderDirection * Phaser.Math.Between(50, 150),
            duration: this.wanderInterval,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            onRepeat: () => {
                this.wanderDirection *= -1;
            }
        });

        // Bubble wobble animation
        this.scene.tweens.add({
            targets: this.bubbleGraphics,
            scaleX: 1.05,
            scaleY: 0.95,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Bubble flickering (alpha pulse) effect
        this.scene.tweens.add({
            targets: this.bubbleGraphics,
            alpha: 0.6,
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Collect the treasure box
     * @param {object} player - Player object
     * @returns {object} Reward info
     */
    collect(player) {
        if (this.isCollected) return null;
        this.isCollected = true;
        this.state = TreasureBox.STATE.BURSTING;

        // Stop animations
        if (this.riseTween) this.riseTween.stop();
        if (this.wanderTween) this.wanderTween.stop();

        // Burst animation for bubble
        this.scene.tweens.add({
            targets: this.bubbleGraphics,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => this.bubbleGraphics.destroy()
        });

        // Collection effect
        this.scene.tweens.add({
            targets: [this.graphics, this.glowGraphics, this.label],
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => this.destroy()
        });

        return { type: this.rewardType, amount: this.rewardAmount };
    }

    /**
     * Destroy the treasure box
     */
    destroy() {
        if (this.riseTween) this.riseTween.stop();
        if (this.wanderTween) this.wanderTween.stop();
        if (this.bubbleGraphics) this.bubbleGraphics.destroy();
        if (this.graphics) this.graphics.destroy();
        if (this.glowGraphics) this.glowGraphics.destroy();
        if (this.label) this.label.destroy();
    }
}

export default TreasureBox;
