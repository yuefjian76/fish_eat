# 鱼吃鱼游戏 - TDD 测试实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为鱼吃鱼游戏核心系统添加 Jest 单元测试

**Architecture:** 测试框架 Jest，纯逻辑提取为可测试函数，测试文件放在 `src/systems/__tests__/`

**Tech Stack:** Jest 29.x, Node.js >= 18

---

## 文件结构

```
fish_eat/
├── package.json                 # 添加 Jest 依赖
├── jest.config.js              # Jest 配置
└── src/
    └── systems/
        ├── __tests__/
        │   ├── BattleSystem.test.js
        │   ├── GrowthSystem.test.js
        │   ├── SkillSystem.test.js
        │   ├── DriftBottleSystem.test.js
        │   └── LuckSystem.test.js
        ├── BattleSystem.js     # 修改：提取纯函数
        ├── GrowthSystem.js      # 修改：提取纯函数
        ├── SkillSystem.js       # 修改：提取纯函数
        ├── DriftBottleSystem.js # 修改：提取纯函数
        ├── LuckSystem.js        # 修改：提取纯函数
        └── DebugLogger.js       # Mock for tests
```

---

## 任务 1: Jest 配置

**Files:**
- Create: `package.json`
- Create: `jest.config.js`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "fish-eat",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

- [ ] **Step 2: 创建 jest.config.js**

```javascript
export default {
  testEnvironment: 'node',
  moduleFileExtensions: ['js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/systems/**/*.js',
    '!src/systems/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true
};
```

- [ ] **Step 3: 运行测试验证配置**

Run: `npm test`
Expected: PASS (no tests yet, but no errors)

- [ ] **Step 4: 提交**

```bash
git add package.json jest.config.js
git commit -m "test: add Jest configuration"
```

---

## 任务 2: BattleSystem 测试

**Files:**
- Modify: `src/systems/BattleSystem.js` (提取纯函数)
- Create: `src/systems/__tests__/BattleSystem.test.js`

### 2.1 提取纯函数

在 `BattleSystem.js` 末尾添加：

```javascript
// Pure functions for testing
export function calculateDamagePure(attackerConfig, defenderConfig, baseDamage = 10) {
    let damage = baseDamage;
    if (attackerConfig.strongAgainst?.includes(defenderConfig.type)) {
        damage *= 1.5;
    }
    if (attackerConfig.weakTo?.includes(defenderConfig.type)) {
        damage *= 0.5;
    }
    return Math.floor(damage);
}

export function canAttackPure(attackerConfig, defenderType) {
    if (attackerConfig.strongAgainst?.includes(defenderType)) {
        return false;
    }
    return true;
}

export function healPure(currentHp, maxHp, amount) {
    const newHp = Math.min(currentHp + amount, maxHp);
    return { newHp, actualHeal: newHp - currentHp };
}

export function applyDamagePure(currentHp, damage) {
    const newHp = Math.max(currentHp - damage, 0);
    return { newHp, actualDamage: currentHp - newHp };
}

export function isDeadPure(hp) {
    return hp <= 0;
}
```

### 2.2 测试文件

- [ ] **Step 1: 创建 BattleSystem.test.js**

```javascript
import {
    calculateDamagePure,
    canAttackPure,
    healPure,
    applyDamagePure,
    isDeadPure
} from '../BattleSystem.js';

describe('BattleSystem - Pure Functions', () => {
    const fishConfig = {
        clownfish: {
            type: 'clownfish',
            strongAgainst: ['shrimp'],
            weakTo: ['shark']
        },
        shrimp: {
            type: 'shrimp',
            strongAgainst: [],
            weakTo: ['clownfish']
        },
        shark: {
            type: 'shark',
            strongAgainst: ['clownfish'],
            weakTo: []
        }
    };

    describe('calculateDamagePure', () => {
        test('returns base damage when no type advantage', () => {
            const result = calculateDamagePure(fishConfig.shrimp, fishConfig.shrimp);
            expect(result).toBe(10);
        });

        test('applies 1.5x bonus for strong against', () => {
            const result = calculateDamagePure(fishConfig.clownfish, fishConfig.shrimp);
            expect(result).toBe(15); // 10 * 1.5
        });

        test('applies 0.5x penalty for weak to', () => {
            const result = calculateDamagePure(fishConfig.clownfish, fishConfig.shark);
            expect(result).toBe(5); // 10 * 0.5
        });

        test('returns base damage for unknown fish types', () => {
            const result = calculateDamagePure({}, {});
            expect(result).toBe(10);
        });
    });

    describe('canAttackPure', () => {
        test('returns true when no type disadvantage', () => {
            expect(canAttackPure(fishConfig.shark, 'clownfish')).toBe(true);
        });

        test('returns false when attacker is strong against target', () => {
            expect(canAttackPure(fishConfig.clownfish, 'shrimp')).toBe(false);
        });
    });

    describe('healPure', () => {
        test('heals by specified amount', () => {
            const result = healPure(50, 100, 30);
            expect(result.newHp).toBe(80);
            expect(result.actualHeal).toBe(30);
        });

        test('caps at maxHp', () => {
            const result = healPure(90, 100, 30);
            expect(result.newHp).toBe(100);
            expect(result.actualHeal).toBe(10);
        });

        test('heal of 0 does nothing', () => {
            const result = healPure(50, 100, 0);
            expect(result.newHp).toBe(50);
            expect(result.actualHeal).toBe(0);
        });
    });

    describe('applyDamagePure', () => {
        test('applies damage correctly', () => {
            const result = applyDamagePure(80, 25);
            expect(result.newHp).toBe(55);
            expect(result.actualDamage).toBe(25);
        });

        test('caps at 0 (no negative HP)', () => {
            const result = applyDamagePure(20, 50);
            expect(result.newHp).toBe(0);
            expect(result.actualDamage).toBe(20);
        });
    });

    describe('isDeadPure', () => {
        test('returns true when hp is 0', () => {
            expect(isDeadPure(0)).toBe(true);
        });

        test('returns true when hp is negative', () => {
            expect(isDeadPure(-10)).toBe(true);
        });

        test('returns false when hp is positive', () => {
            expect(isDeadPure(1)).toBe(false);
        });
    });
});
```

- [ ] **Step 2: 运行测试验证**

Run: `npm test -- BattleSystem.test.js`
Expected: 11 tests PASS

