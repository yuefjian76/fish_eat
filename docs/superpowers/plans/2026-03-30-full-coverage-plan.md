# Full Test Coverage Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve test coverage to 80%+ for 7 modules using TDD approach.

**Architecture:** Extract pure functions where possible, mock Phaser only where necessary. Each module gets comprehensive unit tests in `src/systems/__tests__/` or `src/entities/__tests__/`.

**Tech Stack:** Jest, ES Modules, Phaser mocks

---

## File Structure

```
src/systems/__tests__/
├── LuckSystem.test.js          (NEW)
├── GrowthSystem.test.js        (NEW)
├── DriftBottleSystem.test.js    (NEW)
├── SkillSystem.test.js         (NEW - extend existing)
├── DebugLogger.test.js          (NEW - extend existing)

src/entities/__tests__/
├── FishFactory.test.js         (NEW)
├── TreasureBox.test.js          (NEW)
```

---

## Task 1: LuckSystem Tests

**Files:**
- Create: `src/systems/__tests__/LuckSystem.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
import { LuckSystem } from '../LuckSystem.js';

describe('LuckSystem', () => {
    let luckSystem;

    beforeEach(() => {
        luckSystem = new LuckSystem(0);
    });

    describe('constructor', () => {
        test('initializes with given luck value', () => {
            const system = new LuckSystem(10);
            expect(system.getLuck()).toBe(10);
        });

        test('defaults to 0 luck', () => {
            const system = new LuckSystem();
            expect(system.getLuck()).toBe(0);
        });
    });

    describe('getLuck', () => {
        test('returns current luck', () => {
            luckSystem.luck = 25;
            expect(luckSystem.getLuck()).toBe(25);
        });
    });

    describe('addLuck', () => {
        test('adds to luck and returns new value', () => {
            expect(luckSystem.addLuck(5)).toBe(5);
            expect(luckSystem.getLuck()).toBe(5);
        });

        test('handles negative amounts', () => {
            luckSystem.luck = 10;
            expect(luckSystem.addLuck(-3)).toBe(7);
        });
    });

    describe('setLuck', () => {
        test('sets luck to specific value', () => {
            luckSystem.setLuck(50);
            expect(luckSystem.getLuck()).toBe(50);
        });
    });

    describe('reset', () => {
        test('resets luck to base value', () => {
            luckSystem.luck = 25;
            luckSystem.baseLuck = 10;
            luckSystem.reset();
            expect(luckSystem.getLuck()).toBe(10);
        });
    });

    describe('calculateGoodChance', () => {
        test('returns base chance when luck is 0', () => {
            const chance = luckSystem.calculateGoodChance(50, {});
            expect(chance).toBe(50);
        });

        test('increases chance with positive luck', () => {
            luckSystem.luck = 10;
            const chance = luckSystem.calculateGoodChance(50, {});
            // luckBonus = 10 * 2 = 20
            expect(chance).toBe(70);
        });

        test('caps at 95', () => {
            luckSystem.luck = 50;
            const chance = luckSystem.calculateGoodChance(50, {});
            expect(chance).toBe(95);
        });

        test('floors at 5', () => {
            luckSystem.luck = -30;
            const chance = luckSystem.calculateGoodChance(50, {});
            expect(chance).toBe(5);
        });
    });

    describe('modifyWeight', () => {
        test('increases good effect weight with luck', () => {
            luckSystem.luck = 10;
            const result = luckSystem.modifyWeight(10, true, { goodBonusPerLuck: 0.5 });
            // bonus = 10 * 0.5 = 5
            expect(result).toBe(15);
        });

        test('decreases bad effect weight with luck', () => {
            luckSystem.luck = 10;
            const result = luckSystem.modifyWeight(10, false, { badReductionPerLuck: 0.3 });
            // reduction = 10 * 0.3 = 3
            expect(result).toBe(7);
        });

        test('minimum weight is 1', () => {
            luckSystem.luck = 100;
            const result = luckSystem.modifyWeight(5, false, { badReductionPerLuck: 1 });
            // Would be 5 - 100 = -95, but min is 1
            expect(result).toBe(1);
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="LuckSystem" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/LuckSystem.test.js
git commit -m "test: add LuckSystem unit tests"
```

---

## Task 2: GrowthSystem Tests

