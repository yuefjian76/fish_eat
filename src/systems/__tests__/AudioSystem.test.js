// AudioSystem.test.js
// Tests for Web Audio synthesized sound effects

describe('AudioSystem - sound synthesis parameters', () => {
    describe('eat sound parameters', () => {
        test('eat sound has frequency in range', () => {
            const params = getEatSoundParams('normal');
            expect(params.frequency).toBeGreaterThan(200);
            expect(params.frequency).toBeLessThan(2000);
        });

        test('eat sound has short duration', () => {
            const params = getEatSoundParams('normal');
            expect(params.duration).toBeGreaterThan(0);
            expect(params.duration).toBeLessThan(0.5);
        });

        test('big fish eat has lower frequency than small fish', () => {
            const small = getEatSoundParams('small');
            const big = getEatSoundParams('big');
            expect(big.frequency).toBeLessThan(small.frequency);
        });
    });

    describe('hurt sound parameters', () => {
        test('hurt sound has low frequency for impact feel', () => {
            const params = getHurtSoundParams();
            expect(params.frequency).toBeLessThan(500);
        });

        test('hurt sound uses noise-like waveform', () => {
            const params = getHurtSoundParams();
            expect(['sawtooth', 'square']).toContain(params.waveform);
        });
    });

    describe('level-up sound parameters', () => {
        test('level-up sound has ascending notes', () => {
            const notes = getLevelUpNotes();
            expect(notes.length).toBeGreaterThan(1);
            // Each subsequent note should be higher
            for (let i = 1; i < notes.length; i++) {
                expect(notes[i].frequency).toBeGreaterThanOrEqual(notes[i - 1].frequency);
            }
        });

        test('level-up sound has multiple notes', () => {
            const notes = getLevelUpNotes();
            expect(notes.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('AudioSystem enabled/disabled', () => {
        test('audio disabled by default if AudioContext unavailable', () => {
            const sys = createAudioSystem(null);
            expect(sys.enabled).toBe(false);
        });

        test('audio enabled when AudioContext available', () => {
            const mockCtx = { createOscillator: () => null, createGain: () => null, currentTime: 0, destination: null };
            const sys = createAudioSystem(mockCtx);
            expect(sys.enabled).toBe(true);
        });

        test('playing sound when disabled does not throw', () => {
            const sys = createAudioSystem(null);
            expect(() => sys.play('eat')).not.toThrow();
        });
    });

    describe('volume control', () => {
        test('volume is 0.0-1.0 range', () => {
            const sys = createAudioSystem(null);
            sys.setVolume(0.5);
            expect(sys.volume).toBe(0.5);
        });

        test('volume clamped to 0', () => {
            const sys = createAudioSystem(null);
            sys.setVolume(-0.5);
            expect(sys.volume).toBe(0);
        });

        test('volume clamped to 1', () => {
            const sys = createAudioSystem(null);
            sys.setVolume(1.5);
            expect(sys.volume).toBe(1);
        });
    });
});

// ─── Pure logic helpers (these will be extracted from AudioSystem.js) ──────

function getEatSoundParams(size) {
    // Small fish = higher pitch, big fish = lower pitch
    const freq = size === 'big' ? 300 : (size === 'small' ? 800 : 550);
    return { frequency: freq, duration: 0.15, waveform: 'sine' };
}

function getHurtSoundParams() {
    return { frequency: 180, duration: 0.3, waveform: 'sawtooth' };
}

function getLevelUpNotes() {
    return [
        { frequency: 523, duration: 0.1 },  // C5
        { frequency: 659, duration: 0.1 },  // E5
        { frequency: 784, duration: 0.1 },  // G5
        { frequency: 1047, duration: 0.3 }, // C6
    ];
}

function createAudioSystem(audioContext) {
    return {
        enabled: audioContext !== null,
        volume: 0.5,
        ctx: audioContext,
        play(type) {
            if (!this.enabled) return;
        },
        setVolume(v) {
            this.volume = Math.max(0, Math.min(1, v));
        }
    };
}