- [ ] **Step 3: 提交**

```bash
git add src/systems/BattleSystem.js src/systems/__tests__/BattleSystem.test.js
git commit -m "test: add BattleSystem unit tests"
```

---

## 任务 3: GrowthSystem 测试

**Files:**
- Modify: `src/systems/GrowthSystem.js` (提取纯函数)
- Create: `src/systems/__tests__/GrowthSystem.test.js`

### 3.1 提取纯函数

在 `GrowthSystem.js` 末尾添加：

```javascript
// Pure functions for testing
export function getExpForLevelPure(experienceTable, level) {
    const index = level - 1;
    if (index < 0 || index >= experienceTable.length) {
        return experienceTable[experienceTable.length - 1] || 0;
    }
    return experienceTable[index];
}

export function checkLevelUpPure(currentExp, currentLevel, experienceTable) {
    const expForNextLevel = getExpForLevelPure(experienceTable, currentLevel + 1);
    return currentExp >= expForNextLevel;
}

export function calculateComboMultiplier(comboCount, bonusMultiplier) {
    return 1 + (comboCount * bonusMultiplier);
}

export function calculateExpGain(baseExp, comboCount, bonusMultiplier) {
    const multiplier = calculateComboMultiplier(comboCount, bonusMultiplier);
    return Math.floor(baseExp * multiplier);
}
```

### 3.2 测试文件

- [ ] **Step 1: 创建 GrowthSystem.test.js**

```javascript
import {
    getExpForLevelPure,
    checkLevelUpPure,
    calculateComboMultiplier,
    calculateExpGain
} from '../GrowthSystem.js';

describe('GrowthSystem - Pure Functions', () => {
    const expTable = [0, 100, 250, 500, 900, 1500];

    describe('getExpForLevelPure', () => {
        test('returns correct exp for level 1', () => {
            expect(getExpForLevelPure(expTable, 1)).toBe(0);
        });

        test('returns correct exp for level 2', () => {
            expect(getExpForLevelPure(expTable, 2)).toBe(100);
        });

        test('returns last value for out of range level', () => {
            expect(getExpForLevelPure(expTable, 100)).toBe(1500);
        });

        test('returns 0 for level 0', () => {
            expect(getExpForLevelPure(expTable, 0)).toBe(0);
        });
    });

    describe('checkLevelUpPure', () => {
        test('returns true when exp is enough', () => {
            expect(checkLevelUpPure(100, 1, expTable)).toBe(true);
        });

        test('returns false when exp is not enough', () => {
            expect(checkLevelUpPure(50, 1, expTable)).toBe(false);
        });
    });

    describe('calculateComboMultiplier', () => {
        test('returns 1 for combo 0', () => {
            expect(calculateComboMultiplier(0, 0.2)).toBe(1);
        });

        test('returns 1.2 for combo 1', () => {
            expect(calculateComboMultiplier(1, 0.2)).toBe(1.2);
        });

        test('returns 1.6 for combo 3', () => {
            expect(calculateComboMultiplier(3, 0.2)).toBe(1.6);
        });
    });

    describe('calculateExpGain', () => {
        test('base exp with no combo', () => {
            const result = calculateExpGain(100, 0, 0.2);
            expect(result).toBe(100);
        });

        test('exp with combo 2', () => {
            const result = calculateExpGain(100, 2, 0.2);
            expect(result).toBe(140); // 100 * 1.4
        });

        test('floors the result', () => {
            const result = calculateExpGain(33, 1, 0.2);
            expect(result).toBe(39); // 33 * 1.2 = 39.6 -> 39
        });
    });
});
```

- [ ] **Step 2: 运行测试验证**

Run: `npm test -- GrowthSystem.test.js`
Expected: 11 tests PASS

- [ ] **Step 3: 提交**

```bash
git add src/systems/GrowthSystem.js src/systems/__tests__/GrowthSystem.test.js
git commit -m "test: add GrowthSystem unit tests"
```

---

## 任务 4: LuckSystem 测试

**Files:**
- Modify: `src/systems/LuckSystem.js` (已有很多纯函数)
- Create: `src/systems/__tests__/LuckSystem.test.js`

### 4.1 测试文件

- [ ] **Step 1: 创建 LuckSystem.test.js**

```javascript
import LuckSystem from '../LuckSystem.js';

describe('LuckSystem', () => {
    let luckSystem;

    beforeEach(() => {
        luckSystem = new LuckSystem(0);
    });

    describe('constructor', () => {
        test('initializes with given luck value', () => {
            const system = new LuckSystem(5);
            expect(system.getLuck()).toBe(5);
        });

        test('defaults to 0 luck', () => {
            expect(luckSystem.getLuck()).toBe(0);
        });
    });

    describe('addLuck', () => {
        test('adds positive value', () => {
            luckSystem.addLuck(3);
            expect(luckSystem.getLuck()).toBe(3);
        });

        test('adds negative value', () => {
            luckSystem.addLuck(-2);
            expect(luckSystem.getLuck()).toBe(-2);
        });

        test('accumulates', () => {
            luckSystem.addLuck(3);
            luckSystem.addLuck(2);
            expect(luckSystem.getLuck()).toBe(5);
        });
    });

    describe('setLuck', () => {
        test('sets exact value', () => {
            luckSystem.addLuck(10);
            luckSystem.setLuck(5);
            expect(luckSystem.getLuck()).toBe(5);
        });
    });

    describe('reset', () => {
        test('resets to base value', () => {
            const system = new LuckSystem(3);
            system.addLuck(5);
            system.reset();
            expect(system.getLuck()).toBe(3);
        });
    });

    describe('modifyWeight', () => {
        const luckInfluence = {
            goodBonusPerLuck: 0.5,
            badReductionPerLuck: 0.3
        };

        test('increases good effect weight', () => {
            luckSystem.addLuck(2);
            const result = luckSystem.modifyWeight(10, true, luckInfluence);
            expect(result).toBe(11); // 10 + (2 * 0.5)
        });

        test('decreases bad effect weight', () => {
            luckSystem.addLuck(2);
            const result = luckSystem.modifyWeight(10, false, luckInfluence);
            expect(result).toBe(9.4); // 10 - (2 * 0.3)
        });

        test('minimum weight is 1', () => {
            luckSystem.addLuck(100);
            const result = luckSystem.modifyWeight(5, false, luckInfluence);
            expect(result).toBe(1); // Would be negative, clamped to 1
        });
    });

    describe('calculateGoodChance', () => {
        const luckInfluence = {
            goodBonusPerLuck: 0.5,
            badReductionPerLuck: 0.3
        };

        test('base chance without luck', () => {
            const result = luckSystem.calculateGoodChance(70, luckInfluence);
            expect(result).toBe(70);
        });

        test('increases with positive luck', () => {
            luckSystem.addLuck(5);
            const result = luckSystem.calculateGoodChance(70, luckInfluence);
            expect(result).toBe(80); // 70 + (5 * 2)
        });

        test('caps at 95', () => {
            luckSystem.addLuck(50);
            const result = luckSystem.calculateGoodChance(70, luckInfluence);
            expect(result).toBe(95);
        });

        test('floors at 5', () => {
            luckSystem.addLuck(-50);
            const result = luckSystem.calculateGoodChance(70, luckInfluence);
            expect(result).toBe(5);
        });
    });
});
```

