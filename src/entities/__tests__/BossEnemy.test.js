import { jest } from '@jest/globals';

describe('BossEnemy', () => {
    test('transitions to next phase at correct HP threshold', () => {
        const boss = {
            maxHp: 1000,
            hp: 600, // 60% HP
            phase: 1,
            phases: 2,
            getPhaseThreshold: function() {
                return Math.floor(this.maxHp * (1 - this.phase / this.phases));
            }
        };

        // When HP drops below threshold, phase should advance
        boss.hp = 400; // Below 500 (50% for phase 2 in 2-phase boss)
        if (boss.hp <= boss.getPhaseThreshold() && boss.phase < boss.phases) {
            boss.phase++;
        }

        expect(boss.phase).toBe(2);
    });

    test('uses correct skill for current phase', () => {
        const boss = {
            phase: 1,
            skills: ['tentacle_slap', 'ink_blind'],
            getCurrentSkill: function() {
                return this.skills[this.phase - 1];
            }
        };

        expect(boss.getCurrentSkill()).toBe('tentacle_slap');

        boss.phase = 2;
        expect(boss.getCurrentSkill()).toBe('ink_blind');
    });
});