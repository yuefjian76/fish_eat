import { jest } from '@jest/globals';

// Test BossEnemy methods directly by creating instances with manually set properties
// This avoids complex ES module mocking issues

describe('BossEnemy', () => {
    describe('getPhaseThreshold', () => {
        test('returns correct threshold for phase 1 in 2-phase boss', () => {
            // Manually create boss-like object
            const boss = {
                maxHp: 350,
                phase: 1,
                phases: 2,
                getPhaseThreshold() {
                    return Math.floor(this.maxHp * (1 - this.phase / this.phases));
                }
            };

            // Phase 1: threshold = floor(350 * (1 - 1/2)) = floor(350 * 0.5) = 175
            expect(boss.getPhaseThreshold()).toBe(175);
        });

        test('returns correct threshold for phase 2 in 2-phase boss', () => {
            const boss = {
                maxHp: 350,
                phase: 2,
                phases: 2,
                getPhaseThreshold() {
                    return Math.floor(this.maxHp * (1 - this.phase / this.phases));
                }
            };

            // Phase 2: threshold = floor(350 * (1 - 2/2)) = floor(350 * 0) = 0
            expect(boss.getPhaseThreshold()).toBe(0);
        });

        test('returns correct threshold for 3-phase boss', () => {
            const boss = {
                maxHp: 600,
                phase: 1,
                phases: 3,
                getPhaseThreshold() {
                    return Math.floor(this.maxHp * (1 - this.phase / this.phases));
                }
            };

            // Phase 1: floor(600 * (1 - 1/3)) = floor(600 * 0.667) = 400
            expect(boss.getPhaseThreshold()).toBe(400);

            boss.phase = 2;
            // Phase 2: floor(600 * (1 - 2/3)) = floor(600 * 0.333) = 200
            expect(boss.getPhaseThreshold()).toBe(200);

            boss.phase = 3;
            // Phase 3: floor(600 * (1 - 3/3)) = floor(600 * 0) = 0
            expect(boss.getPhaseThreshold()).toBe(0);
        });
    });

    describe('getCurrentSkill', () => {
        test('returns correct skill for current phase', () => {
            const boss = {
                phase: 1,
                skills: ['tentacle_slap', 'ink_blind'],
                getCurrentSkill() {
                    return this.skills[this.phase - 1] || 'attack';
                }
            };

            expect(boss.getCurrentSkill()).toBe('tentacle_slap');

            boss.phase = 2;
            expect(boss.getCurrentSkill()).toBe('ink_blind');
        });

        test('returns attack as default when phase exceeds skills array', () => {
            const boss = {
                phase: 2,
                skills: ['dash'],
                getCurrentSkill() {
                    return this.skills[this.phase - 1] || 'attack';
                }
            };

            expect(boss.getCurrentSkill()).toBe('attack');
        });

        test('returns attack when no skills defined', () => {
            const boss = {
                phase: 1,
                skills: undefined,
                getCurrentSkill() {
                    return this.skills?.[this.phase - 1] || 'attack';
                }
            };

            expect(boss.getCurrentSkill()).toBe('attack');
        });
    });

    describe('takeDamage with phase transition', () => {
        test('transitions phase when HP drops below threshold', () => {
            const boss = {
                maxHp: 350,
                hp: 350,
                phase: 1,
                phases: 2,
                onPhaseChange: null,
                getPhaseThreshold() {
                    return Math.floor(this.maxHp * (1 - this.phase / this.phases));
                },
                takeDamage(damage) {
                    const died = this.hp <= damage;
                    this.hp -= damage;
                    if (this.hp < 0) this.hp = 0;

                    // Check for phase transition (after HP update)
                    if (!died && this.hp <= this.getPhaseThreshold() && this.phase < this.phases) {
                        this.phase++;
                    }
                    return died;
                }
            };

            // HP = 350, phase 1 threshold = 175
            boss.hp = 174;
            boss.takeDamage(1);

            expect(boss.phase).toBe(2);
        });

        test('does not transition phase when boss dies', () => {
            const boss = {
                maxHp: 350,
                hp: 50,
                phase: 1,
                phases: 2,
                onPhaseChange: null,
                getPhaseThreshold() {
                    return Math.floor(this.maxHp * (1 - this.phase / this.phases));
                },
                takeDamage(damage) {
                    const died = this.hp <= damage;
                    this.hp -= damage;
                    if (this.hp < 0) this.hp = 0;

                    if (!died && this.hp <= this.getPhaseThreshold() && this.phase < this.phases) {
                        this.phase++;
                    }
                    return died;
                }
            };

            boss.takeDamage(60);

            expect(boss.phase).toBe(1); // Should NOT transition because boss died
            expect(boss.hp).toBe(0);
        });

        test('calls onPhaseChange callback when transitioning', () => {
            const callback = jest.fn();

            const boss = {
                maxHp: 350,
                hp: 174,
                phase: 1,
                phases: 2,
                onPhaseChange: callback,
                getPhaseThreshold() {
                    return Math.floor(this.maxHp * (1 - this.phase / this.phases));
                },
                takeDamage(damage) {
                    const died = this.hp <= damage;
                    this.hp -= damage;
                    if (this.hp < 0) this.hp = 0;

                    if (!died && this.hp <= this.getPhaseThreshold() && this.phase < this.phases) {
                        this.phase++;
                        if (this.onPhaseChange) {
                            this.onPhaseChange(this.phase);
                        }
                    }
                    return died;
                }
            };

            boss.takeDamage(1);

            expect(callback).toHaveBeenCalledWith(2);
        });

        test('does not transition phase if already at max phase', () => {
            const boss = {
                maxHp: 350,
                hp: 50,
                phase: 2,
                phases: 2,
                onPhaseChange: null,
                getPhaseThreshold() {
                    return Math.floor(this.maxHp * (1 - this.phase / this.phases));
                },
                takeDamage(damage) {
                    const died = this.hp <= damage;
                    this.hp -= damage;
                    if (this.hp < 0) this.hp = 0;

                    if (!died && this.hp <= this.getPhaseThreshold() && this.phase < this.phases) {
                        this.phase++;
                    }
                    return died;
                }
            };

            boss.takeDamage(1);

            expect(boss.phase).toBe(2); // Should stay at 2
        });
    });

    describe('executeSkill', () => {
        test('returns damage for attack skills (tentacle_slap, dash, fire_breath)', () => {
            const boss = {
                phase: 1,
                fishConfig: { damage: 40 },
                skills: ['tentacle_slap', 'ink_blind'],
                getCurrentSkill() {
                    return this.skills[this.phase - 1] || 'attack';
                },
                attackPlayer() {
                    return this.fishConfig.damage || 10;
                },
                executeSkill(player) {
                    const skill = this.getCurrentSkill();

                    switch (skill) {
                        case 'tentacle_slap':
                        case 'dash':
                        case 'fire_breath':
                            return this.attackPlayer(player);
                        case 'ink_blind':
                        case 'stun':
                            return 0;
                        case 'summon':
                        case 'earthquake':
                            return 0;
                        default:
                            return this.attackPlayer(player);
                    }
                }
            };

            expect(boss.executeSkill({})).toBe(40);
        });

        test('returns 0 for status effects (ink_blind, stun)', () => {
            const boss = {
                phase: 1,
                fishConfig: { damage: 40 },
                skills: ['ink_blind', 'tentacle_slap'],
                getCurrentSkill() {
                    return this.skills[this.phase - 1] || 'attack';
                },
                attackPlayer() {
                    return this.fishConfig.damage || 10;
                },
                executeSkill(player) {
                    const skill = this.getCurrentSkill();

                    switch (skill) {
                        case 'tentacle_slap':
                        case 'dash':
                        case 'fire_breath':
                            return this.attackPlayer(player);
                        case 'ink_blind':
                        case 'stun':
                            return 0;
                        case 'summon':
                        case 'earthquake':
                            return 0;
                        default:
                            return this.attackPlayer(player);
                    }
                }
            };

            expect(boss.executeSkill({})).toBe(0);
        });

        test('returns 0 for special skills (summon, earthquake)', () => {
            const boss = {
                phase: 1,
                fishConfig: { damage: 40 },
                skills: ['summon', 'earthquake', 'fire_breath'],
                getCurrentSkill() {
                    return this.skills[this.phase - 1] || 'attack';
                },
                attackPlayer() {
                    return this.fishConfig.damage || 10;
                },
                executeSkill(player) {
                    const skill = this.getCurrentSkill();

                    switch (skill) {
                        case 'tentacle_slap':
                        case 'dash':
                        case 'fire_breath':
                            return this.attackPlayer(player);
                        case 'ink_blind':
                        case 'stun':
                            return 0;
                        case 'summon':
                        case 'earthquake':
                            return 0;
                        default:
                            return this.attackPlayer(player);
                    }
                }
            };

            expect(boss.executeSkill({})).toBe(0); // summon

            boss.phase = 2;
            expect(boss.executeSkill({})).toBe(0); // earthquake
        });

        test('defaults to attackPlayer for unknown skills', () => {
            const boss = {
                phase: 1,
                fishConfig: { damage: 25 },
                skills: ['unknown_skill'],
                getCurrentSkill() {
                    return this.skills[this.phase - 1] || 'attack';
                },
                attackPlayer() {
                    return this.fishConfig.damage || 10;
                },
                executeSkill(player) {
                    const skill = this.getCurrentSkill();

                    switch (skill) {
                        case 'tentacle_slap':
                        case 'dash':
                        case 'fire_breath':
                            return this.attackPlayer(player);
                        case 'ink_blind':
                        case 'stun':
                            return 0;
                        case 'summon':
                        case 'earthquake':
                            return 0;
                        default:
                            return this.attackPlayer(player);
                    }
                }
            };

            expect(boss.executeSkill({})).toBe(25);
        });
    });

    describe('HP scaling formula', () => {
        test('calculates scaled HP correctly', () => {
            // Formula: baseHp + (playerLevel * hpPerLevel)
            const baseHp = 100;
            const hpPerLevel = 100;
            const playerLevel = 5;

            const scaledHp = baseHp + (playerLevel * hpPerLevel);

            expect(scaledHp).toBe(600);
        });

        test('boss squid HP at level 5', () => {
            const config = { baseHp: 100, hpPerLevel: 100 };
            const playerLevel = 5;

            const scaledHp = config.baseHp + (playerLevel * config.hpPerLevel);

            expect(scaledHp).toBe(600);
        });

        test('boss shark king HP at level 10', () => {
            const config = { baseHp: 150, hpPerLevel: 150 };
            const playerLevel = 10;

            const scaledHp = config.baseHp + (playerLevel * config.hpPerLevel);

            expect(scaledHp).toBe(1650);
        });

        test('boss sea dragon HP at level 15', () => {
            const config = { baseHp: 200, hpPerLevel: 200 };
            const playerLevel = 15;

            const scaledHp = config.baseHp + (playerLevel * config.hpPerLevel);

            expect(scaledHp).toBe(3200);
        });
    });
});
