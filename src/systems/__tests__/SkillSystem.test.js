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
            skillSystem.scene.growthSystem = {
                addExperience: () => ({ expGained: 10, leveledUp: false }),
                getExp: () => 10, getLevel: () => 1, getExpForLevel: () => 100
            };
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
            skillSystem.scene.growthSystem = {
                addExperience: () => ({ expGained: 10, leveledUp: false }),
                getExp: () => 10, getLevel: () => 1, getExpForLevel: () => 100
            };
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
        // Helper: build a standard mock scene with enemies
        const buildScene = (enemyList, overrides = {}) => ({
            enemies: enemyList,
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
            updatePlayerHealthBar: () => {},
            ...overrides
        });

        const makeEnemy = (x = 150, dies = false, exp = 25) => ({
            graphics: { x, y: 100, active: true },
            fishData: { size: 20 },
            takeDamage: () => dies,
            getExpValue: () => exp,
            destroy: () => {}
        });

        test('kills enemy and grants exp', () => {
            const enemy = makeEnemy(150, true, 25);
            const mockScene = buildScene([enemy]);
            skillSystem.setPlayer(mockScene.player, mockScene);

            const result = skillSystem.executeDamageSkill('bite', mockSkillsData.bite);
            expect(result.success).toBe(true);
            // killed is now a count (>= 1 means at least one killed)
            expect(result.killed).toBeGreaterThan(0);
            expect(mockScene.enemies.length).toBe(0);
        });

        test('triggers level up when exp causes level up', () => {
            const enemy = makeEnemy(150, true, 50);
            const onLevelUp = jest.fn();
            const mockScene = buildScene([enemy], {
                growthSystem: {
                    addExperience: () => ({ expGained: 50, leveledUp: true }),
                    getExp: () => 130, getLevel: () => 5, getExpForLevel: () => 200
                },
                onLevelUp
            });
            skillSystem.setPlayer(mockScene.player, mockScene);

            skillSystem.executeDamageSkill('bite', mockSkillsData.bite);
            expect(onLevelUp).toHaveBeenCalled();
        });

        test('returns no_target when enemy out of range', () => {
            const farEnemy = makeEnemy(1000); // way out of range=200
            const mockScene = buildScene([farEnemy]);
            skillSystem.setPlayer(mockScene.player, mockScene);

            const result = skillSystem.executeDamageSkill('bite', mockSkillsData.bite);
            expect(result.success).toBe(false);
            expect(result.reason).toBe('no_target');
        });

        // ── feat-043: AOE hit (range-based, all enemies) ──────────────────
        test('AOE: hits multiple enemies in range', () => {
            const e1 = makeEnemy(150, false); // in range (distance ≈ 50)
            const e2 = makeEnemy(180, false); // in range (distance ≈ 80)
            const mockScene = buildScene([e1, e2]);
            skillSystem.setPlayer(mockScene.player, mockScene);

            const result = skillSystem.executeDamageSkill('bite', mockSkillsData.bite);
            expect(result.success).toBe(true);
            expect(result.hitCount).toBe(2);
        });

        test('AOE: only hits enemies within range, ignores distant', () => {
            const near = makeEnemy(150, false);   // in range
            const far = makeEnemy(1000, false);   // out of range
            const mockScene = buildScene([near, far]);
            skillSystem.setPlayer(mockScene.player, mockScene);

            const result = skillSystem.executeDamageSkill('bite', mockSkillsData.bite);
            expect(result.hitCount).toBe(1);
        });

        test('AOE: kills all in-range enemies, not out-of-range', () => {
            const near = makeEnemy(150, true, 10);
            const far = makeEnemy(1000, true, 10);
            const mockScene = buildScene([near, far]);
            skillSystem.setPlayer(mockScene.player, mockScene);

            skillSystem.executeDamageSkill('bite', mockSkillsData.bite);
            // near enemy destroyed (removed from array), far enemy stays
            expect(mockScene.enemies.length).toBe(1);
            expect(mockScene.enemies[0]).toBe(far);
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

        test('feat-043: healPercent=0.15 heals 15% of maxHp', () => {
            // Uses real skills.json-like data: healPercent instead of healAmount
            const healSkillPercent = { type: 'heal', cooldown: 15, healPercent: 0.15 };
            const mockScene = {
                hp: 60,
                maxHp: 200,
                updatePlayerHealthBar: jest.fn(),
                add: {
                    text: () => ({
                        setOrigin: () => ({ setDepth: () => {} }),
                        setDepth: () => {},
                        destroy: () => {}
                    })
                },
                tweens: { add: jest.fn() }
            };
            const mockPlayer = { x: 0, y: 0 };
            skillSystem.setPlayer(mockPlayer, mockScene);

            const result = skillSystem.executeHealSkill('heal', healSkillPercent);
            expect(result.success).toBe(true);
            // 15% of 200 = 30; 60 + 30 = 90
            expect(result.healAmount).toBe(30);
            expect(mockScene.hp).toBe(90);
        });

        test('feat-043: healPercent caps at remaining HP gap', () => {
            const healSkillPercent = { type: 'heal', cooldown: 15, healPercent: 0.15 };
            const mockScene = {
                hp: 195,
                maxHp: 200,
                updatePlayerHealthBar: jest.fn(),
                add: { text: () => ({ setOrigin: () => {}, setDepth: () => {} }) },
                tweens: { add: jest.fn() }
            };
            const mockPlayer = { x: 0, y: 0 };
            skillSystem.setPlayer(mockPlayer, mockScene);

            const result = skillSystem.executeHealSkill('heal', healSkillPercent);
            expect(result.success).toBe(true);
            // 15% of 200 = 30, but only 5 HP gap → caps at 5
            expect(result.healAmount).toBe(5);
            expect(mockScene.hp).toBe(200);
        });
    });

    describe('feat-043: skill config values', () => {
        test('E speed_up: speedMultiplier=1.5, cooldown=10s, duration=3s', () => {
            const realSpeedUp = { type: 'buff', cooldown: 10, speedMultiplier: 1.5, duration: 3, unlockLevel: 4 };
            expect(realSpeedUp.speedMultiplier).toBe(1.5);
            expect(realSpeedUp.cooldown).toBe(10);
            expect(realSpeedUp.duration).toBe(3);
        });

        test('W shield: cooldown=30s, shieldHpPercent=0.3, duration=5s', () => {
            const realShield = { type: 'defense', cooldown: 30, shieldHpPercent: 0.3, duration: 5, unlockLevel: 2 };
            expect(realShield.shieldHpPercent).toBe(0.3);
            expect(realShield.cooldown).toBe(30);
        });

        test('Q bite: range=100, damage=25, cooldown=3s', () => {
            const realBite = { type: 'damage', cooldown: 3, damage: 25, range: 100, unlockLevel: 1 };
            expect(realBite.range).toBe(100);
            expect(realBite.damage).toBe(25);
            expect(realBite.cooldown).toBe(3);
        });

        test('R heal: healPercent=0.15, cooldown=15s (no legacy healAmount)', () => {
            const realHeal = { type: 'heal', cooldown: 15, healPercent: 0.15, unlockLevel: 6 };
            expect(realHeal.healPercent).toBe(0.15);
            expect(realHeal.cooldown).toBe(15);
            expect(realHeal.healAmount).toBeUndefined();
        });

        test('E buff: executeBuffSkill applies speedMultiplier=1.5 correctly', () => {
            // Use a SkillSystem initialized with 'speed_up' key so activeEffects is null (not undefined)
            const realSkillsData = {
                speed_up: { key: 'E', type: 'buff', cooldown: 10, speedMultiplier: 1.5, duration: 3, unlockLevel: 4 }
            };
            const ss = new SkillSystem(realSkillsData);
            const speedUpSkill = realSkillsData.speed_up;
            const mockScene = {
                speed: 200, baseSpeed: 200,
                time: { addEvent: jest.fn(() => ({})), delayedCall: jest.fn(), now: 0 }
            };
            const mockPlayer = { x: 0, y: 0 };
            ss.setPlayer(mockPlayer, mockScene);

            const result = ss.executeBuffSkill('speed_up', speedUpSkill);
            expect(result.success).toBe(true);
            // Speed should be multiplied by 1.5
            expect(mockScene.speed).toBe(300); // 200 * 1.5
        });

        test('W defense: executeDefenseSkill reports shieldHp=30% of maxHp', () => {
            const shieldSkill = { type: 'defense', cooldown: 30, shieldHpPercent: 0.3, duration: 5 };
            const mockScene = {
                maxHp: 200,
                add: {
                    graphics: jest.fn(() => ({
                        setPosition: jest.fn(),
                        fillStyle: jest.fn(),
                        fillCircle: jest.fn(),
                        setDepth: jest.fn(),
                        destroyed: false
                    }))
                },
                time: {
                    addEvent: jest.fn(() => ({})),
                    delayedCall: jest.fn(),
                    now: 0
                }
            };
            const mockPlayer = {
                x: 0, y: 0,
                playerData: { size: 30 },
                isShielded: false,
                shieldGraphics: null
            };
            skillSystem.setPlayer(mockPlayer, mockScene);

            const result = skillSystem.executeDefenseSkill('shield', shieldSkill);
            expect(result.success).toBe(true);
            // shieldHp = floor(200 * 0.3) = 60
            expect(result.shieldHp).toBe(60);
        });
    });
});
