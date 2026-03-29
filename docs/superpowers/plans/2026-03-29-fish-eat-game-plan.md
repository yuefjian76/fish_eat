# 鱼吃鱼游戏 — 实现计划

**Goal:** 构建一个完整的鱼吃鱼网页游戏，包含核心玩法、战斗系统、技能系统、成长体系和渐进式关卡

**Architecture:** 数据驱动的 Phaser.js 3.x 游戏，使用 JSON 配置表定义游戏内容，按阶段渐进式开发

**Tech Stack:** Phaser.js 3.x, HTML5 Canvas, JSON 配置

---

## 文件结构

```
/fish-eat
├── index.html                    # 游戏入口页面
├── src/
│   ├── main.js                    # Phaser 游戏启动
│   ├── config/                    # JSON 配置表
│   │   ├── fish.json              # 鱼种属性配置
│   │   ├── skills.json            # 技能配置
│   │   ├── levels.json            # 等级/经验配置
│   │   ├── maps.json              # 地图/关卡配置
│   │   └── drops.json             # 掉落/宝箱配置
│   ├── scenes/                    # Phaser 场景
│   │   ├── BootScene.js           # 加载资源场景
│   │   ├── MenuScene.js           # 开始菜单场景
│   │   ├── GameScene.js           # 核心游戏场景
│   │   ├── UIScene.js             # UI 叠加场景
│   │   └── GameOverScene.js       # 游戏结束场景
│   ├── entities/                  # 游戏实体
│   │   ├── Player.js              # 玩家鱼
│   │   ├── Enemy.js               # 敌对鱼
│   │   ├── FishFactory.js         # 鱼群生成工厂
│   │   └── TreasureBox.js         # 宝箱实体
│   ├── systems/                   # 游戏系统
│   │   ├── BattleSystem.js        # 战斗系统
│   │   ├── SkillSystem.js         # 技能系统
│   │   ├── GrowthSystem.js        # 成长系统（经验/等级）
│   │   ├── DriftBottleSystem.js   # 漂流瓶系统
│   │   ├── LuckSystem.js          # 幸运值系统
│   │   └── InputManager.js        # 输入管理
│   └── ui/                       # UI 组件
│       ├── HUD.js                # HUD 主组件
│       ├── SkillBar.js            # 技能栏
│       ├── HealthBar.js           # 血量条
│       └── MiniMap.js             # 小地图
└── assets/                       # 资源目录（图片、音效等）
```

---

## 阶段 1：核心玩法

### Task 1.1: 项目初始化
创建 index.html、main.js 和基础配置

### Task 1.2: 场景框架
创建 5 个 Phaser 场景的框架代码

### Task 1.3: 玩家移动和吃鱼判定
实现方向键移动和体型吃鱼逻辑

---

## 阶段 2：战斗系统

### Task 2.1: 血量与伤害系统
实现 BattleSystem 和 Player 战斗方法

### Task 2.2: 敌人攻击 AI
实现 Enemy 追击和攻击行为

---

## 阶段 3：技能系统

### Task 3.1: 技能配置和释放
创建 skills.json、SkillSystem 和 SkillBar

---

## 阶段 4：成长与 UI

### Task 4.1: 经验与等级系统
创建等级配置和 GrowthSystem

### Task 4.2: 漂流瓶系统
创建漂流瓶配置、LuckSystem 和 DriftBottleSystem

---

## 阶段 5：完善

### Task 5.1: 地图主题系统
创建 maps.json 和主题切换逻辑

### Task 5.2: 难度分级
创建 difficulty.json 和难度选择

### Task 5.3: 宝箱掉落系统
创建 drops.json 和 TreasureBox

---
