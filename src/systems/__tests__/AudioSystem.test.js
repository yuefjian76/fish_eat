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

describe('AudioSystem - BGM parameters', () => {
    test('getOceanHumFreq returns low frequency for deep sea', () => {
        expect(getOceanHumFreq('deep')).toBe(55);
    });

    test('getOceanHumFreq returns higher frequency for tropical', () => {
        expect(getOceanHumFreq('tropical')).toBe(110);
    });

    test('getOceanHumFreq returns medium frequency for arctic', () => {
        expect(getOceanHumFreq('arctic')).toBe(80);
    });

    test('getOceanHumFreq defaults to 80 for unknown theme', () => {
        expect(getOceanHumFreq('unknown')).toBe(80);
    });

    test('bubbleChance scales with difficulty', () => {
        expect(getBubbleChance('easy')).toBeLessThan(getBubbleChance('hard'));
    });

    test('bubbleFrequency is higher for tropical', () => {
        expect(getBubbleFrequency('tropical')).toBeGreaterThan(getBubbleFrequency('deep'));
    });

    test('getLFOOscillatorType returns sine for ocean wave feel', () => {
        expect(getLFOOscillatorType()).toBe('sine');
    });
});

function getOceanHumFreq(theme) {
    switch (theme) {
        case 'deep': return 55;
        case 'tropical': return 110;
        case 'arctic': return 80;
        default: return 80;
    }
}

function getBubbleChance(difficulty) {
    switch (difficulty) {
        case 'easy': return 0.1;
        case 'normal': return 0.2;
        case 'hard': return 0.3;
        default: return 0.2;
    }
}

function getBubbleFrequency(theme) {
    switch (theme) {
        case 'deep': return 0.7;
        case 'tropical': return 1.2;
        case 'arctic': return 0.9;
        default: return 1.0;
    }
}

function getLFOOscillatorType() {
    return 'sine';
}