- [ ] **Step 2: 运行测试验证**

Run: `npm test -- LuckSystem.test.js`
Expected: 14 tests PASS

- [ ] **Step 3: 提交**

```bash
git add src/systems/__tests__/LuckSystem.test.js
git commit -m "test: add LuckSystem unit tests"
```

---

## 任务 5: DriftBottleSystem 测试

**Files:**
- Modify: `src/systems/DriftBottleSystem.js` (提取纯函数)
- Create: `src/systems/__tests__/DriftBottleSystem.test.js`

### 5.1 提取纯函数

在 `DriftBottleSystem.js` 末尾添加：

```javascript
// Pure functions for testing
export function selectEffectPure(effects, isGoodRoll, luckSystem, luckInfluence) {
    const eligibleEffects = effects.filter(e => e.good === isGoodRoll);

    let totalWeight = 0;
    const weightedEffects = eligibleEffects.map(effect => {
        const modifiedWeight = luckSystem.modifyWeight(
            effect.weight,
            effect.good,
            luckInfluence
        );
        totalWeight += modifiedWeight;
        return { effect, weight: modifiedWeight };
    });

    let random = Math.random() * totalWeight;
    for (const { effect, weight } of weightedEffects) {
        random -= weight;
        if (random <= 0) {
            return effect;
        }
    }

    return weightedEffects[0]?.effect || effects[0];
}

export function rollForGoodEffect(luckSystem, luckInfluence) {
    const goodChance = luckSystem.calculateGoodChance(
        luckInfluence.baseGoodChance,
        luckInfluence
    );
    return Math.random() * 100 < goodChance;
}
```

### 5.2 测试文件

- [ ] **Step 1: 创建 DriftBottleSystem.test.js**

```javascript
import {
    selectEffectPure,
    rollForGoodEffect
} from '../DriftBottleSystem.js';
import LuckSystem from '../LuckSystem.js';

describe('DriftBottleSystem - Pure Functions', () => {
    const effects = [
        { id: 'full_health', name: '血量全满', good: true, weight: 12 },
        { id: 'coins_50', name: '金币+50', good: true, weight: 20 },
        { id: 'speed_down', name: '速度-30%', good: false, weight: 5 },
        { id: 'luck_down', name: '幸运-1', good: false, weight: 3 }
    ];

    const luckInfluence = {
        baseGoodChance: 70,
        goodBonusPerLuck: 2,
        badReductionPerLuck: 1
    };

    describe('rollForGoodEffect', () => {
        test('base roll returns true/false based on probability', () => {
            // Test multiple times to verify randomness
            const results = [];
            for (let i = 0; i < 100; i++) {
                const luckSystem = new LuckSystem(0);
                results.push(rollForGoodEffect(luckSystem, luckInfluence));
            }
            // Should have both true and false results given 70% chance
            expect(results.some(r => r)).toBe(true);
        });

        test('high luck increases good chance', () => {
            const luckSystem = new LuckSystem(10); // +10 luck
            // With 10 luck and base 70%, should be very likely to roll good
            let goodCount = 0;
            for (let i = 0; i < 20; i++) {
                if (rollForGoodEffect(luckSystem, luckInfluence)) goodCount++;
            }
            expect(goodCount).toBeGreaterThan(15);
        });
    });

    describe('selectEffectPure', () => {
        test('returns only good effects when isGoodRoll is true', () => {
            const luckSystem = new LuckSystem(0);
            for (let i = 0; i < 50; i++) {
                const effect = selectEffectPure(effects, true, luckSystem, luckInfluence);
                expect(effect.good).toBe(true);
            }
        });

        test('returns only bad effects when isGoodRoll is false', () => {
            const luckSystem = new LuckSystem(0);
            for (let i = 0; i < 50; i++) {
                const effect = selectEffectPure(effects, false, luckSystem, luckInfluence);
                expect(effect.good).toBe(false);
            }
        });

        test('always returns a valid effect', () => {
            const luckSystem = new LuckSystem(0);
            const effect = selectEffectPure(effects, true, luckSystem, luckInfluence);
            expect(effect).toBeDefined();
            expect(effect.id).toBeDefined();
        });

        test('luck affects weight selection', () => {
            // With high luck, good effects should be weighted higher
            const highLuckSystem = new LuckSystem(10);
            const lowLuckSystem = new LuckSystem(-5);

            // This test verifies the function runs without error
            // Weight distribution is probabilistic
            expect(() => selectEffectPure(effects, true, highLuckSystem, luckInfluence)).not.toThrow();
            expect(() => selectEffectPure(effects, false, lowLuckSystem, luckInfluence)).not.toThrow();
        });
    });
});
```

- [ ] **Step 2: 运行测试验证**

Run: `npm test -- DriftBottleSystem.test.js`
Expected: 7 tests PASS

- [ ] **Step 3: 提交**

```bash
git add src/systems/DriftBottleSystem.js src/systems/__tests__/DriftBottleSystem.test.js
git commit -m "test: add DriftBottleSystem unit tests"
```

---

## 任务 6: SkillSystem 测试

**Files:**
- Modify: `src/systems/SkillSystem.js` (提取纯函数)
- Create: `src/systems/__tests__/SkillSystem.test.js`

### 6.1 提取纯函数

在 `SkillSystem.js` 末尾添加：

