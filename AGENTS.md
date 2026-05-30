# AGENTS.md — 鱼吃鱼 (Fish Eat Fish)

## 项目概述

**鱼吃鱼** 是一款基于 Phaser.js 3.x 的单人 HTML5 游戏。玩家控制一条鱼在无限海洋世界中吃更小的鱼、与 AI 敌人战斗、升级成长、解锁技能，并挑战 3 个阶段性 Boss。

本项目采用 **Harness 工程方法**，通过 5 个子系统确保多会话开发的可靠性和可维护性。

---

## Harness 架构：5 个子系统

```
┌─────────────────────────────────────────────────────────────┐
│                        THE HARNESS                          │
│                                                             │
│  ┌──────────────────┐   ┌──────────────────────────────┐   │
│  │   Instructions   │   │           State              │   │
│  │                  │   │                              │   │
│  │  AGENTS.md       │   │  progress.md                 │   │
│  │  CLAUDE.md       │   │  feature_list.json           │   │
│  │  docs/           │   │  session-handoff.md          │   │
│  │  feature_list    │   │  git log                     │   │
│  └──────────────────┘   └──────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐   ┌──────────────────────────────┐   │
│  │   Verification   │   │           Scope              │   │
│  │                  │   │                              │   │
│  │  npm test        │   │  一次只做一个功能            │   │
│  │  ./init.sh       │   │  feature_list.json 边界      │   │
│  │  E2E smoke       │   │  完成定义明确                │   │
│  │  browser check   │   │                              │   │
│  └──────────────────┘   └──────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Session Lifecycle                   │  │
│  │                                                      │  │
│  │  init.sh 启动 → 选一个功能 → 实现 → 验证 → 更新状态  │  │
│  │  clean-state-checklist.md → 提交 → 交接文档          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 子系统 1：Instructions（指令系统）

### 启动规则

写代码之前，**必须按顺序完成**：

1. **阅读本文件** — 理解 harness 架构和 agent 边界
2. **阅读 `CLAUDE.md`** — 获取快速参考（架构、命令、关键文件）
3. **阅读 `docs/ARCHITECTURE.md`** — 理解游戏架构和系统关系
4. **阅读 `docs/PRODUCT.md`** — 理解完整功能需求和游戏机制
5. **阅读 `docs/RELIABILITY.md`** — 理解日志规范和可观测性要求
6. **执行 `./init.sh`** — 验证环境健康（必须全部通过）
7. **阅读 `feature_list.json`** — 查看当前功能状态，选择目标功能

如果 `./init.sh` 有步骤失败，**先修复再开始新功能**。

### 文档层级

```
docs/
  ARCHITECTURE.md   -- 游戏架构、系统关系、实体模式、数据流
  PRODUCT.md        -- 游戏功能需求、操控说明、UI 布局
  RELIABILITY.md    -- 日志规范、可观测性、clean state 要求
```

添加新功能时，先更新对应文档再写代码。

### Agent 角色

| Agent | 职责 | 边界 |
|-------|------|------|
| `feature-dev` | 功能开发 | 一次一个功能，TDD 驱动，验证通过才算完成 |
| `code-review` | 代码审查 | 审查架构边界、测试覆盖、日志规范 |
| `brainstorming` | 方案设计 | 分析问题、设计架构、评估权衡，不写代码 |

---

## 子系统 2：State（状态系统）

状态文件是跨会话连续性的唯一来源。每个会话结束必须更新。

| 文件 | 用途 | 更新时机 |
|------|------|---------|
| `feature_list.json` | 所有功能的状态（pending/in_progress/completed）和证据 | 每次完成或开始一个功能 |
| `progress.md` | 会话日志，记录已完成、进行中、下一步 | 每个会话结束 |
| `session-handoff.md` | 跨会话交接，记录决策、阻碍、修改文件 | 多会话功能结束时 |

### `feature_list.json` 状态规范

```json
{
  "id": "feat-001",
  "name": "功能名称",
  "status": "completed",
  "evidence": "npm test 通过，具体证据描述",
  "completedAt": "2026-05-29"
}
```

状态值：`pending` | `in_progress` | `completed` | `blocked`

---

## 子系统 3：Verification（验证系统）

**没有通过验证，不得声称功能完成。**

### 验证命令

```bash
# 标准验证（必须通过）
./init.sh

