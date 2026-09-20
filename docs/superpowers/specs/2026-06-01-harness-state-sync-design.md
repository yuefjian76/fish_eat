# Harness 状态同步 — 设计 Spec

**项目**: 鱼吃鱼 (Fish Eat Fish)
**Spec 创建日期**: 2026-06-01
**作者**: brainstorming + 用户协作
**状态**: 待用户审阅

---

## 1. 背景

fish_eat 项目截至 2026-05-31 已完成 `feature_list.json` 中全部 49 个 feature(feat-001 ~ feat-049),并实现了 `window.__DEBUG_API__`(feat-E2E-debug)。代码与测试处于 **clean state**(850+ 单元测试,23 E2E 测试,`./init.sh` 5 步全过)。

但根目录的 4 个 State 子系统文件与多个过时分析/路线图文档**未同步**:
- `session-handoff.md` 仍标 "47/49 done",**实际 49/49**
- `quality-document.md` 仍标 "40 features"
- `IMPLEMENTATION_PRIORITY.md` 的"立即着手"三项已全部实施,但文件未更新
- `OPTIMIZATION_ANALYSIS.md` / `README_IMPROVEMENTS.md` / `findings.md` 仍描述为"待做/未做"
- `progress.md` 反映 2026-05-31 状态,但 `claude-progress.md` / `evaluator-rubric.md` 仍写 40/730

下次会话启动时按 AGENTS.md §启动规则读这些文件,会**先得到错误信号**(47/49 → 实际没有 pending 项)而浪费 1-2 分钟。

### 1.1 当前不一致(本次发现的)

| 文件 | 标称状态 | 实际状态 |
|------|---------|---------|
| `session-handoff.md` | 47/49 done | 49/49 done |
| `quality-document.md` | 40 features | 49 features |
| `evaluator-rubric.md` | 40 features / 730 tests | 49 features / 850+ tests |
| `claude-progress.md` | 40 features / 731 tests | 49 features / 850+ tests |
| `IMPLEMENTATION_PRIORITY.md` | "立即着手"3 项待做 | 3 项全部已实施(feat-038 / ImpactSystem / feat-044) |
| `OPTIMIZATION_ANALYSIS.md` | 12 个方案待做 | 4-5 个已部分/全部实施 |
| `findings.md` | 2 Bug + 1 未实现 + 1 缺失 + 1 不匹配 | 全部已修(feat-005/009/014/038) |
| `feature_list.json` | 49 features | ✅ 真值, **不动** |

### 1.2 用户决策记录

- **方向**: 先清理过时文档
- **范围**: 全部清理(7+ 个文件)
- **过时文件处理**: 重写保留(顶部加过期警告)
- **产出**: `docs/PHASE_3_ROADMAP.md` 作为下个阶段路线图
- **验证**: `./init.sh` + 跑全套 E2E
- **核心原则**: **harness 5 子系统框架保留**,内容按现状更新

---

## 2. 设计目标

### 2.1 目标

1. **harness 5 子系统框架保留**: `AGENTS.md` / `CLAUDE.md` / `feature_list.json` / `progress.md` / `session-handoff.md` 章节标题和顺序不变,内容按 49/49 现状更新
2. **过时文件加警告 + 现状段重写**: 4 个分析/调研文件加 `> ⚠️` 横幅,相关段标 ✅ 已完成并链接到 `feature_list.json`
3. **新建 `docs/PHASE_3_ROADMAP.md`**: 列出 5 个 Phase 3 候选方向(从 IMPLEMENTATION_PRIORITY / OPTIMIZATION_ANALYSIS / README_IMPROVEMENTS 整合),为下次 brainstorming 提供干净起点
4. **零代码改动**: 不动 `src/**` 任何文件
5. **零 feature_list 改动**: 49/49 状态保持

### 2.2 非目标

- **不在范围**:
  - 重构 `AGENTS.md` / `CLAUDE.md` 的章节结构
  - 重写 `clean-state-checklist.md` 的检查项(长期操作清单,只加 1 行维护者提示)
  - 改动 `docs/ARCHITECTURE.md` / `docs/PRODUCT.md` / `docs/RELIABILITY.md`(已为真值)
  - 改动 `init.sh`(已为真值)
  - 删除任何文件(只加内容 + 顶部加警告)
  - 补新单元测试(纯文档变更,`./init.sh` 应自动通过)
  - 重构 `src/**` 任何代码
  - 改动 `__mocks__/**` / `e2e/**` / `tests/**`

