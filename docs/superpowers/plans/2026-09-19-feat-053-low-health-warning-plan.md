# feat-053 低血量警告强化 — 实施计划

> 日期：2026-09-19 · Spec：`docs/superpowers/specs/2026-09-19-feat-053-low-health-warning-design.md`

## 步骤

### 1. 配置（数据层）

- [x] 新建 `src/config/low_health.json`
- [x] `GameScene.preload()` 加载；`init.sh` Step 4 纳入校验

### 2. 系统（逻辑层，TDD）

- [x] 先写 `src/systems/__tests__/LowHealthWarningSystem.test.js`
- [x] 再写 `src/systems/LowHealthWarningSystem.js`（纯逻辑，无 Phaser 依赖）

### 3. 音频

- [x] `AudioSystem` 新增 `heartbeat` 合成音 + 测试

### 4. 集成（场景层）

- [x] `GameScene`：创建系统、每帧 update 并推送 `UIScene`、`heartbeatDue` 时播音、状态变化打日志
- [x] `GameScene._triggerGameOver()`：清除警告（避免死亡演出期间红光残留）
- [x] `UIScene`：vignette 改为静态绘制 + 只改 alpha；新增"危险"文字；移除旧 tween/脏标记逻辑
- [x] `UIScene.updateUI` 不再自己算 vignette（改由推送驱动）

### 5. 调试能力

- [x] `__DEBUG_API__.damage(n)`（第 16 个方法，`fullHealth()` 的逆操作）
- [x] 更新 `help()` 清单

### 6. 验证

- [x] `npm test` 全绿
- [x] 新建 `e2e/low-health.spec.js` 并通过
- [x] 全量 E2E 无回归
- [x] 截图 + 像素采样确认边缘确实变红

### 7. 收尾

- [x] `ARCHITECTURE.md` / `PRODUCT.md` / `RELIABILITY.md` / `PHASE_3_ROADMAP.md`
- [x] `feature_list.json` feat-053 completed
- [x] `progress.md` / `session-handoff.md` / `CLAUDE.md` / `AGENTS.md` / `quality-document.md` 计数同步

---

## 实施结果（2026-09-19 完成）

**状态**：feat-053 已 completed，全部验证通过。

| 验证项 | 命令 | 结果 |
|--------|------|------|
| 单元测试 | `npm test` | 906 passed / 0 failed（53 suites，1 skipped） |
| E2E（本功能） | `npx playwright test e2e/low-health.spec.js --project=chromium` | 7 passed |
| E2E（全量 ×2） | `npx playwright test --project=chromium --repeat-each=2` | 98 passed，0 flaky |
| 环境 | `./init.sh` | 5/5 steps pass |
| 视觉 | 人工截图 + 像素采样 | 见下 |

**新增/改动文件**

| 文件 | 变更 |
|------|------|
| `src/systems/LowHealthWarningSystem.js` | 新增（纯逻辑，25 单测） |
| `src/config/low_health.json` | 新增（阈值 0.3 / alphaExponent 0.5 / 脉冲 / 心跳 / 文字） |
| `src/systems/__tests__/LowHealthWarningSystem.test.js` | 新增 |
| `src/systems/AudioSystem.js` | 新增 `heartbeat` 合成音（+3 单测） |
| `src/scenes/UIScene.js` | `_drawVignetteStrips()` 一次性绘制 + `updateLowHealthWarning(state)`；新增 `dangerText`；移除旧 tween/脏标记 |
| `src/scenes/GameScene.js` | `_updateLowHealthWarning(delta)` / `_clearLowHealthWarning()` / `__DEBUG_API__.damage(n)` |
| `e2e/low-health.spec.js` | 新增（7 用例） |
| `init.sh` | Step 4 增加 `low_health.json` 校验 |

**计划外但必要的两处修正**（均通过截图发现，E2E 无法捕获）

1. **强度曲线改为 `severity ** 0.5`**：线性曲线在 25% 血量时 alpha 仅 0.13，实战几乎不可见。
2. **暗角条厚度改为短边的 14%**（原为写死 60px）：60px 时渐变收得过窄，视觉上出现生硬色带。

**像素采样证据**（`redness = r - (g+b)/2`，左边缘 / 画面中心）

| 状态 | 左边缘 | 中心 |
|------|--------|------|
| 满血 | -169.5 | 158.0 |
| 25% | -90.0 | 162.0 |
| 22% | -68.5 | 154.0 |
| 12%（critical） | -50.0 | 155.0 |

中心像素基本不变 → 暗角没有把画面泛白，玩家仍能清晰辨认敌鱼。
截图：`/tmp/lh-0-full.png`、`/tmp/lh-1-warn.png`、`/tmp/lh-1b-warn22.png`、`/tmp/lh-2-critical.png`。
