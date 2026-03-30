# Enemy.js Test Coverage Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve Enemy.js test coverage from 27% to 80%+ by adding TDD tests for uncovered functions.

**Architecture:** Enemy.js uses Phaser physics and requires Phaser mocks for testing. Tests use method borrowing pattern to test prototype methods in isolation.

**Tech Stack:** Jest, ES Modules, Phaser.js mocks

---

## Files

- **Source:** `src/entities/Enemy.js`
- **Existing Test:** `src/systems/__tests__/EnemyAI.test.js`

---

## Coverage Analysis

Current Enemy.js coverage: 27.17% lines

**Uncovered functions to test:**
| Function | Lines | Priority |
|----------|-------|----------|
| `updateHealthBar` | 94-110 | HIGH |
| `setRandomWanderDirection` | 115-126 | HIGH |
| `isPlayerInVision` | 133-140 | HIGH |
| `isPlayerInAttackRange` | 147-154 | HIGH |
| `chasePlayer` | 160-168 | HIGH |
| `attackPlayer` | 175-187 | HIGH |
| `getExpValue` | 212-214 | MEDIUM |
| `destroy` | 219-222 | MEDIUM |
| `update` | 357-442 | HIGH |

---

## Task 1: Add updateHealthBar Tests

**Files:**
- Modify: `src/systems/__tests__/EnemyAI.test.js`

- [ ] **Add updateHealthBar tests**

```javascript
describe('updateHealthBar', () => {
    test('updateHealthBar creates health bar graphics', () => {
        const mockGraphics = { fillStyle: jest.fn().mockReturnThis(), fillRect: jest.fn().mockReturnThis(), lineStyle: jest.fn().mockReturnThis(), strokeRect: jest.fn().mockReturnThis() };
        const enemy = {
            healthBar: mockGraphics,
            hp: 75,
            maxHp: 100,
            healthBarWidth: 60,
            healthBarHeight: 4,
            fishConfig: { size: 30 }
        };

        const updateHealthBarFn = Enemy.prototype.updateHealthBar;
        updateHealthBarFn.call(enemy);

        expect(mockGraphics.fillStyle).toHaveBeenCalled();
        expect(mockGraphics.fillRect).toHaveBeenCalled();
    });

    test('health bar color changes based on HP percentage', () => {
        const mockGraphics = { fillStyle: jest.fn().mockReturnThis(), fillRect: jest.fn().mockReturnThis(), lineStyle: jest.fn().mockReturnThis(), strokeRect: jest.fn().mockReturnThis() };
        const enemy = {
            healthBar: mockGraphics,
            hp: 20, // 20% HP - should be red
            maxHp: 100,
            healthBarWidth: 60,
            healthBarHeight: 4,
            fishConfig: { size: 30 }
        };

        const updateHealthBarFn = Enemy.prototype.updateHealthBar;
        updateHealthBarFn.call(enemy);

        // Third fillStyle call should be for health (0xff0000 for red when HP < 25%)
        const fillStyleCalls = mockGraphics.fillStyle.mock.calls;
        expect(fillStyleCalls[2][0]).toBe(0xff0000);
    });
});
```

---

## Task 2: Add Vision and Range Tests

**Files:**
- Modify: `src/systems/__tests__/EnemyAI.test.js`

- [ ] **Add isPlayerInVision tests**

```javascript
describe('isPlayerInVision', () => {
    test('returns true when player within vision range', () => {
        const enemy = {
            graphics: { x: 100, y: 100 },
            visionRange: 200
        };
        const player = { x: 150, y: 100 }; // Distance = 50 < 200

        const isPlayerInVisionFn = Enemy.prototype.isPlayerInVision;
        expect(isPlayerInVisionFn.call(enemy, player)).toBe(true);
    });

    test('returns false when player outside vision range', () => {
        const enemy = {
            graphics: { x: 100, y: 100 },
            visionRange: 200
        };
        const player = { x: 400, y: 100 }; // Distance = 300 > 200

        const isPlayerInVisionFn = Enemy.prototype.isPlayerInVision;
        expect(isPlayerInVisionFn.call(enemy, player)).toBe(false);
    });

    test('returns false when player is null', () => {
        const enemy = { graphics: { x: 100, y: 100 }, visionRange: 200 };

        const isPlayerInVisionFn = Enemy.prototype.isPlayerInVision;
        expect(isPlayerInVisionFn.call(enemy, null)).toBe(false);
    });
});
```

