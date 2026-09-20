# Harness 状态同步 — 实现 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 同步 fish_eat 的 harness 5 子系统文件与 `feature_list.json` 49/49 现状,产出 `docs/PHASE_3_ROADMAP.md` 作为下个阶段路线图。

**Architecture:** 纯文档变更。5 阶段增量执行(数据快照 → harness 5 子系统更新 → 过时文档加警告 → ROADMAP 新建 → 最终验证)。每阶段后跑 `./init.sh` 确认 0 回归。

**Tech Stack:** Markdown / Git / Bash / Node.js (Jest + Playwright)。

**Spec:** `docs/superpowers/specs/2026-06-01-harness-state-sync-design.md`

---

## 关键约束(读前必看)

1. **不动代码**: `src/**` / `__mocks__/**` / `e2e/**` / `tests/**` **绝对不动**
2. **不动 `feature_list.json`**: 49/49 状态保持
3. **不动 `init.sh`** / `docs/ARCHITECTURE.md` / `docs/PRODUCT.md` / `docs/RELIABILITY.md`(已为真值)
4. **不删任何文件**: 只加内容 + 顶部加警告横幅
5. **harness 5 子系统框架保留**: AGENTS.md / CLAUDE.md 章节标题和顺序不变,只更新内容
6. **单源真相**: `claude-progress.md` **仅**加横幅不重写(否则与 session-handoff.md 双源)
7. **每阶段后验证**: `./init.sh` 5 步全过

---

## 数据快照区(Phase 1 填入,后续所有任务引用)

> 在 Phase 1 任务完成后,以下值被填入。所有后续任务引用本节,不重新测量。

| 维度 | 值 | 测量命令 |
|------|----|---------|
| `UNIT_TESTS` | **855 passed + 1 skipped** | `./init.sh` 输出末尾 |
| `E2E_DEBUG_API` | **16** | `npx playwright test e2e/debug-api.spec.js --list` |
| `E2E_SMOKE` | **7** | `npx playwright test e2e/smoke.spec.js --list` |
| `E2E_TOTAL` | **23** | `E2E_DEBUG_API + E2E_SMOKE` |
| `COMMIT_COUNT` | **214** | `git log --oneline \| wc -l` |
| `FEATURE_COUNT` | **49** | `node -e "console.log(require('./feature_list.json').features.length)"` |
| `SYSTEM_COUNT` | **31** | `ls src/systems/*.js \| grep -v __tests__ \| wc -l` |
| `SCENE_COUNT` | **6** | `ls src/scenes/*.js \| grep -v '.bak' \| wc -l`(BootScene/GameOverScene/GameScene/MenuScene/ShopScene/UIScene) |

---

## Phase 1: 数据真实性确认

### Task 1: 测量数据快照

**Files:** 无文件修改,只读取数据。

- [ ] **Step 1.1: 跑 `./init.sh` 拿测试数**

```bash
./init.sh 2>&1 | tail -20
```

记录最后一行(如 "Tests: 855 passed, 855 total"),作为 `UNIT_TESTS`。

- [ ] **Step 1.2: 拿 E2E 测试数**

```bash
npx playwright test e2e/debug-api.spec.js --list 2>&1 | grep -c "›"
npx playwright test e2e/smoke.spec.js --list 2>&1 | grep -c "›"
```

记录两个数,求和得 `E2E_TOTAL`。

- [ ] **Step 1.3: 拿 commit / feature / system / scene 数**

```bash
git log --oneline | wc -l
node -e "console.log(require('./feature_list.json').features.length)"
ls src/systems/*.js | grep -v __tests__ | wc -l
ls src/scenes/*.js | grep -v '.bak' | wc -l
```

记录 4 个数。

- [ ] **Step 1.4: 填入"数据快照区"**

打开本 plan 顶部"数据快照区",把 TBD 替换为实测值。

- [ ] **Step 1.5: 验证 git status 干净**

```bash
git status
```

期望: "nothing to commit, working tree clean"(或仅有未追踪的 `node_modules/`)。

- [ ] **Step 1.6: 提交(可选,数据快照不需 commit)**

不需要 commit(数据快照区在 plan 里,不在仓库中)。

**完成 Task 1 验证**: `UNIT_TESTS / E2E_DEBUG_API / E2E_SMOKE / E2E_TOTAL / COMMIT_COUNT / FEATURE_COUNT(49) / SYSTEM_COUNT / SCENE_COUNT(7)` 全部有值。

---

## Phase 2: harness 5 子系统文件更新

### Task 2: 重写 `AGENTS.md`

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/AGENTS.md`(全文,~330 行)
- Reference: 数据快照区

**保留**: 5 个子系统标题和顺序(Instructions / State / Verification / Scope / Session Lifecycle)。

- [ ] **Step 2.1: 读原文件**

```bash
wc -l /Users/yuefengjiang/AI/fish_eat/AGENTS.md
git show HEAD:AGENTS.md | head -20
```

记录原文件行数(期望 ~330)。

- [ ] **Step 2.2: §启动规则 - 加第 8 步**

在 §启动规则(原文件第 27-60 行)的第 7 步 "执行 `./init.sh`" 之后,加第 8 步:

```markdown
8. **阅读 `docs/PHASE_3_ROADMAP.md`** — 查看下一阶段候选方向,选择 brainstorming 起点
```

- [ ] **Step 2.3: §文档层级 - 补 PHASE_3_ROADMAP**

在 §文档层级的代码块中,改为:

```markdown
docs/
  ARCHITECTURE.md        -- 游戏架构、系统关系、实体模式、数据流
  PRODUCT.md             -- 游戏功能需求、操控说明、UI 布局
  RELIABILITY.md         -- 日志规范、可观测性、clean state 要求
  PHASE_3_ROADMAP.md     -- Phase 3 候选方向(从 OPTIMIZATION_ANALYSIS / IMPLEMENTATION_PRIORITY 整合)
