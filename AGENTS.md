# AGENTS.md -- 鱼吃鱼 (Fish Eat Fish)

## 项目概述

鱼吃鱼是一款 Phaser.js 3.x HTML5 游戏，玩家控制一条鱼吃更小的鱼、与 AI 敌人战斗、升级、解锁技能。

本项目使用 harness 工程方法管理开发流程，通过 5 个核心子系统（Instructions/State/Verification/Scope/Lifecycle）确保开发质量和可维护性。

## 启动规则

写代码之前必须按顺序完成：

1. **阅读本文件** — 理解 agent 角色和边界
2. **阅读 `CLAUDE.md`** — 项目工作流和验证要求
3. **阅读 `docs/ARCHITECTURE.md`** — 理解游戏架构和系统关系
4. **阅读 `docs/PRODUCT.md`** — 理解完整功能需求
5. **阅读 `docs/RELIABILITY.md`** — 理解日志和性能要求
6. **执行 `./init.sh`** — 验证环境健康
7. **阅读 `feature_list.json`** — 查看当前功能状态

## Agent 角色

### 主要 Agent 职责

| Agent | 职责 | 边界 |
|-------|------|------|
| `feature-dev` | 功能开发 | 一个功能一个功能地开发，使用 TDD + sub-agent 驱动 |
| `code-review` | 代码审查 | 审查代码质量、架构边界、测试覆盖 |
| `brainstorming` | 头脑风暴 | 分析问题、设计方案、评估权衡 |

### 协作规则

- **一次只做一个功能** — 从 `feature_list.json` 中精确选一个未完成的功能
- **必须验证** — 未运行验证命令不得声称完成
- **保持范围** — 不修改与当前功能无关的文件
- **harness 文件更新** — 结束会话前更新 `progress.md` 和 `feature_list.json`

## 文档层级

```
docs/
  ARCHITECTURE.md   -- 游戏架构、系统依赖、数据流
  PRODUCT.md        -- 功能需求和用户界面
  RELIABILITY.md    -- 日志、可观测性、clean state
```

添加新功能时，先更新对应文档再写代码。

## 架构边界

- **Scene 层** — 场景控制流和用户交互（BootScene/MenuScene/GameScene/UIScene/GameOverScene）
- **System 层** — 游戏逻辑系统（Battle/Skill/Growth/Combo 等）
- **Entity 层** — 游戏对象（Player/Enemy/BossEnemy/TreasureBox）
- **Config 层** — JSON 配置数据（fish/skills/levels/maps 等）

系统之间通过 DI + 回调接口通信，不直接引用 Phaser 场景。

## 完成定义

一个功能只有在满足以下**全部条件**时才算完成：

- [ ] 目标行为已实现
- [ ] 单元测试通过（`npm test`）
- [ ] E2E 冒烟测试通过（`npx playwright test e2e/smoke.spec.js` 或 Playwright MCP）
- [ ] 运行时无 JavaScript 错误（Console 无 Error）
- [ ] 证据已记录在 `feature_list.json`
- [ ] 文档已更新（`docs/` 中相关文件）
- [ ] 仓库可从标准启动路径重启

### E2E 验证要求

E2E 测试验证游戏完整流程，确保功能可集成：

- **菜单界面** — 登录/注册/游客模式入口正常
- **游戏加载** — Canvas 渲染，场景切换无崩溃
- **核心循环** — 玩家移动、碰撞、吃鱼、升级流程正常
- **UI 响应** — HUD 显示、技能栏、技能使用正常

运行 E2E 验证：
```bash
# 方式 1: Playwright MCP（推荐）
# 在 Claude Code 中使用 browser_* MCP 工具

# 方式 2: 命令行
npx playwright test e2e/smoke.spec.js --project=chromium

# 方式 3: 内置 HTTP server
python3 -m http.server 8765 &
npx playwright test e2e/smoke.spec.js
```

## 可观测性要求

所有系统必须输出结构化日志，支持运行时调试和问题排查。

### 日志规范

使用 `DebugLogger`（`src/systems/DebugLogger.js`），遵循以下级别：

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| **DEBUG** | 常规数据访问、每帧更新 | "Player moved to", "Enemy spawn calculated" |
| **INFO** | 重要事件、功能里程碑 | "Level up to 5", "Boss spawned", "Skill used" |
| **WARN** | 非关键异常、可恢复错误 | "Resource not found, using fallback", "Content missing" |
| **ERROR** | 操作失败、功能崩溃 | "Failed to load fish data", "Collision detection error" |

### 日志格式

```javascript
import { logger } from '../systems/DebugLogger.js';

// 基本用法
logger.debug('Player moved', { x: player.x, y: player.y });
logger.info('Enemy eaten', { fishType: 'clownfish', expGain: 50 });
logger.warn('Sprite missing, using fallback', { fishType: type });
logger.error('Failed to load config', { file: 'fish.json', error: e.message });

// 服务专属 logger
const spawnLogger = logger.forService('SpawnSystem');
spawnLogger.info('Enemy spawned', { type, x, y, aiLevel });
```

### 关键日志点

**GameScene:**
- 游戏开始/结束
- 吃鱼成功（fishType, expGain, newLevel）
- 升级触发（level, skillUnlocked）
- 波次状态切换

**SpawnSystem:**
- 敌鱼创建（type, x, y, aiLevel）
- 刷怪权重（weights, playerLevel）

**CollisionSystem:**
- 碰撞结果（type: eat/damaged, fishType）
- 吃鱼判定（canEat, sizeRatio）

**SkillSystem:**
- 技能使用（skillId, success, cooldownRemaining）
- 冷却完成

### 日志输出目标

| 环境 | 输出 |
|------|------|
| 开发/调试 | Console + 页面内显示 |
| 生产 | Console（可通过 URL 参数开启 DEBUG 模式 `?debug=true`） |

### 调试模式

通过 `window.__GAME_SCENE__` 在浏览器控制台直接访问游戏状态：

```javascript
// 在浏览器控制台
__GAME_SCENE__.waveSystem.getState()     // 查看当前波次
__GAME_SCENE__.enemies.length            // 查看敌鱼数量
__GAME_SCENE__.hp                        // 查看玩家血量
```

## 会话交接

需要多会话完成的功能，使用 `session-handoff.md` 记录：
- 已完成的工作
- 剩余工作
- 任何阻碍或决策
- 修改的文件列表

## Clean State

每次主要测试周期前：

1. 运行 `bash scripts/cleanup-scanner.sh` 检查 stale artifacts
2. 验证 `clean-state-checklist.md` 通过所有检查
3. 运行 `bash scripts/benchmark.sh` 测量性能

## 目录结构

```
src/
├── main.js              # Phaser 配置 + 游戏初始化
├── config/              # JSON 数据文件
├── scenes/              # Phaser 场景
├── entities/            # 游戏对象类
├── systems/             # 游戏逻辑系统
└── ui/                  # UI 组件
```

## 测试策略

| 测试层 | 命令 | 覆盖目标 |
|--------|------|----------|
| 单元测试 | `npm test` | 每个系统的纯逻辑 |
| E2E 冒烟 | `npx playwright test e2e/smoke.spec.js` | 游戏加载 + 基础操作 |
| 全流程 | `./init.sh` | install → test → verify |

## 已知约束

- **PNG 透明度** — 部分水母/章鱼 PNG 背景可能不透明，程序化 fallback 存在
- **浏览器兼容** — 需要 WebGL 支持
- **localStorage** — 认证和用户数据通过 localStorage 持久化