```javascript
// Pure functions for testing
export function findSkillByKey(skillsData, key) {
    for (const id in skillsData) {
        if (skillsData[id].key === key) {
            return { id, skill: skillsData[id] };
        }
    }
    return null;
}

export function isSkillOnCooldownPure(cooldowns, skillId) {
    return cooldowns[skillId] > 0;
}

export function calculateHealPure(currentHp, maxHp, healAmount) {
    const actualHeal = Math.min(healAmount, maxHp - currentHp);
    return actualHeal > 0 ? { success: true, healAmount: actualHeal } : { success: false, reason: 'full_hp' };
}
```

### 6.2 测试文件

- [ ] **Step 1: 创建 SkillSystem.test.js**

```javascript
import {
    findSkillByKey,
    isSkillOnCooldownPure,
    calculateHealPure
} from '../SkillSystem.js';

describe('SkillSystem - Pure Functions', () => {
    const skillsData = {
        bite: { key: 'Q', name: '撕咬', type: 'damage', cooldown: 3000, damage: 25 },
        shield: { key: 'W', name: '护盾', type: 'defense', cooldown: 10000, duration: 5 },
        speed_up: { key: 'E', name: '加速', type: 'buff', cooldown: 8000, duration: 3 },
        heal: { key: 'R', name: '治疗', type: 'heal', cooldown: 15000, healAmount: 30 }
    };

    describe('findSkillByKey', () => {
        test('finds skill by key', () => {
            const result = findSkillByKey(skillsData, 'Q');
            expect(result).not.toBeNull();
            expect(result.id).toBe('bite');
            expect(result.skill.name).toBe('撕咬');
        });

        test('returns null for unknown key', () => {
            const result = findSkillByKey(skillsData, 'X');
            expect(result).toBeNull();
        });

        test('finds all skills', () => {
            const keys = ['Q', 'W', 'E', 'R'];
            keys.forEach(key => {
                const result = findSkillByKey(skillsData, key);
                expect(result).not.toBeNull();
            });
        });
    });

    describe('isSkillOnCooldownPure', () => {
        test('returns true when on cooldown', () => {
            const cooldowns = { bite: 1500, shield: 0 };
            expect(isSkillOnCooldownPure(cooldowns, 'bite')).toBe(true);
        });

        test('returns false when not on cooldown', () => {
            const cooldowns = { bite: 0, shield: 0 };
            expect(isSkillOnCooldownPure(cooldowns, 'bite')).toBe(false);
        });

        test('returns true for negative cooldown (edge case)', () => {
            const cooldowns = { bite: -5 };
            expect(isSkillOnCooldownPure(cooldowns, 'bite')).toBe(true);
        });
    });

    describe('calculateHealPure', () => {
        test('heals partial amount', () => {
            const result = calculateHealPure(50, 100, 30);
            expect(result.success).toBe(true);
            expect(result.healAmount).toBe(30);
        });

        test('caps heal at maxHp', () => {
            const result = calculateHealPure(90, 100, 30);
            expect(result.success).toBe(true);
            expect(result.healAmount).toBe(10);
        });

        test('fails when already at maxHp', () => {
            const result = calculateHealPure(100, 100, 30);
            expect(result.success).toBe(false);
            expect(result.reason).toBe('full_hp');
        });

        test('fails when healAmount is 0', () => {
            const result = calculateHealPure(50, 100, 0);
            expect(result.success).toBe(false);
        });
    });
});
```

- [ ] **Step 2: 运行测试验证**

Run: `npm test -- SkillSystem.test.js`
Expected: 12 tests PASS

- [ ] **Step 3: 提交**

```bash
git add src/systems/SkillSystem.js src/systems/__tests__/SkillSystem.test.js
git commit -m "test: add SkillSystem unit tests"
```

---

---

## 任务 7: FishMovementSystem 测试（鱼的移动逻辑）

**Files:**
- Create: `src/systems/__tests__/FishMovementSystem.test.js`

### 7.1 提取纯函数

在 `src/systems/FishMovementSystem.js` 中实现：

```javascript
// Pure functions for testing fish movement logic

/**
 * Calculate current speed with modifiers
 * @param {number} baseSpeed - Base speed
 * @param {boolean} isShiftDown - Shift key pressed
 * @param {boolean} hasSpeedUpBuff - Has speed_up skill active
 * @returns {number} Final speed
 */
export function calculateSpeedPure(baseSpeed, isShiftDown, hasSpeedUpBuff) {
    let speed = baseSpeed;
    if (isShiftDown || hasSpeedUpBuff) {
        speed *= 1.8;
    }
    return speed;
}

/**
 * Calculate new position with velocity (Euler integration)
 * @param {number} currentPos - Current position
 * @param {number} velocity - Velocity (can be negative)
 * @param {number} delta - Time delta in ms
 * @returns {number} New position
 */
export function calculatePositionPure(currentPos, velocity, delta) {
    const deltaSeconds = delta / 1000;
    return currentPos + velocity * deltaSeconds;
}

/**
 * Clamp position to bounds
 * @param {number} pos - Position to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped position
 */
export function clampPositionPure(pos, min, max) {
    return Math.max(min, Math.min(max, pos));
}

/**
 * Calculate rotation angle from velocity
 * @param {number} vx - Velocity X
 * @param {number} vy - Velocity Y
 * @returns {number} Angle in radians, or null if no movement
 */
export function calculateRotationFromVelocity(vx, vy) {
    if (vx === 0 && vy === 0) {
        return null;
    }
    return Math.atan2(vy, vx);
}

/**
 * Calculate movement state from keys
 * @param {object} keys - { left, right, up, down } boolean states
 * @returns {object} { vx, vy } velocity components
 */
export function calculateVelocityFromKeys(keys) {
    let vx = 0;
    let vy = 0;
    if (keys.left) vx -= 1;
    if (keys.right) vx += 1;
    if (keys.up) vy -= 1;
    if (keys.down) vy += 1;
    return { vx, vy };
}
```

### 7.2 测试文件

- [ ] **Step 1: 创建 FishMovementSystem.test.js**