**Files:**
- Create: `src/systems/__tests__/GrowthSystem.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
import { GrowthSystem } from '../GrowthSystem.js';

describe('GrowthSystem', () => {
    let growthSystem;
    const mockLevelsData = {
        experienceTable: [0, 100, 250, 500, 1000],
        skillUnlocks: { bite: 1, shield: 2, speedUp: 3, heal: 5 },
        combo: { timeWindow: 5, bonusMultiplier: 0.1 }
    };

    beforeEach(() => {
        growthSystem = new GrowthSystem(mockLevelsData);
    });

    describe('constructor', () => {
        test('initializes with level 1', () => {
            expect(growthSystem.getLevel()).toBe(1);
        });

        test('initializes with 0 exp', () => {
            expect(growthSystem.getExp()).toBe(0);
        });

        test('initializes with 0 combo', () => {
            expect(growthSystem.getComboCount()).toBe(0);
        });

        test('unlocks level 1 skills', () => {
            expect(growthSystem.isSkillUnlocked('bite')).toBe(true);
        });
    });

    describe('getExpForLevel', () => {
        test('returns exp for level 1', () => {
            expect(growthSystem.getExpForLevel(1)).toBe(0);
        });

        test('returns exp for level 2', () => {
            expect(growthSystem.getExpForLevel(2)).toBe(100);
        });

        test('returns last exp for out of bounds level', () => {
            expect(growthSystem.getExpForLevel(100)).toBe(1000);
        });
    });

    describe('getMaxLevel', () => {
        test('returns experience table length', () => {
            expect(growthSystem.getMaxLevel()).toBe(5);
        });
    });

    describe('addExperience', () => {
        test('adds base exp', () => {
            growthSystem.addExperience(50, 1000, null);
            expect(growthSystem.getExp()).toBe(50);
        });

        test('does not trigger combo on first kill', () => {
            const result = growthSystem.addExperience(50, 1000, null);
            expect(result.comboCount).toBe(0);
        });

        test('increases combo on rapid kills', () => {
            growthSystem.addExperience(50, 1000, null);
            const result = growthSystem.addExperience(50, 2000, null); // 1 second later
            expect(result.comboCount).toBe(1);
        });

        test('resets combo if time window exceeded', () => {
            growthSystem.addExperience(50, 1000, null);
            growthSystem.addExperience(50, 7000, null); // 6 seconds later (> 5s window)
            const result = growthSystem.addExperience(50, 8000, null);
            expect(result.comboCount).toBe(0);
        });

        test('returns combo multiplier', () => {
            growthSystem.addExperience(50, 1000, null);
            const result = growthSystem.addExperience(50, 2000, null);
            // comboMultiplier = 1 + (1 * 0.1) = 1.1
            expect(result.comboMultiplier).toBeCloseTo(1.1);
        });
    });

    describe('checkLevelUp', () => {
        test('returns false when not enough exp', () => {
            growthSystem.addExperience(50, 1000, null);
            expect(growthSystem.checkLevelUp()).toBe(false);
        });

        test('levels up when enough exp', () => {
            growthSystem.currentExp = 100; // Enough for level 2
            growthSystem.checkLevelUp();
            expect(growthSystem.getLevel()).toBe(2);
        });

        test('returns true when leveling up', () => {
            growthSystem.currentExp = 100;
            expect(growthSystem.checkLevelUp()).toBe(true);
        });
    });

    describe('isSkillUnlocked', () => {
        test('returns true for unlocked skill', () => {
            expect(growthSystem.isSkillUnlocked('bite')).toBe(true);
        });

        test('returns false for locked skill', () => {
            expect(growthSystem.isSkillUnlocked('heal')).toBe(false);
        });
    });

    describe('getUnlockedSkills', () => {
        test('returns array of unlocked skills', () => {
            const skills = growthSystem.getUnlockedSkills();
            expect(skills).toContain('bite');
            expect(skills).not.toContain('heal');
        });
    });

    describe('getLevelProgress', () => {
        test('returns 0 at start of level', () => {
            expect(growthSystem.getLevelProgress()).toBe(0);
        });

        test('returns progress between 0 and 1', () => {
            growthSystem.currentExp = 50; // 50% to level 2 (100)
            expect(growthSystem.getLevelProgress()).toBe(0.5);
        });
    });

    describe('getExpToNextLevel', () => {
        test('returns exp needed for next level', () => {
            growthSystem.currentExp = 50;
            expect(growthSystem.getExpToNextLevel()).toBe(50);
        });
    });

    describe('reset', () => {
        test('resets all values', () => {
            growthSystem.currentExp = 500;
            growthSystem.currentLevel = 3;
            growthSystem.reset();
            expect(growthSystem.getExp()).toBe(0);
            expect(growthSystem.getLevel()).toBe(1);
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="GrowthSystem" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/GrowthSystem.test.js
git commit -m "test: add GrowthSystem unit tests"
```

