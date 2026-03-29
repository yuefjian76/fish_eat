/**
 * FishFactory Tests - Player Fish Enhancement
 */
import { FishFactory } from '../../entities/FishFactory.js';

describe('FishFactory - Player Fish', () => {
    describe('createPlayerFish', () => {
        test('createPlayerFish method exists', () => {
            expect(typeof FishFactory.createPlayerFish).toBe('function');
        });

        test('createPlayerFish is a static method on FishFactory', () => {
            expect(FishFactory).toHaveProperty('createPlayerFish');
        });
    });

    describe('drawClownfish - glowing stripes', () => {
        test('drawClownfish method exists', () => {
            expect(typeof FishFactory.drawClownfish).toBe('function');
        });

        test('drawClownfish is a static method on FishFactory', () => {
            expect(FishFactory).toHaveProperty('drawClownfish');
        });
    });

    describe('createFish', () => {
        test('createFish method exists', () => {
            expect(typeof FishFactory.createFish).toBe('function');
        });

        test('createFish is a static method on FishFactory', () => {
            expect(FishFactory).toHaveProperty('createFish');
        });
    });
});
