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
                graphics: jest.fn(() => createMockGraphics())
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
});