---

## 3. 改动清单

### 3.1 重写(5 子系统 harness 框架保持,内容更新)

| # | 文件 | 改动内容 |
|---|------|---------|
| 3.1.1 | `AGENTS.md` | §启动规则第 8 步加 ROADMAP 引用;§文档层级补 PHASE_3_ROADMAP.md;§目录结构补 `e2e/debug-api.spec.js` / `docs/PHASE_3_ROADMAP.md`;§可观测性加 `window.__DEBUG_API__`;§已知约束加 DEBUG_API 行 |
| 3.1.2 | `CLAUDE.md` | 测试数 `~730` → 快照值;E2E 加 `e2e/debug-api.spec.js` (16 tests) + `e2e/smoke.spec.js` (7 tests);新增"调试模式"章节(`?debug=true` 暴露 `__GAME_SCENE__` + `__DEBUG_API__`,含 14 方法表);新增"Phase 3 路线图"章节引用 ROADMAP;关键文件表加 3 项;故障章节保留(API 连接断开错误) |
| 3.1.3 | `progress.md` | "当前阶段" 段:Phase 2 完成(49/49) → Phase 3 规划;历史会话记录保持(2026-05-30/31 不动);新增"会话 — 2026-06-01(harness 状态同步)" 段,记录本次改动 |
| 3.1.4 | `session-handoff.md` | 状态表 49/49 + 850+ tests + 23 E2E + 5/5 init.sh;§"Pending Features" 删除,改为链 ROADMAP;§"Next Session Startup" 加 ROADMAP 引用;§"What Was Accomplished" 段加 feat-044/045/E2E-debug 行 |
| 3.1.5 | `quality-document.md` | 总评分 A(不变);§分维度表加 5 行(ScrollingWorld / ScrollingBackground / DecorationPool / DEBUG_API / Skill Synergy);§System Quality 表加 6 行(DepthColorMapper / ScrollingBackground / DecorationPool / Prng / AudioMusicSystem / ShopSystem / ImpactSystem);§Feature Completeness 40 → 49;测试数 → 快照值 |

### 3.2 加过期警告 + 现状段重写(顶部加 ⚠️ 横幅)

| # | 文件 | 横幅内容(模板) | 段更新 |
|---|------|---------------|--------|
| 3.2.1 | `claude-progress.md` | `> ⚠️ 截至 2026-06-01,本文档与 session-handoff.md 内容重叠;请以 session-handoff.md 为准(单源真相)` | 不重写章节,仅顶部加横幅,避免双源真相 |
| 3.2.2 | `evaluator-rubric.md` | `> ⚠️ 截至 2026-06-01,本评分表已更新;49/49 features, 850+ tests, 23 E2E` | 评分表更新:40 → 49;730 → 快照;加 ScrollingWorld / DEBUG_API 行;5/5 总评不变 |
| 3.2.3 | `IMPLEMENTATION_PRIORITY.md` | `> ⚠️ 截至 2026-06-01,本文档反映 2026-05-24 之前状态;feat-038 / ImpactSystem / feat-044 已完成。Phase 3 候选见 docs/PHASE_3_ROADMAP.md` | "立即着手" 3 项标 ✅ 已完成(feat-038 / ImpactSystem / feat-044),"第二周优先" 4 项标 ✅ / 候选,"第三周后" 5 项链 ROADMAP |
| 3.2.4 | `OPTIMIZATION_ANALYSIS.md` | `> ⚠️ 截至 2026-06-01,方案 1/3/4/5 已部分/全部完成;方案 2/6/7/8/9/10/11/12 仍候选,见 docs/PHASE_3_ROADMAP.md` | 12 个方案表格按 ✅ / 候选分组 |
| 3.2.5 | `README_IMPROVEMENTS.md` | `> ⚠️ 截至 2026-06-01,3 个"立即开始"已落地;其余见 docs/PHASE_3_ROADMAP.md` | 简介段重写;文件结构补 ROADMAP 行 |
| 3.2.6 | `findings.md` | `> ⚠️ 截至 2026-06-01,本文档记录 2026-04 调研发现;Bug 1/2 与 3 项"未实现"已全部修复,详见 feature_list.json` | Bug 1 ✅ / Bug 2 ✅ / 连击 ✅ feat-009 / 音效 ✅ feat-014 / 特殊行为 ✅ feat-005;体验分析 5 点标状态 |