# 单独运行
npm test                                           # 单元测试
npx playwright test e2e/smoke.spec.js --project=chromium  # E2E 冒烟
python3 -m http.server 8765 &                      # 启动本地服务器
```

### 完成定义 (Definition of Done)

一个功能只有满足以下**全部条件**才算完成：

- [ ] 目标行为已实现，在浏览器中手动验证
- [ ] 单元测试通过（`npm test` 全绿）
- [ ] E2E 冒烟测试通过（7 个测试全部通过）
- [ ] 运行时无 JavaScript 错误（浏览器 Console 无 Error）
- [ ] `feature_list.json` 中状态更新为 `completed`，并记录证据
- [ ] 相关 `docs/` 文档已更新
- [ ] 仓库可从 `./init.sh` 干净重启

### E2E 验证范围

E2E 冒烟测试（`e2e/smoke.spec.js`）覆盖：

- 游戏页面正常加载（无 JS 错误）
- Phaser Canvas 正常渲染
- 菜单界面元素可见
- 游戏场景可以启动
- 玩家对象存在于场景中
- Debug overlay 在 `?debug=true` 模式下显示
- `window.__GAME_SCENE__` 暴露正常

---

## 子系统 4：Scope（范围系统）

### 核心规则

- **一次只做一个功能** — 从 `feature_list.json` 精确选取一个 `pending` 状态的功能
- **不修改无关文件** — 当前功能之外的文件，不得修改
- **不重写 feature list** — 不通过修改 feature_list.json 来掩盖未完成的工作
- **不跳步骤** — 必须完成验证才能标记完成

### 架构边界（不得跨层）

```
Scene 层 (scenes/)
  ↕ 通过 DI + 回调通信
System 层 (systems/)
  ↕ 通过参数传递
Entity 层 (entities/)
  ↕ 只读配置
