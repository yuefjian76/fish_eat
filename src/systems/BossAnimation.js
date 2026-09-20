export class BossAnimation {
    constructor(scene) {
        this.scene = scene;
        this.currentAnimation = null;
    }

    /**
     * Play boss entrance animation
     * @param {string} type - Animation type ('rise_from_bottom', 'charge_from_left')
     * @param {object} boss - Boss entity
     */
    play(type, boss) {
        this.currentAnimation = type;

        switch (type) {
            case 'rise_from_bottom':
                this.playRiseFromBottom(boss);
                break;
            case 'charge_from_left':
                this.playChargeFromLeft(boss);
                break;
            default:
                // No animation
                break;
        }
    }

    /**
     * Entrance positions are relative to the player, not to the 1024x768 design
     * canvas: the camera follows the player across an infinite scrolling world,
     * so absolute coordinates would play the animation somewhere off screen.
     * The 400/700/384 constants remain as a fallback for scenes without a player.
     */
    _anchors(boss) {
        const graphics = boss.graphics;
        const player = this.scene.player;
        if (player && Number.isFinite(player.x) && Number.isFinite(player.y)) {
            return {
                riseX: graphics.x || player.x + 200,
                riseStartY: player.y + 240,
                riseEndY: player.y - 80,
                chargeStartX: player.x - 420,
                chargeStartY: graphics.y || player.y,
                chargeEndX: player.x + 180,
            };
        }
        return {
            riseX: graphics.x || 400,
            riseStartY: 700,
            riseEndY: 384,
            chargeStartX: -100,
            chargeStartY: graphics.y || 384,
            chargeEndX: 400,
        };
    }

    playRiseFromBottom(boss) {
        const graphics = boss.graphics;
        const a = this._anchors(boss);

        // Start below the player
        graphics.setPosition(a.riseX, a.riseStartY);

        // Screen shake
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(500, 0.01);
        }

        // Rise up animation
        this.scene.tweens.add({
            targets: graphics,
            y: a.riseEndY,
            duration: 2000,
            ease: 'Sine.easeInOut'
        });
    }

    playChargeFromLeft(boss) {
        const graphics = boss.graphics;
        const a = this._anchors(boss);

        // Start off screen left
        graphics.setPosition(a.chargeStartX, a.chargeStartY);

        // Charge across screen
        this.scene.tweens.add({
            targets: graphics,
            x: a.chargeEndX,
            duration: 1500,
            ease: 'Quad.easeOut'
        });
    }

    /**
     * Check if animation is playing
     */
    isPlaying() {
        return this.currentAnimation !== null;
    }

    /**
     * Stop current animation
     */
    stop() {
        if (this.scene.tweens) {
            this.scene.tweens.killAll();
        }
        this.currentAnimation = null;
    }
}

export default BossAnimation;