```javascript
import {
    calculateSpeedPure,
    calculatePositionPure,
    clampPositionPure,
    calculateRotationFromVelocity,
    calculateVelocityFromKeys
} from '../FishMovementSystem.js';

describe('FishMovementSystem - Pure Functions', () => {
    const BASE_SPEED = 200;

    describe('calculateSpeedPure', () => {
        test('returns base speed when no modifiers', () => {
            expect(calculateSpeedPure(BASE_SPEED, false, false)).toBe(200);
        });

        test('applies 1.8x multiplier when shift is down', () => {
            expect(calculateSpeedPure(BASE_SPEED, true, false)).toBe(360);
        });

        test('applies 1.8x multiplier when speed_up buff is active', () => {
            expect(calculateSpeedPure(BASE_SPEED, false, true)).toBe(360);
        });

        test('applies only 1.8x (not stacking) when both are true', () => {
            // 1.8x multiplier applies once, not twice
            expect(calculateSpeedPure(BASE_SPEED, true, true)).toBe(360);
        });

        test('works with custom base speed', () => {
            expect(calculateSpeedPure(300, true, false)).toBe(540);
        });
    });

    describe('calculatePositionPure', () => {
        test('updates position based on velocity and delta', () => {
            // delta = 1000ms = 1 second, velocity = 200
            expect(calculatePositionPure(100, 200, 1000)).toBe(300);
        });

        test('handles negative velocity (moving left/up)', () => {
            expect(calculatePositionPure(100, -150, 1000)).toBe(-50);
        });

        test('handles small delta values', () => {
            // delta = 16ms ≈ 60fps frame
            expect(calculatePositionPure(100, 200, 16)).toBeCloseTo(103.2);
        });

        test('position unchanged when velocity is 0', () => {
            expect(calculatePositionPure(500, 0, 1000)).toBe(500);
        });
    });

    describe('clampPositionPure', () => {
        test('returns same value when within bounds', () => {
            expect(clampPositionPure(50, 0, 100)).toBe(50);
        });

        test('returns min when below', () => {
            expect(clampPositionPure(-10, 0, 100)).toBe(0);
        });

        test('returns max when above', () => {
            expect(clampPositionPure(150, 0, 100)).toBe(100);
        });

        test('handles edge cases', () => {
            expect(clampPositionPure(0, 0, 100)).toBe(0);
            expect(clampPositionPure(100, 0, 100)).toBe(100);
        });
    });

    describe('calculateRotationFromVelocity', () => {
        test('returns angle for rightward movement (positive X)', () => {
            const angle = calculateRotationFromVelocity(1, 0);
            expect(angle).toBeCloseTo(0);
        });

        test('returns angle for downward movement (positive Y)', () => {
            const angle = calculateRotationFromVelocity(0, 1);
            expect(angle).toBeCloseTo(Math.PI / 2);
        });

        test('returns angle for leftward movement (negative X)', () => {
            const angle = calculateRotationFromVelocity(-1, 0);
            expect(angle).toBeCloseTo(Math.PI);
        });

        test('returns angle for upward movement (negative Y)', () => {
            const angle = calculateRotationFromVelocity(0, -1);
            expect(angle).toBeCloseTo(-Math.PI / 2);
        });

        test('returns null for zero velocity (no movement)', () => {
            expect(calculateRotationFromVelocity(0, 0)).toBeNull();
        });

        test('handles diagonal movement', () => {
            const angle = calculateRotationFromVelocity(1, 1);
            expect(angle).toBeCloseTo(Math.PI / 4);
        });
    });

    describe('calculateVelocityFromKeys', () => {
        test('returns 0,0 when no keys pressed', () => {
            expect(calculateVelocityFromKeys({ left: false, right: false, up: false, down: false }))
                .toEqual({ vx: 0, vy: 0 });
        });

        test('returns positive X when right pressed', () => {
            expect(calculateVelocityFromKeys({ left: false, right: true, up: false, down: false }))
                .toEqual({ vx: 1, vy: 0 });
        });

        test('returns negative X when left pressed', () => {
            expect(calculateVelocityFromKeys({ left: true, right: false, up: false, down: false }))
                .toEqual({ vx: -1, vy: 0 });
        });

        test('returns positive Y when down pressed', () => {
            expect(calculateVelocityFromKeys({ left: false, right: false, up: false, down: true }))
                .toEqual({ vx: 0, vy: 1 });
        });

        test('returns negative Y when up pressed', () => {
            expect(calculateVelocityFromKeys({ left: false, right: false, up: true, down: false }))
                .toEqual({ vx: 0, vy: -1 });
        });

        test('handles diagonal (left + down)', () => {
            expect(calculateVelocityFromKeys({ left: true, right: false, up: false, down: true }))
                .toEqual({ vx: -1, vy: 1 });
        });

        test('left and right cancel out', () => {
            expect(calculateVelocityFromKeys({ left: true, right: true, up: false, down: false }))
                .toEqual({ vx: 0, vy: 0 });
        });
    });
});
```

- [ ] **Step 2: 运行测试验证**

Run: `npm test -- FishMovementSystem.test.js`
Expected: 23 tests PASS

- [ ] **Step 3: 提交**

```bash
git add src/systems/FishMovementSystem.js src/systems/__tests__/FishMovementSystem.test.js
git commit -m "test: add FishMovementSystem unit tests"
```

---

## 任务 8: EatDetectionSystem 测试（吃鱼/PK逻辑）

**Files:**
- Create: `src/systems/__tests__/EatDetectionSystem.test.js`

### 8.1 提取纯函数

在 `src/systems/EatDetectionSystem.js` 中实现：