Config 层 (config/*.json)
```

| 层级 | 职责 | 不应包含 |
|------|------|---------|
| **Scene** | 场景控制流、用户交互、系统组装 | 具体游戏逻辑 |
| **System** | 独立游戏逻辑（无 Phaser 依赖为佳） | 直接操作 Scene |
| **Entity** | 渲染 + 物理 + 状态存储 | 游戏规则判断 |
| **Config** | JSON 数据定义 | 代码逻辑 |

系统间通信模式：
- **DI 注入**：构造函数传入依赖（如 `new SpawnSystem(waveSystem)`）
- **回调接口**：副作用通过回调传出（如 `onEnemyCreated(enemy)`）
- **查询接口**：只读查询（如 `waveSystem.getSpawnInterval()`）

### 功能选择流程

```
1. 读 feature_list.json
2. 找第一个 status: "pending" 的功能
3. 确认依赖功能已 completed
4. 将状态改为 "in_progress"
5. 实现功能
6. 通过验证
7. 将状态改为 "completed"，记录证据
```

---

## 子系统 5：Session Lifecycle（会话生命周期）

### 会话启动流程

```
START
│
├── 1. 读 AGENTS.md（本文件）
├── 2. 读 CLAUDE.md（快速参考）
├── 3. 读 session-handoff.md（上次遗留了什么）
├── 4. 读 progress.md（历史进度）
├── 5. 执行 ./init.sh（验证环境）
├── 6. 读 feature_list.json（选择目标功能）
└── 7. 查看 git log --oneline -5（近期变更）

SELECT
│
└── 选择唯一一个 pending 功能开始工作

EXECUTE
│
├── 实现功能
├── 运行 npm test（单元测试）
├── 运行 E2E smoke test
├── 浏览器验证（无 Console Error）
└── 记录验证证据

WRAP UP（会话结束前必做）
│
├── 更新 feature_list.json（状态 + 证据）
├── 更新 progress.md（本次会话记录）
├── 更新 session-handoff.md（如果功能跨会话）
├── git commit（只在验证通过后）
└── 确保 ./init.sh 可干净执行
```

### 会话结束检查

结束前确认：
1. `npm test` 全部通过
2. `feature_list.json` 已更新
3. `progress.md` 已追加本次记录
4. 无意外文件在 `git status`
5. 下一个会话可以立即执行 `./init.sh`

---

## 可观测性规范

所有系统必须使用 `DebugLogger`（`src/systems/DebugLogger.js`）输出结构化日志。

### 日志级别

| 级别 | 使用场景 |
|------|---------|
| `DEBUG` | 每帧更新、常规数据访问 |
| `INFO` | 重要事件里程碑（升级、Boss 出现、技能使用） |
| `WARN` | 非关键异常、可恢复错误（资源缺失用 fallback） |
| `ERROR` | 功能崩溃、关键操作失败 |

### 关键日志点

```javascript
// GameScene
logger.info('Game started', { difficulty, fishType, initialEnemies });
logger.info('Fish eaten', { fishType, expGain, newLevel, combo });
logger.info('Level up', { level, skillUnlocked, newMaxHp });
logger.info('Boss spawned', { bossType, playerLevel });
logger.info('Game over', { score, level, kills, survivalTime });

// SpawnSystem / Enemy
logger.debug('Enemy spawned', { type, x, y, aiLevel, enemyLevel });
logger.debug('AI state change', { fishType, from, to });

// SkillSystem
logger.info('Skill used', { skillId, success, cooldownRemaining });
```

### 调试模式

通过 URL 参数 `?debug=true` 启用：
- 页面内 Debug Overlay（Wave / HP / Score / Lv / Enemies）
- `window.__GAME_SCENE__` 暴露到浏览器控制台

```javascript
// 浏览器控制台调试
window.__GAME_SCENE__.waveSystem.getState()   // 当前波次状态
window.__GAME_SCENE__.enemies.length          // 当前敌鱼数量
window.__GAME_SCENE__.hp                      // 玩家当前血量
window.__GAME_SCENE__.level                   // 玩家等级
```

---

## 目录结构

```
fish_eat/
├── AGENTS.md              # ← 你在这里（harness 主文件）
├── CLAUDE.md              # 快速参考（Claude Code 专用）
├── init.sh                # 标准启动和验证脚本
├── feature_list.json      # 功能状态追踪（真相来源）
├── progress.md            # 会话连续性日志
├── session-handoff.md     # 跨会话交接文档
├── clean-state-checklist.md  # 提交前检查清单
├── evaluator-rubric.md    # 评分标准文档
├── quality-document.md    # 质量评估汇总
├── docs/
│   ├── ARCHITECTURE.md    # 游戏架构说明
│   ├── PRODUCT.md         # 产品功能说明
│   └── RELIABILITY.md     # 日志和可靠性规范
├── src/
│   ├── main.js            # Phaser 配置 + 游戏初始化
│   ├── config/            # JSON 数据配置（fish/skills/levels 等）
│   ├── scenes/            # Phaser 场景（Boot/Menu/Game/UI/GameOver/Shop）
│   ├── entities/          # 游戏对象（Enemy/BossEnemy/TreasureBox/FishFactory）
│   ├── systems/           # 游戏逻辑系统（20+ 独立系统）
│   ├── constants/         # 全局常量（DepthLayers/WorldConfig）
│   └── ui/                # UI 组件（SkillBar）
├── tests/                 # 测试文件
├── e2e/                   # E2E 冒烟测试（Playwright）
└── __mocks__/             # Jest mock 文件
```

---

## 已知约束

| 约束 | 说明 | 处理方式 |
|------|------|---------|
| PNG 透明度 | 部分鱼类 PNG 背景不透明 | FishFactory 自动 fallback 为程序化绘制 |
| WebGL 依赖 | 需要 WebGL 支持才能运行 | 现代浏览器均支持 |
| localStorage | 认证和用户数据通过 localStorage 持久化 | 跨页面刷新保留会话 |
| GameScene 体量 | GameScene.js ~1800 行（已提取 8 个系统） | 架构边界已清晰，继续按需提取 |
| ES Modules | 浏览器端 ES module，无构建步骤 | 需通过 HTTP server 访问（不能 file://） |