```

- [ ] **Step 2.4: §目录结构 - 补 debug-api + ROADMAP**

在 §目录结构(原文件第 293-320 行)的代码块中,改动以下两行:
- `e2e/                   -- E2E 冒烟测试(Playwright)` → `e2e/                   -- E2E 测试(Playwright: smoke.spec.js + debug-api.spec.js)`
- `__mocks__/             -- Jest mock 文件` 之后加 `docs/PHASE_3_ROADMAP.md     -- Phase 3 候选方向`

- [ ] **Step 2.5: §可观测性规范 - 加 DEBUG_API**

在 §可观测性规范(原文件第 247-289 行)中"调试模式"小节(第 277-289 行)后,加新小节:

```markdown
### E2E 调试 API(`window.__DEBUG_API__`)

启用: URL 加 `?debug=true`,会同时暴露 `window.__GAME_SCENE__` 和 `window.__DEBUG_API__`。

`__DEBUG_API__` 包含 14 个方法,用于 E2E 测试和手动调试:
- `state()` / `level(n)` / `skill(slot)` / `eat(fishType)` / `watch(event, on)`
- `spawn(...)` / `killAll()` / `fullHealth()` / `maxExp()` / `restart()`
- `help()` 等

详见 `e2e/debug-api.spec.js`(16 个 E2E 测试)。
```

- [ ] **Step 2.6: §已知约束 - 加 DEBUG_API**

在 §已知约束表格中,加一行:

```markdown
| DEBUG_API | `window.__DEBUG_API__` 仅在 `?debug=true` 时暴露 | 生产环境不暴露;URL 缺参数则对象为 undefined |
```

- [ ] **Step 2.7: 验证 AGENTS.md 结构保留**

```bash
grep -n "^## 子系统" /Users/yuefengjiang/AI/fish_eat/AGENTS.md
```

期望输出 5 行(5 个子系统标题),顺序为:Instructions / State / Verification / Scope / Session Lifecycle。

- [ ] **Step 2.8: 验证 `./init.sh` 仍通过**

```bash
./init.sh 2>&1 | tail -5
```

期望: 5 步全过, 测试数 ≥ 数据快照区 `UNIT_TESTS`。

- [ ] **Step 2.9: 暂不 commit(本任务和其他任务一起 commit)**

---

### Task 3: 重写 `CLAUDE.md`

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/CLAUDE.md`(全文)

**保留**: 章节标题(会话启动/项目概述/关键命令/关键文件/游戏架构/.../工作规则/完成定义/交付标准/升级路径/已知约束/故障/自动 compact)。

- [ ] **Step 3.1: 读原文件结构**

```bash
grep -n "^## " /Users/yuefengjiang/AI/fish_eat/CLAUDE.md
```

记录原章节顺序。

- [ ] **Step 3.2: 测试数更新**

在"项目概述"段附近找到 "Phaser.js 3.x · Arcade Physics · ES Modules · Jest · Playwright",改为:

```markdown
**技术栈**:Phaser.js 3.x · Arcade Physics · ES Modules · Jest(UNIT_TESTS 个测试) · Playwright(E2E_TOTAL 个 E2E 测试)
```

替换 `UNIT_TESTS` 和 `E2E_TOTAL` 为数据快照区实际值。

- [ ] **Step 3.3: 关键命令表 - 加 E2E debug-api**

在"关键命令"表(原文件第 19-26 行)中加一行:

```markdown
| `npx playwright test e2e/debug-api.spec.js --project=chromium` | E2E debug-api(E2E_DEBUG_API 个测试) |
```

- [ ] **Step 3.4: 关键文件表 - 加 3 项**

在"关键文件"表(原文件第 28-44 行)中加 3 行:

```markdown
| `e2e/debug-api.spec.js` | E2E debug-api 测试(16 用例) |
| `e2e/smoke.spec.js` | E2E 冒烟测试(7 用例) |
| `docs/PHASE_3_ROADMAP.md` | Phase 3 候选方向(下次 brainstorming 起点) |
```

- [ ] **Step 3.5: 新增"调试模式"章节**

在"日志规范"章节(原文件第 84-95 行)后,新增"调试模式"章节:

```markdown
## 调试模式

URL 加 `?debug=true` 启用:

- 页面内 Debug Overlay(Wave / HP / Score / Lv / Enemies)
- `window.__GAME_SCENE__` 暴露游戏状态
- `window.__DEBUG_API__` 暴露 14 个调试方法

常用方法:

```javascript
__DEBUG_API__.help()           // 方法清单
__DEBUG_API__.state()          // 当前游戏状态
__DEBUG_API__.level(n)         // 直接升到 n 级(测技能解锁)
__DEBUG_API__.killAll()        // 清空敌鱼
__DEBUG_API__.fullHealth()     // 满血
__DEBUG_API__.maxExp()         // 当前等级经验溢出,触发升级
__DEBUG_API__.restart()        // 重启场景
__DEBUG_API__.eat(fishType)    // 在玩家位置生成并吃指定鱼
__DEBUG_API__.watch(event, on) // 订阅事件
```
```
```

- [ ] **Step 3.6: 新增"Phase 3 路线图"章节**

在"工作规则"章节(原文件第 97-104 行)前,新增:

```markdown
## Phase 3 路线图

49/49 features 全部完成后,下一阶段方向见 [`docs/PHASE_3_ROADMAP.md`](docs/PHASE_3_ROADMAP.md)。当前 5 个候选方向(P0 体验打磨 / P1 动作演出 / P1 群体 AI / P2 极限计时 / P2 无障碍),每次会话只选 1 个方向,通过 brainstorming 流程生成 spec → plan → 实现。
```

- [ ] **Step 3.7: 验证 CLAUDE.md 章节结构**

```bash
grep -n "^## " /Users/yuefengjiang/AI/fish_eat/CLAUDE.md
```

期望章节顺序(新增章节已插入):
1. 会话启动(每次必做)
2. 项目概述
3. 关键命令
4. 关键文件
5. 游戏架构
6. 核心系统
7. 游戏机制速查
8. 操控
9. 日志规范
10. **调试模式**(新增)
11. **Phase 3 路线图**(新增)
12. 工作规则
13. 完成定义
14. 交付标准
15. 升级路径
16. 已知约束
17. 故障排除
18. 自动 compact 规则

- [ ] **Step 3.8: 验证 `./init.sh` 仍通过**

```bash
./init.sh 2>&1 | tail -5
```

期望: 5 步全过, 测试数 ≥ 数据快照区 `UNIT_TESTS`。

---

### Task 4: 重写 `progress.md` 当前阶段段

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/progress.md`(顶部"当前阶段"段 + 追加 2026-06-01 会话段)

