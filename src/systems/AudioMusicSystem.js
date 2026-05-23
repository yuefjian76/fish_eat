/**
 * AudioMusicSystem - Procedural background music using Web Audio API oscillators
 * Supports calm, surge, and victory moods with smooth transitions.
 */
export class AudioMusicSystem {
    constructor(audioContext) {
        this.ctx = null;
        this.volume = 0.3;
        this.enabled = false;
        this.currentMood = null;
        this.isPlaying = false;
        this.transitionDuration = 1.5;
        this.activeOscillators = [];
        this._masterGain = null;
        this._nodes = [];

        this._init(audioContext);
    }

    _init(audioContext) {
        try {
            if (audioContext) {
                this.ctx = audioContext;
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
     * Start background music with specified mood
     * @param {'calm'|'surge'|'victory'} mood
     */
    startMusic(mood = 'calm') {
        if (!this.enabled || !this.ctx) return;

        // Resume context if suspended (browser autoplay policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.stopMusic();

        this.currentMood = mood;
        this.isPlaying = true;

        const params = this._getMoodParams(mood);
        const now = this.ctx.currentTime;

        // Create master gain
        this._masterGain = this.ctx.createGain();
        this._masterGain.gain.setValueAtTime(this.volume, now);
        this._masterGain.connect(this.ctx.destination);

        // Create oscillators based on mood
        this._createMoodOscillators(mood, params, now);
    }

    /**
     * Stop background music
     */
    stopMusic() {
        if (!this.enabled) return;

        this.isPlaying = false;
        this.currentMood = null;

        // Stop and cleanup all oscillators
        this._nodes.forEach(node => {
            try {
                node.oscillator?.stop();
            } catch (e) { /* already stopped */ }
        });

        this._nodes = [];
        this.activeOscillators = [];
        this._masterGain = null;
    }

    /**
     * Switch to a different mood with smooth transition
     * @param {'calm'|'surge'|'victory'} mood
     */
    setMood(mood) {
        if (!this.enabled) return;

        if (!this.isPlaying) {
            this.startMusic(mood);
            return;
        }

        const wasPlaying = this.isPlaying;
        this.stopMusic();

        if (wasPlaying) {
            this.startMusic(mood);
        }
    }

    _getMoodParams(mood) {
        switch (mood) {
            case 'calm':
                return {
                    baseFreq: 110,
                    waveform: 'sine',
                    lfoRate: 0.3,
                    harmonics: [1, 2],
                    harmonicGains: [1, 0.3]
                };
            case 'surge':
                return {
                    baseFreq: 220,
                    waveform: 'sawtooth',
                    lfoRate: 2.5,
                    harmonics: [1, 2, 3],
                    harmonicGains: [1, 0.5, 0.2]
                };
            case 'victory':
                return {
                    baseFreq: 440,
                    waveform: 'triangle',
                    lfoRate: 4,
                    harmonics: [1, 2, 3, 4],
                    harmonicGains: [1, 0.4, 0.2, 0.1]
                };
            default:
                return {
                    baseFreq: 110,
                    waveform: 'sine',
                    lfoRate: 0.3,
                    harmonics: [1, 2],
                    harmonicGains: [1, 0.3]
                };
        }
    }

    _createMoodOscillators(mood, params, now) {
        switch (mood) {
            case 'calm':
                this._createCalmOscillators(params, now);
                break;
            case 'surge':
                this._createSurgeOscillators(params, now);
                break;
            case 'victory':
                this._createVictoryOscillators(params, now);
                break;
        }
    }

    _createCalmOscillators(params, now) {
        // Base drone with harmonic overtones
        params.harmonics.forEach((harmonic, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = params.waveform;
            osc.frequency.setValueAtTime(params.baseFreq * harmonic, now);
            gain.gain.setValueAtTime(params.harmonicGains[idx] * this.volume, now);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(now);

            this._nodes.push({ oscillator: osc, gain });
            this.activeOscillators.push(osc);
        });

        // LFO for gentle wave-like modulation
        this._addLFO(params.baseFreq, params.lfoRate, now);
    }

    _createSurgeOscillators(params, now) {
        // Intense drone with multiple harmonics
        params.harmonics.forEach((harmonic, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = params.waveform;
            osc.frequency.setValueAtTime(params.baseFreq * harmonic, now);
            gain.gain.setValueAtTime(params.harmonicGains[idx] * this.volume * 0.5, now);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(now);

            this._nodes.push({ oscillator: osc, gain });
            this.activeOscillators.push(osc);
        });

        // Faster LFO for pulsing intensity
        this._addLFO(params.baseFreq, params.lfoRate, now);
    }

    _createVictoryOscillators(params, now) {
        // Triumphant chord-like structure
        params.harmonics.forEach((harmonic, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = params.waveform;
            osc.frequency.setValueAtTime(params.baseFreq * harmonic, now);
            gain.gain.setValueAtTime(params.harmonicGains[idx] * this.volume * 0.4, now);

            osc.connect(gain);
            gain.connect(this._masterGain);
            osc.start(now);

            this._nodes.push({ oscillator: osc, gain });
            this.activeOscillators.push(osc);
        });

        // Add a secondary melody-like oscillator for victory flourish
        const melodyOsc = this.ctx.createOscillator();
        const melodyGain = this.ctx.createGain();

        melodyOsc.type = 'sine';
        melodyOsc.frequency.setValueAtTime(params.baseFreq * 2, now);
        melodyGain.gain.setValueAtTime(this.volume * 0.2, now);

        melodyOsc.connect(melodyGain);
        melodyGain.connect(this._masterGain);
        melodyOsc.start(now);

        this._nodes.push({ oscillator: melodyOsc, gain: melodyGain });
        this.activeOscillators.push(melodyOsc);

        // Quick LFO for celebratory feel
        this._addLFO(params.baseFreq, params.lfoRate, now);
    }

    _addLFO(freq, rate, now) {
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const modGain = this.ctx.createGain();

        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(rate, now);
        lfoGain.gain.setValueAtTime(0.3, now);
        modGain.gain.setValueAtTime(freq * 0.05, now);

        lfo.connect(lfoGain);
        lfoGain.connect(modGain.gain);
        lfo.start(now);

        this._nodes.push({ oscillator: lfo, gain: lfoGain });
        this.activeOscillators.push(lfo);
    }
}