### 3.3 基本不动(仅 1 行维护者提示)

| # | 文件 | 改动 |
|---|------|------|
| 3.3.1 | `clean-state-checklist.md` | 顶部加 1 行 `> 维护者: 任何修改后请跑 ./init.sh, 详见 session-handoff.md`;8 类检查项不动 |

### 3.4 新建(Phase 3 路线图 — 重点产出)

| # | 文件路径 | 内容 |
|---|---------|------|
| 3.4.1 | `docs/PHASE_3_ROADMAP.md` | 5 个候选方向(P0 体验打磨 / P1 动作演出 / P1 群体 AI / P2 极限计时 / P2 无障碍)+ 来源出处 + 工作量 + 收益 + 前置依赖 + 典型内容 + 选择流程 + 已归档段 |

**PHASE_3_ROADMAP.md 结构草案**:

```markdown
# Phase 3 Roadmap — 鱼吃鱼

> 状态: 规划中(2026-06-01 创建)
> 来源: 从 IMPLEMENTATION_PRIORITY.md / OPTIMIZATION_ANALYSIS.md / README_IMPROVEMENTS.md 中未实施部分整合
> 选择规则: 一个会话只做 1 个方向;通过 brainstorming 流程生成 spec → plan → 实现

## 候选方向(按优先级)

### P0: 体验打磨(用 __DEBUG_API__ 跑游戏找手感问题)
- 来源: README_IMPROVEMENTS.md "立即开始" 的延续
- 工作量: 1-3 天
- 收益: 中(立竿见影)
- 前置: 全部已完成
- 典型内容: 调平衡参数、加细节 UI、修复实际玩游戏发现的问题
- 验证: 单元测试 + 浏览器手动

### P1: 动作演出系统(AnimationDirector)
- 来源: OPTIMIZATION_ANALYSIS.md 方案 2
- 工作量: 5 天
- 收益: 高
- 前置: 全部已完成
- 典型内容: 受击/死亡/升级的镜头和粒子编排, 数据驱动(animation_choreo.json)

### P1: 群体 AI(Enemy Flocking)
- 来源: OPTIMIZATION_ANALYSIS.md 方案 9
- 工作量: 3 天
- 收益: 中
- 前置: feat-004(Enemy AI 状态机)
- 典型内容: 鱼群行为 separation/alignment/cohesion; 留出可关闭的 flag

### P2: 极限计时模式(Rush Hour)
- 来源: OPTIMIZATION_ANALYSIS.md 方案 10
- 工作量: 2 天
- 收益: 中
- 前置: feat-020(Daily Challenge System, 可参考)
- 典型内容: 时间倒计时 + 难度递增 + 排行榜

### P2: 无障碍设置(Accessibility Scene)
- 来源: OPTIMIZATION_ANALYSIS.md 方案 12
- 工作量: 2 天
- 收益: 中
- 前置: 无
- 典型内容: 色盲模式、键位重映射、字号调整

## 选择流程(下次会话)

1. 读本文档,选 1 个方向
2. 进入 brainstorming skill(本文档可作为 brainstorm 输入)
3. 生成 spec → plan → 实现 → 验证
4. 完成后把对应项目从本表移到 "已归档" 段

## 已归档(已通过 feat-XXX 落地)

- 视觉层次重构 → feat-038(DEPTH_LAYERS)
- 统一打击反馈 → ImpactSystem 已存在, 测试覆盖
- 鱼种克制强化 → feat-044
- 技能多样扩展 → feat-045
- 动态背景 → feat-046~049(ScrollingWorld)
- 节奏感系统 → PacingSystem(已存在于 systems/ 待评估整合)
- 进度里程碑 → feat-015(AchievementSystem, 15 个成就)
- 动作演出(部分) → ImpactSystem + BossAnimation
- 群体 AI(部分) → Enemy 5 种特殊行为(feat-005)
- 极限计时 → feat-020(Daily Challenge)
- 音频分层 → feat-014 + feat-039(AudioMusicSystem)
- 无障碍 → Settings Scene(尚未实现, 仍 P2)
```

---

## 4. 执行顺序

5 个阶段,每阶段后 `./init.sh` 验证。

### Phase 1: 数据真实性确认(15min)

