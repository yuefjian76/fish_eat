import { jest } from '@jest/globals';

// Mock body with velocity
const createMockBody = () => ({
    _velocity: { x: 0, y: 0 },
    setVelocity: jest.fn(function(x, y) {
        this._velocity.x = x;
        this._velocity.y = y;
    }),
    getVelocity: jest.fn(function() {
        return this._velocity;
    })
});

// Mock target with graphics position
const createMockTarget = (x, y) => ({
    x,
    y,
    graphics: { x, y },
    body: createMockBody()
});

// Mock Phaser camera shake
const createMockCamera = () => ({
    _shakeIntensity: 0,
    _shakeDuration: 0,
    _shakeTimer: 0,
    shake: jest.fn(function(intensity, duration) {
        this._shakeIntensity = intensity;
        this._shakeDuration = duration;
        this._shakeTimer = duration;
    }),
    resetShake: jest.fn(function() {
        this._shakeIntensity = 0;
        this._shakeDuration = 0;
        this._shakeTimer = 0;
    })
});

// Import the module
import { ImpactSystem, MAX_KNOCKBACK_VELOCITY } from '../ImpactSystem.js';

describe('ImpactSystem', () => {
    describe('MAX_KNOCKBACK_VELOCITY constant', () => {
        test('is defined and is a positive number', () => {
            expect(MAX_KNOCKBACK_VELOCITY).toBeGreaterThan(0);
        });

        test('is 450 based on existing implementation', () => {
            expect(MAX_KNOCKBACK_VELOCITY).toBe(450);
        });
    });

    describe('applyKnockback', () => {
        test('knockback direction is away from attacker', () => {
            // Player at (100,100), attacker at (200,100) → knockback should be negative X (away from attacker)
            const target = createMockTarget(100, 100);
            const source = { x: 200, y: 100 };
            const damage = 10;

            ImpactSystem.applyKnockback(target, source, damage);

            const velocity = target.body.getVelocity();
            expect(velocity.x).toBeLessThan(0);
            expect(velocity.y).toBe(0);
        });

        test('knockback magnitude scales with damage', () => {
            const lightTarget = createMockTarget(100, 100);
            const heavyTarget = createMockTarget(100, 100);
            const source = { x: 200, y: 100 };

            ImpactSystem.applyKnockback(lightTarget, source, 5);
            ImpactSystem.applyKnockback(heavyTarget, source, 20);

            const lightVel = lightTarget.body.getVelocity();
            const heavyVel = heavyTarget.body.getVelocity();
            const lightMag = Math.hypot(lightVel.x, lightVel.y);
            const heavyMag = Math.hypot(heavyVel.x, heavyVel.y);

            expect(heavyMag).toBeGreaterThan(lightMag);
        });

        test('knockback works from all directions', () => {
            // Attacker below target
            const target1 = createMockTarget(100, 100);
            ImpactSystem.applyKnockback(target1, { x: 100, y: 200 }, 10);
            expect(target1.body.getVelocity().y).toBeLessThan(0);

            // Attacker above target
            const target2 = createMockTarget(100, 100);
            ImpactSystem.applyKnockback(target2, { x: 100, y: 0 }, 10);
            expect(target2.body.getVelocity().y).toBeGreaterThan(0);

            // Attacker left of target
            const target3 = createMockTarget(100, 100);
            ImpactSystem.applyKnockback(target3, { x: 0, y: 100 }, 10);
            expect(target3.body.getVelocity().x).toBeGreaterThan(0);

            // Attacker right of target
            const target4 = createMockTarget(100, 100);
            ImpactSystem.applyKnockback(target4, { x: 200, y: 100 }, 10);
            expect(target4.body.getVelocity().x).toBeLessThan(0);
        });

        test('knockback magnitude is capped at MAX_KNOCKBACK_VELOCITY', () => {
            const target = createMockTarget(100, 100);
            const source = { x: 200, y: 100 };

            // Very high damage should still respect velocity cap
            ImpactSystem.applyKnockback(target, source, 100);

            const velocity = target.body.getVelocity();
            const magnitude = Math.hypot(velocity.x, velocity.y);
            expect(magnitude).toBeLessThanOrEqual(MAX_KNOCKBACK_VELOCITY);
        });

        test('handles diagonal knockback correctly', () => {
            const target = createMockTarget(100, 100);
            const source = { x: 200, y: 200 };

            ImpactSystem.applyKnockback(target, source, 10);

            const velocity = target.body.getVelocity();
            expect(velocity.x).toBeLessThan(0);
            expect(velocity.y).toBeLessThan(0);
        });

        test('returns early when target is null', () => {
            expect(() => ImpactSystem.applyKnockback(null, { x: 100, y: 100 }, 10)).not.toThrow();
        });

        test('returns early when target has no body', () => {
            const targetNoBody = { x: 100, y: 100, graphics: { x: 100, y: 100 } };
            expect(() => ImpactSystem.applyKnockback(targetNoBody, { x: 200, y: 100 }, 10)).not.toThrow();
        });

        test('uses graphics.position when body is not available for direction calculation', () => {
            const target = {
                x: 100,
                y: 100,
                graphics: { x: 100, y: 100 },
                body: null
            };
            // Should not throw, uses graphics position
            expect(() => ImpactSystem.applyKnockback(target, { x: 200, y: 100 }, 10)).not.toThrow();
        });
    });

    describe('screenShake', () => {
        test('applies shake to camera with given intensity and duration', () => {
            const mockCamera = createMockCamera();
            ImpactSystem.screenShake(mockCamera, 0.01, 100);

            expect(mockCamera.shake).toHaveBeenCalledWith(0.01, 100);
        });

        test('can be called multiple times', () => {
            const mockCamera = createMockCamera();
            ImpactSystem.screenShake(mockCamera, 0.005, 50);
            ImpactSystem.screenShake(mockCamera, 0.02, 200);

            expect(mockCamera.shake).toHaveBeenCalledTimes(2);
        });

        test('shake intensity and duration are passed correctly', () => {
            const mockCamera = createMockCamera();
            ImpactSystem.screenShake(mockCamera, 0.01, 100);

            expect(mockCamera._shakeIntensity).toBe(0.01);
            expect(mockCamera._shakeDuration).toBe(100);
        });
    });
});