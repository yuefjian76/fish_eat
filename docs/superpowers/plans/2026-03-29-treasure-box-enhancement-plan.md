# 宝箱系统增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 扩展宝箱系统，添加 5 种新奖励类型（经验、技能冷却减少、无敌、传送、双倍收益）

**Architecture:** 修改 `drops.json` 奖励配置，更新 `TreasureBox.js` 处理新奖励类型，更新 `GameScene.js` 应用新效果

**Tech Stack:** Phaser.js 3.x, JavaScript ES6+

---

## 文件结构

```
src/
├── config/
│   └── drops.json           # 修改：添加新奖励类型配置
├── entities/
│   └── TreasureBox.js       # 修改：添加新奖励类型处理
└── scenes/
    └── GameScene.js         # 修改：实现新奖励效果应用
```

---

## 任务 1: 更新 drops.json 配置

**Files:**
- Modify: `src/config/drops.json`

- [ ] **Step 1: 更新 drops.json，添加 5 种新奖励类型**

```json
{
  "dropChance": 0.4,
  "autoDespawnTime": 10000,
  "rewards": {
    "coin": {
      "weight": 30,
      "minAmount": 20,
      "maxAmount": 100
    },
    "potion": {
      "weight": 20,
      "healAmount": 30
    },
    "skillFragment": {
      "weight": 10,
      "amount": 1
    },
    "exp": {
      "weight": 15,
      "percentOfNextLevel": 0.1
    },
    "cooldownReduction": {
      "weight": 10,
      "reductionSeconds": 3
    },
    "invincibility": {
      "weight": 5,
      "durationSeconds": 3
    },
    "teleport": {
      "weight": 5
    },
    "doubleRewards": {
      "weight": 5,
      "durationSeconds": 15
    }
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/config/drops.json
git commit -m "feat: add 5 new treasure box reward types"
```

---

## 任务 2: 更新 TreasureBox.js 添加新奖励类型

**Files:**
- Modify: `src/entities/TreasureBox.js`

- [ ] **Step 1: 添加新奖励类型常量**

```javascript
static TYPE = {
    COIN: 'coin',
    POTION: 'potion',
    SKILL_FRAGMENT: 'skillFragment',
    EXP: 'exp',
    COOLDOWN_REDUCTION: 'cooldownReduction',
    INVINCIBILITY: 'invincibility',
    TELEPORT: 'teleport',
    DOUBLE_REWARDS: 'doubleRewards'
};
```

- [ ] **Step 2: 更新 createRewardLabel 方法**

```javascript
createRewardLabel() {
    const labels = {
        [TreasureBox.TYPE.COIN]: `+${this.rewardAmount}`,
        [TreasureBox.TYPE.POTION]: 'HP',
        [TreasureBox.TYPE.SKILL_FRAGMENT]: 'SKILL',
        [TreasureBox.TYPE.EXP]: '+EXP',
        [TreasureBox.TYPE.COOLDOWN_REDUCTION]: 'CD-3s',
        [TreasureBox.TYPE.INVINCIBILITY]: '无敌',
        [TreasureBox.TYPE.TELEPORT]: '传送',
        [TreasureBox.TYPE.DOUBLE_REWARDS]: 'x2'
    };
    // ... 其余代码保持不变
}
```

- [ ] **Step 3: 提交**

```bash
git add src/entities/TreasureBox.js
git commit -m "feat: add new treasure box reward types to TreasureBox"
```

---

## 任务 3: 更新 GameScene.js 实现奖励效果

**Files:**
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: 添加宝箱自动消失定时器**

在 `spawnTreasureBox` 方法中，修改宝箱创建部分：

```javascript
// Create treasure box
const treasureBox = new TreasureBox(this, x, y, rewardType, rewardAmount);

// Auto despawn after 10 seconds
this.time.delayedCall(this.dropsData.autoDespawnTime || 10000, () => {
    if (treasureBox && !treasureBox.isCollected) {
        treasureBox.destroy();
    }
});
```

- [ ] **Step 2: 在 GameScene 添加新状态变量**

```javascript
// Add to constructor or init method:
this.isInvincible = false;
this.doubleRewardsActive = false;
```

- [ ] **Step 3: 更新 collectTreasureBox 方法处理新奖励类型**