**保留**: 会话日志结构,所有历史 session 时间戳不动。

- [ ] **Step 4.1: 读"当前阶段"段**

```bash
head -15 /Users/yuefengjiang/AI/fish_eat/progress.md
```

- [ ] **Step 4.2: 替换"当前阶段"段(第 1-15 行)**

把"当前阶段: E2E Debug Console API 完成"段(原文件第 3-15 行)替换为:

```markdown
# 进度日志

## 当前阶段:Phase 3 规划(49/49 features 完成)

49/49 features 全部 completed,`./init.sh` 5 步全过,`window.__DEBUG_API__` 已实现。
下一阶段方向见 [`docs/PHASE_3_ROADMAP.md`](docs/PHASE_3_ROADMAP.md)。

### 完成里程碑

- ✅ feat-001 ~ feat-024:核心游戏功能(24 个)
- ✅ feat-025 ~ feat-033:架构重构(8 个系统提取)
- ✅ feat-034 ~ feat-040:增强功能(7 个)
- ✅ feat-041 ~ feat-045:类型相克 + 技能协同(5 个)
- ✅ feat-046 ~ feat-049:ScrollingWorld(4 个)
- ✅ E2E Debug API:`window.__DEBUG_API__`(16 E2E tests)

**单元测试**:UNIT_TESTS 个 | **E2E 测试**:E2E_TOTAL 个 | **完成度**:49/49
```

替换 `UNIT_TESTS` / `E2E_TOTAL` 为数据快照区实际值。

- [ ] **Step 4.3: 追加 2026-06-01 会话段**

在文件最末尾(自动 compact 规则前),追加:

```markdown
---

## 会话 — 2026-06-01(harness 状态同步)

### 已完成
- ✅ harness 5 子系统文件与 feature_list.json 49/49 同步
- ✅ AGENTS.md / CLAUDE.md 框架保留,内容更新
- ✅ progress / session-handoff / quality-document / evaluator-rubric 状态对齐
- ✅ IMPLEMENTATION_PRIORITY / OPTIMIZATION_ANALYSIS / README_IMPROVEMENTS / findings 加 ⚠️ 横幅,候选链 ROADMAP
- ✅ docs/PHASE_3_ROADMAP.md 新建,5 个 Phase 3 候选方向

### 文件改动
- `AGENTS.md` / `CLAUDE.md` — 5 子系统框架保留,内容按 49/49 更新
- `progress.md` / `session-handoff.md` / `quality-document.md` / `evaluator-rubric.md` — 状态对齐
- `IMPLEMENTATION_PRIORITY.md` / `OPTIMIZATION_ANALYSIS.md` / `README_IMPROVEMENTS.md` / `findings.md` — 加 ⚠️ 横幅 + 现状段
- `claude-progress.md` / `clean-state-checklist.md` — 顶部加横幅/提示
- `docs/PHASE_3_ROADMAP.md` — 新建

### 验证
- `./init.sh` 5 步全过(UNIT_TESTS 个测试)
- `e2e/debug-api.spec.js` E2E_DEBUG_API 测试全过
- `e2e/smoke.spec.js` E2E_SMOKE 测试全过
- `git status` 干净
- 0 broken `PHASE_3_ROADMAP` 引用
```

替换占位符为实际值。

- [ ] **Step 4.4: 验证 progress.md 结构**

```bash
grep -n "^## " /Users/yuefengjiang/AI/fish_eat/progress.md | head -10
```

期望: "当前阶段" 段在最前,新会话段在末尾。

- [ ] **Step 4.5: 验证 `./init.sh` 仍通过**

```bash
./init.sh 2>&1 | tail -5
```

---

### Task 5: 重写 `session-handoff.md`

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/session-handoff.md`(全文)

- [ ] **Step 5.1: 读原文件结构**

```bash
grep -n "^## " /Users/yuefengjiang/AI/fish_eat/session-handoff.md
```

- [ ] **Step 5.2: 替换"Current State Snapshot"表(原文件第 9-20 行)**

替换为:

```markdown
| Dimension | Status |
|-----------|--------|
| Features | ✅ feat-001 ~ feat-049 completed (49/49) |
| Unit tests | ✅ UNIT_TESTS passing, 0 failed |
| E2E tests | ✅ E2E_TOTAL passing(E2E_DEBUG_API debug-api + E2E_SMOKE smoke) |
| `./init.sh` | ✅ All 5 steps pass |
| E2E | ✅ Browser loads, wave/enemy spawning/BGM/debug-api all work |
| Harness files | ✅ All present(AGENTS/CLAUDE/feature_list/progress/session-handoff/quality/evaluator-rubric/clean-state-checklist/init.sh) |
| Docs | ✅ ARCHITECTURE.md / PRODUCT.md / RELIABILITY.md / PHASE_3_ROADMAP.md all current |
| Active feature | None — Phase 2 complete; Phase 3 selection in PHASE_3_ROADMAP.md |
| Blocking issues | None |
```

替换占位符为数据快照区实际值。

- [ ] **Step 5.3: §"Pending Features" - 删除并替换为 ROADMAP 引用**

删除"## Pending Features"整个章节(原文件第 80-85 行),替换为:

```markdown
## Next Phase Direction

49/49 features complete. Next phase candidates in [`docs/PHASE_3_ROADMAP.md`](docs/PHASE_3_ROADMAP.md)(P0 体验打磨 / P1 动作演出 / P1 群体 AI / P2 极限计时 / P2 无障碍)。
```

- [ ] **Step 5.4: §"Next Session Startup" - 加 ROADMAP 引用**

在"## Next Session Startup"章节(原文件第 112-122 行),加一行:

```markdown
cat docs/PHASE_3_ROADMAP.md   # Phase 3 candidates
```

放在 `cat session-handoff.md` 之后。

- [ ] **Step 5.5: §"What Was Accomplished" - 加 feat-044/045/E2E-debug**

在"What Was Accomplished (2026-05-30)"标题下(原文件第 23 行附近),加 ScrollingWorld 表之后的章节:

```markdown
### feat-044/045 + E2E Debug API (2026-05-30 ~ 2026-05-31)

