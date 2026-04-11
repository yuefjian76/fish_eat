import { jest } from '@jest/globals';
import { BossAnimation } from '../BossAnimation.js';

describe('BossAnimation', () => {
    let mockScene;
    let mockBoss;

    beforeEach(() => {
        mockScene = {
            tweens: { add: jest.fn(), killAll: jest.fn() },
            cameras: { main: { shake: jest.fn() } }
        };

        mockBoss = {
            graphics: {
                x: 400,
                y: 384,
                setPosition: jest.fn()
            }
        };
    });

    describe('constructor', () => {
        test('initializes with scene and null animation', () => {
            const animation = new BossAnimation(mockScene);

            expect(animation.scene).toBe(mockScene);
            expect(animation.currentAnimation).toBeNull();
        });
    });

    describe('play', () => {
        test('sets currentAnimation when play is called', () => {
            const animation = new BossAnimation(mockScene);

            animation.play('rise_from_bottom', mockBoss);

            expect(animation.currentAnimation).toBe('rise_from_bottom');
        });

        test('rise_from_bottom triggers rise animation', () => {
            const animation = new BossAnimation(mockScene);

            animation.play('rise_from_bottom', mockBoss);

            expect(mockBoss.graphics.setPosition).toHaveBeenCalledWith(400, 700);
            expect(mockScene.cameras.main.shake).toHaveBeenCalledWith(500, 0.01);
            expect(mockScene.tweens.add).toHaveBeenCalledWith({
                targets: mockBoss.graphics,
                y: 384,
                duration: 2000,
                ease: 'Sine.easeInOut'
            });
        });

        test('charge_from_left triggers charge animation', () => {
            const animation = new BossAnimation(mockScene);

            animation.play('charge_from_left', mockBoss);

            expect(mockBoss.graphics.setPosition).toHaveBeenCalledWith(-100, 384);
            expect(mockScene.tweens.add).toHaveBeenCalledWith({
                targets: mockBoss.graphics,
                x: 400,
                duration: 1500,
                ease: 'Quad.easeOut'
            });
        });

        test('unknown animation type does nothing', () => {
            const animation = new BossAnimation(mockScene);

            animation.play('unknown_animation', mockBoss);

            expect(animation.currentAnimation).toBe('unknown_animation');
            expect(mockBoss.graphics.setPosition).not.toHaveBeenCalled();
            expect(mockScene.tweens.add).not.toHaveBeenCalled();
        });

        test('rise_from_bottom without cameras does not throw', () => {
            const sceneWithoutCameras = {
                tweens: { add: jest.fn() }
            };
            const animation = new BossAnimation(sceneWithoutCameras);

            // Should not throw
            animation.play('rise_from_bottom', mockBoss);

            expect(sceneWithoutCameras.tweens.add).toHaveBeenCalled();
        });
    });

    describe('isPlaying', () => {
        test('returns false when no animation has been played', () => {
            const animation = new BossAnimation(mockScene);

            expect(animation.isPlaying()).toBe(false);
        });

        test('returns true when animation is playing', () => {
            const animation = new BossAnimation(mockScene);

            animation.play('rise_from_bottom', mockBoss);

            expect(animation.isPlaying()).toBe(true);
        });

        test('returns true after charge_from_left', () => {
            const animation = new BossAnimation(mockScene);

            animation.play('charge_from_left', mockBoss);

            expect(animation.isPlaying()).toBe(true);
        });
    });

    describe('stop', () => {
        test('calls killAll on tweens', () => {
            const animation = new BossAnimation(mockScene);

            animation.play('rise_from_bottom', mockBoss);
            animation.stop();

            expect(mockScene.tweens.killAll).toHaveBeenCalled();
        });

        test('resets currentAnimation to null', () => {
            const animation = new BossAnimation(mockScene);

            animation.play('rise_from_bottom', mockBoss);
            animation.stop();

            expect(animation.currentAnimation).toBeNull();
        });

        test('stop when no animation does not throw', () => {
            const animation = new BossAnimation(mockScene);

            // Should not throw
            animation.stop();

            expect(animation.currentAnimation).toBeNull();
        });

        test('stop without tweens does not throw', () => {
            const sceneWithoutTweens = {};
            const animation = new BossAnimation(sceneWithoutTweens);

            // Should not throw
            animation.stop();

            expect(animation.currentAnimation).toBeNull();
        });
    });

    describe('playRiseFromBottom', () => {
        test('uses default x position when graphics.x is undefined', () => {
            const animation = new BossAnimation(mockScene);
            const bossWithNoX = {
                graphics: {
                    x: undefined,
                    y: 384,
                    setPosition: jest.fn()
                }
            };

            animation.play('rise_from_bottom', bossWithNoX);

            expect(bossWithNoX.graphics.setPosition).toHaveBeenCalledWith(400, 700);
        });
    });

    describe('playChargeFromLeft', () => {
        test('uses default y position when graphics.y is undefined', () => {
            const animation = new BossAnimation(mockScene);
            const bossWithNoY = {
                graphics: {
                    x: 400,
                    y: undefined,
                    setPosition: jest.fn()
                }
            };

            animation.play('charge_from_left', bossWithNoY);

            expect(bossWithNoY.graphics.setPosition).toHaveBeenCalledWith(-100, 384);
        });
    });
});
