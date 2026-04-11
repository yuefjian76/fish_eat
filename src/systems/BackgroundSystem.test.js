/**
 * BackgroundSystem Tests
 * Tests for image-based underwater decoration system with bubbles
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { BackgroundSystem } from './BackgroundSystem.js';

// Helper to create mock Phaser image with x, y properties
function createMockImage(x = 0, y = 0) {
    return {
        x,
        y,
        setDepth: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        destroy: jest.fn()
    };
}

// Helper to create mock Phaser graphics object
function createMockGraphics(x = 0, y = 0) {
    return {
        x,
        y,
        fillStyle: jest.fn().mockReturnThis(),
        fillCircle: jest.fn().mockReturnThis(),
        fillRect: jest.fn().mockReturnThis(),
        lineStyle: jest.fn().mockReturnThis(),
        strokeCircle: jest.fn().mockReturnThis(),
        strokeRect: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setScale: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        destroy: jest.fn()
    };
}

describe('BackgroundSystem', () => {
    let mockScene;
    let mockImageFactory;
    let mockGraphicsFactory;
    let mockTween;
    let createdImages;
    let createdGraphics;

    beforeEach(() => {
        createdImages = [];
        createdGraphics = [];

        mockTween = {
            add: jest.fn().mockReturnValue({
                targets: null,
                y: 0,
                alpha: 1,
                scale: 1,
                duration: 0,
                repeat: -1,
                onRepeat: jest.fn()
            })
        };

        // Create a new mock image factory each time
        mockImageFactory = (x, y, key) => {
            const img = createMockImage(x, y);
            createdImages.push(img);
            return img;
        };

        // Create a new mock graphics factory each time
        mockGraphicsFactory = () => {
            const g = createMockGraphics();
            createdGraphics.push(g);
            return g;
        };

        mockScene = {
            add: {
                image: mockImageFactory,
                graphics: mockGraphicsFactory
            },
            tweens: mockTween
        };
    });

    describe('constructor', () => {
        test('creates BackgroundSystem instance', () => {
            const system = new BackgroundSystem(mockScene);
            expect(system).toBeDefined();
            expect(system.scene).toBe(mockScene);
            expect(system.bubbles).toEqual([]);
            expect(system.bgImages).toEqual({});
        });

        test('sets correct screen dimensions', () => {
            const system = new BackgroundSystem(mockScene, 1280, 720);
            expect(system.screenWidth).toBe(1280);
            expect(system.screenHeight).toBe(720);
        });

        test('sets bubble respawn position below screen', () => {
            const system = new BackgroundSystem(mockScene, 1024, 768);
            expect(system.bubbleRespawnY).toBe(768 + 50);
        });
    });

    describe('createBackground', () => {
        test('loads all background images', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBackground();

            // Should create 5 background images (background, far, midground, sand, foreground)
            // Each call creates one image, 5 calls for background layers
            expect(createdImages.length).toBeGreaterThanOrEqual(5);
        });

        test('sets depth for background layers', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBackground();

            // At least some images should have setDepth called
            const hasSetDepth = createdImages.some(img =>
                img.setDepth.mock.calls.length > 0
            );
            expect(hasSetDepth).toBe(true);
        });

        test('scales background images', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBackground();

            // At least some images should have setScale called
            const hasSetScale = createdImages.some(img =>
                img.setScale.mock.calls.length > 0
            );
            expect(hasSetScale).toBe(true);
        });
    });

    describe('createBubbleAnimation', () => {
        test('creates 70 bubbles by default', () => {
            const system = new BackgroundSystem(mockScene);
            system._createBubbleAnimation();

            expect(system.bubbles.length).toBe(70);
        });

        test('creates bubble objects with required methods', () => {
            const system = new BackgroundSystem(mockScene, 1024, 768);
            system._createBubbleAnimation();

            // Each bubble should be a Phaser image-like object with required methods
            system.bubbles.forEach(bubble => {
                expect(bubble).toHaveProperty('setScale');
                expect(bubble).toHaveProperty('setAlpha');
                expect(bubble).toHaveProperty('setDepth');
                expect(bubble).toHaveProperty('destroy');
            });
        });

        test('bubbles are positioned within screen bounds', () => {
            const system = new BackgroundSystem(mockScene, 1024, 768);
            system._createBubbleAnimation();

            // All bubbles should have x between 0 and 1024
            system.bubbles.forEach(bubble => {
                expect(bubble.x).toBeGreaterThanOrEqual(0);
                expect(bubble.x).toBeLessThanOrEqual(1024);
            });
        });

        test('bubbles have animation tweens added', () => {
            const system = new BackgroundSystem(mockScene);
            system._createBubbleAnimation();

            // Should add 2 tweens per bubble (rise + wobble) = 140 total
            expect(mockTween.add).toHaveBeenCalled();
            expect(mockTween.add.mock.calls.length).toBe(140);
        });

        test('bubble tweens have correct properties', () => {
            const system = new BackgroundSystem(mockScene);
            system._createBubbleAnimation();

            const tweenCall = mockTween.add.mock.calls[0][0];
            expect(tweenCall).toHaveProperty('targets');
            expect(tweenCall).toHaveProperty('y');
            expect(tweenCall).toHaveProperty('alpha');
            expect(tweenCall).toHaveProperty('duration');
            expect(tweenCall).toHaveProperty('repeat', -1);
        });

        test('bubble tweens have onRepeat callback for respawn', () => {
            const system = new BackgroundSystem(mockScene);
            system._createBubbleAnimation();

            const tweenCall = mockTween.add.mock.calls[0][0];
            expect(tweenCall.onRepeat).toBeDefined();
            expect(typeof tweenCall.onRepeat).toBe('function');
        });
    });

    describe('setPlayerPosition', () => {
        test('stores player position', () => {
            const system = new BackgroundSystem(mockScene);
            system.setPlayerPosition(500, 400);

            expect(system.playerX).toBe(500);
            expect(system.playerY).toBe(400);
        });
    });

    describe('update', () => {
        test('updates parallax based on player position', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBackground();
            system.setPlayerPosition(500, 384);

            // Should not throw when updating parallax
            expect(() => system.update(16)).not.toThrow();
        });

        test('handles update without player position', () => {
            const system = new BackgroundSystem(mockScene);
            // Don't set player position

            // Should not throw
            expect(() => system.update(16)).not.toThrow();
        });
    });

    describe('destroy', () => {
        test('cleans up all background images', () => {
            const system = new BackgroundSystem(mockScene);

            // Create mock destroy functions
            const destroyFns = {
                background: jest.fn(),
                far: jest.fn(),
                midground: jest.fn(),
                sand: jest.fn(),
                foreground: jest.fn()
            };

            // Manually set up bgImages with mock destroy methods
            system.bgImages.background = { destroy: destroyFns.background };
            system.bgImages.far = { destroy: destroyFns.far };
            system.bgImages.midground = { destroy: destroyFns.midground };
            system.bgImages.sand = { destroy: destroyFns.sand };
            system.bgImages.foreground = { destroy: destroyFns.foreground };

            // Capture state before destroy
            const bgImagesBefore = { ...system.bgImages };

            system.destroy();

            // Verify destroy was called on all images BEFORE reset
            expect(destroyFns.background).toHaveBeenCalled();
            expect(destroyFns.far).toHaveBeenCalled();
            expect(destroyFns.midground).toHaveBeenCalled();
            expect(destroyFns.sand).toHaveBeenCalled();
            expect(destroyFns.foreground).toHaveBeenCalled();

            // After reset, bgImages should be empty
            expect(system.bgImages).toEqual({});
        });

        test('cleans up all bubbles', () => {
            const system = new BackgroundSystem(mockScene);
            system._createBubbleAnimation();

            // Mock destroy on each bubble
            system.bubbles.forEach(b => b.destroy = jest.fn());

            system.destroy();

            expect(system.bubbles.length).toBe(0);
        });

        test('resets bgImages to empty object', () => {
            const system = new BackgroundSystem(mockScene);

            // Manually set some bgImages
            system.bgImages.background = { destroy: jest.fn() };
            system.destroy();

            expect(system.bgImages).toEqual({});
        });
    });
});
