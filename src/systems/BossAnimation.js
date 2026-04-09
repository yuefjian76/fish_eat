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

    playRiseFromBottom(boss) {
        const graphics = boss.graphics;

        // Start from below screen
        graphics.setPosition(graphics.x || 400, 700);

        // Screen shake
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(500, 0.01);
        }

        // Rise up animation
        this.scene.tweens.add({
            targets: graphics,
            y: 384,
            duration: 2000,
            ease: 'Sine.easeInOut'
        });
    }

    playChargeFromLeft(boss) {
        const graphics = boss.graphics;

        // Start off screen left
        graphics.setPosition(-100, graphics.y || 384);

        // Charge across screen
        this.scene.tweens.add({
            targets: graphics,
            x: 400,
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