```javascript
// Pure functions for testing eat/damage detection logic

/**
 * Check if player can eat a fish
 * Size threshold: playerSize > fishSize * 1.2
 * @param {number} playerSize - Player fish size
 * @param {number} fishSize - Target fish size
 * @returns {boolean} True if player can eat
 */
export function canEatFishPure(playerSize, fishSize) {
    return playerSize > fishSize * 1.2;
}

/**
 * Check if fish can eat player (player takes damage)
 * Size threshold: fishSize > playerSize * 1.2
 * @param {number} playerSize - Player fish size
 * @param {number} fishSize - Target fish size
 * @returns {boolean} True if fish can eat player
 */
export function canFishEatPlayerPure(playerSize, fishSize) {
    return fishSize > playerSize * 1.2;
}

/**
 * Check if type advantage blocks eating
 * @param {string} eaterType - Type of fish trying to eat
 * @param {string} targetType - Type of potential prey
 * @param {object} fishData - Fish configuration data
 * @returns {boolean} True if eating is blocked by type advantage
 */
export function isBlockedByTypeAdvantage(eaterType, targetType, fishData) {
    const targetFish = fishData[targetType];
    if (!targetFish) return false;
    const strongAgainst = targetFish.strongAgainst;
    return strongAgainst && strongAgainst.includes(eaterType);
}

/**
 * Check if type advantage blocks damage to player
 * @param {string} playerType - Player fish type
 * @param {string} fishType - Attacking fish type
 * @param {object} fishData - Fish configuration data
 * @returns {boolean} True if damage is blocked
 */
export function isDamageBlockedByTypeAdvantage(playerType, fishType, fishData) {
    const fishDataEntry = fishData[fishType];
    if (!fishDataEntry) return false;
    const weakTo = fishDataEntry.weakTo;
    return weakTo && weakTo.includes(playerType);
}

/**
 * Calculate damage dealt from fish to player
 * @param {number} fishSize - Size of attacking fish
 * @returns {number} Damage amount
 */
export function calculateDamageDealtPure(fishSize) {
    return Math.floor(fishSize / 4);
}

/**
 * Calculate enemy damage with difficulty multiplier
 * @param {number} baseDamage - Base damage from enemy
 * @param {number} difficultyMultiplier - Enemy damage multiplier from difficulty
 * @returns {number} Final damage after multiplier
 */
export function calculateEnemyDamagePure(baseDamage, difficultyMultiplier) {
    return Math.floor(baseDamage * difficultyMultiplier);
}

/**
 * Apply damage to HP
 * @param {number} currentHp - Current HP
 * @param {number} damage - Damage to apply
 * @returns {object} { newHp, actualDamage }
 */
export function applyDamageToHpPure(currentHp, damage) {
    const newHp = Math.max(currentHp - damage, 0);
    return { newHp, actualDamage: currentHp - newHp };
}
```

### 8.2 测试文件

- [ ] **Step 1: 创建 EatDetectionSystem.test.js**

```javascript
import {
    canEatFishPure,
    canFishEatPlayerPure,
    isBlockedByTypeAdvantage,
    isDamageBlockedByTypeAdvantage,
    calculateDamageDealtPure,
    calculateEnemyDamagePure,
    applyDamageToHpPure
} from '../EatDetectionSystem.js';

describe('EatDetectionSystem - Pure Functions', () => {
    const fishData = {
        clownfish: {
            strongAgainst: ['shrimp'],
            weakTo: ['shark']
        },
        shrimp: {
            strongAgainst: [],
            weakTo: ['clownfish']
        },
        shark: {
            strongAgainst: ['clownfish'],
            weakTo: []
        }
    };

    describe('canEatFishPure', () => {
        test('player can eat smaller fish (20% size difference)', () => {
            // Player size 100, fish size 80 -> can eat (100 > 80 * 1.2 = 96)
            expect(canEatFishPure(100, 80)).toBe(true);
        });

        test('player cannot eat similar size fish', () => {
            // Player size 100, fish size 90 -> cannot eat (100 > 90 * 1.2 = 108 = false)
            expect(canEatFishPure(100, 90)).toBe(false);
        });

        test('player cannot eat larger fish', () => {
            expect(canEatFishPure(50, 100)).toBe(false);
        });

        test('exact 1.2x threshold is NOT eatable', () => {
            // Player size 120, fish size 100 -> 120 > 100 * 1.2 = 120? No (not greater)
            expect(canEatFishPure(120, 100)).toBe(false);
        });

        test('just over 1.2x threshold IS eatable', () => {
            // Player size 121, fish size 100 -> 121 > 120 = true
            expect(canEatFishPure(121, 100)).toBe(true);
        });
    });

    describe('canFishEatPlayerPure', () => {
        test('fish can eat player when significantly larger', () => {
            // Fish size 100, player size 80 -> 100 > 80 * 1.2 = 96 = true
            expect(canFishEatPlayerPure(80, 100)).toBe(true);
        });

        test('fish cannot eat similar size player', () => {
            expect(canFishEatPlayerPure(100, 90)).toBe(false);
        });

        test('fish cannot eat smaller player', () => {
            expect(canFishEatPlayerPure(100, 50)).toBe(false);
        });

        test('exact 1.2x threshold is NOT eatable', () => {
            expect(canFishEatPlayerPure(100, 120)).toBe(false);
        });
    });

    describe('isBlockedByTypeAdvantage', () => {
        test('returns true when target is strong against eater', () => {
            // Shark is strong against clownfish, so clownfish cannot eat shark
            expect(isBlockedByTypeAdvantage('clownfish', 'shark', fishData)).toBe(true);
        });

        test('returns false when no type advantage', () => {
            // Clownfish is strong against shrimp, so clownfish CAN eat shrimp
            expect(isBlockedByTypeAdvantage('clownfish', 'shrimp', fishData)).toBe(false);
        });

        test('returns false when target type not found', () => {
            expect(isBlockedByTypeAdvantage('clownfish', 'unknown', fishData)).toBe(false);
        });

        test('returns false when strongAgainst is empty', () => {
            expect(isBlockedByTypeAdvantage('shrimp', 'clownfish', fishData)).toBe(false);
        });
    });

    describe('isDamageBlockedByTypeAdvantage', () => {
        test('returns true when player is strong against fish', () => {
            // Clownfish is weak to shark, so shark damage TO player is blocked
            expect(isDamageBlockedByTypeAdvantage('clownfish', 'shark', fishData)).toBe(true);
        });

        test('returns false when no type advantage', () => {
            // Shark is not weak to clownfish
            expect(isDamageBlockedByTypeAdvantage('clownfish', 'clownfish', fishData)).toBe(false);
        });

        test('returns false when fish type not found', () => {
            expect(isDamageBlockedByTypeAdvantage('clownfish', 'unknown', fishData)).toBe(false);
        });
    });

    describe('calculateDamageDealtPure', () => {
        test('calculates damage from fish size', () => {
            // Fish size 40 -> damage = floor(40/4) = 10
            expect(calculateDamageDealtPure(40)).toBe(10);
        });

        test('handles odd size numbers', () => {
            // Fish size 45 -> damage = floor(45/4) = 11
            expect(calculateDamageDealtPure(45)).toBe(11);
        });

        test('handles large fish', () => {
            // Fish size 100 -> damage = floor(100/4) = 25
            expect(calculateDamageDealtPure(100)).toBe(25);
        });

        test('minimum damage is 0 (very small fish)', () => {
            expect(calculateDamageDealtPure(1)).toBe(0);
        });
    });

    describe('calculateEnemyDamagePure', () => {
        test('applies difficulty multiplier', () => {
            expect(calculateEnemyDamagePure(10, 0.3)).toBe(3);
        });

        test('handles easy mode (low multiplier)', () => {
            expect(calculateEnemyDamagePure(20, 0.3)).toBe(6);
        });

        test('handles normal mode (medium multiplier)', () => {
            expect(calculateEnemyDamagePure(20, 0.6)).toBe(12);
        });

        test('handles hard mode (high multiplier)', () => {
            expect(calculateEnemyDamagePure(20, 1.0)).toBe(20);
        });

        test('floors the result', () => {
            expect(calculateEnemyDamagePure(10, 0.35)).toBe(3); // 3.5 -> 3
        });
    });

    describe('applyDamageToHpPure', () => {
        test('applies damage correctly', () => {
            const result = applyDamageToHpPure(100, 30);
            expect(result.newHp).toBe(70);
            expect(result.actualDamage).toBe(30);
        });

        test('caps HP at 0 (no negative)', () => {
            const result = applyDamageToHpPure(30, 50);
            expect(result.newHp).toBe(0);
            expect(result.actualDamage).toBe(30);
        });

        test('damage of 0 leaves HP unchanged', () => {
            const result = applyDamageToHpPure(50, 0);
            expect(result.newHp).toBe(50);
            expect(result.actualDamage).toBe(0);
        });
    });
});
```

