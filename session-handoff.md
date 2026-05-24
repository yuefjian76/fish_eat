# Session Handoff

## Current Objective

- **Goal:** GameScene 架构重构 — 将 70KB/1800+ 行的 GameScene 拆分为 8 个独立系统
- **Current status:** feat-025 E2E 验证框架已完成，开始 feat-026 WaveSystem 提取
- **Active feature:** feat-026（WaveSystem Extraction）

## Completed This Session

- [x] feat-025 E2E Verification Framework — COMPLETED
  - `window.__PHASER_GAME__` exposed in main.js
  - `window.__GAME_SCENE__` exposed in GameScene.js (DEBUG mode `?debug=true`)
  - Debug overlay added showing: `Wave: | HP: | Score: | Lv: | Enemies:`
  - `e2e/smoke.spec.js` created with 7 smoke tests
  - `init.sh` updated (Step 5 E2E note)
  - `./init.sh` passes, 549 tests pass

- [x] feat-026 WaveSystem Extraction — COMPLETED
  - `WaveSystem.js` created with `getState()`, `getSpawnInterval()`, `getTimer()`, `getCurrentPhaseDuration()`, `reset(config)`
  - `WaveSystem.test.js` created with 19 test cases
  - GameScene uses `this.waveSystem.update(delta)` and `this.waveSystem.getSpawnInterval()`
  - Wave indicator preserved via `getTimer()` and `getCurrentPhaseDuration()`
  - Scene restart supported via `waveSystem.reset(config)` in GameScene.init()

- [x] feat-027 SpawnSystem Extraction — COMPLETED
  - `SpawnSystem.js` created with DI WaveSystem, pure logic without Phaser
  - `SpawnSystem.test.js` created with 20 test cases
  - GameScene uses `_doSpawnEnemy()` callback pattern
  - 570 tests pass

## Verification Evidence

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| 单元测试 | `npm test` | 570 passed | - |
| 全流程验证 | `./init.sh` | 通过 | 含 npm install + test + http smoke |

## Files Changed

- `CLAUDE.md` — 重写，中文版，含 startup workflow / working rules / definition of done
- `feature_list.json` — 更新，feat-025~040 为重构新特性
- `progress.md` — 更新，记录当前阶段和架构决策
- `docs/ARCHITECTURE_REFACTOR_PLAN.md` — 新建，完整架构计划

## Architecture Decisions Confirmed

| Module | Decision |
|--------|----------|
| CollisionSystem | Return structured result `{type, fish, expGain, comboMultiplier, score, isLevelUp, canEat}` |
| TreasureSystem | Independent system, `onCollect` callback |
| RangedAttackSystem | Independent system, calls `onEnemyAttack` |
| SpawnSystem ↔ WaveSystem | DI + query interface (`waveSystem.getSpawnInterval()`) |
| SpawnSystem side effects | Callback injection `onEnemyCreated(enemy)` |
| scene.restart() | Each system has `reset(config)` method |
| E2E verification | Playwright MCP + `window.__GAME_SCENE__` exposure |
| State exposure | DEBUG mode `?debug=true` |

## Decisions Made

1. **CollisionSystem 返回结构化 result** — GameScene 通过 `onCollisionResult(result)` 处理所有副作用（屏幕震动、粒子、音效等）
2. **SpawnSystem 用回调注入副作用** — `onEnemyCreated(enemy)` 让 GameScene 处理 boss 检查/音效/粒子
3. **scene.restart() 用 reset(config)** — 每个系统实现 `reset(config)` 方法，GameScene 在 `init()` 中调用
4. **三个 overlap 分开管理** — CollisionSystem（吃鱼）、TreasureSystem（宝箱）、RangedAttackSystem（炮弹）各自独立

## Blockers / Risks

- `session-handoff.md` 缺失（需创建）
- 尚未实施任何 Phase，实际代码可能与计划有偏差

## Next Session Startup

1. Read `CLAUDE.md`
2. Read `docs/ARCHITECTURE_REFACTOR_PLAN.md`
3. Read `feature_list.json` and `progress.md`
4. Run `./init.sh` before editing
5. Start with **feat-028: FloatingTextSystem Extraction** (Phase 2.3)

## Recommended Next Step

**feat-028: FloatingTextSystem Extraction**

Step 1: Create `src/systems/FloatingTextSystem.js` with showDamage(x,y,damage), showExp(x,y,exp), reset(config)
Step 2: Write unit tests for FloatingTextSystem
Step 3: Extract floating text logic from GameScene
Step 4: Update GameScene to use new FloatingTextSystem
Step 5: Verify with npm test + ./init.sh + E2E test
Step 3: Extract spawn logic from GameScene (lines 1077-1087)
Step 4: Update GameScene to use new SpawnSystem (DI with waveSystem)
Step 5: Verify with npm test + ./init.sh + E2E test

---

## Feature Extraction Order (for reference)

```
WaveSystem (feat-026)
  ↓
SpawnSystem (feat-027)
  ↓
FloatingTextSystem (feat-028)
  ↓
CollisionSystem (feat-029)
  ↓
TreasureSystem (feat-030)
  ↓
RangedAttackSystem (feat-031)
  ↓
PlayerControlSystem (feat-032)
  ↓
HealthRegenSystem (feat-033)
  ↓
Bug Fixes (feat-034 ~ feat-036)
  ↓
Camera + Parallax (feat-037)
```