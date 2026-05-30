# CLAUDE.md — 鱼吃鱼 (Fish Eat Fish) 快速参考

本文件为 Claude Code 在本仓库工作时的快速参考。完整规范请读 `AGENTS.md`。

---

## 会话启动（每次必做）

```bash
pwd                          # 确认工作目录
./init.sh                    # 验证环境（必须全部通过）
cat feature_list.json        # 查看功能状态
git log --oneline -5         # 查看近期变更
```

读取顺序：`AGENTS.md` → `CLAUDE.md`（本文件）→ `docs/ARCHITECTURE.md` → `feature_list.json`

---

## 项目概述

**鱼吃鱼** — Phaser.js 3.x HTML5 游戏。单人，俯视角，玩家控制一条鱼吃更小的鱼、升级、解锁技能、挑战 Boss。

**技术栈**：Phaser.js 3.x · Arcade Physics · ES Modules · Jest · Playwright

---

## 关键命令

```bash
npm test                                              # 单元测试（当前 ~730 个）
npm run test:watch                                    # 监听模式
./init.sh                                             # 完整验证（install + test + smoke）
python3 -m http.server 8765                           # 启动本地 HTTP 服务器
npx playwright test e2e/smoke.spec.js --project=chromium  # E2E 冒烟
```

---

## 关键文件

| 文件 | 用途 |
|------|------|
| `src/main.js` | Phaser 游戏配置 + 场景注册 |
| `src/scenes/GameScene.js` | 核心游戏循环（~1800 行） |
| `src/scenes/UIScene.js` | HUD 叠加层（与 GameScene 并行） |
| `src/entities/Enemy.js` | 敌人 AI 状态机（5 种特殊行为） |
| `src/entities/FishFactory.js` | 鱼类精灵工厂（Spine/PNG/程序化） |
| `src/systems/SkillSystem.js` | 技能冷却 + 效果执行 |
| `src/systems/GrowthSystem.js` | 经验值 + 升级 + 技能解锁 |
| `src/systems/WaveSystem.js` | 波次状态机（calm/surge/peak） |
| `src/systems/DebugLogger.js` | 结构化日志（DEBUG/INFO/WARN/ERROR） |
| `src/config/fish.json` | 鱼类配置（HP/速度/大小/克制关系） |
| `src/config/skills.json` | 技能配置（Q/W/E/R） |
| `feature_list.json` | **功能状态真相来源** |
| `progress.md` | 会话连续性日志 |
| `session-handoff.md` | 跨会话交接文档 |

---

## 游戏架构

### 场景流程

```
BootScene → MenuScene → GameScene ←→ UIScene → GameOverScene
                              ↑                       |
                              └───────────────────────┘
                                    (restart)
```

### 层级边界

```
Scene 层 (scenes/)      控制流、用户交互、系统组装
    ↕ DI + 回调
System 层 (systems/)    独立游戏逻辑（尽量无 Phaser 依赖）
    ↕ 参数传递
Entity 层 (entities/)   渲染 + 物理 + 状态存储
    ↕ 只读
Config 层 (config/)     JSON 数据定义
```

### 核心系统

| 系统 | 文件 | 职责 |
|------|------|------|
| GrowthSystem | `systems/GrowthSystem.js` | EXP / 升级 / 连击 |
| SkillSystem | `systems/SkillSystem.js` | Q/W/E/R 技能冷却和执行 |
| WaveSystem | `systems/WaveSystem.js` | 波次状态机（calm→surge→peak） |
| ComboSystem | `systems/ComboSystem.js` | 连击时间窗口倍率 |
| BossSystem | `systems/BossSystem.js` | Boss 战斗流程控制 |
| AudioSystem | `systems/AudioSystem.js` | Web Audio API 合成音效 |
| AchievementSystem | `systems/AchievementSystem.js` | 15 个成就里程碑 |
| FloatingTextSystem | `systems/FloatingTextSystem.js` | 浮动文本（伤害/经验） |
| CollisionSystem | `systems/CollisionSystem.js` | 吃鱼碰撞判定 |
| SpawnSystem | `systems/SpawnSystem.js` | 敌鱼生成逻辑 |
| PlayerControlSystem | `systems/PlayerControlSystem.js` | 键盘/鼠标控制 |
| HealthRegenSystem | `systems/HealthRegenSystem.js` | 脱战回血 |
| ImpactSystem | `systems/ImpactSystem.js` | 打击反馈（震屏/粒子） |
| DebugLogger | `systems/DebugLogger.js` | 结构化日志 |

