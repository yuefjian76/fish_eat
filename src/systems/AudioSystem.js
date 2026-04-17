/**
 * AudioSystem - Web Audio API synthesized sound effects and BGM
 * Uses MP3 files for background music, synthesized for sound effects.
 */
export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.volume = 0.4;
        this.enabled = false;
        this.bgmVolume = 0.15;
        this._bgmNodes = null;
        this._bgmBuffer = null;
        this._bgmSource = null;
        this._bubbleTimeout = null;
        this._useMP3BGM = true; // Use MP3 files for BGM
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
     * Load MP3 BGM file
     * @param {string} url - URL to MP3 file
     */
    async loadBGM(url) {
        if (!this.enabled || !this.ctx) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this._bgmBuffer = await this.ctx.decodeAudioData(arrayBuffer);
            console.log('BGM loaded:', url);
        } catch (e) {
            console.warn('Failed to load BGM:', e);
            this._bgmBuffer = null;
        }
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
    // Background Music (BGM)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Start background music - uses MP3 file if available, otherwise synthesized.
     * @param {string} theme - 'deep'|'tropical'|'arctic'
     * @param {string} difficulty - 'easy'|'normal'|'hard'
     */
    async startBGM(theme = 'deep', difficulty = 'normal') {
        if (!this.enabled || !this.ctx) return Promise.resolve();

        this.stopBGM();

        // Try to load and play MP3 BGM
        if (this._useMP3BGM && !this._bgmBuffer) {
            const bgmFile = 'src/assets/audio/bgm_peaceful.mp3';
            try {
                await this.loadBGM(bgmFile);
            } catch (e) {
                console.warn('BGM load failed, using synthesized:', e);
            }
        }

        // Play MP3 BGM if loaded
        if (this._useMP3BGM && this._bgmBuffer) {
            this._playBGMLoop();
            return;
        }

        // Fallback to synthesized BGM
        this._startSynthBGM(theme, difficulty);
        return Promise.resolve();
    }

    _playBGMLoop() {
        if (!this.enabled || !this.ctx || !this._bgmBuffer) return;

        const now = this.ctx.currentTime;
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(this.bgmVolume, now);
        masterGain.connect(this.ctx.destination);

        const source = this.ctx.createBufferSource();
        source.buffer = this._bgmBuffer;
        source.loop = true;
        source.connect(masterGain);
        source.start(now);

        this._bgmSource = source;
        this._bgmNodes = { masterGain };
    }

    _startSynthBGM(theme, difficulty) {
        const now = this.ctx.currentTime;
        const masterGain = this.ctx.createGain();
        masterGain.gain.setValueAtTime(this.bgmVolume, now);
        masterGain.connect(this.ctx.destination);

        // Ocean hum - low frequency drone with LFO modulation
        const humFreq = this._getOceanHumFreq(theme);
        const hum = this.ctx.createOscillator();
        const humGain = this.ctx.createGain();
        hum.type = 'sine';
        hum.frequency.setValueAtTime(humFreq, now);

        // Add slight detuned harmonic for richness
        const hum2 = this.ctx.createOscillator();
        const hum2Gain = this.ctx.createGain();
        hum2.type = 'sine';
        hum2.frequency.setValueAtTime(humFreq * 1.5, now);
        hum2Gain.gain.setValueAtTime(0.3, now);

        // LFO for wave-like amplitude modulation
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.2, now); // Slow wave rhythm
        lfoGain.gain.setValueAtTime(0.3, now);

        lfo.connect(lfoGain);
        lfoGain.connect(humGain.gain);

        hum.connect(humGain);
        hum2.connect(hum2Gain);
        humGain.connect(masterGain);
        hum2Gain.connect(masterGain);

        hum.start(now);
        hum2.start(now);
        lfo.start(now);

        this._bgmNodes = { hum, hum2, lfo, masterGain };

        // Start bubble scheduler
        this._scheduleBubble(theme, difficulty);
    }

    /** Stop background music */
    stopBGM() {
        if (this._bubbleTimeout) {
            clearTimeout(this._bubbleTimeout);
            this._bubbleTimeout = null;
        }
        if (this._bgmSource) {
            try {
                this._bgmSource.stop();
            } catch (e) { /* already stopped */ }
            this._bgmSource = null;
        }
        if (this._bgmNodes) {
            try {
                this._bgmNodes.hum?.stop();
                this._bgmNodes.hum2?.stop();
                this._bgmNodes.lfo?.stop();
            } catch (e) { /* already stopped */ }
            this._bgmNodes = null;
        }
    }

    _getOceanHumFreq(theme) {
        switch (theme) {
            case 'deep': return 55;
            case 'tropical': return 110;
            case 'arctic': return 80;
            default: return 80;
        }
    }

    _getBubbleChance(difficulty) {
        switch (difficulty) {
            case 'easy': return 0.1;
            case 'normal': return 0.2;
            case 'hard': return 0.3;
            default: return 0.2;
        }
    }

    _getBubbleFrequency(theme) {
        switch (theme) {
            case 'deep': return 0.7;
            case 'tropical': return 1.2;
            case 'arctic': return 0.9;
            default: return 1.0;
        }
    }

    _scheduleBubble(theme, difficulty) {
        if (!this.enabled || !this.ctx || !this._bgmNodes) return;

        const chance = this._getBubbleChance(difficulty);
        if (Math.random() < chance) {
            this._playBubble();
        }

        const freq = this._getBubbleFrequency(theme);
        const delay = (3000 + Math.random() * 4000) / freq;
        this._bubbleTimeout = setTimeout(() => this._scheduleBubble(theme, difficulty), delay);
    }

    _playBubble() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        const baseFreq = 800 + Math.random() * 800;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

        gain.gain.setValueAtTime(this.bgmVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
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