---

## Task 3: DriftBottleSystem Tests

**Files:**
- Create: `src/systems/__tests__/DriftBottleSystem.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
import { DriftBottleSystem } from '../DriftBottleSystem.js';
import { LuckSystem } from '../LuckSystem.js';

describe('DriftBottleSystem', () => {
    let driftBottleSystem;
    const mockDriftBottleData = {
        effects: [
            { id: 'full_health', name: 'Full Health', type: 'instant', good: true, weight: 10 },
            { id: 'double_coins', name: '2x Coins', type: 'buff', good: true, weight: 5, duration: 30000 },
            { id: 'speed_down', name: 'Slow', type: 'debuff', good: false, weight: 3, duration: 10000 }
        ],
        luckInfluence: {
            baseGoodChance: 70,
            goodBonusPerLuck: 2,
            badReductionPerLuck: 1
        }
    };

    beforeEach(() => {
        driftBottleSystem = new DriftBottleSystem(mockDriftBottleData);
    });

    describe('constructor', () => {
        test('initializes with luck system', () => {
            expect(driftBottleSystem.luckSystem).toBeDefined();
            expect(driftBottleSystem.luckSystem instanceof LuckSystem).toBe(true);
        });

        test('initializes with double coins inactive', () => {
            expect(driftBottleSystem.isDoubleCoinsActive()).toBe(false);
        });

        test('initializes with cooldown accel inactive', () => {
            expect(driftBottleSystem.isCooldownAccelActive()).toBe(false);
        });
    });

    describe('setLuckSystem', () => {
        test('sets external luck system', () => {
            const externalLuck = new LuckSystem(10);
            driftBottleSystem.setLuckSystem(externalLuck);
            expect(driftBottleSystem.luckSystem).toBe(externalLuck);
        });
    });

    describe('isDoubleCoinsActive', () => {
        test('returns false initially', () => {
            expect(driftBottleSystem.isDoubleCoinsActive()).toBe(false);
        });
    });

    describe('isCooldownAccelActive', () => {
        test('returns false initially', () => {
            expect(driftBottleSystem.isCooldownAccelActive()).toBe(false);
        });
    });

    describe('getCooldownMultiplier', () => {
        test('returns 1 when not active', () => {
            expect(driftBottleSystem.getCooldownMultiplier()).toBe(1);
        });

        test('returns 0.5 when active', () => {
            driftBottleSystem.cooldownAccelActive = true;
            expect(driftBottleSystem.getCooldownMultiplier()).toBe(0.5);
        });
    });

    describe('reset', () => {
        test('resets luck system', () => {
            driftBottleSystem.luckSystem.luck = 20;
            driftBottleSystem.reset();
            expect(driftBottleSystem.luckSystem.getLuck()).toBe(0);
        });

        test('clears active effects', () => {
            driftBottleSystem.doubleCoinsActive = true;
            driftBottleSystem.reset();
            expect(driftBottleSystem.doubleCoinsActive).toBe(false);
        });
    });

    describe('selectEffect', () => {
        test('selects from good effects when luck is high', () => {
            driftBottleSystem.luckSystem.setLuck(20); // High luck
            // With luck 20, good chance = min(95, 70 + 20*2) = 95
            const effect = driftBottleSystem.selectEffect();
            expect(effect.good).toBe(true);
        });

        test('selects from bad effects when luck is very low', () => {
            driftBottleSystem.luckSystem.setLuck(-30);
            // With luck -30, good chance = max(5, 70 - 60) = 5
            const effect = driftBottleSystem.selectEffect();
            expect(effect.good).toBe(false);
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="DriftBottleSystem" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/DriftBottleSystem.test.js
git commit -m "test: add DriftBottleSystem unit tests"
```

