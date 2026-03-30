# New Enemies System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 new fish types, 2 elite enemies, and 3 boss enemies with TDD approach, achieving 80%+ coverage.

**Architecture:** Enemy system extends via FishFactory for graphics, Enemy.js for AI behaviors, and new BossSystem for boss mechanics. All new enemy types follow existing patterns from `src/entities/Enemy.js` and `src/entities/FishFactory.js`.

**Tech Stack:** Phaser.js 3.x, Jest, ES Modules, TDD

---

## File Structure

- **Modify:** `src/config/fish.json` - Add new enemy type configurations
- **Modify:** `src/entities/FishFactory.js` - Add draw methods for new fish types
- **Modify:** `src/entities/Enemy.js` - Add new AI behavior methods
- **Create:** `src/systems/BossSystem.js` - New boss management system
- **Create:** `src/systems/__tests__/BossSystem.test.js` - Boss system tests
- **Modify:** `src/entities/__tests__/FishFactory.test.js` - Add draw method tests
- **Modify:** `src/systems/__tests__/EnemyAI.test.js` - Add new AI behavior tests
- **Modify:** `src/scenes/GameScene.js` - Integrate boss spawning and 1v1 mechanic

---

## Phase 1: New Fish Types (6 fish)

### Task 1: Add Anglerfish (灯笼鱼)

**Files:**
- Modify: `src/config/fish.json`
- Modify: `src/entities/FishFactory.js`
- Modify: `src/entities/__tests__/FishFactory.test.js`

- [ ] **Step 1: Add anglerfish config to fish.json**

Add to fish.json:
```json
"anglerfish": {
  "hp": 30, "speed": 80, "size": 35, "damage": 10,
  "range": 200, "exp": 15, "behavior": "ranged",
  "color": 0x4B0082, "strongAgainst": [], "weakTo": ["shark"]
}
```

- [ ] **Step 2: Write failing test for drawAnglerfish**

In `FishFactory.test.js`:
```javascript
describe('drawAnglerfish', () => {
    test('draws anglerfish with glowing lure', () => {
        const mockGraphics = createMockGraphics();
        FishFactory.drawAnglerfish(mockGraphics, 35, 0x4B0082, { color: 0x330033 });
        expect(mockGraphics.fillCircle).toHaveBeenCalled(); // Body
        expect(mockGraphics.fillEllipse).toHaveBeenCalled(); // Lure
    });
});
```

- [ ] **Step 3: Run test to verify it fails**
- [ ] **Step 4: Implement drawAnglerfish in FishFactory.js**

```javascript
static drawAnglerfish(graphics, size, color, darkerColor) {
    // Body
    graphics.fillStyle(color, 1);
    graphics.fillEllipse(0, 0, size * 1.5, size);
    // Glowing lure
    graphics.fillStyle(0xFFFF00, 0.8);
    graphics.fillEllipse(size * 0.5, -size * 0.8, size * 0.4, size * 0.3);
    // Eye
    graphics.fillStyle(0x000000, 1);
    graphics.fillCircle(size * 0.4, -size * 0.1, size * 0.12);
}
```

- [ ] **Step 5: Run test to verify it passes**
- [ ] **Step 6: Commit**

---

### Task 2: Add Jellyfish (水母)

**Files:**
- Modify: `src/config/fish.json`
- Modify: `src/entities/FishFactory.js`
- Modify: `src/entities/__tests__/FishFactory.test.js`

- [ ] **Step 1: Add jellyfish config to fish.json**

```json
"jellyfish": {
  "hp": 25, "speed": 50, "size": 40, "damage": 8,
  "aoe": true, "exp": 10, "behavior": "floating",
  "color": 0xADD8E6, "strongAgainst": [], "weakTo": ["shark", "eel"]
}
```

- [ ] **Step 2: Write failing test for drawJellyfish**
- [ ] **Step 3: Run test to verify it fails**
- [ ] **Step 4: Implement drawJellyfish in FishFactory.js**
- [ ] **Step 5: Run test to verify it passes**
- [ ] **Step 6: Commit**

---

### Task 3: Add Seahorse (海马)

**Files:**
- Modify: `src/config/fish.json`
- Modify: `src/entities/FishFactory.js`
- Modify: `src/entities/__tests__/FishFactory.test.js`

- [ ] **Step 1: Add seahorse config to fish.json**

```json
"seahorse": {
  "hp": 20, "speed": 200, "size": 25, "damage": 5,
  "evasive": true, "exp": 12, "behavior": "evasive",
  "color": 0xFFD700, "strongAgainst": [], "weakTo": ["octopus"]
}
```

- [ ] **Step 2: Write failing test for drawSeahorse**
- [ ] **Step 3: Run test to verify it fails**
- [ ] **Step 4: Implement drawSeahorse in FishFactory.js**
- [ ] **Step 5: Run test to verify it passes**
- [ ] **Step 6: Commit**