```javascript
collectTreasureBox(player, treasureBoxGraphics) {
    // Find the treasure box instance
    const treasureBox = this.treasureBoxes.getChildren().find(
        tb => tb === treasureBoxGraphics
    );

    if (!treasureBox || !treasureBox.treasureBoxData || treasureBox.treasureBoxData.isCollected) {
        return;
    }

    const reward = treasureBox.treasureBoxData.collect(player);
    if (!reward) return;

    // Apply reward based on type
    switch (reward.type) {
        case TreasureBox.TYPE.COIN:
            this.score += reward.amount;
            logger.info(`Treasure collected: COIN, amount=${reward.amount}`);
            break;
        case TreasureBox.TYPE.POTION:
            this.hp += reward.amount;
            if (this.hp > this.maxHp) this.hp = this.maxHp;
            this.updatePlayerHealthBar();
            logger.info(`Treasure collected: POTION, amount=${reward.amount}`);
            break;
        case TreasureBox.TYPE.SKILL_FRAGMENT:
            this.score += reward.amount * 100;
            logger.info(`Skill fragment collected! +${reward.amount * 100} score`);
            break;
        case TreasureBox.TYPE.EXP:
            const expForNextLevel = this.growthSystem.getExpForLevel(this.level + 1);
            const expGain = Math.floor(expForNextLevel * 0.1);
            const expResult = this.growthSystem.addExperience(expGain, this.time.now, this.luckSystem);
            this.exp = this.growthSystem.getExp();
            this.level = this.growthSystem.getLevel();
            if (this.doubleRewardsActive) {
                this.score += expResult.expGained * 20;
            } else {
                this.score += expResult.expGained * 10;
            }
            logger.info(`Treasure collected: EXP, amount=${expGain}`);
            break;
        case TreasureBox.TYPE.COOLDOWN_REDUCTION:
            if (this.skillSystem) {
                this.skillSystem.reduceAllCooldowns(3);
            }
            logger.info('Treasure collected: COOLDOWN REDUCTION -3s');
            break;
        case TreasureBox.TYPE.INVINCIBILITY:
            this.isInvincible = true;
            this.time.delayedCall(3000, () => {
                this.isInvincible = false;
                logger.info('Invincibility ended');
            });
            logger.info('Treasure collected: INVINCIBILITY 3s');
            break;
        case TreasureBox.TYPE.TELEPORT:
            this.player.x = Phaser.Math.Between(100, 900);
            this.player.y = Phaser.Math.Between(100, 600);
            logger.info('Treasure collected: TELEPORT');
            break;
        case TreasureBox.TYPE.DOUBLE_REWARDS:
            this.doubleRewardsActive = true;
            this.time.delayedCall(15000, () => {
                this.doubleRewardsActive = false;
                logger.info('Double rewards ended');
            });
            logger.info('Treasure collected: DOUBLE REWARDS 15s');
            break;
    }

    // Update UI
    this.scene.get('UIScene').updateUI(this.score, this.exp, this.level, this.hp, this.maxHp, this.growthSystem.getExpForLevel(this.level + 1));
}
```

- [ ] **Step 4: 提交**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: implement treasure box reward effects"
```

---

## 任务 4: 更新 SkillSystem 添加 reduceAllCooldowns 方法

**Files:**
- Modify: `src/systems/SkillSystem.js`

- [ ] **Step 1: 添加 reduceAllCooldowns 方法**

```javascript
/**
 * Reduce cooldown for all skills
 * @param {number} seconds - Seconds to reduce
 */
reduceAllCooldowns(seconds) {
    for (const skillId in this.cooldowns) {
        if (this.cooldowns[skillId] > 0) {
            this.cooldowns[skillId] = Math.max(0, this.cooldowns[skillId] - seconds);
        }
    }
    logger.info(`All skill cooldowns reduced by ${seconds}s`);
}
```

- [ ] **Step 2: 提交**

```bash
git add src/systems/SkillSystem.js
git commit -m "feat: add reduceAllCooldowns method"
```

---

## 任务 5: 更新 LuckSystem 支持权重修改

**Files:**
- Modify: `src/systems/LuckSystem.js`

- [ ] **Step 1: 添加 modifyWeightPure 纯函数**

```javascript
/**
 * Modify weight based on luck value
 * @param {number} baseWeight - Base weight
 * @param {boolean} isGoodEffect - True if good effect
 * @param {object} luckInfluence - Luck influence config
 * @returns {number} Modified weight
 */
modifyWeightPure(baseWeight, isGoodEffect, luckInfluence) {
    const luck = this.getLuck();
    if (isGoodEffect) {
        return Math.max(1, baseWeight + luck * (luckInfluence.goodBonusPerLuck || 0.5));
    } else {
        return Math.max(1, baseWeight - luck * (luckInfluence.badReductionPerLuck || 0.3));
    }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/systems/LuckSystem.js
git commit -m "feat: add modifyWeightPure to LuckSystem"
```

---

## 最终检查

- [ ] **运行游戏测试**

刷新游戏页面，验证：
1. 宝箱显示新标签（+EXP、CD-3s、无敌、传送、x2）
2. 拾取宝箱后效果正确应用
3. 宝箱 10 秒后自动消失
4. 幸运值影响奖励权重

- [ ] **提交所有更改**

```bash
git add -A
git commit -m "feat: complete treasure box enhancement with 8 reward types"
```

- [ ] **推送到远程**

```bash
git push
```

---

## 预期测试场景

| 奖励类型 | 验证方式 |
|----------|----------|
| coin | 分数增加 |
| potion | 血量增加 |
| skillFragment | 分数增加 +100 |
| exp | 经验增加（升级） |
| cooldownReduction | 技能冷却减少 3 秒 |
| invincibility | 3 秒内无敌（不受伤害） |
| teleport | 玩家位置变化 |
| doubleRewards | 15 秒内经验/金币翻倍 |
