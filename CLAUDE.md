# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本仓库工作时提供指导。

## 项目概述

**鱼吃鱼 (Fish Eat Fish)** — 一款单人的 Phaser.js 3.x HTML5 游戏，玩家控制一条鱼吃更小的鱼、与 AI 敌人战斗、升级、解锁技能。

## 启动工作流

写代码之前：

1. **确认工作目录** — 执行 `pwd`
2. **完整阅读本文件**
3. **阅读项目文档**（`docs/`、`task_plan.md`、`findings.md`）
4. **执行 `./init.sh`** — 验证环境健康
5. **阅读 `feature_list.json`** — 查看当前特性状态
6. **查看最近提交** — 执行 `git log --oneline -5`

如果基础验证失败，先修复问题，再添加新功能。

## 架构

**Phaser.js 3.x**，ES modules。游戏使用 Phaser 内置的 arcage 物理引擎（无重力，俯视角移动）。

### 场景流程
```
BootScene → MenuScene → GameScene + UIScene → GameOverScene
                                      ↑___________|
```

**5 个场景：**
- `BootScene` — 加载画面，带进度条
- `MenuScene` — 标题画面，含难度选择、登录/注册
- `GameScene` — 核心游戏循环
- `UIScene` — HUD 覆盖层（与 GameScene 并行运行）
- `GameOverScene` — 结果画面，含重新开始选项

### 核心系统

| 系统 | 文件 | 职责 |
|--------|------|----------------|
| Auth | `systems/AuthSystem.js` | localStorage 认证、会话持久化 |
| UserData | `systems/UserDataSystem.js` | 用户数据存档 |
| Battle | `systems/BattleSystem.js` | 伤害计算、属性克制 |
| Skill | `systems/SkillSystem.js` | 冷却时间、技能执行（Q/W/E/R） |
| Growth | `systems/GrowthSystem.js` | 经验值、升级、连击追踪 |
| Drift Bottle | `systems/DriftBottleSystem.js` | 升级时随机好/坏效果 |
| Luck | `systems/LuckSystem.js` | 影响漂流瓶概率 |
| Debug | `systems/DebugLogger.js` | 带时间戳的日志级别（DEBUG/INFO/WARN/ERROR） |
| Combo | `systems/ComboSystem.js` | 时间窗口内的连击倍率 |
| Audio | `systems/AudioSystem.js` | Web Audio API 合成音效 |
| Achievement | `systems/AchievementSystem.js` | 15 个里程碑成就 |
| Boss | `systems/BossSystem.js` | Boss 敌人及特殊能力 |
| Background | `systems/BackgroundSystem.js` | 3 种主题背景及视差 |

### 数据驱动设计

所有游戏内容定义在 `src/config/` 下的 JSON 配置文件中：
- `fish.json` — 鱼的种类、HP、速度、大小、克制关系
- `skills.json` — 技能定义，含冷却时间和效果
- `levels.json` — 经验值表和技能解锁阈值
- `maps.json` — 主题背景（深海/热带/极地）
- `difficulty.json` — 各难度下的敌人数量和 AI 强度
- `drops.json` — 宝箱掉落率和奖励
- `driftBottle.json` — 漂流瓶效果及权重
- `upgrades.json` — 商店升级定义

### 实体模式

- `entities/Player.js` — 玩家鱼（供未来扩展）
- `entities/Enemy.js` — AI 鱼，含 WANDERING/CHASING/ATTACKING/FLEEING 状态
- `entities/BossEnemy.js` — Boss 鱼，含特殊能力
- `entities/TreasureBox.js` — 可收集的宝箱
- `entities/FishFactory.js` — 鱼精灵工厂（PNG 或程序化生成）

### 操控

| 按键 | 动作 |
|-----|------|
| 方向键 | 移动 |
| Shift | 加速 |
| Q/W/E/R | 技能（撕咬/护盾/加速/治疗） |
| 鼠标 | 替代移动方式 |

### 游戏机制

- **吃鱼规则：** 玩家必须比目标大 20% 以上
- **属性克制：** 剪刀石头布式（鲨鱼 > 小鱼 > 虾 > 鲨鱼）
- **升级：** 提升体型、解锁技能、触发漂流瓶
- **难度：** 简单/普通/困难，敌人数量和 AI 侵略性递增
- **玩家体型：** 玩家为基础体型的 2 倍（便于识别）
- **会话：** 认证会话通过 localStorage 跨页面刷新持久化

## 工作规则

- **一次只做一个特性：** 从 `feature_list.json` 中精确选一个未完成的特性
- **必须验证：** 未运行验证命令不得声称完成
- **更新产物：** 结束会话前更新 `progress.md` 和 `feature_list.json`
- **保持范围：** 不修改与当前特性无关的文件
- **保持干净状态：** 下一次会话必须能立即执行 `./init.sh`

## 必需产物

- `feature_list.json` — 特性状态追踪（真相来源）
- `progress.md` — 会话连续性日志
- `init.sh` — 标准启动和验证路径
- `session-handoff.md` — 可选，用于多会话特性

## 完成定义

一个特性只有满足以下**全部条件**才算完成：

- [ ] 目标行为已实现
- [ ] 验证实际运行过（`npm test` 通过）
- [ ] 证据已记录在 `feature_list.json`
- [ ] 仓库可从标准启动路径重启

## 会话结束

结束会话前：

1. 更新 `progress.md` 当前状态
2. 更新 `feature_list.json` 新特性状态
3. 记录未解决的风险或阻碍
4. 工作处于安全状态时提交，附描述性提交信息
5. 留下干净状态，使下一次会话能立即执行 `./init.sh`

## 验证命令

```bash
# 完整验证
./init.sh

# 或直接运行
npm install && npm test
```

## 升级路径

遇到以下情况时：
- **架构决策**：查阅项目文档，或询问用户
- **需求不明确**：查阅 `task_plan.md` / `findings.md`，或询问用户
- **测试反复失败**：更新进度，标记需人工 review
- **范围模糊**：重读 `feature_list.json` 中的完成定义

## 已知问题

- **PNG 透明度：** 部分水母/章鱼的 PNG 文件可能背景不透明。如果纹理检查失败，回退到程序化（纯色）绘制。

## 目录结构

```
src/
├── main.js              # Phaser 配置 + 游戏初始化
├── config/              # JSON 数据文件
├── scenes/              # Phaser 场景
├── entities/            # 游戏对象类
├── systems/             # 游戏逻辑系统
└── ui/                 # UI 组件
```