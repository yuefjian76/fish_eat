/**
 * FloatingTextSystem - Floating damage/EXP text animation
 *
 * Creates animated floating text that rises and fades out.
 *
 * Usage:
 *   const ftSystem = new FloatingTextSystem({
 *     scene: gameScene,
 *     onTextCreated: (text) => { ... }  // callback for side effects
 *   });
 *
 *   // Show floating text:
 *   ftSystem.showDamage(x, y, damage);  // red, shows "-damage"
 *   ftSystem.showExp(x, y, exp);        // green, shows "+exp"
 *   ftSystem.show(x, y, text, style);    // generic
 */
export class FloatingTextSystem {
    /**
     * @param {object} config - Configuration object
     * @param {Phaser.Scene} config.scene - Phaser scene reference
     * @param {function} [config.onTextCreated] - Callback when text is created
     */
    constructor(config) {
        this._scene = config.scene;
        this.onTextCreated = config.onTextCreated || (() => {});
    }

    /**
     * Show floating damage text (red, negative)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} damage - Damage amount
     * @returns {Phaser.GameObjects.Text} Created text object
     */
    showDamage(x, y, damage) {
        return this.show(x, y, `-${damage}`, {
            color: 0xff3333,
            fontSize: '18px'
        });
    }

    /**
     * Show floating EXP text (green, positive)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} exp - EXP amount
     * @returns {Phaser.GameObjects.Text} Created text object
     */
    showExp(x, y, exp) {
        return this.show(x, y, `+${exp}`, {
            color: 0x00ff44,
            fontSize: '16px'
        });
    }

    /**
     * Show floating text with custom content
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Text to display
     * @param {object} style - Style options {color, fontSize}
     * @returns {Phaser.GameObjects.Text} Created text object
     */
    show(x, y, text, style = {}) {
        const color = style.color ?? 0xffffff;
        const fontSize = style.fontSize ?? '16px';

        const floatText = this._scene.add.text(x, y, text, {
            fontSize,
            fontFamily: 'Arial',
            color: `#${color.toString(16).padStart(6, '0')}`,
            stroke: '#000000',
            strokeThickness: 3
        });
        floatText.setOrigin(0.5);
        floatText.setDepth(50);

        // Tween: rise upward and fade out
        this._scene.tweens.add({
            targets: floatText,
            y: y - 40,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => floatText.destroy()
        });

        this.onTextCreated(floatText);
        return floatText;
    }

    /**
     * Show synergy activation text (gold, centered)
     * @param {string} synergyName - Name of the synergy to display
     * @returns {Phaser.GameObjects.Text} Created text object
     */
    showSynergyName(synergyName) {
        const x = this.player?.x || this._scene.cameras?.main?.centerX || 400;
        const y = (this.player?.y || this._scene.cameras?.main?.centerY || 300) - 50;

        const floatText = this._scene.add.text(x, y, synergyName, {
            fontSize: '24px',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        });
        floatText.setOrigin(0.5);
        floatText.setDepth(1000);

        this._scene.tweens.add({
            targets: floatText,
            y: y - 60,
            alpha: 0,
            duration: 1200,
            ease: 'Cubic.easeOut',
            onComplete: () => floatText.destroy()
        });

        this.onTextCreated(floatText);
        return floatText;
    }

    /**
     * Reset floating text system
     */
    reset() {
        // No persistent state to reset
    }
}

export default FloatingTextSystem;