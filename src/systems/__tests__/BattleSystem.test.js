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

    describe('heal', () => {
        test('heals by specified amount when under maxHp', () => {
            const result = battleSystem.heal(50, 100, 20);
            expect(result.newHp).toBe(70);
            expect(result.actualHeal).toBe(20);
        });

        test('caps healing at maxHp', () => {
            const result = battleSystem.heal(90, 100, 20);
            expect(result.newHp).toBe(100);
            expect(result.actualHeal).toBe(10); // Only healed 10, not 20
        });

        test('heal at maxHp returns 0 actual heal', () => {
            const result = battleSystem.heal(100, 100, 20);
            expect(result.newHp).toBe(100);
            expect(result.actualHeal).toBe(0);
        });

        test('heal of 0 returns same hp', () => {
            const result = battleSystem.heal(50, 100, 0);
            expect(result.newHp).toBe(50);
            expect(result.actualHeal).toBe(0);
        });
    });

    describe('applyDamage', () => {
        test('reduces hp by damage amount', () => {
            const result = battleSystem.applyDamage(100, 30);
            expect(result.newHp).toBe(70);
            expect(result.actualDamage).toBe(30);
        });

        test('hp cannot go below 0', () => {
            const result = battleSystem.applyDamage(50, 100);
            expect(result.newHp).toBe(0);
            expect(result.actualDamage).toBe(50); // Only took 50 damage, not 100
        });

        test('damage of 0 returns same hp', () => {
            const result = battleSystem.applyDamage(50, 0);
            expect(result.newHp).toBe(50);
            expect(result.actualDamage).toBe(0);
        });

        test('damage exactly equal to hp sets hp to 0', () => {
            const result = battleSystem.applyDamage(50, 50);
            expect(result.newHp).toBe(0);
            expect(result.actualDamage).toBe(50);
        });
    });
});
