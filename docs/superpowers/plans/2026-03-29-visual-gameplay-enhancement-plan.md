# 鱼吃鱼 - 视觉与玩法全面增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现视觉美化、技能解锁、PK增强、敌人AI改进

**Architecture:**
- 新建 BackgroundSystem 管理程序化生成的海底装饰（气泡、珊瑚、海藻）
- 修改 TreasureBox/FishFactory 使用更精美的几何绘制
- 技能系统增加 unlockLevel 字段控制可用性
- 战斗系统增加等级加成公式
- 敌人AI增加 FISHING/FLEEING 状态

**Tech Stack:** Phaser.js 3.x, JavaScript ES6+, Jest (TDD)

---

## 文件结构

```
src/
├── systems/
│   ├── BackgroundSystem.js         # 新增：背景装饰系统
│   ├── BackgroundSystem.test.js    # 新增：背景系统测试 (在 src/systems/__tests__/)
│   └── __tests__/
│       ├── TreasureBoxVisual.test.js  # 新增：宝箱视觉测试
│       ├── FishFactory.test.js         # 新增：鱼工厂测试
│       ├── SkillLock.test.js           # 新增：技能锁定测试
│       ├── BattleScaling.test.js       # 新增：战斗等级加成测试
│       └── EnemyAI.test.js             # 新增：敌人AI测试
├── entities/
│   ├── TreasureBox.js             # 修改：精美宝箱造型
│   └── Enemy.js                   # 修改：敌人AI新状态
├── scenes/
│   └── GameScene.js               # 修改：集成新系统 + 敌人等级分布
└── config/
    └── skills.json                # 修改：添加 unlockLevel + speedMultiplier
```

---

## 任务 1: BackgroundSystem - 海底背景装饰

**Files:**
- Create: `src/systems/BackgroundSystem.js`
- Test: `src/systems/BackgroundSystem.test.js`

- [ ] **Step 1: 写测试文件**

```javascript
// src/systems/BackgroundSystem.test.js
import { BackgroundSystem } from '../BackgroundSystem.js';

describe('BackgroundSystem', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: { graphics: jest.fn(() => ({ setDepth: jest.fn() })) },
            time: { addEvent: jest.fn() },
            tweens: { add: jest.fn() }
        };
    });

    describe('createBubbles', () => {
        test('creates correct number of bubbles', () => {
            const system = new BackgroundSystem(mockScene);
            system.createBubbles(5);
            // Should track bubble count
        });
    });

    describe('bubble animation', () => {
        test('bubbles rise and despawn at top', () => {
            // Bubble at y=700 should move to y<0 and despawn
        });
    });

    describe('createCoral', () => {
        test('creates coral at specified position', () => {
            // Should draw coral graphics at x, y
        });
    });

    describe('createSeaweed', () => {
        test('creates seaweed with sway animation', () => {
            // Should have tween animation for swaying
        });
    });
});
```

- [ ] **Step 2: 实现 BackgroundSystem**

```javascript
// src/systems/BackgroundSystem.js
export class BackgroundSystem {
    constructor(scene) {
        this.scene = scene;
        this.bubbles = [];
        this.corals = [];
        this.seaweeds = [];
    }

    createBubbles(count = 10) {
        // Create bubble particles that rise from bottom
        // Each bubble: small circle, slight horizontal drift, loop
    }

    createCoral(x, y, type = 'branch', color = 0xFF6B6B) {
        // type: 'branch' | 'brain' | 'fan'
        // Draw coral shape based on type
    }

    createSeaweed(x, y, height = 100, color = 0x2ECC71) {
        // Create swaying seaweed with tween animation
    }

    update(delta) {
        // Update bubble positions
        // Remove bubbles that go off screen and respawn at bottom
    }

    destroy() {
        // Clean up all graphics
    }
}
```

- [ ] **Step 3: 运行测试验证**

Run: `npm test -- --testPathPattern=BackgroundSystem`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/systems/BackgroundSystem.js src/systems/BackgroundSystem.test.js
git commit -m "feat: add BackgroundSystem for procedural underwater decorations"
```

---

## 任务 2: TreasureBox - 精美宝箱造型

**Files:**
- Modify: `src/entities/TreasureBox.js:1-169`
- Test: `src/systems/__tests__/TreasureBoxVisual.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/TreasureBoxVisual.test.js
import { TreasureBox } from '../../entities/TreasureBox.js';

