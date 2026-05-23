import { PlayerControlSystem } from '../PlayerControlSystem.js';

// Mock player
const createMockPlayer = () => ({
    x: 100,
    y: 100,
    body: {
        velocity: { x: 0, y: 0 },
        setVelocity: () => {},
        setVelocityX: () => {},
        setVelocityY: () => {}
    },
    rotation: 0
});

// Mock scene
const createMockScene = () => {
    const mockCursors = {
        left: { isDown: false },
        right: { isDown: false },
        up: { isDown: false },
        down: { isDown: false }
    };
    const mockShiftKey = { isDown: false };
    return {
        input: {
            keyboard: {
                createCursorKeys: () => mockCursors,
                addKey: () => mockShiftKey
            },
            on: () => {}
        },
        _mockCursors: mockCursors,
        _mockShiftKey: mockShiftKey
    };
};

describe('PlayerControlSystem', () => {
    describe('initialization', () => {
        test('creates player control system', () => {
            const pcs = new PlayerControlSystem({
                scene: createMockScene(),
                player: createMockPlayer()
            });
            expect(pcs).toBeDefined();
        });

        test('initializes with default speed', () => {
            const pcs = new PlayerControlSystem({
                scene: createMockScene(),
                player: createMockPlayer()
            });
            expect(pcs.getSpeed()).toBe(200);
        });

        test('uses custom speed', () => {
            const pcs = new PlayerControlSystem({
                scene: createMockScene(),
                player: createMockPlayer(),
                speed: 300
            });
            expect(pcs.getSpeed()).toBe(300);
        });
    });

    describe('setSpeed', () => {
        test('sets speed', () => {
            const pcs = new PlayerControlSystem({
                scene: createMockScene(),
                player: createMockPlayer()
            });
            pcs.setSpeed(250);
            expect(pcs.getSpeed()).toBe(250);
        });
    });

    describe('reset', () => {
        test('resets mouse active state', () => {
            const pcs = new PlayerControlSystem({
                scene: createMockScene(),
                player: createMockPlayer()
            });
            pcs.reset();
            expect(pcs.isMouseActive()).toBe(false);
        });

        test('accepts new speed config', () => {
            const pcs = new PlayerControlSystem({
                scene: createMockScene(),
                player: createMockPlayer(),
                speed: 200
            });
            pcs.reset({ speed: 300 });
            expect(pcs.getSpeed()).toBe(300);
        });
    });

    describe('isMouseActive', () => {
        test('returns false initially', () => {
            const pcs = new PlayerControlSystem({
                scene: createMockScene(),
                player: createMockPlayer()
            });
            expect(pcs.isMouseActive()).toBe(false);
        });
    });
});