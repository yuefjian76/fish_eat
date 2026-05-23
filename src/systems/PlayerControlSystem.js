/**
 * PlayerControlSystem - Keyboard and mouse input handling
 *
 * Handles player movement via keyboard (arrow keys + shift) or mouse.
 *
 * Usage:
 *   const controlSystem = new PlayerControlSystem({
 *     scene: gameScene,
 *     player: player
 *   });
 *
 *   // In game loop:
 *   controlSystem.update(delta);
 */
export class PlayerControlSystem {
    /**
     * @param {object} config - Configuration object
     * @param {Phaser.Scene} config.scene - Phaser scene reference
     * @param {object} config.player - Player object with body
     * @param {number} [config.speed=200] - Base movement speed
     */
    constructor(config) {
        this._scene = config.scene;
        this._player = config.player;
        this._speed = config.speed ?? 200;

        // Input state
        this._cursors = null;
        this._shiftKey = null;
        this._mouseTarget = null;
        this._isMouseActive = false;

        // Constants
        this._DEAD_ZONE = 8;
        this._EASE_ZONE = 80;
    }

    /**
     * Setup keyboard and mouse input
     */
    setupInput() {
        this._cursors = this._scene.input.keyboard.createCursorKeys();
        this._shiftKey = this._scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // Mouse control
        this._scene.input.on('pointermove', (pointer) => {
            this._mouseTarget = { x: pointer.x, y: pointer.y };
            this._isMouseActive = true;
        });
        this._scene.input.on('pointerdown', (pointer) => {
            this._mouseTarget = { x: pointer.x, y: pointer.y };
            this._isMouseActive = true;
        });
    }

    /**
     * Update player movement
     * @param {number} delta - Time since last update
     */
    update(delta) {
        const speed = this._shiftKey?.isDown ? this._speed * 1.5 : this._speed;

        // Keyboard takes priority
        if (this._isKeyboardActive()) {
            this._handleKeyboard(speed);
            this._isMouseActive = false;
        } else if (this._isMouseActive && this._mouseTarget) {
            this._handleMouse(speed);
        } else {
            this._stopMovement();
        }

        // Update rotation based on velocity
        if (this._player?.body) {
            const vx = this._player.body.velocity.x;
            const vy = this._player.body.velocity.y;
            if (vx !== 0 || vy !== 0) {
                this._player.rotation = Math.atan2(vy, vx);
            }
        }
    }

    /**
     * Check if keyboard is active
     * @returns {boolean}
     */
    _isKeyboardActive() {
        if (!this._cursors) return false;
        return this._cursors.left.isDown || this._cursors.right.isDown ||
               this._cursors.up.isDown || this._cursors.down.isDown;
    }

    /**
     * Handle keyboard movement
     * @param {number} speed - Movement speed
     */
    _handleKeyboard(speed) {
        if (this._cursors.left.isDown) {
            this._player.body.setVelocityX(-speed);
        } else if (this._cursors.right.isDown) {
            this._player.body.setVelocityX(speed);
        } else {
            this._player.body.setVelocityX(0);
        }

        if (this._cursors.up.isDown) {
            this._player.body.setVelocityY(-speed);
        } else if (this._cursors.down.isDown) {
            this._player.body.setVelocityY(speed);
        } else {
            this._player.body.setVelocityY(0);
        }
    }

    /**
     * Handle mouse movement with dead zone and easing
     * @param {number} speed - Movement speed
     */
    _handleMouse(speed) {
        const dx = this._mouseTarget.x - this._player.x;
        const dy = this._mouseTarget.y - this._player.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= this._DEAD_ZONE) {
            this._player.body.setVelocityX(0);
            this._player.body.setVelocityY(0);
        } else {
            const scale = dist < this._EASE_ZONE ? dist / this._EASE_ZONE : 1.0;
            const effectiveSpeed = speed * scale;
            this._player.body.setVelocityX((dx / dist) * effectiveSpeed);
            this._player.body.setVelocityY((dy / dist) * effectiveSpeed);
        }
    }

    /**
     * Stop player movement
     */
    _stopMovement() {
        this._player.body.setVelocityX(0);
        this._player.body.setVelocityY(0);
    }

    /**
     * Set movement speed
     * @param {number} speed - New speed
     */
    setSpeed(speed) {
        this._speed = speed;
    }

    /**
     * Get current speed
     * @returns {number} Current speed
     */
    getSpeed() {
        return this._speed;
    }

    /**
     * Check if mouse is active
     * @returns {boolean}
     */
    isMouseActive() {
        return this._isMouseActive;
    }

    /**
     * Reset player control system
     * @param {object} config - New configuration (optional)
     */
    reset(config) {
        if (config) {
            this._speed = config.speed ?? this._speed;
        }
        this._isMouseActive = false;
        this._mouseTarget = null;
    }
}

export default PlayerControlSystem;