---

### Task 4: Add Octopus (章鱼)

**Files:**
- Modify: `src/config/fish.json`
- Modify: `src/entities/FishFactory.js`
- Modify: `src/entities/__tests__/FishFactory.test.js`

- [ ] **Step 1: Add octopus config to fish.json**

```json
"octopus": {
  "hp": 50, "speed": 100, "size": 45, "damage": 20,
  "stealth": true, "exp": 20, "behavior": "stealth",
  "color": 0x8B008B, "strongAgainst": ["seahorse"], "weakTo": ["shark", "eel"]
}
```

- [ ] **Step 2: Write failing test for drawOctopus**
- [ ] **Step 3: Run test to verify it fails**
- [ ] **Step 4: Implement drawOctopus in FishFactory.js**
- [ ] **Step 5: Run test to verify it passes**
- [ ] **Step 6: Commit**

---

### Task 5: Add Eel (鳗鱼)

**Files:**
- Modify: `src/config/fish.json`
- Modify: `src/entities/FishFactory.js`
- Modify: `src/entities/__tests__/FishFactory.test.js`

- [ ] **Step 1: Add eel config to fish.json**

```json
"eel": {
  "hp": 40, "speed": 250, "size": 50, "damage": 25,
  "dash": true, "exp": 18, "behavior": "dash",
  "color": 0xFFD700, "strongAgainst": [], "weakTo": ["shark"]
}
```

- [ ] **Step 2: Write failing test for drawEel**
- [ ] **Step 3: Run test to verify it fails**
- [ ] **Step 4: Implement drawEel in FishFactory.js**
- [ ] **Step 5: Run test to verify it passes**
- [ ] **Step 6: Commit**

---

### Task 6: Add Shark AI Behavior Extension

**Files:**
- Modify: `src/entities/Enemy.js`
- Modify: `src/systems/__tests__/EnemyAI.test.js`

- [ ] **Step 1: Write test for shark chase behavior**

```javascript
describe('shark behavior', () => {
    test('shark chases player aggressively', () => {
        const enemy = createEnemyWithBehavior('shark');
        enemy.graphics.x = 100; enemy.graphics.y = 100;
        enemy.scene.player.x = 200; enemy.scene.player.y = 100;
        enemy.update(16);
        expect(enemy.graphics.x).toBeGreaterThan(100);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement shark chase logic in Enemy.js update method**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

## Phase 2: Elite Enemies (2 types)

### Task 7: Add Mutant Shark (变异鲨鱼)

**Files:**
- Modify: `src/config/fish.json`
- Modify: `src/entities/Enemy.js`
- Modify: `src/entities/FishFactory.js`
- Modify: `src/systems/__tests__/EnemyAI.test.js`

- [ ] **Step 1: Add mutant_shark config with elite flag**

```json
"mutant_shark": {
  "hp": 240, "speed": 180, "size": 80, "damage": 30,
  "enrage": true, "elite": true, "exp": 100,
  "behavior": "enrage", "color": 0xFF4444, "strongAgainst": [], "weakTo": []
}
```

- [ ] **Step 2: Write test for enrage mechanic**

```javascript
describe('Mutant Shark enrage', () => {
    test('enrages when hp below 30%', () => {
        const enemy = createEliteEnemy('mutant_shark');
        enemy.maxHp = 100;
        enemy.hp = 20; // 20%
        enemy.update(16);
        expect(enemy.speedMultiplier).toBe(2);
    });
});
```

- [ ] **Step 3: Run test to verify it fails**
- [ ] **Step 4: Implement enrage logic in Enemy.js**
- [ ] **Step 5: Run test to verify it passes**
- [ ] **Step 6: Write test and implement drawMutantShark with red glow effect**
- [ ] **Step 7: Commit**

---

### Task 8: Add Giant Jellyfish (巨型水母)

**Files:**
- Modify: `src/config/fish.json`
- Modify: `src/entities/Enemy.js`
- Modify: `src/entities/FishFactory.js`
- Modify: `src/systems/__tests__/EnemyAI.test.js`

- [ ] **Step 1: Add giant_jellyfish config**

```json
"giant_jellyfish": {
  "hp": 150, "speed": 60, "size": 120, "damage": 15,
  "chain_lightning": true, "elite": true, "exp": 120,
  "behavior": "chain_lightning", "color": 0x00FFFF, "strongAgainst": [], "weakTo": []
}
```

- [ ] **Step 2: Write test for chain lightning mechanic**

```javascript
describe('Giant Jellyfish chain lightning', () => {
    test('chain lightning damages nearby players', () => {
        const enemy = createEliteEnemy('giant_jellyfish');
        enemy.scene.player = { x: 100, y: 100, takeDamage: jest.fn() };
        enemy.scene.getChildren = () => [enemy.scene.player];
        enemy.executeChainLightning();
        expect(enemy.scene.player.takeDamage).toHaveBeenCalled();
    });
});
```

- [ ] **Step 3: Run test to verify it fails**
- [ ] **Step 4: Implement chain lightning in Enemy.js**
- [ ] **Step 5: Run test to verify it passes**
- [ ] **Step 6: Write test and implement drawGiantJellyfish with glow effect**
- [ ] **Step 7: Commit**

---

## Phase 3: Boss System

### Task 9: Create BossSystem

**Files:**
- Create: `src/systems/BossSystem.js`
- Create: `src/systems/__tests__/BossSystem.test.js`

- [ ] **Step 1: Write failing test for BossSystem**

```javascript
import { BossSystem } from '../BossSystem.js';