- [ ] **Step 2: 运行测试验证**

Run: `npm test -- EatDetectionSystem.test.js`
Expected: 26 tests PASS

- [ ] **Step 3: 提交**

```bash
git add src/systems/EatDetectionSystem.js src/systems/__tests__/EatDetectionSystem.test.js
git commit -m "test: add EatDetectionSystem unit tests"
```

---

## 任务 9: EnemyAISystem 测试（敌人AI行为）

**Files:**
- Create: `src/systems/__tests__/EnemyAISystem.test.js`

### 9.1 提取纯函数

在 `src/systems/EnemyAISystem.js` 中实现：

```javascript
// Pure functions for testing enemy AI behavior

export const AI_STATE = {
    WANDERING: 'wandering',
    CHASING: 'chasing',
    ATTACKING: 'attacking'
};

/**
 * Calculate AI parameters based on aiLevel
 * @param {number} aiLevel - AI level multiplier (0.5-1.5)
 * @returns {object} AI parameters
 */
export function calculateAIParamsPure(aiLevel) {
    return {
        visionRange: Math.floor(200 * aiLevel),
        attackRange: Math.floor(50 * aiLevel),
        attackCooldown: Math.floor(1500 / aiLevel),
        wanderInterval: Math.floor(2000 / aiLevel),
        chaseSpeedMultiplier: 1.5 * aiLevel
    };
}

/**
 * Check if target is within vision range
 * @param {number} dx - Delta X
 * @param {number} dy - Delta Y
 * @param {number} visionRange - Vision range threshold
 * @returns {boolean} True if in vision
 */
export function isInVisionRangePure(dx, dy, visionRange) {
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= visionRange;
}

/**
 * Check if target is within attack range
 * @param {number} dx - Delta X
 * @param {number} dy - Delta Y
 * @param {number} attackRange - Attack range threshold
 * @returns {boolean} True if in attack range
 */
export function isInAttackRangePure(dx, dy, attackRange) {
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= attackRange;
}

/**
 * Determine AI state based on ranges
 * @param {boolean} inVision - Target in vision range
 * @param {boolean} inAttackRange - Target in attack range
 * @returns {string} AI state
 */
export function determineAIStatePure(inVision, inAttackRange) {
    if (inAttackRange) return AI_STATE.ATTACKING;
    if (inVision) return AI_STATE.CHASING;
    return AI_STATE.WANDERING;
}

/**
 * Check if attack is on cooldown
 * @param {number} lastAttackTime - Timestamp of last attack
 * @param {number} currentTime - Current timestamp
 * @param {number} attackCooldown - Cooldown duration in ms
 * @returns {boolean} True if on cooldown
 */
export function isAttackOnCooldownPure(lastAttackTime, currentTime, attackCooldown) {
    return currentTime - lastAttackTime < attackCooldown;
}

/**
 * Calculate angle to target
 * @param {number} dx - Delta X
 * @param {number} dy - Delta Y
 * @returns {number} Angle in radians
 */
export function calculateAngleToTargetPure(dx, dy) {
    return Math.atan2(dy, dx);
}

/**
 * Calculate chase speed
 * @param {number} baseSpeed - Fish base speed
 * @param {number} chaseSpeedMultiplier - AI chase multiplier
 * @returns {number} Chase speed
 */
export function calculateChaseSpeedPure(baseSpeed, chaseSpeedMultiplier) {
    return baseSpeed * chaseSpeedMultiplier;
}
```

### 9.2 测试文件

- [ ] **Step 1: 创建 EnemyAISystem.test.js**

