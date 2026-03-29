# 宝箱系统增强设计

## 概述

扩展现有宝箱系统，添加 5 种新奖励类型，使宝箱效果更丰富多样。

## 当前状态

现有奖励类型：
- `coin` - 金币 +20~100
- `potion` - 血量 +30
- `skillFragment` - 技能碎片 +1

## 新增奖励类型

| 类型 | 效果 | 权重 |
|------|------|------|
| exp | 经验 +当前升级需要的10% | 15 |
| cooldownReduction | 所有技能冷却 -3秒 | 10 |
| invincibility | 无敌3秒 | 5 |
| teleport | 传送随机位置 | 5 |
| doubleRewards | 双倍收益15秒 | 5 |

## 奖励权重配置

```json
{
  "coin": { "weight": 30 },
  "potion": { "weight": 20 },
  "skillFragment": { "weight": 10 },
  "exp": { "weight": 15 },
  "cooldownReduction": { "weight": 10 },
  "invincibility": { "weight": 5 },
  "teleport": { "weight": 5 },
  "doubleRewards": { "weight": 5 }
}
```

总计权重：100

## 行为

### 出现方式
- 死亡鱼掉落（保持现有逻辑）
- 40% 掉落概率（保持现有逻辑）

### 消失机制
- **10秒后自动消失**，不再永久存在

### 收集方式
- 玩家碰撞触发收集

## 幸运值影响

- 好奖励（coin/potion/skillFragment/exp/doubleRewards）：权重 +luck*0.5
- 坏奖励（cooldownReduction/invincibility/teleport）：权重 -luck*0.3
- 权重最小值为 1

## 视觉效果

### 外观（所有类型统一）
- 棕色宝箱（保持现有）
- 金色边框和光晕（保持现有）
- 漂浮动画（保持现有）

### 标签显示
| 类型 | 标签 |
|------|------|
| coin | +20~100 |
| potion | HP |
| skillFragment | SKILL |
| exp | +EXP |
| cooldownReduction | CD-3s |
| invincibility | 无敌 |
| teleport | 传送 |
| doubleRewards | x2 |

## 实现文件

- `src/config/drops.json` - 更新奖励配置
- `src/entities/TreasureBox.js` - 添加新奖励类型处理
- `src/scenes/GameScene.js` - 添加新奖励效果应用

## 新奖励效果实现

### exp
```javascript
// 获得当前升级所需经验的 10%
const expForNextLevel = this.growthSystem.getExpForLevel(this.level + 1);
const expGain = Math.floor(expForNextLevel * 0.1);
this.growthSystem.addExperience(expGain, this.time.now, this.luckSystem);
```

### cooldownReduction
```javascript
// 所有技能冷却减少 3 秒
if (this.skillSystem) {
    this.skillSystem.reduceAllCooldowns(3);
}
```

### invincibility
```javascript
// 无敌 3 秒
this.isInvincible = true;
this.time.delayedCall(3000, () => {
    this.isInvincible = false;
});
```

### teleport
```javascript
// 传送到随机安全位置
this.player.x = Phaser.Math.Between(100, 900);
this.player.y = Phaser.Math.Between(100, 600);
```

### doubleRewards
```javascript
// 双倍收益 15 秒
this.doubleRewardsActive = true;
this.time.delayedCall(15000, () => {
    this.doubleRewardsActive = false;
});
```