1. 跑 `./init.sh` 拿到当前测试数(快照)
2. `npx playwright test e2e/ --list` 拿到 E2E 实际测试数
3. `git log --oneline | wc -l` 拿到 commit 数
4. `ls src/systems/` 拿到系统清单
5. `git log --oneline --grep="feat-"` 拿到 49 个 feat 的 commit 链

**产出**: 数据快照(测试数 / E2E 数 / commit 数 / 系统数)。

### Phase 2: harness 5 子系统文件更新(90min)

按"读改写顺序" 严格 1-1 同步。

| 顺序 | 文件 | 关键校验 |
|------|------|---------|
| 2.1 | `AGENTS.md` | 5 子系统标题和顺序不变 |
| 2.2 | `CLAUDE.md` | 调试模式章节插在"日志规范"和"工作规则"之间 |
| 2.3 | `progress.md` | 历史 session 时间戳不动 |
| 2.4 | `session-handoff.md` | 状态表所有数字对齐 Phase 1 快照 |
| 2.5 | `quality-document.md` | System Quality 表不漏系统 |
| 2.6 | `claude-progress.md` | **仅**顶部加横幅, 不重写 |
| 2.7 | `evaluator-rubric.md` | 不改 "5/5" 总评 |

**验证**:`./init.sh` 仍 5 步全过。

### Phase 3: 过时文档加警告 + 现状段重写(45min)

每个文件按相同模式改:
1. 顶部加 `> ⚠️` 横幅(1 段)
2. 找到"立即着手/待办/未做/候选"段
3. 每行标 ✅ 已完成 + 链回 feature_list.json
4. "建议/候选"段统一指向 `docs/PHASE_3_ROADMAP.md`

| 顺序 | 文件 |
|------|------|
| 3.1 | `IMPLEMENTATION_PRIORITY.md` |
| 3.2 | `OPTIMIZATION_ANALYSIS.md` |
| 3.3 | `README_IMPROVEMENTS.md` |
| 3.4 | `findings.md` |
| 3.5 | `clean-state-checklist.md` (仅 1 行维护者提示) |

**验证**:`grep -r "⚠️" --include="*.md" .` 检查 4 个文件有横幅;`./init.sh` 仍 5 步全过。

### Phase 4: `docs/PHASE_3_ROADMAP.md` 新建(30min)

1. 写新文件
2. 验证所有引用 ROADMAP 的位置都有真实文件支持:`grep -rn "PHASE_3_ROADMAP" --include="*.md" .`
3. 验证"已归档"段每条都有真实 feature 链

**验证**:`./init.sh` 仍 5 步全过。

### Phase 5: 最终验证(15min)

| # | 验证项 | 命令 | 期望 |
|---|--------|------|------|
| 5.1 | 全测试 | `./init.sh` | 5 步全过, 测试数 ≥ 850 |
| 5.2 | E2E debug-api | `npx playwright test e2e/debug-api.spec.js --project=chromium` | 16 全过 |
| 5.3 | E2E smoke | `npx playwright test e2e/smoke.spec.js --project=chromium` | 7 全过 |
| 5.4 | 一致性 | grep 5 个 harness 文件数字 | 49/49 / 快照测试数 / 23 E2E |
| 5.5 | 引用 | grep "PHASE_3_ROADMAP" 引用 | 0 broken ref |
| 5.6 | git status | `git status` | 干净, 待 commit 列表清晰 |
| 5.7 | git diff | 估算改动行数 | ~500-800 行新增/修改, 0 行删除 |

---

## 5. 风险点与回滚

### 5.1 风险

| # | 风险 | 缓解 |
|---|------|------|
| R1 | 改 `AGENTS.md` / `CLAUDE.md` 时改坏结构(5 子系统错位) | 改前用 `git diff` 对照原版;改后用 `wc -l` 看长度变化;Phase 2 每文件改后跑 `./init.sh` |
| R2 | 测试数有出入(我猜 850+, 实际可能 855+) | Phase 1 跑 `./init.sh` 拿真实数字 |
| R3 | `e2e/debug-api.spec.js` 在 Playwright 上跑失败(网络/headless) | E2E 失败 ≠ 文档改动回归,看具体错误;若 E2E 框架问题,在 progress.md 标注,不阻塞 commit |
| R4 | `claude-progress.md` 和 `session-handoff.md` 内容重复 | claude-progress 仅加横幅不重写,保证单源真相 |
| R5 | 顶部 ⚠️ 横幅写法不一致 | 使用同一模板 |

### 5.2 回滚

