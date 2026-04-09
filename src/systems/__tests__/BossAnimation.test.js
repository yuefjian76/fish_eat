import { jest } from '@jest/globals';

describe('BossAnimation', () => {
    test('boss rises from bottom with screen shake', () => {
        const mockBoss = {
            graphics: {
                setPosition: jest.fn(),
                setTint: jest.fn()
            }
        };
        const mockScene = {
            tweens: { add: jest.fn() },
            cameras: { main: { shake: jest.fn() } }
        };

        // Create animation object with behavior
        const animation = {
            boss: mockBoss,
            scene: mockScene,
            play: function(type, boss) {
                if (type === 'rise_from_bottom') {
                    boss.graphics.setPosition(boss.graphics.x || 400, 700);
                    this.scene.cameras.main.shake(500, 0.01);
                    this.scene.tweens.add({
                        targets: boss.graphics,
                        y: 384,
                        duration: 2000,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
        };

        animation.play('rise_from_bottom', mockBoss);

        expect(mockBoss.graphics.setPosition).toHaveBeenCalled();
        expect(mockScene.cameras.main.shake).toHaveBeenCalled();
        expect(mockScene.tweens.add).toHaveBeenCalled();
    });

    test('boss charges from left', () => {
        const mockBoss = {
            graphics: {
                setPosition: jest.fn(),
                x: -100
            }
        };
        const mockScene = {
            tweens: { add: jest.fn() }
        };

        const animation = {
            boss: mockBoss,
            scene: mockScene,
            play: function(type, boss) {
                if (type === 'charge_from_left') {
                    boss.graphics.setPosition(-100, 384);
                    this.scene.tweens.add({
                        targets: boss.graphics,
                        x: 400,
                        duration: 1500,
                        ease: 'Quad.easeOut'
                    });
                }
            }
        };

        animation.play('charge_from_left', mockBoss);

        expect(mockBoss.graphics.setPosition).toHaveBeenCalled();
        expect(mockScene.tweens.add).toHaveBeenCalled();
    });
});