describe('TreasureBox Visual', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                graphics: jest.fn(() => ({
                    setDepth: jest.fn(),
                    setPosition: jest.fn()
                }))
            },
            physics: { world: { enable: jest.fn() } },
            tweens: { add: jest.fn() }
        };
    });

    test('creates glow effect matching reward type color', () => {
        const glowColors = {
            [TreasureBox.TYPE.COIN]: 0xFFFF00,
            [TreasureBox.TYPE.POTION]: 0xFF69B4,
            [TreasureBox.TYPE.INVINCIBILITY]: 0xFFD700
        };
        // Verify glow color matches type
    });
});
```

- [ ] **Step 2: 更新 TreasureBox.js - 添加精美造型**

在 constructor 中替换 `createChest()` 为 `createExquisiteChest()`:

```javascript
// src/entities/TreasureBox.js

/**
 * Draw exquisite chest with type-specific glow
 */
createExquisiteChest() {
    const typeColors = {
        [TreasureBox.TYPE.COIN]: { body: 0xFFD700, glow: 0xFFFF00 },
        [TreasureBox.TYPE.POTION]: { body: 0xFF4444, glow: 0xFF69B4 },
        [TreasureBox.TYPE.SKILL_FRAGMENT]: { body: 0x4488FF, glow: 0x88CCFF },
        [TreasureBox.TYPE.EXP]: { body: 0xAA44FF, glow: 0xCC88FF },
        [TreasureBox.TYPE.COOLDOWN_REDUCTION]: { body: 0x44FFFF, glow: 0x88FFFF },
        [TreasureBox.TYPE.INVINCIBILITY]: { body: 0xFFFFFF, glow: 0xFFD700 },
        [TreasureBox.TYPE.TELEPORT]: { body: 0xFF8800, glow: 0xFFAA44 },
        [TreasureBox.TYPE.DOUBLE_REWARDS]: { body: 0x44FF44, glow: 0x88FF88 }
    };

    const colors = typeColors[this.rewardType] || typeColors[TreasureBox.TYPE.COIN];

    // Box body (3D effect with gradient)
    this.graphics.fillStyle(colors.body, 1);
    this.graphics.fillRect(-12, -8, 24, 16);

    // Box lid (rounded top)
    this.graphics.fillStyle(Phaser.Display.Color.IntegerToColor(
        Phaser.Display.Color.GetColor(
            Math.floor(Phaser.Display.Color.ValueToColor(colors.body).r * 1.2),
            Math.floor(Phaser.Display.Color.ValueToColor(colors.body).g * 1.2),
            Math.floor(Phaser.Display.Color.ValueToColor(colors.body).b * 1.2)
        )
    ).color, 1);
    this.graphics.fillRect(-14, -14, 28, 8);

    // Gold trim
    this.graphics.lineStyle(2, 0xFFD700, 1);
    this.graphics.strokeRect(-12, -8, 24, 16);
    this.graphics.strokeRect(-14, -14, 28, 8);

    // Glow effect (larger, semi-transparent)
    this.glowGraphics.fillStyle(colors.glow, 0.3);
    this.glowGraphics.fillCircle(0, 0, 25);
}
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- --testPathPattern=TreasureBoxVisual`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/entities/TreasureBox.js
git commit -m "feat: add exquisite treasure chest visuals with type-specific glow"
```

---

## 任务 3: FishFactory - 玩家鱼美化

**Files:**
- Modify: `src/entities/FishFactory.js:1-266`
- Test: `src/systems/__tests__/FishFactory.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/FishFactory.test.js
import { FishFactory } from '../../entities/FishFactory.js';

describe('FishFactory - Player Fish', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: { graphics: jest.fn(() => ({ setDepth: jest.fn() })) }
        };
    });

    describe('createPlayerFish', () => {
        test('creates fish 1.1x larger than enemy version', () => {
            const enemyGraphics = FishFactory.createFish(mockScene, 'clownfish', 20, 0xFF6B35);
            const playerGraphics = FishFactory.createPlayerFish(mockScene, 'clownfish', 20, 0xFF6B35);
            // Player should be 10% larger
        });

        test('adds glow effect to player fish', () => {
            // Should have additional glow layer
        });
    });
});
```

- [ ] **Step 2: 添加 createPlayerFish 方法**