---

## 游戏机制速查

| 机制 | 规则 |
|------|------|
| **吃鱼** | 玩家体型 > 目标体型 × 1.2 才能吃 |
| **受伤** | 敌人体型 > 玩家体型 × 1.2 时造成伤害 |
| **克制** | `strongAgainst` 定义克制关系（鲨鱼克小鱼等） |
| **升级** | 体型 ×1.5，+20 MaxHP，全满血，检查技能解锁 |
| **技能** | Q=撕咬(Lv1), W=护盾(Lv2), E=加速(Lv4), R=治疗(Lv6) |
| **波次** | calm(8s/2s间隔) → surge(4s/400ms间隔) → peak(3s/2s间隔) |
| **Boss** | Lv5=触手乌贼, Lv10=鲨鱼王, Lv15=海龙 |
| **区域** | 玩家位置决定当前区域，影响敌人等级范围和背景 |

---

## 操控

| 按键 | 动作 |
|------|------|
| 方向键 | 移动 |
| Shift | 加速（速度 ×1.8） |
| Q / W / E / R | 技能（撕咬/护盾/加速/治疗） |
| ESC | 暂停 |
| 鼠标移动/点击 | 替代移动方式 |

---

## 日志规范

```javascript
import { logger } from '../systems/DebugLogger.js';

logger.debug('Enemy spawned', { type, x, y });
logger.info('Level up', { level, skillUnlocked });
logger.warn('Sprite missing, using fallback', { fishType });
logger.error('Failed to load config', { file, error });
```

调试模式（URL 加 `?debug=true`）：
- 页面内显示 Debug Overlay
- `window.__GAME_SCENE__` 暴露到 Console

---

## 工作规则

1. **一次只做一个功能** — 从 `feature_list.json` 精确选一个 `pending` 功能
2. **必须验证才能完成** — 未运行 `npm test` + E2E 不得标记 completed
3. **禁止占位符交付** — 视觉/渲染类必须 E2E 验证，逻辑类必须单元测试 + E2E
4. **保持范围** — 不修改当前功能无关的文件
5. **会话结束前更新** — `progress.md` 和 `feature_list.json` 必须更新
6. **保持干净状态** — 下次会话必须能立即执行 `./init.sh`

---

## 完成定义

- [ ] 目标行为已实现（浏览器手动验证）
- [ ] `npm test` 全部通过
- [ ] E2E 冒烟测试通过（**禁止占位符实现**，除非需求文档明确标注"仅占位"）
- [ ] 浏览器 Console 无 Error
- [ ] `feature_list.json` 已更新（status: "completed" + 证据）
- [ ] 相关 `docs/` 文档已更新
- [ ] `./init.sh` 可干净执行

---

## 交付标准

**核心原则：禁止占位符实现，必须交付真实可用的功能。**

| 情况 | 要求 |
|------|------|
| 视觉/渲染类功能 | 必须 E2E 验证（浏览器看得到） |
| 逻辑/计算类功能 | 必须单元测试 + E2E 验证 |
| 文档/配置类 | 至少人工确认内容正确 |
| 除非需求明确标注 | "占位"、"TBD"、"仅结构" 才可跳过 E2E |

违反此标准的交付会被打回。TDD 先写测试是好的，但测试 GREEN 后必须接 E2E 验证实际效果。

---

## 升级路径

| 情况 | 处理 |
|------|------|
| 架构决策不明确 | 查阅 `docs/ARCHITECTURE.md`，或询问用户 |
| 需求不明确 | 查阅 `docs/PRODUCT.md` 和 `feature_list.json` |
| 测试反复失败 | 更新 `progress.md`，标记 `blocked`，记录阻碍原因 |
| 范围模糊 | 重读 `feature_list.json` 中该功能的完成定义 |

---

## 已知约束

- **ES Modules**：需通过 HTTP server 访问（不能 `file://` 直接打开）
- **PNG 透明度**：部分鱼类 PNG 背景不透明，FishFactory 自动 fallback 程序化绘制
- **WebGL**：需要 WebGL 支持（现代浏览器默认支持）
- **localStorage**：认证和存档通过 localStorage 持久化
