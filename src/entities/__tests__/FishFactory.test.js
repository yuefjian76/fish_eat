import { jest } from '@jest/globals';
import { FishFactory } from '../../entities/FishFactory.js';

describe('FishFactory', () => {
    let mockScene;

    // Shared helper to create mock graphics object
    function createMockGraphics() {
        return {
            fillStyle: jest.fn().mockReturnThis(),
            fillEllipse: jest.fn().mockReturnThis(),
            fillTriangle: jest.fn().mockReturnThis(),
            fillRect: jest.fn().mockReturnThis(),
            fillCircle: jest.fn().mockReturnThis(),
            lineStyle: jest.fn().mockReturnThis(),
            lineBetween: jest.fn().mockReturnThis(),
            beginPath: jest.fn().mockReturnThis(),
            moveTo: jest.fn().mockReturnThis(),
            lineTo: jest.fn().mockReturnThis(),
            arc: jest.fn().mockReturnThis(),
            strokePath: jest.fn().mockReturnThis(),
            closePath: jest.fn().mockReturnThis(),
            fillPath: jest.fn().mockReturnThis()
        };
    }

    beforeEach(() => {
        mockScene = {
            add: {
                graphics: jest.fn(() => ({
                    ...createMockGraphics(),
                    setDepth: jest.fn().mockReturnThis(),
                    setPosition: jest.fn().mockReturnThis()
                })),
                image: jest.fn(() => ({
                    setScale: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setTint: jest.fn().mockReturnThis(),
                    setSize: jest.fn().mockReturnThis()
                }))
            },
            textures: {
                exists: jest.fn().mockReturnValue(true)
            }
        };
    });

    describe('createFish', () => {
        test('creates clownfish with correct graphics', () => {
            const graphics = FishFactory.createFish(mockScene, 'clownfish', 30, 0xFF6B6B);
            expect(graphics).toBeDefined();
            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        test('creates shrimp with correct graphics', () => {
            const graphics = FishFactory.createFish(mockScene, 'shrimp', 20, 0xFF6B6B);
            expect(graphics).toBeDefined();
        });

        test('creates shark with correct graphics', () => {
            const graphics = FishFactory.createFish(mockScene, 'shark', 50, 0x888888);
            expect(graphics).toBeDefined();
        });

        test('creates default fish for unknown type', () => {
            const graphics = FishFactory.createFish(mockScene, 'unknown', 30, 0xFF6B6B);
            expect(graphics).toBeDefined();
        });
    });

    describe('drawClownfish', () => {
        test('draws clownfish shape', () => {
            const mockGraphics = createMockGraphics();
            FishFactory.drawClownfish(mockGraphics, 30, 0xFF6B6B, { color: 0xCC5555 });
            expect(mockGraphics.fillEllipse).toHaveBeenCalled();
            // Verify fillEllipse is called with body dimensions based on size
            expect(mockGraphics.fillEllipse).toHaveBeenCalledWith(0, 0, 30 * 1.8, 30 * 1.2);
        });
    });

    describe('drawShrimp', () => {
        test('draws shrimp shape', () => {
            const mockGraphics = createMockGraphics();
            FishFactory.drawShrimp(mockGraphics, 20, 0xFF6B6B, { color: 0xCC5555 });
            expect(mockGraphics.fillCircle).toHaveBeenCalled();
            // Verify fillTriangle is called for tail fan
            expect(mockGraphics.fillTriangle).toHaveBeenCalled();
        });
    });

    describe('drawShark', () => {
        test('draws shark shape', () => {
            const mockGraphics = createMockGraphics();
            FishFactory.drawShark(mockGraphics, 50, 0x888888, { color: 0x666666 });
            expect(mockGraphics.fillEllipse).toHaveBeenCalled();
            // Verify fillEllipse is called with body dimensions based on size
            expect(mockGraphics.fillEllipse).toHaveBeenCalledWith(0, 0, 50 * 2.5, 50 * 0.8);
        });
    });

    describe('drawDefaultFish', () => {
        test('draws default fish shape', () => {
            const mockGraphics = createMockGraphics();
            FishFactory.drawDefaultFish(mockGraphics, 30, 0xFF6B6B, { color: 0xCC5555 });
            expect(mockGraphics.fillEllipse).toHaveBeenCalled();
            // Verify fillEllipse is called with body dimensions based on size
            expect(mockGraphics.fillEllipse).toHaveBeenCalledWith(0, 0, 30 * 1.6, 30);
        });
    });

    describe('drawAnglerfish', () => {
        test('draws anglerfish with glowing lure', () => {
            const mockGraphics = createMockGraphics();
            FishFactory.drawAnglerfish(mockGraphics, 35, 0x4B0082, { color: 0x330033 });
            expect(mockGraphics.fillCircle).toHaveBeenCalled(); // Body
            expect(mockGraphics.fillEllipse).toHaveBeenCalled(); // Lure
        });
    });

    describe('drawJellyfish', () => {
        test('draws jellyfish with dome and tentacles', () => {
            const mockGraphics = createMockGraphics();
            FishFactory.drawJellyfish(mockGraphics, 40, 0xADD8E6, { color: 0x88BBDD });
            expect(mockGraphics.fillEllipse).toHaveBeenCalled(); // Dome
            expect(mockGraphics.fillTriangle).toHaveBeenCalled(); // Tentacles
        });
    });

    describe('createPlayerFishFromSprite', () => {
        test('creates player sprite when texture exists', () => {
            const sprite = FishFactory.createPlayerFishFromSprite(mockScene, 1.5, 3);
            expect(sprite).toBeDefined();
            expect(sprite.setScale).toHaveBeenCalledWith(1.5);
            expect(sprite.setDepth).toHaveBeenCalledWith(15);
        });

        test('falls back to procedural when texture not found', () => {
            mockScene.textures.exists.mockReturnValue(false);
            const sprite = FishFactory.createPlayerFishFromSprite(mockScene, 1.0, 0);
            expect(sprite).toBeDefined();
            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        test('adds glow graphics to sprite', () => {
            const sprite = FishFactory.createPlayerFishFromSprite(mockScene, 1.0, 0);
            expect(sprite.glowGraphics).toBeDefined();
        });
    });

    describe('createEnemyFromSprite', () => {
        test('creates enemy sprite for fish type', () => {
            const sprite = FishFactory.createEnemyFromSprite(mockScene, 'fish', 1.0, 0);
            expect(sprite).toBeDefined();
            expect(sprite.setScale).toHaveBeenCalledWith(1.0);
            expect(sprite.setDepth).toHaveBeenCalledWith(10);
            expect(sprite.setTint).toHaveBeenCalledWith(0xff8844);
        });

        test('creates enemy sprite for fish_big type', () => {
            const sprite = FishFactory.createEnemyFromSprite(mockScene, 'fish_big', 2.0, 0);
            expect(sprite).toBeDefined();
        });

        test('falls back to procedural when texture not found', () => {
            mockScene.textures.exists.mockReturnValue(false);
            const sprite = FishFactory.createEnemyFromSprite(mockScene, 'fish', 1.0, 0);
            expect(sprite).toBeDefined();
        });
    });

    describe('createPlayerFish', () => {
        test('creates player fish with sprite when available', () => {
            const fish = FishFactory.createPlayerFish(mockScene, 'clownfish', 45, 0xFF6B6B);
            expect(fish).toBeDefined();
        });

        test('falls back to procedural with glow when sprite fails', () => {
            mockScene.textures.exists.mockReturnValue(false);
            const fish = FishFactory.createPlayerFish(mockScene, 'clownfish', 30, 0xFF6B6B);
            expect(fish).toBeDefined();
            expect(fish.glowGraphics).toBeDefined();
        });
    });
});