---

## Task 4: SkillSystem Tests

**Files:**
- Create: `src/systems/__tests__/SkillSystem.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
import { SkillSystem } from '../SkillSystem.js';

describe('SkillSystem', () => {
    let skillSystem;
    const mockSkillsData = {
        bite: { key: 'Q', name: 'Bite', type: 'damage', cooldown: 0.5, unlockLevel: 1 },
        shield: { key: 'W', name: 'Shield', type: 'defense', cooldown: 15, unlockLevel: 2 },
        speedUp: { key: 'E', name: 'Speed Up', type: 'buff', cooldown: 20, unlockLevel: 3 },
        heal: { key: 'R', name: 'Heal', type: 'heal', cooldown: 30, unlockLevel: 5 }
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
            const result = skillSystem.useSkill('W'); // shield requires level 2
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
            const result = skillSystem.useSkill('Q');
            expect(result.success).toBe(true);
        });

        test('starts cooldown after successful use', () => {
            skillSystem.useSkill('Q');
            expect(skillSystem.cooldowns.bite).toBe(0.5);
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
    });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="SkillSystem" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/SkillSystem.test.js
git commit -m "test: add SkillSystem unit tests"
```

---

## Task 5: FishFactory Tests

**Files:**
- Create: `src/entities/__tests__/FishFactory.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
import { FishFactory } from '../../entities/FishFactory.js';

describe('FishFactory', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                graphics: jest.fn(() => ({
                    fillStyle: jest.fn().mockReturnThis(),
                    fillEllipse: jest.fn().mockReturnThis(),
                    fillTriangle: jest.fn().mockReturnThis(),
                    fillRect: jest.fn().mockReturnThis(),
                    fillCircle: jest.fn().mockReturnThis(),
                    lineStyle: jest.fn().mockReturnThis(),
                    beginPath: jest.fn().mockReturnThis(),
                    moveTo: jest.fn().mockReturnThis(),
                    lineTo: jest.fn().mockReturnThis(),
                    arc: jest.fn().mockReturnThis(),
                    strokePath: jest.fn().mockReturnThis(),
                    closePath: jest.fn().mockReturnThis(),
                    fillPath: jest.fn().mockReturnThis()
                }))
            }
        };
    });

    describe('createFish', () => {
        test('creates clownfish with correct graphics', () => {
            const graphics = FishFactory.createFish(mockScene, 'clownfish', 30, 0xFF6B6B);
            expect(graphics).toBeDefined();
            expect(mockScene.add.graphics).toHaveBeenCalled();
        });

        test('creates shrimp with correct graphics', () => {
            const graphics = FishFactory.createFish(mockScene, 'shrimp', 20, 0xFF6B6B);
            expect(graphics).toBeDefined();
        });

        test('creates shark with correct graphics', () => {
            const graphics = FishFactory.createFish(mockScene, 'shark', 50, 0x888888);
            expect(graphics).toBeDefined();
        });

        test('creates default fish for unknown type', () => {
            const graphics = FishFactory.createFish(mockScene, 'unknown', 30, 0xFF6B6B);
            expect(graphics).toBeDefined();
        });
    });

    describe('drawClownfish', () => {
        test('draws clownfish shape', () => {
            const mockGraphics = {
                fillStyle: jest.fn().mockReturnThis(),
                fillEllipse: jest.fn().mockReturnThis(),
                fillTriangle: jest.fn().mockReturnThis(),
                fillRect: jest.fn().mockReturnThis(),
                fillCircle: jest.fn().mockReturnThis()
            };
            FishFactory.drawClownfish(mockGraphics, 30, 0xFF6B6B, { color: 0xCC5555 });
            expect(mockGraphics.fillEllipse).toHaveBeenCalled();
        });
    });

    describe('drawShrimp', () => {
        test('draws shrimp shape', () => {
            const mockGraphics = {
                fillStyle: jest.fn().mockReturnThis(),
                fillCircle: jest.fn().mockReturnThis(),
                fillTriangle: jest.fn().mockReturnThis(),
                lineStyle: jest.fn().mockReturnThis(),
                lineBetween: jest.fn().mockReturnThis()
            };
            FishFactory.drawShrimp(mockGraphics, 20, 0xFF6B6B, { color: 0xCC5555 });
            expect(mockGraphics.fillCircle).toHaveBeenCalled();
        });
    });

    describe('drawShark', () => {
        test('draws shark shape', () => {
            const mockGraphics = {
                fillStyle: jest.fn().mockReturnThis(),
                fillEllipse: jest.fn().mockReturnThis(),
                fillTriangle: jest.fn().mockReturnThis(),
                lineStyle: jest.fn().mockReturnThis(),
                beginPath: jest.fn().mockReturnThis(),
                moveTo: jest.fn().mockReturnThis(),
                lineTo: jest.fn().mockReturnThis(),
                strokePath: jest.fn().mockReturnThis()
            };
            FishFactory.drawShark(mockGraphics, 50, 0x888888, { color: 0x666666 });
            expect(mockGraphics.fillEllipse).toHaveBeenCalled();
        });
    });

    describe('drawDefaultFish', () => {
        test('draws default fish shape', () => {
            const mockGraphics = {
                fillStyle: jest.fn().mockReturnThis(),
                fillEllipse: jest.fn().mockReturnThis(),
                fillTriangle: jest.fn().mockReturnThis(),
                fillCircle: jest.fn().mockReturnThis()
            };
            FishFactory.drawDefaultFish(mockGraphics, 30, 0xFF6B6B, { color: 0xCC5555 });
            expect(mockGraphics.fillEllipse).toHaveBeenCalled();
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="FishFactory" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/entities/__tests__/FishFactory.test.js
git commit -m "test: add FishFactory unit tests"
```

