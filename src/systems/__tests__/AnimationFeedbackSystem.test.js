import { jest } from '@jest/globals';
import { AnimationFeedbackSystem } from '../AnimationFeedbackSystem.js';

const makeScene = (config = null) => {
    const scene = {
        add: {
            graphics: jest.fn(() => ({ setDepth: jest.fn(), setScrollFactor: jest.fn(), fillStyle: jest.fn(), fillCircle: jest.fn(), fillRect: jest.fn(), destroy: jest.fn(), alpha: 0 })),
            text: jest.fn((x, y, content, style) => ({ x, y, content, style, setOrigin: jest.fn(() => ({ setDepth: jest.fn(), destroy: jest.fn() })), setDepth: jest.fn(), destroy: jest.fn() })),
            container: jest.fn(() => ({ add: jest.fn(), setDepth: jest.fn(), destroy: jest.fn() })),
        },
        tweens: { add: jest.fn(({ onComplete }) => { if (onComplete) onComplete(); }) },
        cache: { json: { get: jest.fn(() => config) } },
        logger: { warn: jest.fn() },
        scale: { width: 1024, height: 768 },
    };
    return scene;
};

const fullConfig = {
    levelUp: { ring: { radius: [0, 200], duration: 800, alpha: [1, 0], colors: ['#FFD700'] }, text: { content: 'LEVEL UP!', color: '#FFD700', fontSize: 48, yStart: 200, yEnd: 100, duration: 1200 }, particles: { count: 8, colors: ['#FFD700'], distance: 100, duration: 600 } },
    skillUse: { flash: { duration: 300, alpha: 0.5, color: '#FFFFFF' }, text: { color: '#00FF00', fontSize: 28, yOffset: -50, duration: 600 }, particles: { count: 8, distance: 60, duration: 400 } },
    eat: { flash: { duration: 50, alpha: 0.2, color: '#FFFF00' }, particles: { count: 6, colors: ['#FFFF00'], distance: 40, duration: 300 } },
};

describe('AnimationFeedbackSystem', () => {
    test('constructor loads config from cache', () => {
        const scene = makeScene(fullConfig);
        const sys = new AnimationFeedbackSystem(scene);
        expect(sys.config).toBe(fullConfig);
    });

    test('constructor accepts config directly', () => {
        const scene = makeScene(null);
        const sys = new AnimationFeedbackSystem(scene, fullConfig);
        expect(sys.config).toBe(fullConfig);
    });

    test('trigger("levelUp", {level: 5}) creates animations', () => {
        const scene = makeScene(fullConfig);
        const sys = new AnimationFeedbackSystem(scene);
        sys.trigger('levelUp', { level: 5 });
        expect(scene.add.graphics).toHaveBeenCalled();
        expect(scene.add.text).toHaveBeenCalled();
    });

    test('trigger("skillUse", {slot: "Q"}) creates flash + text + particles', () => {
        const scene = makeScene(fullConfig);
        scene.player = { x: 300, y: 400 };
        const sys = new AnimationFeedbackSystem(scene);
        sys.trigger('skillUse', { slot: 'Q', text: '撕咬', color: '#FF4444' });
        expect(scene.add.graphics).toHaveBeenCalled();
        expect(scene.add.text).toHaveBeenCalled();
    });

    test('trigger("eat", {x, y, exp}) creates particles', () => {
        const scene = makeScene(fullConfig);
        const sys = new AnimationFeedbackSystem(scene);
        sys.trigger('eat', { x: 500, y: 400, exp: 10 });
        expect(scene.add.graphics).toHaveBeenCalled();
    });

    test('trigger("unknown", {}) returns null and logs warn', () => {
        const scene = makeScene(fullConfig);
        const sys = new AnimationFeedbackSystem(scene);
        const result = sys.trigger('unknown', {});
        expect(result).toBeNull();
        expect(scene.logger.warn).toHaveBeenCalled();
    });

    test('trigger("levelUp") without config returns null and logs warn', () => {
        const scene = makeScene(null);
        const sys = new AnimationFeedbackSystem(scene, null);
        const result = sys.trigger('levelUp', { level: 5 });
        expect(result).toBeNull();
        expect(scene.logger.warn).toHaveBeenCalled();
    });

    test('trigger("levelUp") with missing levelUp key returns null', () => {
        const scene = makeScene({ skillUse: {}, eat: {} });
        const sys = new AnimationFeedbackSystem(scene);
        const result = sys.trigger('levelUp', { level: 5 });
        expect(result).toBeNull();
        expect(scene.logger.warn).toHaveBeenCalled();
    });
});