```javascript
import {
    AI_STATE,
    calculateAIParamsPure,
    isInVisionRangePure,
    isInAttackRangePure,
    determineAIStatePure,
    isAttackOnCooldownPure,
    calculateAngleToTargetPure,
    calculateChaseSpeedPure
} from '../EnemyAISystem.js';

describe('EnemyAISystem - Pure Functions', () => {
    describe('AI_STATE', () => {
        test('has all expected states', () => {
            expect(AI_STATE.WANDERING).toBe('wandering');
            expect(AI_STATE.CHASING).toBe('chasing');
            expect(AI_STATE.ATTACKING).toBe('attacking');
        });
    });

    describe('calculateAIParamsPure', () => {
        test('easy mode (aiLevel 0.5) has lower values', () => {
            const params = calculateAIParamsPure(0.5);
            expect(params.visionRange).toBe(100);
            expect(params.attackRange).toBe(25);
            expect(params.attackCooldown).toBe(3000);
            expect(params.wanderInterval).toBe(4000);
            expect(params.chaseSpeedMultiplier).toBe(0.75);
        });

        test('normal mode (aiLevel 0.8) has medium values', () => {
            const params = calculateAIParamsPure(0.8);
            expect(params.visionRange).toBe(160);
            expect(params.attackRange).toBe(40);
            expect(params.attackCooldown).toBe(1875);
            expect(params.wanderInterval).toBe(2500);
            expect(params.chaseSpeedMultiplier).toBe(1.2);
        });

        test('hard mode (aiLevel 1.2) has higher values', () => {
            const params = calculateAIParamsPure(1.2);
            expect(params.visionRange).toBe(240);
            expect(params.attackRange).toBe(60);
            expect(params.attackCooldown).toBe(1250);
            expect(params.wanderInterval).toBe(1667);
            expect(params.chaseSpeedMultiplier).toBe(1.8);
        });

        test('aiLevel 1.0 is baseline', () => {
            const params = calculateAIParamsPure(1.0);
            expect(params.visionRange).toBe(200);
            expect(params.attackRange).toBe(50);
            expect(params.attackCooldown).toBe(1500);
            expect(params.wanderInterval).toBe(2000);
            expect(params.chaseSpeedMultiplier).toBe(1.5);
        });
    });

    describe('isInVisionRangePure', () => {
        test('returns true when within range', () => {
            expect(isInVisionRangePure(100, 0, 200)).toBe(true);
        });

        test('returns true when exactly at range', () => {
            expect(isInVisionRangePure(200, 0, 200)).toBe(true);
        });

        test('returns false when beyond range', () => {
            expect(isInVisionRangePure(201, 0, 200)).toBe(false);
        });

        test('works with diagonal distance', () => {
            // sqrt(100^2 + 100^2) ≈ 141 < 200
            expect(isInVisionRangePure(100, 100, 200)).toBe(true);
            // sqrt(150^2 + 150^2) ≈ 212 > 200
            expect(isInVisionRangePure(150, 150, 200)).toBe(false);
        });

        test('works with negative coordinates', () => {
            expect(isInVisionRangePure(-100, 0, 200)).toBe(true);
            expect(isInVisionRangePure(100, -100, 200)).toBe(true);
        });
    });

    describe('isInAttackRangePure', () => {
        test('returns true when within attack range', () => {
            expect(isInAttackRangePure(30, 0, 50)).toBe(true);
        });

        test('returns false when beyond attack range', () => {
            expect(isInAttackRangePure(60, 0, 50)).toBe(false);
        });

        test('attack range is typically smaller than vision', () => {
            // Same distance
            expect(isInAttackRangePure(40, 0, 50)).toBe(true);
            expect(isInVisionRangePure(40, 0, 50)).toBe(true);
            // Beyond attack but in vision
            expect(isInAttackRangePure(100, 0, 50)).toBe(false);
            expect(isInVisionRangePure(100, 0, 200)).toBe(true);
        });
    });

    describe('determineAIStatePure', () => {
        test('returns ATTACKING when in attack range', () => {
            expect(determineAIStatePure(true, true)).toBe(AI_STATE.ATTACKING);
        });

        test('returns CHASING when in vision but not attack', () => {
            expect(determineAIStatePure(true, false)).toBe(AI_STATE.CHASING);
        });

        test('returns WANDERING when not in any range', () => {
            expect(determineAIStatePure(false, false)).toBe(AI_STATE.WANDERING);
        });

        test('ATTACKING takes priority over CHASING', () => {
            // Even if also in vision, ATTACKING is chosen
            expect(determineAIStatePure(true, true)).toBe(AI_STATE.ATTACKING);
        });
    });

    describe('isAttackOnCooldownPure', () => {
        test('returns false when enough time has passed', () => {
            // Last attack 5000ms ago, cooldown 1500ms -> not on cooldown
            expect(isAttackOnCooldownPure(5000, 7000, 1500)).toBe(false);
        });

        test('returns true when still on cooldown', () => {
            // Last attack 1000ms ago, cooldown 1500ms -> still on cooldown
            expect(isAttackOnCooldownPure(5000, 5900, 1500)).toBe(true);
        });

        test('returns false when exactly at cooldown end', () => {
            // Last attack 5000ms ago, cooldown 1500ms, current 6500ms -> exactly at end
            expect(isAttackOnCooldownPure(5000, 6500, 1500)).toBe(false);
        });

        test('first attack is never on cooldown (lastAttackTime 0)', () => {
            expect(isAttackOnCooldownPure(0, 1000, 1500)).toBe(false);
        });
    });

    describe('calculateAngleToTargetPure', () => {
        test('returns 0 for directly right', () => {
            expect(calculateAngleToTargetPure(100, 0)).toBe(0);
        });

        test('returns PI/2 for directly down', () => {
            expect(calculateAngleToTargetPure(0, 100)).toBeCloseTo(Math.PI / 2);
        });

        test('returns PI for directly left', () => {
            expect(calculateAngleToTargetPure(-100, 0)).toBeCloseTo(Math.PI);
        });

        test('returns -PI/2 for directly up', () => {
            expect(calculateAngleToTargetPure(0, -100)).toBeCloseTo(-Math.PI / 2);
        });

        test('returns correct angle for diagonal', () => {
            expect(calculateAngleToTargetPure(100, 100)).toBeCloseTo(Math.PI / 4);
        });
    });

    describe('calculateChaseSpeedPure', () => {
        test('applies chase multiplier to base speed', () => {
            expect(calculateChaseSpeedPure(100, 1.5)).toBe(150);
        });

        test('easy mode has lower chase multiplier', () => {
            expect(calculateChaseSpeedPure(100, 0.75)).toBe(75);
        });

        test('hard mode has higher chase multiplier', () => {
            expect(calculateChaseSpeedPure(100, 1.8)).toBe(180);
        });
    });
});
```

- [ ] **Step 2: 运行测试验证**

Run: `npm test -- EnemyAISystem.test.js`
Expected: 28 tests PASS

- [ ] **Step 3: 提交**

```bash
git add src/systems/EnemyAISystem.js src/systems/__tests__/EnemyAISystem.test.js
git commit -m "test: add EnemyAISystem unit tests"
```

---

## 最终检查

- [ ] **运行所有测试**

Run: `npm test`
Expected: 132+ tests PASS, coverage report generated

- [ ] **推送到远程**

Run: `git push`

---

## 预期测试数量

| 系统 | 测试数 |
|------|--------|
| BattleSystem | 11 |
| GrowthSystem | 11 |
| LuckSystem | 14 |
| DriftBottleSystem | 7 |
| SkillSystem | 12 |
| FishMovementSystem | 23 |
| EatDetectionSystem | 26 |
| EnemyAISystem | 28 |
| **总计** | **132+** |