---

## Task 6: TreasureBox Tests

**Files:**
- Create: `src/entities/__tests__/TreasureBox.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
import { TreasureBox } from '../../entities/TreasureBox.js';

describe('TreasureBox', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                graphics: jest.fn(() => ({
                    fillStyle: jest.fn().mockReturnThis(),
                    fillCircle: jest.fn().mockReturnThis(),
                    fillRect: jest.fn().mockReturnThis(),
                    lineStyle: jest.fn().mockReturnThis(),
                    strokeRect: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis(),
                    setOrigin: jest.fn().mockReturnThis()
                })),
                text: jest.fn(() => ({
                    setOrigin: jest.fn().mockReturnThis(),
                    setDepth: jest.fn().mockReturnThis()
                }))
            },
            physics: {
                world: { enable: jest.fn() }
            },
            tweens: {
                add: jest.fn()
            },
            treasureBoxes: { add: jest.fn() }
        };
    });

    describe('TYPE enum', () => {
        test('has COIN type', () => {
            expect(TreasureBox.TYPE.COIN).toBe('coin');
        });

        test('has POTION type', () => {
            expect(TreasureBox.TYPE.POTION).toBe('potion');
        });

        test('has SKILL_FRAGMENT type', () => {
            expect(TreasureBox.TYPE.SKILL_FRAGMENT).toBe('skillFragment');
        });

        test('has EXP type', () => {
            expect(TreasureBox.TYPE.EXP).toBe('exp');
        });

        test('has COOLDOWN_REDUCTION type', () => {
            expect(TreasureBox.TYPE.COOLDOWN_REDUCTION).toBe('cooldownReduction');
        });

        test('has INVINCIBILITY type', () => {
            expect(TreasureBox.TYPE.INVINCIBILITY).toBe('invincibility');
        });

        test('has TELEPORT type', () => {
            expect(TreasureBox.TYPE.TELEPORT).toBe('teleport');
        });

        test('has DOUBLE_REWARDS type', () => {
            expect(TreasureBox.TYPE.DOUBLE_REWARDS).toBe('doubleRewards');
        });
    });

    describe('constructor', () => {
        test('creates treasure box at given position', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            expect(box.x).toBe(100);
            expect(box.y).toBe(200);
        });

        test('stores reward type and amount', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.EXP, 100);
            expect(box.rewardType).toBe('exp');
            expect(box.rewardAmount).toBe(100);
        });

        test('initializes as not collected', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            expect(box.isCollected).toBe(false);
        });

        test('enables physics on graphics', () => {
            new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            expect(mockScene.physics.world.enable).toHaveBeenCalled();
        });
    });

    describe('collect', () => {
        test('marks box as collected', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            const mockPlayer = { x: 100, y: 200 };
            box.collect(mockPlayer);
            expect(box.isCollected).toBe(true);
        });

        test('stops float tween on collect', () => {
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            box.floatTween = { stop: jest.fn() };
            const mockPlayer = { x: 100, y: 200 };
            box.collect(mockPlayer);
            expect(box.floatTween.stop).toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        test('destroys graphics', () => {
            const mockGraphics = { destroy: jest.fn() };
            const mockGlow = { destroy: jest.fn() };
            const box = new TreasureBox(mockScene, 100, 200, TreasureBox.TYPE.COIN, 50);
            box.graphics = mockGraphics;
            box.glowGraphics = mockGlow;
            box.destroy();
            expect(mockGraphics.destroy).toHaveBeenCalled();
            expect(mockGlow.destroy).toHaveBeenCalled();
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="TreasureBox" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/entities/__tests__/TreasureBox.test.js
git commit -m "test: add TreasureBox unit tests"
```

