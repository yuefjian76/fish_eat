/**
 * AudioSystem - Web Audio API synthesized sound effects
 * No audio files required — all sounds are generated programmatically.
 */
export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.volume = 0.4;
        this.enabled = false;
        this._init();
    }

    _init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.enabled = true;
            }
        } catch (e) {
            this.enabled = false;
        }
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
    }

    /**
     * Play a synthesized sound
     * @param {'eat'|'eat_big'|'hurt'|'level_up'|'skill'|'collect'} type
     */
    play(type) {
        if (!this.enabled || !this.ctx) return;

        // Resume context if suspended (browser autoplay policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        switch (type) {
            case 'eat':       return this._playEat(false);
            case 'eat_big':   return this._playEat(true);
            case 'hurt':      return this._playHurt();
            case 'level_up':  return this._playLevelUp();
            case 'skill':     return this._playSkill();
            case 'collect':   return this._playCollect();
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Sound synthesizers
    // ─────────────────────────────────────────────────────────────────────

    _playEat(big) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        // Small fish: higher pitch pop; Big fish: satisfying low thud
        const freq = big ? 280 : 650;
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.12);

        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    _playHurt() {
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.volume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
    }

    _playLevelUp() {
        const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
        const durations = [0.1, 0.1, 0.1, 0.35];
        let t = this.ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(this.volume * 0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);

            osc.start(t);
            osc.stop(t + durations[i]);
            t += durations[i] + 0.02;
        });
    }

    _playSkill() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    _playCollect() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);

        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
    }
}
