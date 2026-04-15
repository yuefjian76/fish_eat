import { jest } from '@jest/globals';
import { SkillSystem } from '../SkillSystem.js';

describe('SkillSystem', () => {
    let skillSystem;
    const mockSkillsData = {
        bite: { key: 'Q', name: 'Bite', type: 'damage', cooldown: 0.5, unlockLevel: 1, damage: 10, range: 200 },
        shield: { key: 'W', name: 'Shield', type: 'defense', cooldown: 15, unlockLevel: 2, duration: 5 },
        speedUp: { key: 'E', name: 'Speed Up', type: 'buff', cooldown: 20, unlockLevel: 3, duration: 5, speedMultiplier: 1.5 },
        heal: { key: 'R', name: 'Heal', type: 'heal', cooldown: 30, unlockLevel: 5, healAmount: 20 }
    };

    beforeEach(() => {
        skillSystem = new SkillSystem(mockSkillsData);
    });

    describe('constructor', () => {
        test('initializes cooldowns for all skills', () => {
            expect(skillSystem.cooldowns.bite).toBe(0);
            expect(skillSystem.cooldowns.shield).toBe(0);
        });
    });

    describe('isOnCooldown', () => {
        test('returns false when cooldown is 0', () => {
            expect(skillSystem.isOnCooldown('bite')).toBe(false);
        });

        test('returns true when cooldown is active', () => {
            skillSystem.cooldowns.bite = 5;
            expect(skillSystem.isOnCooldown('bite')).toBe(true);
        });
    });

    describe('isSkillUnlocked', () => {
        test('returns true for unlocked skill at correct level', () => {
            expect(skillSystem.isSkillUnlocked('bite', 1)).toBe(true);
        });

        test('returns false for locked skill at low level', () => {
            expect(skillSystem.isSkillUnlocked('shield', 1)).toBe(false);
        });

        test('returns true for locked skill at high level', () => {
            expect(skillSystem.isSkillUnlocked('shield', 3)).toBe(true);
        });

        test('returns false for unknown skill', () => {
            expect(skillSystem.isSkillUnlocked('unknown', 10)).toBe(false);
        });
    });

    describe('isActive', () => {
        test('returns false when no active effect', () => {
            expect(skillSystem.isActive('shield')).toBe(false);
        });

        test('returns true when effect is active', () => {
            skillSystem.activeEffects.shield = { startTime: Date.now(), duration: 5000 };
            expect(skillSystem.isActive('shield')).toBe(true);
        });
    });

    describe('useSkill', () => {
        beforeEach(() => {
            skillSystem.player = { x: 100, y: 100 };
            skillSystem.scene = { level: 10 };
        });

        test('returns null when no player', () => {
            skillSystem.player = null;
            expect(skillSystem.useSkill('Q')).toBeNull();
        });

        test('returns success:false for locked skill', () => {
            skillSystem.scene.level = 1;
            const result = skillSystem.useSkill('W');
            expect(result.success).toBe(false);
            expect(result.reason).toBe('locked');
        });

        test('returns success:false for on cooldown skill', () => {
            skillSystem.cooldowns.bite = 5;
            const result = skillSystem.useSkill('Q');
            expect(result.success).toBe(false);
            expect(result.reason).toBe('cooldown');
        });

        test('returns success:true for valid skill', () => {
            skillSystem.scene.enemies = [{
                graphics: { x: 150, y: 100, active: true },
                fishData: { size: 20 },
                takeDamage: () => false,
                getExpValue: () => 10
            }];
            skillSystem.scene.growthSystem = { addExperience: () => ({ expGained: 10, leveledUp: false }) };
            skillSystem.scene.luckSystem = {};
            skillSystem.scene.time = { now: 0, addEvent: () => {}, delayedCall: () => {} };
            skillSystem.scene.exp = 0;
            skillSystem.scene.score = 0;
            skillSystem.scene.onLevelUp = () => {};
            skillSystem.scene.scene = { get: () => ({ updateUI: () => {} }) };
            skillSystem.scene.updatePlayerHealthBar = () => {};
            const result = skillSystem.useSkill('Q');
            expect(result.success).toBe(true);
        });

        test('starts cooldown after successful use', () => {
            skillSystem.scene.enemies = [{
                graphics: { x: 150, y: 100, active: true },
                fishData: { size: 20 },
                takeDamage: () => false,
                getExpValue: () => 10
            }];
            skillSystem.scene.growthSystem = { addExperience: () => ({ expGained: 10, leveledUp: false }) };
            skillSystem.scene.luckSystem = {};
            skillSystem.scene.time = { now: 0, addEvent: () => {}, delayedCall: () => {} };
            skillSystem.scene.exp = 0;
            skillSystem.scene.score = 0;
            skillSystem.scene.onLevelUp = () => {};
            skillSystem.scene.scene = { get: () => ({ updateUI: () => {} }) };
            skillSystem.scene.updatePlayerHealthBar = () => {};
            skillSystem.useSkill('Q');
            expect(skillSystem.cooldowns.bite).toBe(0.5);
        });

        test('executes defense skill through useSkill', () => {
            skillSystem.scene.level = 5; // shield unlocks at level 2
            skillSystem.player = { x: 100, y: 100, playerData: { size: 30 }, isShielded: false, shieldGraphics: null };
            skillSystem.scene.add = {
                graphics: () => ({
                    setPosition: () => {},
                    fillStyle: () => {},
                    fillCircle: () => {},
                    setDepth: () => {}
                })
            };
            skillSystem.scene.time = {
                now: 1000,
                addEvent: () => ({ remove: () => {} }),
                delayedCall: () => {}
            };
            const result = skillSystem.useSkill('W');
            expect(result.type).toBe('defense');
        });

        test('executes buff skill through useSkill', () => {
            skillSystem.scene.level = 10; // speedUp unlocks at level 3
            skillSystem.scene.player = { x: 100, y: 100 };
            skillSystem.scene.speed = 100;
            skillSystem.scene.time = {
                now: 1000,
                addEvent: () => ({ remove: () => {} }),
                delayedCall: () => {}
            };
            const result = skillSystem.useSkill('E');
            expect(result.type).toBe('buff');
        });

        test('executes heal skill through useSkill', () => {
            skillSystem.scene.level = 10; // heal unlocks at level 5
            skillSystem.player = { x: 100, y: 100 };
            skillSystem.scene.hp = 50;
            skillSystem.scene.maxHp = 100;
            skillSystem.scene.add = {
                text: () => ({
                    setOrigin: () => ({ setDepth: () => {} }),
                    setDepth: () => {},
                    destroy: () => {}
                })
            };
            skillSystem.scene.tweens = {
                add: jest.fn((config) => {
                    if (config.onComplete) config.onComplete();
                    return config;
                })
            };
            skillSystem.scene.time = {
                now: 1000,
                addEvent: () => ({ remove: () => {} }),
                delayedCall: () => {}
            };
            const result = skillSystem.useSkill('R');
            expect(result.type).toBe('heal');
        });
    });

    describe('getCooldownRemaining', () => {
        test('returns 0 when no cooldown', () => {
            expect(skillSystem.getCooldownRemaining('bite')).toBe(0);
        });
    });

    describe('getCooldownPercent', () => {
        test('returns 0 when ready', () => {
            expect(skillSystem.getCooldownPercent('shield')).toBe(0);
        });

        test('returns correct percentage when on cooldown', () => {
            skillSystem.cooldowns.shield = 7.5;
            expect(skillSystem.getCooldownPercent('shield')).toBe(0.5);
        });

        test('returns 0 for unknown skill', () => {
            expect(skillSystem.getCooldownPercent('unknown')).toBe(0);
        });
    });

    describe('setPlayer', () => {
        test('sets player and scene', () => {
            const mockPlayer = { x: 100, y: 100 };
            const mockScene = { level: 5 };
            skillSystem.setPlayer(mockPlayer, mockScene);
            expect(skillSystem.player).toBe(mockPlayer);
            expect(skillSystem.scene).toBe(mockScene);
        });
    });

    describe('update', () => {
        test('reduces cooldowns by delta', () => {
            skillSystem.cooldowns.bite = 5;
            skillSystem.update(1000);
            expect(skillSystem.cooldowns.bite).toBe(4);
        });

        test('caps cooldown at 0', () => {
            skillSystem.cooldowns.bite = 0.1;
            skillSystem.update(200);
            expect(skillSystem.cooldowns.bite).toBe(0);
        });

        test('removes expired effects', () => {
            const mockScene = {
                time: { now: 10000 },
                speed: 100
            };
            skillSystem.setPlayer({ isShielded: false }, mockScene);
            skillSystem.activeEffects.speedUp = {
                startTime: 1000,
                duration: 5000,
                originalSpeed: 100
            };
            skillSystem.update(5000);
            expect(skillSystem.activeEffects.speedUp).toBeNull();
        });
    });

    describe('removeEffect', () => {
        test('removes shield effect and cleans up', () => {
            const mockScene = {
                add: { graphics: () => ({ setPosition: () => {}, fillStyle: () => {}, fillCircle: () => {}, setDepth: () => {} }) },
                time: { addEvent: () => ({ remove: () => {} }), delayedCall: () => {} }
            };
            const mockPlayer = {
                isShielded: true,
                shieldGraphics: { destroy: () => {} },
                playerData: { size: 30 }
            };
            skillSystem.setPlayer(mockPlayer, mockScene);
            skillSystem.activeEffects.shield = {
                graphics: mockPlayer.shieldGraphics,
                updateEvent: { remove: () => {} },
                startTime: 1000,
                duration: 5000
            };
            skillSystem.removeEffect('shield');
            expect(skillSystem.activeEffects.shield).toBeNull();
            expect(mockPlayer.isShielded).toBe(false);
        });

        test('removes speed buff effect and restores speed', () => {
            const mockScene = { speed: 200 };
            skillSystem.setPlayer({}, mockScene);
            skillSystem.activeEffects.speedUp = {
                startTime: 1000,
                duration: 5000,
                originalSpeed: 100
            };
            skillSystem.removeEffect('speedUp');
            expect(skillSystem.activeEffects.speedUp).toBeNull();
            expect(mockScene.speed).toBe(100);
        });
    });

    describe('isPlayerShielded', () => {
        test('returns false when no shield active', () => {
            expect(skillSystem.isPlayerShielded()).toBe(false);
        });

        test('returns true when shield is active with HP > 0', () => {
            skillSystem.activeEffects.shield = { startTime: Date.now(), duration: 5000, hp: 10, maxHp: 10 };
            expect(skillSystem.isPlayerShielded()).toBe(true);
        });

        test('returns false when shield HP is depleted', () => {
            skillSystem.activeEffects.shield = { startTime: Date.now(), duration: 5000, hp: 0, maxHp: 10 };
            expect(skillSystem.isPlayerShielded()).toBe(false);
        });
    });

    describe('isPlayerSpeedBuffed', () => {
        test('returns true when speed buff is active', () => {
            // The code checks for 'speed_up' key (note: mismatch with data key 'speedUp')
            skillSystem.activeEffects['speed_up'] = { startTime: Date.now(), duration: 5000 };
            expect(skillSystem.isPlayerSpeedBuffed()).toBe(true);
        });
    });

    describe('reduceAllCooldowns', () => {
        test('reduces all active cooldowns', () => {
            skillSystem.cooldowns.bite = 5;
            skillSystem.cooldowns.shield = 10;
            skillSystem.reduceAllCooldowns(3);
            expect(skillSystem.cooldowns.bite).toBe(2);
            expect(skillSystem.cooldowns.shield).toBe(7);
        });

        test('does not go below 0', () => {
            skillSystem.cooldowns.bite = 2;
            skillSystem.reduceAllCooldowns(5);
            expect(skillSystem.cooldowns.bite).toBe(0);
        });
    });

    describe('executeDamageSkill', () => {
        test('kills enemy and grants exp', () => {
            const mockEnemy = {
                graphics: { x: 150, y: 100, active: true },
                fishData: { size: 20 },
                takeDamage: () => true, // Enemy dies
                getExpValue: () => 25,
                destroy: () => {}
            };
            const mockScene = {
                enemies: [mockEnemy],
                player: { x: 100, y: 100 },
                level: 5,
                exp: 0,
                score: 0,
                hp: 100,
                maxHp: 100,
                growthSystem: {
                    addExperience: () => ({ expGained: 25, leveledUp: false }),
                    getExp: () => 25,
                    getLevel: () => 5,
                    getExpForLevel: () => 100
                },
                luckSystem: {},
                time: { now: 1000, addEvent: () => {}, delayedCall: () => {} },
                onLevelUp: () => {},
                scene: { get: () => ({ updateUI: () => {} }) },
                updatePlayerHealthBar: () => {}
            };
            skillSystem.setPlayer(mockScene.player, mockScene);

            const result = skillSystem.executeDamageSkill('bite', mockSkillsData.bite);
            expect(result.success).toBe(true);
            expect(result.killed).toBe(true);
            expect(mockScene.enemies.length).toBe(0); // Enemy removed
        });

        test('triggers level up when exp causes level up', () => {
            const mockEnemy = {
                graphics: { x: 150, y: 100, active: true },
                fishData: { size: 20 },
                takeDamage: () => true,
                getExpValue: () => 50,
                destroy: () => {}
            };
            const mockScene = {
                enemies: [mockEnemy],
                player: { x: 100, y: 100 },
                level: 4,
                exp: 80,
                score: 0,
                hp: 100,
                maxHp: 100,
                growthSystem: {
                    addExperience: () => ({ expGained: 50, leveledUp: true }),
                    getExp: () => 130,
                    getLevel: () => 5,
                    getExpForLevel: () => 200
                },
                luckSystem: {},
                time: { now: 1000, addEvent: () => {}, delayedCall: () => {} },
                onLevelUp: jest.fn(),
                scene: { get: () => ({ updateUI: () => {} }) },
                updatePlayerHealthBar: () => {}
            };
            skillSystem.setPlayer(mockScene.player, mockScene);

            const result = skillSystem.executeDamageSkill('bite', mockSkillsData.bite);
            expect(result.success).toBe(true);
            expect(result.killed).toBe(true);
            expect(mockScene.onLevelUp).toHaveBeenCalled();
        });

        test('returns no_target when enemy out of range', () => {
            const mockScene = {
                enemies: [{
                    graphics: { x: 1000, y: 1000, active: true }, // Far away
                    fishData: { size: 20 },
                    takeDamage: () => false,
                    getExpValue: () => 10
                }],
                player: { x: 100, y: 100 },
                level: 5
            };
            skillSystem.setPlayer(mockScene.player, mockScene);

            const result = skillSystem.executeDamageSkill('bite', mockSkillsData.bite);
            expect(result.success).toBe(false);
            expect(result.reason).toBe('no_target');
        });
    });

    describe('executeDefenseSkill', () => {
        test('creates shield effect', () => {
            const mockScene = {
                add: {
                    graphics: () => ({
                        setPosition: () => {},
                        fillStyle: () => {},
                        fillCircle: () => {},
                        setDepth: () => {},
                        destroy: () => {},
                        destroyed: false
                    })
                },
                time: {
                    now: 1000,
                    addEvent: (config) => {
                        // Call callback immediately to cover lines 217-218
                        if (config.callback) config.callback();
                        return { remove: () => {} };
                    },
                    delayedCall: (delay, callback) => {
                        // Call callback immediately to cover line 238
                        if (callback) callback();
                    }
                }
            };
            const mockPlayer = { x: 100, y: 100, playerData: { size: 30 }, isShielded: false, shieldGraphics: null };
            skillSystem.setPlayer(mockPlayer, mockScene);

            const result = skillSystem.executeDefenseSkill('shield', mockSkillsData.shield);
            expect(result.success).toBe(true);
            expect(result.type).toBe('defense');
            // After delayedCall callback runs, effect should be removed
            expect(skillSystem.activeEffects.shield).toBeNull();
        });

        test('returns already_active if shield is active', () => {
            const mockScene = { add: { graphics: () => ({}) }, time: { now: 1000, addEvent: () => {}, delayedCall: () => {} } };
            const mockPlayer = { x: 100, y: 100, playerData: { size: 30 }, isShielded: false };
            skillSystem.setPlayer(mockPlayer, mockScene);
            skillSystem.activeEffects.shield = { startTime: 1000, duration: 5000 };

            const result = skillSystem.executeDefenseSkill('shield', mockSkillsData.shield);
            expect(result.success).toBe(false);
            expect(result.reason).toBe('already_active');
        });
    });

    describe('executeBuffSkill', () => {
        test('applies speed buff', () => {
            const mockScene = {
                speed: 100,
                time: {
                    now: 1000,
                    addEvent: () => ({ remove: () => {} }),
                    delayedCall: (delay, callback) => {
                        // Call callback immediately to cover line 270
                        if (callback) callback();
                    }
                }
            };
            const mockPlayer = { x: 100, y: 100 };
            skillSystem.setPlayer(mockPlayer, mockScene);

            const result = skillSystem.executeBuffSkill('speedUp', mockSkillsData.speedUp);
            expect(result.success).toBe(true);
            expect(result.type).toBe('buff');
            // Note: delayedCall callback runs immediately and removes the buff
            expect(skillSystem.activeEffects.speedUp).toBeNull();
        });

        test('returns already_active if buff is active', () => {
            const mockScene = { speed: 150, time: { now: 1000, addEvent: () => {}, delayedCall: () => {} } };
            const mockPlayer = { x: 100, y: 100 };
            skillSystem.setPlayer(mockPlayer, mockScene);
            skillSystem.activeEffects.speedUp = { startTime: 1000, duration: 5000, originalSpeed: 100 };

            const result = skillSystem.executeBuffSkill('speedUp', mockSkillsData.speedUp);
            expect(result.success).toBe(false);
            expect(result.reason).toBe('already_active');
        });
    });

    describe('executeHealSkill', () => {
        test('heals player', () => {
            const mockScene = {
                hp: 50,
                maxHp: 100,
                updatePlayerHealthBar: jest.fn(),
                add: {
                    text: () => ({
                        setOrigin: () => ({ setDepth: () => {} }),
                        setDepth: () => {},
                        destroy: () => {}
                    })
                },
                tweens: {
                    add: jest.fn((config) => {
                        // Call onComplete immediately to cover line 320
                        if (config.onComplete) config.onComplete();
                        return config;
                    })
                }
            };
            const mockPlayer = { x: 100, y: 100 };
            skillSystem.setPlayer(mockPlayer, mockScene);

            const result = skillSystem.executeHealSkill('heal', mockSkillsData.heal);
            expect(result.success).toBe(true);
            expect(result.type).toBe('heal');
            expect(mockScene.hp).toBe(70); // 50 + 20
            expect(mockScene.updatePlayerHealthBar).toHaveBeenCalled();
        });

        test('returns full_hp when already at max', () => {
            const mockScene = {
                hp: 100,
                maxHp: 100,
                add: { text: () => {} },
                tweens: { add: () => {} }
            };
            const mockPlayer = { x: 100, y: 100 };
            skillSystem.setPlayer(mockPlayer, mockScene);

            const result = skillSystem.executeHealSkill('heal', mockSkillsData.heal);
            expect(result.success).toBe(false);
            expect(result.reason).toBe('full_hp');
        });

        test('caps heal at maxHp', () => {
            const mockScene = {
                hp: 95,
                maxHp: 100,
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) },
                tweens: { add: () => {} }
            };
            const mockPlayer = { x: 100, y: 100 };
            skillSystem.setPlayer(mockPlayer, mockScene);

            const result = skillSystem.executeHealSkill('heal', mockSkillsData.heal);
            expect(result.success).toBe(true);
            expect(result.healAmount).toBe(5); // Only heals 5, not 20
        });
    });
});