- 所有改动未 commit,`git checkout .` 即可完全回滚
- 如部分 commit,`git reset HEAD~1` 回退到上一次

---

## 6. 验证标准 (Definition of Done)

- [ ] `AGENTS.md` 5 子系统框架保留,内容按 49/49 更新
- [ ] `CLAUDE.md` 测试数/E2E 数更新,新增"调试模式"和"Phase 3 路线图"章节
- [ ] `feature_list.json` **不变**(49/49)
- [ ] `progress.md` 当前阶段更新,2026-06-01 会话段新增
- [ ] `session-handoff.md` 状态表 49/49,Pending 段链 ROADMAP
- [ ] `quality-document.md` Feature 40→49, 测试数 → 快照, System Quality 表加 6 行
- [ ] `claude-progress.md` 顶部加横幅,正文不动
- [ ] `evaluator-rubric.md` Feature 40→49, 5/5 总评不变
- [ ] `IMPLEMENTATION_PRIORITY.md` 顶部加横幅,3 表标注状态
- [ ] `OPTIMIZATION_ANALYSIS.md` 顶部加横幅,12 方案分组
- [ ] `README_IMPROVEMENTS.md` 顶部加横幅,简介段重写
- [ ] `findings.md` 顶部加横幅,5 项调研发现标状态
- [ ] `clean-state-checklist.md` 顶部加 1 行维护者提示
- [ ] `docs/PHASE_3_ROADMAP.md` 新建,5 个候选方向 + 已归档段
- [ ] `./init.sh` 5 步全过
- [ ] `e2e/debug-api.spec.js` 16 测试全过
- [ ] `e2e/smoke.spec.js` 7 测试全过
- [ ] `git status` 干净,待 commit 列表清晰
- [ ] 0 broken `PHASE_3_ROADMAP` 引用
- [ ] 0 broken `feature_list.json` 引用
- [ ] 改动行数估算 ~500-800 行新增/修改,**0 行删除**

---

## 7. 提交策略

**1 个 commit**(粒度合适,便于复盘):

```
docs: synchronize harness state files with feat-049 completion

- AGENTS.md / CLAUDE.md: 5-subsystem framework kept, content updated to 49/49
- progress / session-handoff / quality-document: aligned to 49/49
- claude-progress: ⚠️ banner pointing to session-handoff as single source
- evaluator-rubric: feature count 40→49, test count updated
- IMPLEMENTATION_PRIORITY / OPTIMIZATION_ANALYSIS / README_IMPROVEMENTS / findings:
  ⚠️ banners + 现状段重写, candidates linked to PHASE_3_ROADMAP
- clean-state-checklist: 1-line maintainer note
- docs/PHASE_3_ROADMAP.md: new Phase 3 candidates (P0/P1/P1/P2/P2)
- 0 src/ changes, ./init.sh 5 steps pass, 16+7 E2E pass
```

---

## 8. 附录:数据快照(Phase 1 填入)

> 本节在 Phase 1 执行时填入,作为所有数字引用的真值来源。

| 维度 | 值 | 测量命令 |
|------|----|---------|
| 单元测试数 | TBD | `./init.sh` |
| E2E 测试数(debug-api) | TBD(预期 16) | `npx playwright test e2e/debug-api.spec.js --list` |
| E2E 测试数(smoke) | TBD(预期 7) | `npx playwright test e2e/smoke.spec.js --list` |
| E2E 测试数(总计) | TBD | 求和 |
| 提交数 | TBD | `git log --oneline \| wc -l` |
| feat-XXX 数 | 49 | `jq '.features \| length' feature_list.json` |
| 系统数 | TBD(预期 ~30) | `ls src/systems/*.js \| wc -l` |
| scenes 数 | 7 | `ls src/scenes/*.js \| wc -l`(含 .bak) |

---

## 9. spec 自审(本 spec 写完时自审)

- [x] **Placeholder 扫描**: 无 TBD(除 §8 数据快照需 Phase 1 填入)
- [x] **内部一致性**: 改动清单(§3) / 执行顺序(§4) / 验证标准(§6) / 提交策略(§7) 数字一致
- [x] **范围检查**: 单次 spec 实现可管理(纯文档,无代码,5 阶段)
- [x] **模糊性检查**: 每个文件改什么都具体到段/章节/表格行级;无歧义

---

**下一步**: 用户审阅本 spec → 确认后调用 `superpowers:writing-plans` skill 生成实现 plan → 按 plan 执行。
