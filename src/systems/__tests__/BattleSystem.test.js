import { BattleSystem } from '../BattleSystem.js';

describe('BattleSystem', () => {
    let battleSystem;

    beforeEach(() => {
        battleSystem = new BattleSystem({});
    });

    describe('canAttack', () => {
        test('returns false if attacker type not in fishData', () => {
            const fishData = { clownfish: {} };
            const system = new BattleSystem(fishData);
            expect(system.canAttack('unknown', 'clownfish')).toBe(false);
        });

        test('returns true if attacker has no type advantage against target', () => {
            const fishData = {
                clownfish: { strongAgainst: ['shrimp'] },
                shark: {}
            };
            const system = new BattleSystem(fishData);
            expect(system.canAttack('shark', 'clownfish')).toBe(true);
        });

        test('returns false if attacker is strong against target (type blocks attack)', () => {
            const fishData = {
                clownfish: { strongAgainst: ['shrimp'] },
                shrimp: {}
            };
            const system = new BattleSystem(fishData);
            expect(system.canAttack('clownfish', 'shrimp')).toBe(false);
        });

        test('returns true if attacker is NOT strong against target', () => {
            const fishData = {
                clownfish: { strongAgainst: ['shrimp'] },
                shark: {}
            };
            const system = new BattleSystem(fishData);
            expect(system.canAttack('clownfish', 'shark')).toBe(true);
        });
    });

    describe('calculateDamage with level bonus', () => {
        test('level 1 has base damage', () => {
            const attacker = { level: 1 };
            const defender = { level: 1 };
            const baseDamage = 10;
            // damage = baseDamage + (1-1) * 5 = baseDamage
            const damage = battleSystem.calculateDamage(attacker, defender, baseDamage);
            expect(damage).toBe(10);
        });

        test('each level adds 5 damage', () => {
            const attacker = { level: 3 };
            const defender = { level: 1 };
            const baseDamage = 10;
            // level 3: damage = baseDamage + (3-1) * 5 = baseDamage + 10 = 20
            const damage = battleSystem.calculateDamage(attacker, defender, baseDamage);
            expect(damage).toBe(20);
        });
    });

    describe('calculateDefense with level bonus', () => {
        test('level 1 has 0 defense', () => {
            const defender = { level: 1 };
            // defense = (1-1) * 3 = 0
            const defense = battleSystem.calculateDefense(defender);
            expect(defense).toBe(0);
        });

        test('each level adds 3 defense', () => {
            const defender = { level: 5 };
            // defense = (5-1) * 3 = 12
            const defense = battleSystem.calculateDefense(defender);
            expect(defense).toBe(12);
        });
    });
});
