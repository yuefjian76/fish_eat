# 鱼吃鱼游戏 - TDD 测试设计

## 概述

为鱼吃鱼游戏核心系统添加 Jest 单元测试，采用 TDD 开发模式。

## 技术方案

| 项目 | 选择 |
|------|------|
| 测试框架 | Jest |
| 组织方式 | `src/systems/__tests__/*.test.js` |
| 测试范围 | 纯逻辑（无 Phaser 依赖） |
| Node 版本 | >= 18 |

## 需要测试的系统

### 1. BattleSystem
**文件：** `src/systems/BattleSystem.js`
**测试内容：**
- 基础伤害计算
- 克制加成（strongAgainst）：伤害 * 1.5
- 被克制减成（weakTo）：伤害 * 0.5
- 治疗计算（不超过最大血量）
- 死亡判定（hp <= 0）
- 攻击可行性判定

### 2. GrowthSystem
**文件：** `src/systems/GrowthSystem.js`
**测试内容：**
- 经验累加
- 等级判定（根据经验表）
- 升级后经验重置
- 连续击杀加成（3秒内 combo * 0.2）
- 技能解锁判定

### 3. SkillSystem
**文件：** `src/systems/SkillSystem.js`
**测试内容：**
- 技能冷却计时
- 技能效果触发
- 冷却中无法使用
- 主动技能效果计算

### 4. DriftBottleSystem
**文件：** `src/systems/DriftBottleSystem.js`
**测试内容：**
- 漂流瓶触发概率（受幸运值影响）
- 效果权重选择
- 好的效果 vs 坏的效果（根据幸运值）
- 各种效果的持续时间

### 5. LuckSystem
**文件：** `src/systems/LuckSystem.js`
**测试内容：**
- 幸运值基础计算
- 触发概率影响
- 效果好坏概率影响

## 架构调整

为了便于测试，需要将纯计算逻辑从类中分离：

```javascript
// 示例：BattleSystem.js
export class BattleSystem {
    // ... 原有类逻辑保持不变
}

// 提取纯函数用于测试
export function calculateDamage(attackerConfig, defenderConfig, baseDamage = 10) {
    let damage = baseDamage;
    if (attackerConfig.strongAgainst?.includes(defenderConfig.type)) {
        damage *= 1.5;
    }
    if (attackerConfig.weakTo === defenderConfig.type) {
        damage *= 0.5;
    }
    return Math.floor(damage);
}
```

## 文件结构

```
src/systems/
├── __tests__/
│   ├── BattleSystem.test.js
│   ├── GrowthSystem.test.js
│   ├── SkillSystem.test.js
│   ├── DriftBottleSystem.test.js
│   └── LuckSystem.test.js
├── BattleSystem.js
├── GrowthSystem.js
├── SkillSystem.js
├── DriftBottleSystem.js
├── LuckSystem.js
└── ...
```

## Jest 配置

`package.json` 添加：
```json
{
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

`jest.config.js`：
```javascript
module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/systems/**/*.js', '!src/systems/__tests__/**']
};
```

## 测试数据

测试使用的配置文件数据直接从现有 JSON 提取：

- `src/config/fish.json`
- `src/config/skills.json`
- `src/config/levels.json`
- `src/config/driftBottle.json`
