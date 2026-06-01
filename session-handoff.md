# Session Handoff

> **Harness Subsystem**: State — persists context across agent sessions
> Next agent: read this file FIRST, then run `./init.sh` before touching any code.

---

## Current State Snapshot

| Dimension | Status |
|-----------|--------|
| Features | ✅ feat-001 ~ feat-049 completed (49/49) |
| Unit tests | ✅ 855 passing, 0 failed |
| E2E tests | ✅ 23 passing (16 debug-api + 7 smoke) |
| `./init.sh` | ✅ All 5 steps pass |
| E2E | ✅ Browser loads, wave/enemy spawning/BGM/debug-api all work |
| Harness files | ✅ All present (AGENTS/CLAUDE/feature_list/progress/session-handoff/quality/evaluator-rubric/clean-state-checklist/init.sh) |
| Docs | ✅ ARCHITECTURE.md / PRODUCT.md / RELIABILITY.md / PHASE_3_ROADMAP.md all current |
| Active feature | None — Phase 2 complete; Phase 3 selection in PHASE_3_ROADMAP.md |
| Blocking issues | None |

---

## What Was Accomplished (2026-05-30)

### ScrollingWorld Implementation (feat-046 ~ feat-049)

| feat | 内容 | Tests |
|------|------|-------|
| feat-046 | DepthColorMapper 纯函数 + ScrollingBackground 基础层 | 850 total |
| feat-047 | 视差层(0.08/0.25/0.50) + DepthFog + ScrollEdge + BubblePool | 850 total |
| feat-048 | Prng(mulberry32) + DecorationPool(chunk管理,200上限) | 850 total |
| feat-049 | 删除BackgroundExpansion, GameScene→ScrollingBackground, 文档更新 | 850 total |

**新增文件:**
- `src/systems/DepthColorMapper.js` — worldY→颜色/雾/bubble（纯函数）
- `src/systems/ScrollingBackground.js` — 深度渐变+3层视差+DepthFog+ScrollEdge+BubblePool
- `src/systems/DecorationPool.js` — 程序化装饰对象池
- `src/utils/Prng.js` — mulberry32 PRNG
- `src/config/depth_gradient.json` — 深度颜色配置
- `scripts/preprocess_textures.py` — 纹理预处理脚本
- 对应测试文件 × 4

**删除文件:**
- `src/systems/BackgroundExpansion.js`

**关键设计:**
- 世界尺寸: 20000×20000，出生点 (10000, 14000)
- 5 个深度区域: surface/shallow/mid/deep/abyss
- 深度雾: worldY>12000 时 alpha 0→0.65

**Bug 修复:**
- `themeConfig?.name` 空指针 → 添加可选链
- `survivalSeconds` 缩进错误 → 已修复
- `_createTileLayers` Graphics 占位符 → 改为 `add.image` 加载真实纹理

**CLAUDE.md 更新:**
- 新增"交付标准"章节，禁止占位符实现
- 工作规则新增第3条：禁止占位符交付

### feat-044/045 + E2E Debug API (2026-05-30 ~ 2026-05-31)

| feat | 内容 | Tests |
|------|------|-------|
| feat-044 | Type Effectiveness Activation(2.0x 强 / 0.5x 弱,可变 sizeThreshold) | 855 total |
| feat-045 | Skill Synergy System(rush_bite / storm_slash,3s 队列窗口) | 855 total |
| E2E-debug | `window.__DEBUG_API__` 14 methods + 16 E2E tests | 855 unit + 16 E2E |

---

## Feature Completion Summary

| Range | Category | Count | Status |
|-------|----------|-------|--------|
| feat-001 ~ feat-024 | 核心游戏功能 | 24 | ✅ All completed |
| feat-025 ~ feat-033 | 架构重构（8个系统提取） | 9 | ✅ All completed |
| feat-034 ~ feat-040 | 增强功能 | 7 | ✅ All completed |
| feat-041 | 无限地图系统 | 1 | ✅ completed |
| feat-042 | Background Bug Fix | 1 | ✅ completed |
| feat-043 | 技能数值平衡 | 1 | ✅ completed |
| feat-044 | 属性相克激活 | 1 | ⏳ pending |
| feat-045 | 技能协同系统 | 1 | ⏳ pending |
| feat-046 ~ feat-049 | ScrollingWorld | 4 | ✅ All completed |
| **Total** | | **49** | **47 ✅ / 2 ⏳** |

---

## Next Phase Direction

49/49 features complete. Next phase candidates in [`docs/PHASE_3_ROADMAP.md`](docs/PHASE_3_ROADMAP.md)(P0 体验打磨 / P1 动作演出 / P1 群体 AI / P2 极限计时 / P2 无障碍)。

---

## Architecture Decisions (updated)

| Module | Decision |
|--------|----------|
| ScrollingBackground | 使用 `add.image` + `setPosition` 实现视差，而非 TileSprite |
| DepthColorMapper | 纯静态函数，委托给 ScrollingBackground 内部 `_compute*` 方法 |
| DecorationPool | chunk 种子决定装饰分布，同位置可复现 |
| Prng | mulberry32，相同种子相同序列 |

---

## Verification Evidence

| Check | Command | Result |
|-------|---------|--------|
| All unit tests | `./init.sh` | 850 passed, 0 failed |
| E2E browser | Playwright MCP | wave/enemy spawning/BGM OK, no JS Error |
| Syntax check | `node --check src/scenes/GameScene.js` | Pass |

---

## Next Session Startup

```bash
# Step 1: Orient
./init.sh              # must pass before ANY code changes
cat feature_list.json  # check pending features
cat progress.md       # review history
cat docs/PHASE_3_ROADMAP.md   # Phase 3 candidates

# Step 2: Choose work
# Option A: feat-044 属性相克激活
# Option B: feat-045 技能协同系统

# Step 3: Implement + verify + update docs
```
