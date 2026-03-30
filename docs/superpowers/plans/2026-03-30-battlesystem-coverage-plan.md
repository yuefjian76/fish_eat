# BattleSystem Test Coverage Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve BattleSystem.js test coverage from 31% to 80%+ by adding TDD tests for all uncovered functions.

**Architecture:** BattleSystem is a simple class with pure functions for damage calculation, healing, and type effectiveness. Tests use Jest with Phaser mocks.

**Tech Stack:** Jest, ES Modules, Phaser.js

---

## Files

- **Source:** `src/systems/BattleSystem.js`
- **Existing Test:** `src/systems/__tests__/BattleScaling.test.js` (rename to `BattleSystem.test.js`)
- **New Tests:** Add to `src/systems/__tests__/BattleSystem.test.js`

---

## Functions to Cover

| Function | Current Coverage | Lines | Priority |
|----------|------------------|-------|----------|
| `constructor` | 100% | 5-8 | ✅ Done |
| `calculateDamage` | 100% | 16-22 | ✅ Done |
| `calculateDefense` | 100% | 24-27 | ✅ Done |
| `canAttack` | 0% | 35-45 | HIGH |
| `heal` | 0% | 54-59 | HIGH |
| `applyDamage` | 0% | 67-70 | HIGH |
| `isDead` | 0% | 77-79 | HIGH |

---

## Task 1: Add canAttack Tests

**Files:**
- Modify: `src/systems/__tests__/BattleScaling.test.js` → `src/systems/__tests__/BattleSystem.test.js`

- [ ] **Step 1: Rename test file and add canAttack tests**

```javascript
// Add to describe('BattleSystem')
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="BattleSystem" -v`
Expected: FAIL - "cannotAttack" method doesn't exist (typo in old tests)

- [ ] **Step 3: Verify tests pass**

Run: `npm test -- --testPathPattern="BattleSystem" -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/systems/__tests__/BattleScaling.test.js
git mv src/systems/__tests__/BattleScaling.test.js src/systems/__tests__/BattleSystem.test.js
git add src/systems/__tests__/BattleSystem.test.js
git commit -m "test: add canAttack tests to BattleSystem"
```

---

## Task 2: Add heal Tests

**Files:**
- Modify: `src/systems/__tests__/BattleSystem.test.js`

- [ ] **Step 1: Write heal tests**

```javascript
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
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- --testPathPattern="BattleSystem" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/BattleSystem.test.js
git commit -m "test: add heal tests to BattleSystem"
```

---

## Task 3: Add applyDamage Tests

**Files:**
- Modify: `src/systems/__tests__/BattleSystem.test.js`

- [ ] **Step 1: Write applyDamage tests**

```javascript
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
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- --testPathPattern="BattleSystem" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/BattleSystem.test.js
git commit -m "test: add applyDamage tests to BattleSystem"
```

---

## Task 4: Add isDead Tests

**Files:**
- Modify: `src/systems/__tests__/BattleSystem.test.js`

- [ ] **Step 1: Write isDead tests**

```javascript
describe('isDead', () => {
    test('returns true when hp is 0', () => {
        expect(battleSystem.isDead(0)).toBe(true);
    });

    test('returns true when hp is negative', () => {
        expect(battleSystem.isDead(-10)).toBe(true);
    });

    test('returns false when hp is positive', () => {
        expect(battleSystem.isDead(1)).toBe(false);
    });

    test('returns false when hp equals maxHp', () => {
        expect(battleSystem.isDead(100)).toBe(false);
    });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- --testPathPattern="BattleSystem" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/BattleSystem.test.js
git commit -m "test: add isDead tests to BattleSystem"
```

---

## Task 5: Verify 80% Coverage

- [ ] **Step 1: Run tests with coverage**

Run: `npm test -- --coverage --testPathPattern="BattleSystem" 2>&1`
Expected: BattleSystem.js coverage > 80%

- [ ] **Step 2: If coverage below 80%, add edge case tests**

Potential edge cases:
- `calculateDamage` with missing level property
- `calculateDefense` with missing level property
- `canAttack` with empty strongAgainst array

---

## Expected Results

| File | Stmts | Funcs | Lines |
|------|-------|-------|-------|
| BattleSystem.js | 100% | 100% | 100% |

**Total Tests:** ~20 new tests covering all BattleSystem functions.

---

## Run All Tests

```bash
cd /Users/yuefengjiang/AI/fish_eat
npm test -- --coverage
```