- [ ] **Add isPlayerInAttackRange tests**

```javascript
describe('isPlayerInAttackRange', () => {
    test('returns true when player within attack range', () => {
        const enemy = {
            graphics: { x: 100, y: 100 },
            attackRange: 50
        };
        const player = { x: 130, y: 100 }; // Distance = 30 < 50

        const isPlayerInAttackRangeFn = Enemy.prototype.isPlayerInAttackRange;
        expect(isPlayerInAttackRangeFn.call(enemy, player)).toBe(true);
    });

    test('returns false when player outside attack range', () => {
        const enemy = {
            graphics: { x: 100, y: 100 },
            attackRange: 50
        };
        const player = { x: 200, y: 100 }; // Distance = 100 > 50

        const isPlayerInAttackRangeFn = Enemy.prototype.isPlayerInAttackRange;
        expect(isPlayerInAttackRangeFn.call(enemy, player)).toBe(false);
    });
});
```

---

## Task 3: Add chasePlayer and attackPlayer Tests

**Files:**
- Modify: `src/systems/__tests__/EnemyAI.test.js`

- [ ] **Add chasePlayer tests**

```javascript
describe('chasePlayer', () => {
    test('chasePlayer calls physics.moveTo', () => {
        const mockScene = {
            physics: { moveTo: jest.fn() }
        };
        const enemy = {
            scene: mockScene,
            graphics: { x: 100, y: 100, rotation: 0 },
            baseSpeed: 100,
            chaseSpeedMultiplier: 1.5
        };
        const player = { x: 200, y: 150 };

        const chasePlayerFn = Enemy.prototype.chasePlayer;
        chasePlayerFn.call(enemy, player);

        expect(mockScene.physics.moveTo).toHaveBeenCalled();
    });
});
```

- [ ] **Add attackPlayer tests**

```javascript
describe('attackPlayer', () => {
    test('attackPlayer returns damage when off cooldown', () => {
        const enemy = {
            scene: { time: { now: 3000 } },
            lastAttackTime: 0,
            attackCooldown: 1500,
            state: Enemy.STATE.CHASING,
            fishConfig: { size: 40 }
        };

        const attackPlayerFn = Enemy.prototype.attackPlayer;
        const damage = attackPlayerFn.call(enemy, {});

        expect(damage).toBe(10); // 40 / 4 = 10
        expect(enemy.lastAttackTime).toBe(3000);
    });

    test('attackPlayer returns 0 when on cooldown', () => {
        const enemy = {
            scene: { time: { now: 1000 } },
            lastAttackTime: 500,
            attackCooldown: 1500,
            state: Enemy.STATE.ATTACKING,
            fishConfig: { size: 40 }
        };

        const attackPlayerFn = Enemy.prototype.attackPlayer;
        const damage = attackPlayerFn.call(enemy, {});

        expect(damage).toBe(0);
    });
});
```

---

## Task 4: Add getExpValue and destroy Tests

**Files:**
- Modify: `src/systems/__tests__/EnemyAI.test.js`

- [ ] **Add getExpValue and destroy tests**

```javascript
describe('getExpValue', () => {
    test('returns expValue', () => {
        const enemy = { expValue: 25 };

        const getExpValueFn = Enemy.prototype.getExpValue;
        expect(getExpValueFn.call(enemy)).toBe(25);
    });
});

describe('destroy', () => {
    test('destroy calls graphics.destroy', () => {
        const mockGraphics = { destroy: jest.fn() };
        const mockHealthBar = { destroy: jest.fn() };
        const enemy = {
            graphics: mockGraphics,
            healthBar: mockHealthBar
        };

        const destroyFn = Enemy.prototype.destroy;
        destroyFn.call(enemy);

        expect(mockGraphics.destroy).toHaveBeenCalled();
        expect(mockHealthBar.destroy).toHaveBeenCalled();
    });
});
```

---

## Task 5: Verify 80% Coverage

- [ ] **Run tests with coverage**

```bash
cd /Users/yuefengjiang/AI/fish_eat
npm test -- --coverage
```

Expected: Enemy.js coverage > 80%
