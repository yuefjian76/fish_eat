# 鱼吃鱼 - 视觉与玩法全面增强设计

## 概述

对鱼吃鱼游戏进行全面升级：美化视觉、增加技能解锁系统、改进敌人 AI、强化 PK 机制。

---

## 1. 视觉系统增强

### 1.1 宝箱外观（优先级最高）

**设计方案：** 统一精美造型 + 类型颜色区分

所有宝箱使用相同的精美几何造型，通过颜色和光效区分类型：

| 类型 | 主体颜色 | 光晕颜色 | 标签 |
|------|----------|----------|------|
| coin | 金色 `#FFD700` | 黄色 | `+20~100` |
| potion | 红色 `#FF4444` | 粉红 | `HP` |
| skillFragment | 蓝色 `#4488FF` | 浅蓝 | `SKILL` |
| exp | 紫色 `#AA44FF` | 淡紫 | `+EXP` |
| cooldownReduction | 青色 `#44FFFF` | 青色 | `CD-3s` |
| invincibility | 白色 `#FFFFFF` | 金色 | `无敌` |
| teleport | 橙色 `#FF8800` | 橙色 | `传送` |
| doubleRewards | 绿色 `#44FF44` | 绿色 | `x2` |

**实现：** `TreasureBox.js` 新增 `drawExquisiteChest()` 方法

### 1.2 海底背景

**设计方案：** 程序化生成

**组成元素：**
- 渐变底层背景（保持现有逻辑）
- 珊瑚（静态，多种颜色和形状）
- 海藻（轻微摇摆动画）
- 气泡（上升动画）

**BackgroundSystem.js 结构：**
```javascript
export class BackgroundSystem {
    constructor(scene) { }
    createCoral(x, y, type, color) { }  // 3种珊瑚类型
    createSeaweed(x, y, height, color) { }  // 摇摆动画
    createBubbles(count) { }  // 持续生成上升气泡
    update(delta) { }  // 更新气泡位置
}
```

**珊瑚类型：**
- 分支珊瑚（树枝状）
- 脑珊瑚（圆形褶皱）
- 海扇（扇形）

### 1.3 玩家鱼美化

**设计方案：** 保留小丑鱼造型，增强细节

**改进点：**
- 条纹添加发光效果（使用半透明叠加）
- 背鳍和胸鳍更流畅的曲线
- 玩家专属光晕（淡淡的白色轮廓）
- 眼睛添加高光反射

**与敌人鱼的区别：**
- 玩家鱼有光晕效果
- 条纹有微弱发光
- 体型稍大（1.1x）

---

## 2. 技能解锁系统

### 2.1 配置更新

`skills.json` 新增 `unlockLevel` 字段：

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

### 2.2 技能栏 UI 更新

- 未解锁技能显示为灰色 + 锁图标
- 解锁时播放解锁动画
- 快捷键提示根据等级显示

---

## 3. PK 机制增强

### 3.1 攻击防御随等级增长

**公式：**
```
baseDamage = skill.damage
actualDamage = baseDamage + (level - 1) * 5

baseDefense = 0
actualDefense = (level - 1) * 3
```

### 3.2 BattleSystem 更新

```javascript
calculateDamage(attacker, defender, baseDamage) {
    const levelBonus = (attacker.level - 1) * 5;
    const actualDamage = baseDamage + levelBonus;
    // ... 原有逻辑
}

calculateDefense(defender) {
    return (defender.level - 1) * 3;
}
```

---

## 4. 敌人 AI 改进

### 4.1 等级分布

在现有难度系统（Easy/Normal/Hard）的约束下，敌人等级分布：

- **70%** 同等级敌人（基于玩家当前等级计算）
- **20%** 低一级敌人
- **10%** 高一级敌人

**实现：** `GameScene.spawnEnemy()` 中根据随机roll和等级计算确定具体等级

### 4.2 敌人状态机新增 FISHING 状态

```
WANDERING ←→ CHASING → ATTACKING
    ↑           ↓
    ←←←← FLEEING ←←←←
         ↑
      FISHING
```

**进入 FISHING 条件：**
- 当敌人在 WANDERING 状态时
- 附近没有玩家（玩家距离 > 300px）
- 随机概率（每秒 5% 检查）

**FISHING 状态行为：**
- 敌人随机选择另一个敌人作为目标
- 只选择比自己体型小的敌人（size < 自身size * 0.9）
- 追击并攻击目标
- 吃到敌人后获得经验值（exp = 敌人 exp 值的 50%）
- 吃完后返回 WANDERING

### 4.3 逃跑逻辑

**触发时机：** 当敌人受到攻击且 HP < 30% 时，有 50% 概率进入 FLEEING 状态
- 仅在 `takeDamage()` 被调用时检查，不每帧检查
- 逃跑目标 = 远离攻击者的反方向

**逃跑行为：**
- 向远离攻击者的方向逃跑
- 速度增加 50%
- 持续 3 秒后恢复 WANDERING

---

## 5. 速度加成调整

**修改：** `speedUp` 技能速度从 1.8x 改为 1.2x

需要同时修改两个文件：
- `skills.json` 中的 `speedMultiplier` 字段从 1.8 改为 1.2
- `SkillSystem.js` 中的 `executeBuffSkill()` 方法使用配置值而非硬编码

---

## 6. 文件结构

```
src/
├── systems/
│   ├── BackgroundSystem.js     # 新增：背景装饰系统
│   ├── BattleSystem.js         # 修改：增加等级加成
│   └── SkillSystem.js          # 修改：技能锁定 + 速度配置化
├── entities/
│   ├── TreasureBox.js          # 修改：精美宝箱造型
│   └── FishFactory.js          # 修改：玩家鱼美化
├── scenes/
│   └── GameScene.js            # 修改：集成新系统
└── config/
    └── skills.json             # 修改：添加 unlockLevel + 修正 speedMultiplier
```

---

## 7. 实现顺序（优先级）

1. **BackgroundSystem.js** — 海底背景（气泡、珊瑚、海藻）
2. **TreasureBox.js** — 精美宝箱造型
3. **FishFactory.js** — 玩家鱼美化
4. **skills.json** — 添加 unlockLevel
5. **SkillSystem.js** — 技能锁定逻辑
6. **BattleSystem.js** — 等级加成
7. **Enemy.js** — 新状态机 + 逃跑逻辑
8. **GameScene.js** — 集成所有系统

---

## 8. 测试策略（TDD）

```javascript
// systems/__tests__/BackgroundSystem.test.js
test('createBubbles generates correct count')
test('bubble rises and despawns at top')

// systems/__tests__/SkillUnlock.test.js
test('locked skill returns error')
test('unlocked skill works normally')

// systems/__tests__/BattleScaling.test.js
test('damage increases with level')
test('defense increases with level')

// systems/__tests__/EnemyAI.test.js
test('enemy flees when HP low')
test('enemy attacks smaller enemy')
test('enemy eating enemy grants exp')
```
