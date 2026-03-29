/**
 * BackgroundSystem Tests
 * Tests for procedural underwater decoration system (bubbles, coral, seaweed)
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { BackgroundSystem } from './BackgroundSystem.js';

describe('BackgroundSystem', () => {
    let mockScene;
    let mockGraphics;

    beforeEach(() => {
        mockGraphics = {
            setDepth: jest.fn(),
            fillStyle: jest.fn().mockReturnThis(),
            fillCircle: jest.fn().mockReturnThis(),
            fillEllipse: jest.fn().mockReturnThis(),
            lineStyle: jest.fn().mockReturnThis(),
            beginPath: jest.fn().mockReturnThis(),
            moveTo: jest.fn().mockReturnThis(),
            lineTo: jest.fn().mockReturnThis(),
            arc: jest.fn().mockReturnThis(),
            strokePath: jest.fn().mockReturnThis(),
            closePath: jest.fn().mockReturnThis(),
            fillPath: jest.fn().mockReturnThis(),
            destroy: jest.fn()
        };

        mockScene = {
            add: {
                graphics: jest.fn(() => mockGraphics)
            },
            time: {
                addEvent: jest.fn()
            },
            tweens: {
                add: jest.fn()
            }
        };
    });

    describe('constructor', () => {
        test('creates BackgroundSystem instance', () => {
            const system = new BackgroundSystem(mockScene);
            expect(system).toBeDefined();
            expect(system.scene).toBe(mockScene);
            expect(system.bubbles).toEqual([]);
            expect(system.corals).toEqual([]);
            expect(system.seaweeds).toEqual([]);
        });
    });

    describe('createBubbles', () => {
        test('creates correct number of bubbles', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(5);

            expect(system.bubbles.length).toBe(5);
        });

        test('bubbles have required properties', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(1);

            const bubble = system.bubbles[0];
            expect(bubble).toHaveProperty('x');
            expect(bubble).toHaveProperty('y');
            expect(bubble).toHaveProperty('size');
            expect(bubble).toHaveProperty('speed');
            expect(bubble).toHaveProperty('drift');
        });

        test('creates bubbles with random sizes between 2 and 8', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(10);

            system.bubbles.forEach(bubble => {
                expect(bubble.size).toBeGreaterThanOrEqual(2);
                expect(bubble.size).toBeLessThanOrEqual(8);
            });
        });

        test('creates bubbles with random speeds between 20 and 60', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(10);

            system.bubbles.forEach(bubble => {
                expect(bubble.speed).toBeGreaterThanOrEqual(20);
                expect(bubble.speed).toBeLessThanOrEqual(60);
            });
        });
    });

    describe('bubble animation', () => {
        test('bubbles rise and despawn at top', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(5);

            // Simulate update with bubbles at y < 0
            system.bubbles.forEach(bubble => {
                bubble.y = -10; // Off screen at top
            });

            system.update(16); // ~60fps delta

            // Bubbles that went off screen should respawn at bottom
            system.bubbles.forEach(bubble => {
                expect(bubble.y).toBeGreaterThanOrEqual(600);
            });
        });

        test('bubbles have horizontal drift', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(3);

            system.bubbles.forEach(bubble => {
                expect(bubble.drift).toBeDefined();
                expect(typeof bubble.drift).toBe('number');
            });
        });
    });

    describe('createCoral', () => {
        test('creates coral at specified position', () => {
            const system = new BackgroundSystem(mockScene);
            const coral = system.createCoral(100, 400, 'branch', 0xFF6B6B);

            expect(coral).toBeDefined();
            expect(coral.x).toBe(100);
            expect(coral.y).toBe(400);
            expect(coral.type).toBe('branch');
            expect(coral.color).toBe(0xFF6B6B);
        });

        test('supports branch coral type', () => {
            const system = new BackgroundSystem(mockScene);
            const coral = system.createCoral(50, 450, 'branch');

            expect(coral.type).toBe('branch');
            expect(system.corals.length).toBe(1);
        });

        test('supports brain coral type', () => {
            const system = new BackgroundSystem(mockScene);
            const coral = system.createCoral(150, 450, 'brain');

            expect(coral.type).toBe('brain');
            expect(system.corals.length).toBe(1);
        });

        test('supports fan coral type', () => {
            const system = new BackgroundSystem(mockScene);
            const coral = system.createCoral(200, 450, 'fan');

            expect(coral.type).toBe('fan');
            expect(system.corals.length).toBe(1);
        });

        test('defaults to branch type', () => {
            const system = new BackgroundSystem(mockScene);
            const coral = system.createCoral(100, 400);

            expect(coral.type).toBe('branch');
        });

        test('defaults to red color', () => {
            const system = new BackgroundSystem(mockScene);
            const coral = system.createCoral(100, 400, 'branch');

            expect(coral.color).toBe(0xFF6B6B);
        });

        test('creates graphics object for coral', () => {
            const system = new BackgroundSystem(mockScene);
            system.createCoral(100, 400, 'branch');

            expect(mockScene.add.graphics).toHaveBeenCalled();
        });
    });

    describe('createSeaweed', () => {
        test('creates seaweed at specified position', () => {
            const system = new BackgroundSystem(mockScene);
            const seaweed = system.createSeaweed(300, 500, 120, 0x2ECC71);

            expect(seaweed).toBeDefined();
            expect(seaweed.x).toBe(300);
            expect(seaweed.y).toBe(500);
            expect(seaweed.height).toBe(120);
            expect(seaweed.color).toBe(0x2ECC71);
        });

        test('has default height of 100', () => {
            const system = new BackgroundSystem(mockScene);
            const seaweed = system.createSeaweed(300, 500);

            expect(seaweed.height).toBe(100);
        });

        test('has default green color', () => {
            const system = new BackgroundSystem(mockScene);
            const seaweed = system.createSeaweed(300, 500);

            expect(seaweed.color).toBe(0x2ECC71);
        });

        test('creates sway tween animation', () => {
            const system = new BackgroundSystem(mockScene);
            system.createSeaweed(300, 500, 100);

            expect(mockScene.tweens.add).toHaveBeenCalled();
        });

        test('adds seaweed to seaweeds array', () => {
            const system = new BackgroundSystem(mockScene);
            system.createSeaweed(300, 500, 100);

            expect(system.seaweeds.length).toBe(1);
        });
    });

    describe('update', () => {
        test('updates bubble positions', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(3);

            const initialY = system.bubbles[0].y;
            system.update(16); // ~60fps

            // Bubble should have moved up
            expect(system.bubbles[0].y).toBeLessThan(initialY);
        });

        test('respawns bubbles at bottom when they reach top', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(2);

            // Move bubbles to top
            system.bubbles[0].y = -10;
            system.bubbles[1].y = -20;

            system.update(16);

            // Bubbles should respawn at bottom
            expect(system.bubbles[0].y).toBeGreaterThanOrEqual(600);
            expect(system.bubbles[1].y).toBeGreaterThanOrEqual(600);
        });
    });

    describe('destroy', () => {
        test('cleans up all bubbles', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(5);
            expect(system.bubbles.length).toBe(5);

            system.destroy();

            expect(system.bubbles.length).toBe(0);
        });

        test('cleans up all corals', () => {
            const system = new BackgroundSystem(mockScene);
            system.createCoral(100, 400, 'branch');
            system.createCoral(200, 400, 'brain');
            expect(system.corals.length).toBe(2);

            system.destroy();

            expect(system.corals.length).toBe(0);
        });

        test('cleans up all seaweeds', () => {
            const system = new BackgroundSystem(mockScene);
            system.createSeaweed(300, 500);
            system.createSeaweed(400, 500);
            expect(system.seaweeds.length).toBe(2);

            system.destroy();

            expect(system.seaweeds.length).toBe(0);
        });
    });
});