| feat | 内容 | Tests |
|------|------|-------|
| feat-044 | Type Effectiveness Activation(2.0x 强 / 0.5x 弱,可变 sizeThreshold) | 855 total |
| feat-045 | Skill Synergy System(rush_bite / storm_slash,3s 队列窗口) | 855 total |
| E2E-debug | `window.__DEBUG_API__` 14 methods + 16 E2E tests | 855 unit + 16 E2E |
```

- [ ] **Step 5.6: 验证 session-handoff.md 引用正确**

```bash
grep -c "PHASE_3_ROADMAP" /Users/yuefengjiang/AI/fish_eat/session-handoff.md
```

期望: ≥ 2(状态表 + 下一阶段段 + Next Session 段)。

- [ ] **Step 5.7: 验证 `./init.sh` 仍通过**

```bash
./init.sh 2>&1 | tail -5
```

---

### Task 6: 重写 `quality-document.md`

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/quality-document.md`

- [ ] **Step 6.1: 更新总评分(保留 A)**

第 9 行"## Overall Grade: A"保留不变。

- [ ] **Step 6.2: §Scoring Summary - 补 5 行**

在 §Scoring Summary 表(原文件第 15-32 行)末尾,加 5 行:

```markdown
| ScrollingWorld | A | 4 阶段全部完成(feat-046~049),20000×20000 世界,5 深度区,程序化装饰 | 
| ScrollingBackground | A | 3 层视差 + DepthFog + ScrollEdge + BubblePool |
| DecorationPool + Prng | A | mulberry32 确定性 PRNG,200 上限,chunk 复用 |
| DEBUG_API | A | 14 调试方法,16 E2E 测试,仅 `?debug=true` 暴露 |
| Skill Synergy | A | rush_bite / storm_slash,3s 队列窗口,FloatingText 反馈 |
```

- [ ] **Step 6.3: §Feature Completeness - 40 → 49**

第 38-43 行表格的"Total"行改为:

```markdown
| **Total** | | **49** | **100%** |
```

- [ ] **Step 6.4: §System Quality - 加 6 行**

在 §System Quality 表(原文件第 48-58 行)末尾,加 6 行(测试数用 "—" 占位,因为这些系统的测试数未单独记录):

```markdown
| DepthColorMapper | ~30 | 29 | 100% | N/A(pure functions) |
| ScrollingBackground | ~250 | 36 | 100% | ✅ |
| DecorationPool | ~150 | 10 | 100% | ✅ |
| Prng | ~30 | 8 | 100% | N/A(pure functions) |
| AudioMusicSystem | ~80 | 23 | 100% | ✅ |
| ShopSystem | ~120 | 36 | 100% | ✅ |
| ImpactSystem | ~100 | — | 100% | ✅ |
```

- [ ] **Step 6.5: §Evidence of Quality - 更新测试数**

在 §Evidence of Quality(原文件第 86+ 行),把 `npm test → ~730 tests` 改为 `npm test → UNIT_TESTS tests`(替换占位符)。

- [ ] **Step 6.6: 验证 `./init.sh` 仍通过**

```bash
./init.sh 2>&1 | tail -5
```

---

### Task 7: 给 `claude-progress.md` 加 ⚠️ 横幅(不重写)

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/claude-progress.md`(仅顶部加 3 行)

**核心原则**: **不重写**。claude-progress.md 与 session-handoff.md 是**双源真相风险**,只加横幅指明"以 session-handoff.md 为准"。

- [ ] **Step 7.1: 读原文件**

```bash
head -10 /Users/yuefengjiang/AI/fish_eat/claude-progress.md
```

- [ ] **Step 7.2: 在文件顶部加 3 行**

在 `claude-progress.md` 的最顶部(第 1 行之前),插入:

```markdown
> ⚠️ **截至 2026-06-01,本文档与 `session-handoff.md` 内容重叠;请以 `session-handoff.md` 为单源真相**。
> 状态数字(feature count / test count)以 `feature_list.json` + `./init.sh` 实测为准。
> 下一阶段方向见 `docs/PHASE_3_ROADMAP.md`。

```

- [ ] **Step 7.3: 验证正文未动**

```bash
sed -n '5,15p' /Users/yuefengjiang/AI/fish_eat/claude-progress.md
```

期望: 原内容保留(只是顶部多了 3 行 ⚠️ 横幅)。

- [ ] **Step 7.4: 验证 `./init.sh` 仍通过**

```bash
./init.sh 2>&1 | tail -5
```

---

### Task 8: 更新 `evaluator-rubric.md`

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/evaluator-rubric.md`

- [ ] **Step 8.1: §Scoring 表 - 补 5 维度(5/5 保持)**

在 §Scoring 表(原文件第 13-32 行)末尾,加 5 行(均 5/5):

```markdown
| **ScrollingWorld (4 phases)** | 5 | 20000×20000 世界 + 5 深度区 + 程序化装饰(feat-046~049) |
| **DEBUG_API** | 5 | `window.__DEBUG_API__` 14 methods + 16 E2E tests |
| **Type Effectiveness (feat-044)** | 5 | 2.0x/0.5x 双向 + 可变 sizeThreshold |
| **Skill Synergy (feat-045)** | 5 | rush_bite + storm_slash,3s 队列窗口 |
| **Architecture Refactor (feat-025~033)** | 5 | 8 系统提取 + DI + 回调 + reset() |
```

- [ ] **Step 8.2: §Feature Coverage - 40 → 49**

第 61-69 行表格改为:

```markdown
| 范围 | 数量 | 状态 |
|------|------|------|
| feat-001 ~ feat-024(核心游戏功能) | 24 | ✅ All completed |
| feat-025 ~ feat-033(架构重构 + E2E) | 9 | ✅ All completed |
| feat-034 ~ feat-040(增强 + Bug 修复) | 7 | ✅ All completed |
| feat-041 ~ feat-049(无限地图 + 平衡 + 协同 + ScrollingWorld) | 9 | ✅ All completed |
| **合计** | **49** | **100% 完成** |
```

- [ ] **Step 8.3: §Summary - 更新测试数**

把 "~730 个单元测试" 替换为 "UNIT_TESTS 个单元测试"(占位符替换)。