```javascript
// src/entities/FishFactory.js

/**
 * Create player fish with enhanced visuals and glow
 */
static createPlayerFish(scene, fishType, size, color) {
    // 1.1x size for player
    const playerSize = size * 1.1;
    const graphics = FishFactory.createFish(scene, fishType, playerSize, color);

    // Add player glow effect
    const glowGraphics = scene.add.graphics();
    glowGraphics.fillStyle(0xFFFFFF, 0.2);
    glowGraphics.fillEllipse(0, 0, playerSize * 2.5, playerSize * 1.8);
    glowGraphics.setDepth(-1);

    // Store glow reference
    graphics.glowGraphics = glowGraphics;

    return graphics;
}

/**
 * Enhanced clownfish with glowing stripes
 */
static drawClownfish(graphics, size, color, darkerColor) {
    // Original drawing code...
    // Add glowing stripe effect
    graphics.fillStyle(0xFFFFFF, 0.3);
    graphics.fillRect(-size * 0.5, -size * 0.8, size * 0.25, size * 1.6);
    graphics.fillRect(size * 0.25, -size * 0.6, size * 0.2, size * 1.2);
}
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- --testPathPattern=FishFactory`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/entities/FishFactory.js
git commit -m "feat: add player fish glow effect and enhanced visuals"
```

---

## 任务 4: skills.json - 技能解锁配置

**Files:**
- Modify: `src/config/skills.json`

- [ ] **Step 1: 添加 unlockLevel 字段**

```json
{
  "bite": {
    "name": "咬",
    "key": "Q",
    "type": "damage",
    "cooldown": 3,
    "damage": 20,
    "range": 80,
    "unlockLevel": 1
  },
  "shield": {
    "name": "盾",
    "key": "W",
    "type": "defense",
    "cooldown": 15,
    "duration": 3,
    "unlockLevel": 2
  },
  "speedUp": {
    "name": "加速",
    "key": "E",
    "type": "buff",
    "cooldown": 10,
    "duration": 5,
    "speedMultiplier": 1.2,
    "unlockLevel": 4
  },
  "heal": {
    "name": "治疗",
    "key": "R",
    "type": "heal",
    "cooldown": 20,
    "healAmount": 50,
    "unlockLevel": 6
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/config/skills.json
git commit -m "feat: add unlockLevel to skills config"
```

---

## 任务 5: SkillSystem - 技能锁定逻辑

**Files:**
- Modify: `src/systems/SkillSystem.js`
- Test: `src/systems/__tests__/SkillLock.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/SkillLock.test.js
import { SkillSystem } from '../SkillSystem.js';

describe('SkillLockSystem', () => {
    let skillSystem;
    let mockSkillsData;

    beforeEach(() => {
        mockSkillsData = {
            bite: { key: 'Q', type: 'damage', cooldown: 3, damage: 20, unlockLevel: 1 },
            shield: { key: 'W', type: 'defense', cooldown: 15, unlockLevel: 2 },
            speedUp: { key: 'E', type: 'buff', cooldown: 10, speedMultiplier: 1.2, unlockLevel: 4 },
            heal: { key: 'R', type: 'heal', cooldown: 20, healAmount: 50, unlockLevel: 6 }
        };
        skillSystem = new SkillSystem(mockSkillsData);
    });

    describe('isSkillUnlocked', () => {
        test('level 1 can use bite (unlockLevel 1)', () => {
            expect(skillSystem.isSkillUnlocked('bite', 1)).toBe(true);
        });

        test('level 1 cannot use shield (unlockLevel 2)', () => {
            expect(skillSystem.isSkillUnlocked('shield', 1)).toBe(false);
        });

        test('level 6 can use all skills', () => {
            expect(skillSystem.isSkillUnlocked('heal', 6)).toBe(true);
        });
    });

    describe('useSkill - locked skill', () => {
        test('returns locked error for level 1 player using speedUp', () => {
            const result = skillSystem.useSkill('E', 1);
            expect(result.success).toBe(false);
            expect(result.reason).toBe('locked');
        });
    });
});
```

- [ ] **Step 2: 添加 isSkillUnlocked 和锁定检查**

在 SkillSystem 中添加：

```javascript
// src/systems/SkillSystem.js

/**
 * Check if a skill is unlocked at given level
 * @param {string} skillId - Skill identifier
 * @param {number} playerLevel - Current player level
 * @returns {boolean} True if unlocked
 */
isSkillUnlocked(skillId, playerLevel) {
    const skill = this.skillsData[skillId];
    if (!skill) return false;
    return playerLevel >= (skill.unlockLevel || 1);
}

/**
 * Use a skill by key
 */
useSkill(key) {
    // ... existing code to find skillId ...

    // Check if skill is unlocked
    if (this.scene && !this.isSkillUnlocked(skillId, this.scene.level)) {
        return { success: false, reason: 'locked' };
    }

    // ... rest of existing code ...
}
```

- [ ] **Step 3: 修改 speedUp 使用配置值**

```javascript
executeBuffSkill(skillId, skill) {
    // Use config speedMultiplier, default 1.2
    const multiplier = skill.speedMultiplier || 1.2;
    this.scene.speed = originalSpeed * multiplier;
}
```

- [ ] **Step 4: 运行测试**

Run: `npm test -- --testPathPattern=SkillLock`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/systems/SkillSystem.js
git commit -m "feat: add skill unlock level checks"
```

---

## 任务 6: BattleSystem - 等级加成

**Files:**
- Modify: `src/systems/BattleSystem.js`
- Test: `src/systems/__tests__/BattleScaling.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/BattleScaling.test.js
import { BattleSystem } from '../BattleSystem.js';

describe('BattleScaling', () => {
    let battleSystem;

    beforeEach(() => {
        battleSystem = new BattleSystem({});
    });

    describe('calculateDamage with level bonus', () => {
        test('level 1 has base damage', () => {
            // damage = baseDamage + (1-1) * 5 = baseDamage
        });

        test('each level adds 5 damage', () => {
            // level 3: damage = baseDamage + (3-1) * 5 = baseDamage + 10
        });
    });

    describe('calculateDefense with level bonus', () => {
        test('level 1 has 0 defense', () => {
            // defense = (1-1) * 3 = 0
        });

        test('each level adds 3 defense', () => {
            // level 5: defense = (5-1) * 3 = 12
        });
    });
});
```

- [ ] **Step 2: 更新 BattleSystem**

```javascript
// src/systems/BattleSystem.js

/**
 * Calculate damage with level scaling
 */
calculateDamage(attacker, defender, baseDamage) {
    // Add level bonus: +5 per level
    const levelBonus = ((attacker.level || 1) - 1) * 5;
    const actualDamage = baseDamage + levelBonus;

    // ... existing damage calculation logic ...
}

/**
 * Calculate defense based on defender level
 */
calculateDefense(defender) {
    // Defense = (level - 1) * 3
    return ((defender.level || 1) - 1) * 3;
}
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- --testPathPattern=BattleScaling`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/systems/BattleSystem.js
git commit -m "feat: add level-based damage and defense scaling"
```

---

## 任务 7: Enemy - 敌人 AI 新状态

**Files:**
- Modify: `src/entities/Enemy.js`
- Test: `src/systems/__tests__/EnemyAI.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/EnemyAI.test.js
import { Enemy } from '../../entities/Enemy.js';

describe('EnemyAI States', () => {
    describe('FLEEING state', () => {
        test('enters FLEEING when HP < 30% with 50% chance', () => {
            // Mock enemy with 100 max HP, 25 current HP
            // On takeDamage, should roll 50% chance for FLEEING
        });

        test('FLEEING moves away from attacker', () => {
            // Enemy should move in opposite direction of attacker
        });

        test('FLEEING duration is 3 seconds', () => {
            // After 3 seconds, should return to WANDERING
        });
    });

    describe('FISHING state', () => {
        test('enters FISHING when Wandering with no player nearby', () => {
            // 5% chance per second when player distance > 300
        });

        test('FISHING targets smaller enemies', () => {
            // Only targets enemies with size < self.size * 0.9
        });

        test('FISHING enemy gains exp when eating target', () => {
            // Should gain 50% of target's exp value
        });
    });
});
```

- [ ] **Step 2: 添加新状态到 Enemy.js**

```javascript
// src/entities/Enemy.js

// Add to STATE enum:
static STATE = {
    WANDERING: 'wandering',
    CHASING: 'chasing',
    ATTACKING: 'attacking',
    FLEEING: 'fleeing',   // NEW
    FISHING: 'fishing'    // NEW
};

// Add flee logic in takeDamage:
takeDamage(amount, attacker) {
    // Existing damage logic...

    // Check for flee (HP < 30% with 50% chance)
    if (this.currentHp < this.maxHp * 0.3 && Math.random() < 0.5) {
        this.setState(Enemy.STATE.FLEEING, attacker);
    }
}

// Add FISHING state logic:
update(delta) {
    switch (this.state) {
        // ... existing cases ...

        case Enemy.STATE.FLEEING:
            this.updateFleeing(delta);
            break;
        case Enemy.STATE.FISHING:
            this.updateFishing(delta);
            break;
    }
}

updateFleeing(delta) {
    // Move away from attacker
    // Speed * 1.5
    // Duration 3 seconds, then return to WANDERING
}

updateFishing(delta) {
    // Find target enemy (smaller)
    // Chase and attack
    // If target dies, gain exp and return to WANDERING
}
```

- [ ] **Step 3: 运行测试**

Run: `npm test -- --testPathPattern=EnemyAI`
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/entities/Enemy.js
git commit -m "feat: add FLEEING and FISHING enemy AI states"
```

---

## 任务 8: GameScene - 敌人等级分布

**Files:**
- Modify: `src/scenes/GameScene.js`
- Test: `src/systems/__tests__/EnemyLevelDist.test.js`

- [ ] **Step 1: 写测试**

```javascript
// src/systems/__tests__/EnemyLevelDist.test.js

describe('EnemyLevelDistribution', () => {
    test('70% enemies same level as player', () => {
        // Roll should result in same level 70% of time
    });

    test('20% enemies one level lower', () => {
        // Roll should result in level-1 20% of time
    });

    test('10% enemies one level higher', () => {
        // Roll should result in level+1 10% of time
    });
});
```

- [ ] **Step 2: 在 spawnEnemy 中实现等级分布**

```javascript
// src/scenes/GameScene.js

/**
 * Calculate enemy level based on distribution
 * 70% same level, 20% lower, 10% higher
 */
calculateEnemyLevel(playerLevel) {
    const roll = Math.random();
    if (roll < 0.7) {
        return playerLevel;  // 70%
    } else if (roll < 0.9) {
        return Math.max(1, playerLevel - 1);  // 20%
    } else {
        return playerLevel + 1;  // 10%
    }
}
```

- [ ] **Step 3: 在 spawnEnemy 调用**

```javascript
// In spawnEnemy():
const enemyLevel = this.calculateEnemyLevel(this.level);
// Use enemyLevel for HP, damage, size scaling
```

- [ ] **Step 4: 运行测试**

Run: `npm test -- --testPathPattern=EnemyLevelDist`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: add enemy level distribution (70/20/10)"
```

---

## 任务 9: GameScene - 集成所有系统

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: 集成 BackgroundSystem**

```javascript
// In create():
this.backgroundSystem = new BackgroundSystem(this);
this.backgroundSystem.createBubbles(15);
this.backgroundSystem.createCoral(100, 650, 'branch', 0xFF6B6B);
this.backgroundSystem.createSeaweed(900, 700, 120, 0x2ECC71);
```

- [ ] **Step 2: 更新 spawnTreasureBox 使用新颜色**

```javascript
// Already updated in previous task
```

- [ ] **Step 3: 集成技能锁定到 UI**

```javascript
// In createSkillBar() or updateUI():
// Check isSkillUnlocked before showing skill as available
```

- [ ] **Step 4: 提交**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: integrate BackgroundSystem and skill lock UI"
```

---

## 最终检查

- [ ] **运行所有测试**

```bash
npm test -- --coverage
```

- [ ] **测试游戏功能**

1. 刷新游戏页面 http://localhost:8080
2. 验证气泡、珊瑚、海藻背景效果
3. 验证宝箱有精美造型和颜色区分
4. 验证玩家鱼有光晕效果
5. 验证等级1只有Q技能可用
6. 验证等级提升后新技能解锁
7. 验证敌人会逃跑和互吃

- [ ] **提交所有更改**

```bash
git add -A
git commit -m "feat: complete visual and gameplay enhancement"
```

---

## 预期测试覆盖

| 文件 | 测试覆盖 |
|------|----------|
| BackgroundSystem.js | createBubbles, createCoral, createSeaweed, update |
| SkillSystem.js | isSkillUnlocked, locked skill rejection |
| BattleSystem.js | calculateDamage level bonus, calculateDefense |
| Enemy.js | FLEEING trigger, FISHING target selection |
| TreasureBox.js | Glow color by type |
| FishFactory.js | Player glow effect |
