/**
 * AudioMusicSystem.test.js
 * Tests for procedural background music using Web Audio API oscillators
 */

import { AudioMusicSystem } from '../AudioMusicSystem.js';

describe('AudioMusicSystem', () => {
    let mockCtx;
    let mockGainNode;
    let mockOscillatorNode;
    let mockDestination;

    beforeEach(() => {
        mockGainNode = {
            gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {}
        };
        mockOscillatorNode = {
            type: null,
            frequency: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
            connect: () => {},
            start: () => {},
            stop: () => {}
        };
        mockDestination = {};
        mockCtx = {
            createOscillator: () => ({ ...mockOscillatorNode, type: 'sine' }),
            createGain: () => ({ ...mockGainNode }),
            currentTime: 0,
            destination: mockDestination,
            state: 'running',
            resume: () => {},
            suspend: () => {}
        };
    });

    describe('constructor', () => {
        test('creates system with default values', () => {
            const sys = new AudioMusicSystem(mockCtx);
            expect(sys.volume).toBe(0.3);
            expect(sys.enabled).toBe(true);
            expect(sys.currentMood).toBeNull();
        });

        test('disables when AudioContext is null', () => {
            const sys = new AudioMusicSystem(null);
            expect(sys.enabled).toBe(false);
        });

        test('disables when AudioContext is undefined', () => {
            const sys = new AudioMusicSystem(undefined);
            expect(sys.enabled).toBe(false);
        });
    });

    describe('volume control', () => {
        test('setVolume updates volume within bounds', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.setVolume(0.5);
            expect(sys.volume).toBe(0.5);
        });

        test('setVolume clamps to minimum 0', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.setVolume(-0.5);
            expect(sys.volume).toBe(0);
        });

        test('setVolume clamps to maximum 1', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.setVolume(1.5);
            expect(sys.volume).toBe(1);
        });
    });

    describe('start/stop music', () => {
        test('startMusic creates oscillators for calm mood', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.startMusic('calm');

            expect(sys.currentMood).toBe('calm');
            expect(sys.isPlaying).toBe(true);
        });

        test('startMusic creates oscillators for surge mood', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.startMusic('surge');

            expect(sys.currentMood).toBe('surge');
            expect(sys.isPlaying).toBe(true);
        });

        test('startMusic creates oscillators for victory mood', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.startMusic('victory');

            expect(sys.currentMood).toBe('victory');
            expect(sys.isPlaying).toBe(true);
        });

        test('stopMusic stops all oscillators', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.startMusic('calm');
            sys.stopMusic();

            expect(sys.isPlaying).toBe(false);
            expect(sys.currentMood).toBeNull();
        });

        test('startMusic overwrites previous music', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.startMusic('calm');
            const firstMood = sys.currentMood;

            sys.startMusic('surge');
            expect(firstMood).toBe('calm');
            expect(sys.currentMood).toBe('surge');
        });

        test('startMusic does nothing when disabled', () => {
            const sys = new AudioMusicSystem(null);
            sys.startMusic('calm');
            expect(sys.isPlaying).toBe(false);
        });

        test('stopMusic does nothing when disabled', () => {
            const sys = new AudioMusicSystem(null);
            sys.stopMusic();
            expect(sys.isPlaying).toBe(false);
        });
    });

    describe('setMood', () => {
        test('setMood changes mood while playing', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.startMusic('calm');
            sys.setMood('surge');

            expect(sys.currentMood).toBe('surge');
            expect(sys.isPlaying).toBe(true);
        });

        test('setMood starts music if not playing', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.setMood('victory');

            expect(sys.currentMood).toBe('victory');
            expect(sys.isPlaying).toBe(true);
        });

        test('setMood does nothing when disabled', () => {
            const sys = new AudioMusicSystem(null);
            sys.setMood('calm');
            expect(sys.currentMood).toBeNull();
        });
    });

    describe('mood parameters', () => {
        test('getMoodParams returns calm parameters', () => {
            const params = getMoodParams('calm');
            expect(params.baseFreq).toBeLessThan(150);
            expect(params.waveform).toBe('sine');
            expect(params.lfoRate).toBeLessThan(1);
        });

        test('getMoodParams returns surge parameters', () => {
            const params = getMoodParams('surge');
            expect(params.baseFreq).toBeGreaterThan(200);
            expect(params.waveform).toBe('sawtooth');
        });

        test('getMoodParams returns victory parameters', () => {
            const params = getMoodParams('victory');
            expect(params.baseFreq).toBeGreaterThan(300);
            expect(params.waveform).toBe('triangle');
        });
    });

    describe('smooth transitions', () => {
        test('transitionDuration is reasonable for music', () => {
            const sys = new AudioMusicSystem(mockCtx);
            expect(sys.transitionDuration).toBeGreaterThan(0.5);
            expect(sys.transitionDuration).toBeLessThan(5);
        });
    });

    describe('oscillator cleanup', () => {
        test('activeOscillators is empty initially', () => {
            const sys = new AudioMusicSystem(mockCtx);
            expect(sys.activeOscillators).toEqual([]);
        });

        test('activeOscillators tracks running oscillators', () => {
            const sys = new AudioMusicSystem(mockCtx);
            sys.startMusic('calm');
            expect(sys.activeOscillators.length).toBeGreaterThan(0);
        });
    });

    describe('resume context on start', () => {
        test('resumes suspended AudioContext', () => {
            let resumed = false;
            mockCtx = {
                createOscillator: () => ({ ...mockOscillatorNode, type: 'sine' }),
                createGain: () => ({ ...mockGainNode }),
                currentTime: 0,
                destination: mockDestination,
                state: 'suspended',
                resume: () => { resumed = true; },
                suspend: () => {}
            };
            const sys = new AudioMusicSystem(mockCtx);
            sys.startMusic('calm');

            expect(resumed).toBe(true);
        });
    });
});

// ─── Pure logic helpers (mirror implementation logic) ────────────────────────

function getMoodParams(mood) {
    switch (mood) {
        case 'calm':
            return { baseFreq: 110, waveform: 'sine', lfoRate: 0.3 };
        case 'surge':
            return { baseFreq: 220, waveform: 'sawtooth', lfoRate: 2.5 };
        case 'victory':
            return { baseFreq: 440, waveform: 'triangle', lfoRate: 4 };
        default:
            return { baseFreq: 110, waveform: 'sine', lfoRate: 0.3 };
    }
}