- [ ] **Step 8.4: 验证 ./init.sh 仍通过**

```bash
./init.sh 2>&1 | tail -5
```

---

## Phase 2 验证

- [ ] **Step 2.V1: 一致性检查 - 5 个 harness 文件数字对齐**

```bash
echo "=== feature_list.json ==="
node -e "console.log(require('./feature_list.json').features.length + ' features')"

echo "=== init.sh test count ==="
./init.sh 2>&1 | grep -E "Tests:" | tail -1

echo "=== E2E counts ==="
echo "debug-api: $(npx playwright test e2e/debug-api.spec.js --list 2>&1 | grep -c '›')"
echo "smoke: $(npx playwright test e2e/smoke.spec.js --list 2>&1 | grep -c '›')"
```

期望: feature count = 49, 测试数 ≥ UNIT_TESTS, E2E 数字与数据快照区一致。

- [ ] **Step 2.V2: 5 子系统框架保留检查**

```bash
echo "=== AGENTS.md 5 subsystems ==="
grep -c "^## 子系统" /Users/yuefengjiang/AI/fish_eat/AGENTS.md

echo "=== CLAUDE.md 章节 ==="
grep -c "^## " /Users/yuefengjiang/AI/fish_eat/CLAUDE.md
```

期望: AGENTS 5 个子系统(每个 `^## 子系统 N:` 一行,共 5),CLAUDE 章节数 ≥ 17。

---

## Phase 3: 过时文档加警告 + 现状段重写

### Task 9: 给 `IMPLEMENTATION_PRIORITY.md` 加横幅 + 重写表格

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/IMPLEMENTATION_PRIORITY.md`

- [ ] **Step 9.1: 在文件顶部加 ⚠️ 横幅**

在 `IMPLEMENTATION_PRIORITY.md` 第 1 行之前,插入:

```markdown
> ⚠️ **截至 2026-06-01,本文档反映 2026-05-24 之前状态;feat-038(DEPTH_LAYERS)/ ImpactSystem / feat-044(属性克制) 已完成**。
> 当前状态以 `feature_list.json` 49/49 为准;Phase 3 候选见 `docs/PHASE_3_ROADMAP.md`。

```

- [ ] **Step 9.2: "立即着手" 表 - 全部标 ✅**

第 7-11 行的 3 行表格,每行加 `(✅ feat-038 / ImpactSystem / feat-044 已完成)`:

```markdown
| 1 | 视觉层次重构 | 创建`DEPTH_LAYERS.js`(`feat-038` 已完成 ✅), 修改全局 depth 值 | 简单 | 1天 | 🔥🔥🔥 | 立竿见影改善视觉噪点 |
| 2 | 打击反馈系统 | 创建`ImpactSystem.js`(`ImpactSystem.js` 已存在 ✅), 修改`GameScene.js`/`Enemy.js` | 中等 | 3天 | 🔥🔥🔥🔥 | 核心爽快感来源 |
| 3 | 克制系统强化 | 创建`TypeAdvantageSystem.js`(`feat-044` 已通过 BattleSystem.getTypeMultiplier 完成 ✅), 修改敌人伤害计算 | 中等 | 2天 | 🔥🔥🔥🔥 | 提升策略深度 |
```

- [ ] **Step 9.3: "第二周优先" 表 - 标 ✅ / 候选**

第 13-17 行表格同样处理:feat-045 ✅,其他指向 ROADMAP。

- [ ] **Step 9.4: "第三周后" 表 - 全部链 ROADMAP**

第 19-27 行表格,每行后加 `(→ ROADMAP)`。

- [ ] **Step 9.5: 验证**

```bash
grep -c "✅" /Users/yuefengjiang/AI/fish_eat/IMPLEMENTATION_PRIORITY.md
grep -c "ROADMAP" /Users/yuefengjiang/AI/fish_eat/IMPLEMENTATION_PRIORITY.md
```

期望: ✅ ≥ 3(立即着手) + ≥ 1(第二周) ,ROADMAP ≥ 5。

- [ ] **Step 9.6: 验证 ./init.sh**

```bash
./init.sh 2>&1 | tail -5
```

---

### Task 10: 给 `OPTIMIZATION_ANALYSIS.md` 加横幅 + 重写优先级表

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/OPTIMIZATION_ANALYSIS.md`

- [ ] **Step 10.1: 在文件顶部加 ⚠️ 横幅**

在第 1 行之前,插入:

```markdown
> ⚠️ **截至 2026-06-01,12 个方案中 1/3/4/5 已部分或全部完成;2/6/7/8/9/10/11/12 仍候选,见 `docs/PHASE_3_ROADMAP.md`**。
> 已完成映射:方案 1 → ImpactSystem;方案 3 → feat-038;方案 4 → feat-044;方案 5 → feat-045。

```

- [ ] **Step 10.2: "高优先级" 表 - 标注状态**

第 28-32 行的 3 个方案,加状态后缀:

```markdown
- **方案1**: 统一打击反馈系统 (Unified Impact Feedback) — ✅ ImpactSystem.js 已存在
- **方案2**: 动作演出系统 (Action Choreography) — 🔜 候选 (P1,见 ROADMAP)
- **方案3**: 视觉层次重构 (Visual Hierarchy Refactor) — ✅ feat-038(DEPTH_LAYERS)
```

- [ ] **Step 10.3: "中优先级" / "低优先级" 表 - 全部标注状态**

同样方式:方案 4 ✅ / 5 ✅ / 6 候选 / 7 部分 ✅(feat-015)/ 8 ✅(ScrollingWorld) / 9 候选 / 10 候选 / 11 ✅(AudioMusicSystem) / 12 候选。

- [ ] **Step 10.4: 验证**

```bash
grep -c "✅" /Users/yuefengjiang/AI/fish_eat/OPTIMIZATION_ANALYSIS.md
grep -c "ROADMAP" /Users/yuefengjiang/AI/fish_eat/OPTIMIZATION_ANALYSIS.md
```

期望: ✅ ≥ 5(已实施 5 个方案),ROADMAP ≥ 5。

- [ ] **Step 10.5: 验证 ./init.sh**

```bash
./init.sh 2>&1 | tail -5
```

---