describe('BossSystem', () => {
    let bossSystem;
    let mockScene;

    beforeEach(() => {
        mockScene = {
            level: 5,
            enemies: [],
            physics: { moveTo: jest.fn() },
            time: { now: 1000 }
        };
        bossSystem = new BossSystem(mockScene);
    });

    test('calculates boss HP with level scaling', () => {
        const bossConfig = { baseHp: 100, hpPerLevel: 100 };
        const hp = bossSystem.calculateBossHp(bossConfig, 5);
        expect(hp).toBe(600); // 100 + 5*100
    });

    test('triggers 1v1 mode when boss spawns', () => {
        const mockEnemy = { graphics: { x: 400, y: 400 }, destroy: jest.fn() };
        bossSystem.triggerBossFight(mockEnemy);
        expect(bossSystem.inBossFight).toBe(true);
    });

    test('other enemies flee when boss appears', () => {
        const otherEnemy = { flee: jest.fn() };
        mockScene.enemies = [otherEnemy];
        bossSystem.triggerBossFight({});
        expect(otherEnemy.flee).toHaveBeenCalled();
    });

    test('ends boss fight and resumes normal spawning', () => {
        bossSystem.endBossFight();
        expect(bossSystem.inBossFight).toBe(false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement BossSystem.js**

```javascript
export class BossSystem {
    constructor(scene) {
        this.scene = scene;
        this.currentBoss = null;
        this.inBossFight = false;
        this.bossConfig = null;
    }

    calculateBossHp(config, playerLevel) {
        return config.baseHp + (playerLevel * config.hpPerLevel);
    }

    triggerBossFight(boss) {
        this.currentBoss = boss;
        this.inBossFight = true;
        // Make other enemies flee
        this.scene.enemies.forEach(enemy => {
            if (enemy !== boss && enemy.flee) {
                enemy.flee();
            }
        });
    }

    endBossFight() {
        this.currentBoss = null;
        this.inBossFight = false;
    }

    isBossActive() {
        return this.currentBoss !== null && this.currentBoss.hp > 0;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

### Task 10: Add Boss Drawing Methods

**Files:**
- Modify: `src/entities/FishFactory.js`
- Modify: `src/entities/__tests__/FishFactory.test.js`

- [ ] **Step 1: Write tests for boss draw methods**

```javascript
describe('drawBossSquid', () => {
    test('draws giant squid with tentacles', () => {
        const mockGraphics = createMockGraphics();
        FishFactory.drawBossSquid(mockGraphics, 200, 0x8B0000, { color: 0x4B0000 });
        expect(mockGraphics.fillEllipse).toHaveBeenCalled();
        expect(mockGraphics.fillTriangle).toHaveBeenCalled(); // Tentacles
    });
});

describe('drawBossSharkKing', () => {
    test('draws shark king with crown', () => {
        const mockGraphics = createMockGraphics();
        FishFactory.drawBossSharkKing(mockGraphics, 250, 0xFFFFFF, { color: 0xCCCCCC });
        expect(mockGraphics.fillEllipse).toHaveBeenCalled(); // Body
        expect(mockGraphics.fillTriangle).toHaveBeenCalled(); // Crown
    });
});

describe('drawBossSeaDragon', () => {
    test('draws sea dragon with scales', () => {
        const mockGraphics = createMockGraphics();
        FishFactory.drawBossSeaDragon(mockGraphics, 300, 0x000080, { color: 0x000050 });
        expect(mockGraphics.fillEllipse).toHaveBeenCalled();
        expect(mockGraphics.fillTriangle).toHaveBeenCalled(); // Spikes
    });
});
```

- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement all three boss draw methods**
- [ ] **Step 4: Run tests to verify they pass**
- [ ] **Step 5: Commit**

---

### Task 11: Add Boss Enemy Classes

**Files:**
- Create: `src/entities/BossEnemy.js`
- Create: `src/entities/__tests__/BossEnemy.test.js`
- Modify: `src/config/fish.json`

- [ ] **Step 1: Write test for BossEnemy phase transitions**

```javascript
describe('BossEnemy', () => {
    test('transitions to next phase at correct HP threshold', () => {
        const boss = new BossEnemy(mockScene, 'boss_squid', 1000, 2);
        boss.takeDamage(501); // 50% HP
        expect(boss.phase).toBe(2);
    });

    test('uses correct skill for current phase', () => {
        const boss = new BossEnemy(mockScene, 'boss_shark_king', 1500, 3);
        boss.phase = 1;
        expect(boss.getCurrentSkill()).toBe('dash');
        boss.phase = 2;
        expect(boss.getCurrentSkill()).toBe('summon');
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement BossEnemy class with phase system**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

## Phase 4: Visual Effects

### Task 12: Add Elite Enemy Glow Effect

**Files:**
- Modify: `src/entities/FishFactory.js`
- Modify: `src/entities/__tests__/FishFactory.test.js`

- [ ] **Step 1: Write test for glow effect on elite enemies**
- [ ] **Step 2: Implement eliteGlow method in FishFactory.js**
- [ ] **Step 3: Run tests to verify it passes**
- [ ] **Step 4: Commit**

---

### Task 13: Add Boss Entrance Animation

**Files:**
- Create: `src/systems/BossAnimation.js`
- Create: `src/systems/__tests__/BossAnimation.test.js`

- [ ] **Step 1: Write test for boss entrance animation**

```javascript
describe('BossAnimation', () => {
    test('boss rises from bottom with screen shake', () => {
        const mockBoss = { graphics: { setPosition: jest.fn() }, setTint: jest.fn() };
        const animation = new BossAnimation(mockBoss, 'rise_from_bottom', 2000);
        animation.play();
        expect(mockBoss.graphics.setPosition).toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement BossAnimation.js with rise, charge, and shake effects**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

---

## Phase 5: GameScene Integration

### Task 14: Integrate Boss Spawning

**Files:**
- Modify: `src/scenes/GameScene.js`
- Modify: `src/systems/__tests__/BossSystem.test.js`

- [ ] **Step 1: Add BossSystem instance to GameScene**

```javascript
// In GameScene constructor
this.bossSystem = new BossSystem(this);
this.bossSystem.onBossDefeated.add(() => this.onBossDefeated());
```

- [ ] **Step 2: Add level check for boss triggering**

```javascript
// In spawnFish or onLevelUp
checkBossSpawn() {
    const level = this.growthSystem.getLevel();
    if (level === 5 && !this.bossDefeated.squid) this.spawnBoss('boss_squid');
    if (level === 10 && !this.bossDefeated.sharkKing) this.spawnBoss('boss_shark_king');
    if (level === 15 && !this.bossDefeated.seaDragon) this.spawnBoss('boss_sea_dragon');
}
```

- [ ] **Step 3: Implement spawnBoss method with 1v1 mechanic**

```javascript
spawnBoss(type) {
    // Disable normal enemy spawning
    this.bossSystem.triggerBossFight(boss);
    // Create boss at screen center
    const boss = new BossEnemy(this, type, x, y);
    // Play entrance animation
}
```

- [ ] **Step 4: Implement boss defeat callback to resume normal gameplay**
- [ ] **Step 5: Run tests to verify integration**
- [ ] **Step 6: Commit**

---

## Test Helper Functions

Reference these helpers from `src/systems/__tests__/EnemyAI.test.js`:

```javascript
// In EnemyAI.test.js - use existing helper
function createEnemyWithBehavior(type) {
    const mockScene = {
        physics: { moveTo: jest.fn() },
        enemies: [],
        player: { x: 200, y: 200 }
    };
    return new Enemy(mockScene, 100, 100, { behavior: type }, type, 1);
}

function createEliteEnemy(type) {
    return createEnemyWithBehavior(type);
}
```

---

## Verification

After all tasks:

```bash
cd /Users/yuefengjiang/AI/fish_eat
npm test -- --coverage
```

**Expected Coverage:**
| File | Funcs % |
|------|---------|
| Enemy.js | > 85% |
| FishFactory.js | > 90% |
| BossSystem.js | > 80% |
| BossEnemy.js | > 80% |
| BossAnimation.js | > 80% |

**Coverage for AI Behaviors:**
- Shark chase: tested
- Seahorse evasive: tested
- Octopus stealth: tested
- Eel dash: tested
- Mutant shark enrage: tested
- Giant jellyfish chain lightning: tested

**Total Tests:** ~60+ new tests

---

## Notes

- Follow existing test patterns from `src/systems/__tests__/EnemyAI.test.js`
- Use method borrowing pattern for Enemy.js prototype testing
- Mock Phaser graphics with jest.fn() returning mock objects
- Each fish type needs: config, draw method, AI behavior, tests
