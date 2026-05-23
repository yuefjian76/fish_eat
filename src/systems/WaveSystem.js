/**
 * WaveSystem - Wave state machine for enemy spawning
 *
 * Manages the wave cycle: calm (slow spawn) → surge (fast spawn) → peak → calm
 *
 * Usage:
 *   const waveSystem = new WaveSystem({
 *     onStateChange: (state) => { ... },
 *     onIntervalChange: (interval) => { ... }
 *   });
 *
 *   // In game loop:
 *   waveSystem.update(delta);
 *   const interval = waveSystem.getSpawnInterval();
 */
export class WaveSystem {
    /**
     * @param {object} config - Configuration object
     * @param {number} [config.calmDuration=8000] - Calm phase duration in ms
     * @param {number} [config.surgeDuration=4000] - Surge phase duration in ms
     * @param {number} [config.peakDuration=3000] - Peak phase duration in ms
     * @param {number} [config.baseInterval=2000] - Spawn interval in calm/peak (ms)
     * @param {number} [config.surgeInterval=400] - Spawn interval in surge (ms)
     * @param {function} [config.onStateChange] - Callback when state changes
     * @param {function} [config.onIntervalChange] - Callback when spawn interval changes
     */
    constructor(config = {}) {
        this._state = 'calm';
        this._timer = 0;

        this.config = {
            calmDuration: config.calmDuration ?? 8000,
            surgeDuration: config.surgeDuration ?? 4000,
            peakDuration: config.peakDuration ?? 3000,
            baseInterval: config.baseInterval ?? 2000,
            surgeInterval: config.surgeInterval ?? 400,
            onStateChange: config.onStateChange || (() => {}),
            onIntervalChange: config.onIntervalChange || (() => {})
        };
    }

    /**
     * Update the wave state machine
     * @param {number} delta - Time since last update in ms
     */
    update(delta) {
        this._timer += delta;
        const prevState = this._state;

        if (this._state === 'calm') {
            if (this._timer >= this.config.calmDuration) {
                this._state = 'surge';
                this._timer = 0;
            }
        } else if (this._state === 'surge') {
            if (this._timer >= this.config.surgeDuration) {
                this._state = 'peak';
                this._timer = 0;
            }
        } else if (this._state === 'peak') {
            if (this._timer >= this.config.peakDuration) {
                this._state = 'calm';
                this._timer = 0;
            }
        }

        if (this._state !== prevState) {
            this.config.onStateChange(this._state);
            this.config.onIntervalChange(this.getSpawnInterval());
        }
    }

    /**
     * Get current wave state
     * @returns {string} 'calm' | 'surge' | 'peak'
     */
    getState() {
        return this._state;
    }

    /**
     * Get current spawn interval based on state
     * @returns {number} Spawn interval in ms
     */
    getSpawnInterval() {
        return this._state === 'surge'
            ? this.config.surgeInterval
            : this.config.baseInterval;
    }

    /**
     * Get internal timer for progress bar (internal use)
     * @returns {number} Current timer value in ms
     */
    getTimer() {
        return this._timer;
    }

    /**
     * Get current phase duration
     * @returns {number} Duration in ms
     */
    getCurrentPhaseDuration() {
        if (this._state === 'calm') return this.config.calmDuration;
        if (this._state === 'surge') return this.config.surgeDuration;
        return this.config.peakDuration;
    }

    /**
     * Reset the wave system to initial state
     * @param {object} config - New configuration (optional)
     */
    reset(config) {
        this._state = 'calm';
        this._timer = 0;
        if (config) {
            this.config = {
                calmDuration: config.calmDuration ?? this.config.calmDuration,
                surgeDuration: config.surgeDuration ?? this.config.surgeDuration,
                peakDuration: config.peakDuration ?? this.config.peakDuration,
                baseInterval: config.baseInterval ?? this.config.baseInterval,
                surgeInterval: config.surgeInterval ?? this.config.surgeInterval,
                onStateChange: config.onStateChange || this.config.onStateChange,
                onIntervalChange: config.onIntervalChange || this.config.onIntervalChange
            };
        }
    }
}

export default WaveSystem;