---

## Task 7: DebugLogger Tests (extend existing)

**Files:**
- Modify: `src/systems/__tests__/DebugLogger.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
import { DebugLogger } from '../DebugLogger.js';

describe('DebugLogger', () => {
    let logger;

    beforeEach(() => {
        // Reset singleton
        DebugLogger._instance = null;
        logger = DebugLogger.getInstance();
        logger.setLevel(DebugLogger.LEVEL.DEBUG);
    });

    describe('getInstance', () => {
        test('returns singleton instance', () => {
            const instance1 = DebugLogger.getInstance();
            const instance2 = DebugLogger.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('setLevel', () => {
        test('sets the log level', () => {
            logger.setLevel(DebugLogger.LEVEL.WARN);
            expect(logger._level).toBe(DebugLogger.LEVEL.WARN);
        });
    });

    describe('getLevelName', () => {
        test('returns DEBUG for DEBUG level', () => {
            logger.setLevel(DebugLogger.LEVEL.DEBUG);
            expect(logger.getLevelName()).toBe('DEBUG');
        });

        test('returns INFO for INFO level', () => {
            logger.setLevel(DebugLogger.LEVEL.INFO);
            expect(logger.getLevelName()).toBe('INFO');
        });

        test('returns WARN for WARN level', () => {
            logger.setLevel(DebugLogger.LEVEL.WARN);
            expect(logger.getLevelName()).toBe('WARN');
        });

        test('returns ERROR for ERROR level', () => {
            logger.setLevel(DebugLogger.LEVEL.ERROR);
            expect(logger.getLevelName()).toBe('ERROR');
        });
    });

    describe('_format', () => {
        test('formats message with timestamp and level', () => {
            const formatted = logger._format(DebugLogger.LEVEL.INFO, 'Test message');
            expect(formatted).toContain('Test message');
            expect(formatted).toContain('INFO');
        });
    });

    describe('LEVEL enum', () => {
        test('has correct values', () => {
            expect(DebugLogger.LEVEL.DEBUG).toBe(0);
            expect(DebugLogger.LEVEL.INFO).toBe(1);
            expect(DebugLogger.LEVEL.WARN).toBe(2);
            expect(DebugLogger.LEVEL.ERROR).toBe(3);
        });
    });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npm test -- --testPathPattern="DebugLogger" -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/systems/__tests__/DebugLogger.test.js
git commit -m "test: add DebugLogger unit tests"
```

---

## Task 8: Final Coverage Verification

- [ ] **Step 1: Run full test suite with coverage**

Run: `npm test -- --coverage`
Expected:
- LuckSystem.js > 80%
- GrowthSystem.js > 80%
- DriftBottleSystem.js > 80%
- SkillSystem.js > 80%
- FishFactory.js > 80%
- TreasureBox.js > 80%
- DebugLogger.js > 80%

- [ ] **Step 2: If any module below 80%, add more tests per the spec**

---

## Expected Results

| Module | Target | Tests Added |
|--------|--------|-------------|
| LuckSystem.js | 80%+ | ~12 tests |
| GrowthSystem.js | 80%+ | ~15 tests |
| DriftBottleSystem.js | 80%+ | ~10 tests |
| SkillSystem.js | 80%+ | ~12 tests |
| FishFactory.js | 80%+ | ~8 tests |
| TreasureBox.js | 80%+ | ~15 tests |
| DebugLogger.js | 80%+ | ~8 tests |

**Total new tests:** ~80 tests