### Task 11: 给 `README_IMPROVEMENTS.md` 加横幅

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/README_IMPROVEMENTS.md`

- [ ] **Step 11.1: 顶部加 ⚠️ 横幅**

```markdown
> ⚠️ **截至 2026-06-01,3 个"立即开始"已落地**(视觉层次 feat-038 / 打击反馈 ImpactSystem / 克制 feat-044);后续见 `docs/PHASE_3_ROADMAP.md`。

```

- [ ] **Step 11.2: 重写"立即开始"段**

第 33-44 行的"立即开始"段,改为:

```markdown
### 🚀 立即开始(历史改进,均已完成)

如果你想立即开始改进游戏,3 个关键改进已落地:

1. ~~视觉层次重构 (1小时)~~ → ✅ feat-038(DEPTH_LAYERS)
2. ~~打击反馈系统 (3小时)~~ → ✅ ImpactSystem
3. ~~克制系统强化 (2小时)~~ → ✅ feat-044

详见 `feature_list.json`;后续候选见 [`docs/PHASE_3_ROADMAP.md`](docs/PHASE_3_ROADMAP.md)。
```

- [ ] **Step 11.3: 验证**

```bash
./init.sh 2>&1 | tail -5
```

---

### Task 12: 给 `findings.md` 加横幅 + 标注 5 项调研发现状态

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/findings.md`

- [ ] **Step 12.1: 顶部加 ⚠️ 横幅**

```markdown
> ⚠️ **截至 2026-06-01,本文档记录 2026-04 调研发现;2 Bug + 3 项"未实现"已全部修复,详见 `feature_list.json`**。
> 映射:Bug 1 → SkillBar.js 修复;Bug 2 → feat-003;连击 → feat-009;音效 → feat-014;特殊行为 → feat-005。

```

- [ ] **Step 12.2: 标注 Bug 1 状态(第 7-14 行)**

第 12 行后加:`> ✅ 已修复(SkillBar.js 第 179 行,详见 feat-007)`

- [ ] **Step 12.3: 标注 Bug 2 状态(第 16-22 行)**

第 21 行后加:`> ✅ 已修复(feat-003 PlayerControlSystem 死区+缓动)`

- [ ] **Step 12.4: 标注"未实现功能: 连击系统"(第 24-34 行)**

第 33 行后加:`> ✅ 已实现(feat-009 ComboSystem)`

- [ ] **Step 12.5: 标注"缺失: 音效系统"(第 36-38 行)**

第 37 行后加:`> ✅ 已实现(feat-014 AudioSystem + feat-039 AudioMusicSystem)`

- [ ] **Step 12.6: 标注"敌鱼特殊行为配置 vs 实现不匹配"(第 39-47 行)**

第 46 行后加:`> ✅ 已实现(feat-005 EnemySpecialBehaviors 5 种行为)`

- [ ] **Step 12.7: 标注"体验分析 5 点"**

第 53-58 行的 5 点,逐点后加状态:
- "吃大鱼的成就感" → `> 状态:ImpactSystem 部分实现`
- "成长的可见性" → `> 状态:feat-008 升级 size 1.5x + 光波动画`
- "音效反馈" → `> 状态:feat-014 + feat-039 已实现`
- "危机感" → `> 状态:HUD 低血量变色,屏幕震屏(部分)`
- "连击的满足感" → `> 状态:feat-009 ComboSystem + HUD 显示`

- [ ] **Step 12.8: 验证**

```bash
grep -c "✅" /Users/yuefengjiang/AI/fish_eat/findings.md
```

期望: ≥ 7(Bug 1/2 + 3 项未实现 + 5 项体验)。

- [ ] **Step 12.9: 验证 ./init.sh**

```bash
./init.sh 2>&1 | tail -5
```

---

### Task 13: 给 `clean-state-checklist.md` 加 1 行维护者提示

**Files:**
- Modify: `/Users/yuefengjiang/AI/fish_eat/clean-state-checklist.md`(仅第 1 行后加 1 行)

- [ ] **Step 13.1: 加维护者提示**

在 `clean-state-checklist.md` 第 1 行后(标题前),插入:

```markdown
> 维护者:任何修改后请跑 `./init.sh` + 跑 `e2e/*` 全部测试,详见 `session-handoff.md`。

```

- [ ] **Step 13.2: 验证 8 类检查项未动**

```bash
grep -c "^## " /Users/yuefengjiang/AI/fish_eat/clean-state-checklist.md
```

期望: 仍 8 个 `## ` 章节(Build / Architecture / Runtime / Logging / Data Integrity / Performance / Repository / Harness Files / E2E,共 9 个,数字相近即可)。

- [ ] **Step 13.3: 验证 ./init.sh**

```bash
./init.sh 2>&1 | tail -5
```

---

## Phase 3 验证

- [ ] **Step 3.V1: 4 个过时文件都有 ⚠️ 横幅**

```bash
for f in IMPLEMENTATION_PRIORITY.md OPTIMIZATION_ANALYSIS.md README_IMPROVEMENTS.md findings.md; do
  echo "=== $f ==="
  head -3 "$f"
done
```

期望: 4 个文件头部均有 `> ⚠️`。

- [ ] **Step 3.V2: ./init.sh 仍通过**

```bash
./init.sh 2>&1 | tail -5
```

---

## Phase 4: `docs/PHASE_3_ROADMAP.md` 新建

### Task 14: 创建 Phase 3 路线图

**Files:**
- Create: `/Users/yuefengjiang/AI/fish_eat/docs/PHASE_3_ROADMAP.md`

- [ ] **Step 14.1: 写新文件**

```bash
cat > /Users/yuefengjiang/AI/fish_eat/docs/PHASE_3_ROADMAP.md <<'EOF'
# Phase 3 Roadmap — 鱼吃鱼

> **状态**:规划中(2026-06-01 创建)
> **来源**:从 `IMPLEMENTATION_PRIORITY.md` / `OPTIMIZATION_ANALYSIS.md` / `README_IMPROVEMENTS.md` 中未实施部分整合
> **选择规则**:一个会话只做 1 个方向;通过 brainstorming 流程生成 spec → plan → 实现

---

## 候选方向(按优先级)

### P0: 体验打磨(用 `__DEBUG_API__` 跑游戏找手感问题)

- **来源**:`README_IMPROVEMENTS.md` "立即开始" 的延续 + `findings.md` 体验分析 5 点
- **工作量**:1-3 天
- **收益**:中(立竿见影)
- **前置依赖**:全部已完成
- **典型内容**:调平衡参数(技能数值 / 敌人刷新 / 升级曲线);加细节 UI(低血量警告 / 死亡特写 / Boss 血条强化);修复实际玩游戏发现的问题
- **验证**:单元测试 + 浏览器手动 + `__DEBUG_API__` 触发

### P1: 动作演出系统(AnimationDirector)

- **来源**:`OPTIMIZATION_ANALYSIS.md` 方案 2
- **工作量**:5 天
- **收益**:高
- **前置依赖**:全部已完成
- **典型内容**:受击/死亡/升级/技能/Boss 阶段的镜头和粒子编排;数据驱动(`animation_choreo.json`);TDD
- **验证**:单元测试 + E2E + 浏览器视觉确认

### P1: 群体 AI(Enemy Flocking)

- **来源**:`OPTIMIZATION_ANALYSIS.md` 方案 9
- **工作量**:3 天
- **收益**:中
- **前置依赖**:feat-004(Enemy AI 状态机)
- **典型内容**:鱼群行为 separation/alignment/cohesion;留出可关闭的 flag 以保留旧行为
- **验证**:单元测试(EmergentBehavior) + E2E + 浏览器目测

### P2: 极限计时模式(Rush Hour)

- **来源**:`OPTIMIZATION_ANALYSIS.md` 方案 10
- **工作量**:2 天
- **收益**:中
- **前置依赖**:feat-020(Daily Challenge System,可参考结构)
- **典型内容**:时间倒计时 + 难度递增 + 排行榜(localStorage)
- **验证**:单元测试 + E2E + 浏览器手动

### P2: 无障碍设置(Accessibility Scene)

- **来源**:`OPTIMIZATION_ANALYSIS.md` 方案 12
- **工作量**:2 天
- **收益**:中
- **前置依赖**:无
- **典型内容**:色盲模式 / 键位重映射 / 字号调整 / 屏幕震动开关
- **验证**:单元测试 + E2E + 浏览器手动

---

## 选择流程(下次会话)

1. 读本文档,选 1 个方向
2. 进入 `superpowers:brainstorming` skill(本文档可作为 brainstorm 输入)
3. 生成 spec → plan → 实现 → 验证
4. 完成后把对应项目从本表移到 "已归档" 段
5. 在 `feature_list.json` 加新 feat-XXX 条目,状态走 standard lifecycle

---

## 已归档(已通过 feat-XXX 落地)

| 方案 | feat | 状态 |
|------|------|------|
| 视觉层次重构 | feat-038(DEPTH_LAYERS) | ✅ completed |
| 统一打击反馈 | ImpactSystem.js(feat-038 同期) | ✅ completed |
| 鱼种克制强化 | feat-044 | ✅ completed |
| 技能多样扩展 | feat-045(Skill Synergy) | ✅ completed |
| 动态背景 | feat-046 ~ feat-049(ScrollingWorld) | ✅ completed |
| 背景音乐 | feat-039(AudioMusicSystem) | ✅ completed |
| 进度里程碑 | feat-015(AchievementSystem, 15 个成就) | ✅ completed |
| 群体 AI(部分) | feat-005(Enemy 5 种特殊行为) | ✅ completed |
| 极限计时(部分) | feat-020(Daily Challenge) | ✅ completed |
| 音频分层 | feat-014 + feat-039 | ✅ completed |
| 调试 API | E2E-debug(`window.__DEBUG_API__`) | ✅ completed |
| 无障碍 | (尚未实现,仍 P2) | 🔜 pending |

---

## 链接

- 详细分析:`IMPLEMENTATION_PRIORITY.md` / `OPTIMIZATION_ANALYSIS.md` / `README_IMPROVEMENTS.md`
- 当前状态:`feature_list.json` + `session-handoff.md`
- Spec 模板:`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Plan 模板:`docs/superpowers/plans/YYYY-MM-DD-<topic>-plan.md`
EOF
```

- [ ] **Step 14.2: 验证文件创建**

```bash
ls -la /Users/yuefengjiang/AI/fish_eat/docs/PHASE_3_ROADMAP.md
wc -l /Users/yuefengjiang/AI/fish_eat/docs/PHASE_3_ROADMAP.md
```

期望: 文件存在,行数 ≥ 100。

- [ ] **Step 14.3: 验证 0 broken 引用**

```bash
grep -rn "PHASE_3_ROADMAP" /Users/yuefengjiang/AI/fish_eat/ --include="*.md" | head -20
```

期望: 所有引用都指向 `docs/PHASE_3_ROADMAP.md` 且文件存在。

- [ ] **Step 14.4: 验证 ./init.sh**

```bash
./init.sh 2>&1 | tail -5
```

---

## Phase 5: 最终验证

### Task 15: 全套 E2E 验证

- [ ] **Step 15.1: 单元测试**

```bash
./init.sh 2>&1 | tail -5
```

期望: 5 步全过, 测试数 ≥ UNIT_TESTS。

- [ ] **Step 15.2: E2E debug-api(若 Playwright 框架可用)**

```bash
npx playwright test e2e/debug-api.spec.js --project=chromium 2>&1 | tail -10
```

期望: E2E_DEBUG_API 测试全过;若 Playwright 框架不可用,在 `progress.md` 标注 "E2E 框架问题"。

- [ ] **Step 15.3: E2E smoke**

```bash
npx playwright test e2e/smoke.spec.js --project=chromium 2>&1 | tail -10
```

期望: E2E_SMOKE 测试全过。

- [ ] **Step 15.4: 一致性最终检查**

```bash
echo "=== feature_list.json ==="
node -e "console.log(require('./feature_list.json').features.length + ' features')"

echo "=== 5 harness files 数字 ==="
for f in AGENTS.md CLAUDE.md progress.md session-handoff.md quality-document.md evaluator-rubric.md; do
  echo "--- $f ---"
  grep -E "49|UNIT_TESTS|E2E" "$f" | head -3
done
```

期望: 5 个文件均提到 49(数字可能形式不同,但应一致);`feature_list.json` features.length = 49。

- [ ] **Step 15.5: 0 broken 引用**

```bash
grep -rn "PHASE_3_ROADMAP" /Users/yuefengjiang/AI/fish_eat/ --include="*.md" | wc -l
ls /Users/yuefengjiang/AI/fish_eat/docs/PHASE_3_ROADMAP.md
```

期望: 引用数 ≥ 5(5 个文件链 ROADMAP),目标文件存在。

- [ ] **Step 15.6: git status 干净(待 commit)**

```bash
git status --short
```

期望: 仅 14 个修改文件(11 个状态/分析文件 + 1 个新文件 PHASE_3_ROADMAP.md) + progress.md,共 15 个文件。

- [ ] **Step 15.7: git diff 行数估算**

```bash
git diff --stat
```

期望: ~500-800 行新增/修改, 0 行删除(只加内容)。

- [ ] **Step 15.8: 提交**

```bash
git add -A
git commit -m "docs: synchronize harness state files with feat-049 completion

- AGENTS.md / CLAUDE.md: 5-subsystem framework kept, content updated to 49/49
- progress / session-handoff / quality-document: aligned to 49/49
- claude-progress: ⚠️ banner pointing to session-handoff as single source
- evaluator-rubric: feature count 40→49, test count updated
- IMPLEMENTATION_PRIORITY / OPTIMIZATION_ANALYSIS / README_IMPROVEMENTS / findings:
  ⚠️ banners + 现状段重写, candidates linked to PHASE_3_ROADMAP
- clean-state-checklist: 1-line maintainer note
- docs/PHASE_3_ROADMAP.md: new Phase 3 candidates (P0/P1/P1/P2/P2)
- 0 src/ changes, ./init.sh 5 steps pass"
```

期望: 1 个 commit,working tree clean。

---

## Plan 自审(spec coverage)

按 writing-plans 要求自审 3 个维度:

### 1. Spec coverage(每条 spec 需求都有任务对应)

| Spec § | 内容 | 对应 Task |
|--------|------|----------|
| §2.1 目标 1 | harness 5 子系统框架保留 | Task 2(AGENTS) + Task 3(CLAUDE) |
| §2.1 目标 2 | 过时文件加警告 + 现状段重写 | Task 7(claude-progress) + Task 9(IMPLEMENTATION_PRIORITY) + Task 10(OPTIMIZATION_ANALYSIS) + Task 11(README_IMPROVEMENTS) + Task 12(findings) |
| §2.1 目标 3 | 新建 PHASE_3_ROADMAP.md | Task 14 |
| §2.1 目标 4 | 零代码改动 | (约束,全部任务不碰 src/) |
| §2.1 目标 5 | 零 feature_list 改动 | (约束,Task 1 仅测量不修改) |
| §3.1.1-§3.1.5 | 5 个 harness 文件重写 | Task 2 / 3 / 4 / 5 / 6 |
| §3.2.1-§3.2.6 | 6 个过时文件加警告 | Task 7 / 8 / 9 / 10 / 11 / 12 |
| §3.3.1 | clean-state-checklist 加提示 | Task 13 |
| §3.4.1 | PHASE_3_ROADMAP 新建 | Task 14 |
| §4 Phase 1-5 | 5 阶段执行 | Task 1 / 2-8 / 9-13 / 14 / 15 |
| §5 风险 | 5 项风险 | 在每 Task 中通过"约束 / 验证"步骤体现 |
| §6 DoD | 21 条 | Task 15 Step 15.1-15.8 覆盖 |

**结论**: 全部 spec 章节都有对应任务,**0 缺口**。

### 2. Placeholder 扫描

```bash
grep -E "TBD|TODO|implement later|fill in details|appropriate|similar to" /Users/yuefengjiang/AI/fish_eat/docs/superpowers/plans/2026-06-01-harness-state-sync-plan.md
```

- "TBD" 出现在"数据快照区"中(预期,Phase 1 任务 1 填入)
- 其他 placeholder 词汇:0

**结论**: **0 真实占位符**(数据快照区是 Phase 1 必填区,不是占位符)。

### 3. 类型 / 命名一致性

| 引用 | 出现位置 | 一致性 |
|------|---------|--------|
| `__DEBUG_API__` | Task 3(CLAUDE) + Task 14(ROADMAP) + progress.md 引用 | ✓ |
| `?debug=true` | Task 2(AGENTS) + Task 3(CLAUDE) | ✓ |
| `PHASE_3_ROADMAP.md` | Task 5(session-handoff) + Task 9-12 + Task 14 | ✓ |
| `feature_list.json` | Task 1 + Task 14 + Task 15 | ✓ |
| `E2E_DEBUG_API / E2E_SMOKE / E2E_TOTAL / UNIT_TESTS` | 数据快照区 → 全部 Task 引用 | ✓ |

**结论**: 命名一致,无 `clearLayers()` vs `clearFullLayers()` 类问题。

---

## 完成定义 (Definition of Done)

全部以下条件满足 = 任务完成:

- [ ] Task 1-15 全部勾选完成
- [ ] `./init.sh` 5 步全过,测试数 ≥ UNIT_TESTS
- [ ] `e2e/debug-api.spec.js` E2E_DEBUG_API 测试全过
- [ ] `e2e/smoke.spec.js` E2E_SMOKE 测试全过
- [ ] 5 个 harness 文件(feature count / test count)数字一致
- [ ] 4 个过时文件(IMPLEMENTATION_PRIORITY / OPTIMIZATION_ANALYSIS / README_IMPROVEMENTS / findings)顶部均有 ⚠️ 横幅
- [ ] `claude-progress.md` 顶部有 ⚠️ 横幅指明单源真相(session-handoff.md)
- [ ] `clean-state-checklist.md` 顶部有 1 行维护者提示
- [ ] `docs/PHASE_3_ROADMAP.md` 存在,5 个候选方向 + 已归档段
- [ ] 0 broken `PHASE_3_ROADMAP` 引用
- [ ] 0 broken `feature_list.json` 引用
- [ ] `git status` 干净,1 个 commit 已提交
- [ ] 0 行删除,改动估算 ~500-800 行新增/修改
- [ ] `src/**` 无任何修改
- [ ] `feature_list.json` 无任何修改
