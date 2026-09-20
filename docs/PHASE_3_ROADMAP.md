# Phase 3 Roadmap — 鱼吃鱼

> **状态**:规划中(2026-06-01 创建)
> **来源**:从 `IMPLEMENTATION_PRIORITY.md` / `OPTIMIZATION_ANALYSIS.md` / `README_IMPROVEMENTS.md` 中未实施部分整合
> **选择规则**:一个会话只做 1 个方向;通过 brainstorming 流程生成 spec → plan → 实现

---

## 候选方向(按优先级)

> **进展更新 (2026-09-19)**：feat-050 已落地「数据驱动战斗反馈动画」（AnimationFeedbackSystem），
> 因此 **P1 动作演出系统** 的起点应改为「在现有 AnimationFeedbackSystem 上扩展镜头编排」而非从零实现。
> 同会话完成 feat-051：E2E 套件曾长期失败（含 1 处假通过），已修复并全绿（37 用例，repeat×2 无 flaky）。
> 新 spec 必须复用 `e2e/helpers/game.js`。

> **进展更新 (2026-09-19 第二轮)**：P0 体验打磨已落地 **feat-052 死亡演出**（DeathSequenceSystem，
> 血量归零 → 定格/镜头推进/淡出 → 结算页，结算数据在死亡瞬间快照）。
> P0 剩余候选：低血量警告强化（已有基础实现，可增强）、Boss 战节奏调整、数值平衡实测。

> **进展更新 (2026-09-19 第三轮)**：P0 体验打磨第二项落地 —— **feat-053 低血量警告强化**
> （LowHealthWarningSystem：红色暗角 → critical 脉冲 + `危险` 文字 + 心跳音；纯逻辑 + 数据驱动 + 16 个 `__DEBUG_API__` 方法）。
> P0 剩余候选：**Boss 战节奏调整**（已由 feat-054 完成）、**数值平衡实测**（仍需用 `__DEBUG_API__` 实跑）。

> **进展更新 (2026-09-20 第四轮)**：P0 第三项落地 —— **feat-054 Boss 战修复与节奏调整**。
> 用 `__DEBUG_API__` 实跑发现 Boss 战从未真正跑通（配置缺 `size` 导致坐标 NaN、伤害链路断裂、战斗期间照常刷怪、
> 升级到偶数级会因背景系统 API 不匹配直接崩溃）。修复后实测：走位打法 27.3s 击杀 5 级乌贼（10 次撕咬），
> 站桩约 25s 被反杀。**P0 剩余：数值平衡实测**（敌人刷新/升级曲线/技能数值的整局手感）。

> **进展更新 (2026-09-20 第五轮)**：P0 最后一项落地 —— **feat-055 数值平衡实测与难度曲线修复**。
> 用逐级食物链采样发现两处结构性缺陷：(1) 玩家体型每级 ×1.5 复利使 Lv4 后所有普通敌鱼可吃、
> 接触伤害永不触发；(2) 难度加成被乘进**尺寸**，令 Lv1 唯一可吃的虾在 ~16s 后变得吃不下 —— 开局成长死锁。
> 修复后：体型曲线收敛到 9.4×（Lv11 273），敌人尺寸按玩家体型开方缩放，任意等级都同时存在可吃/威胁两档。
> 自动游玩探针从"60s 内阵亡"变为"跑满 120s"。**P0 体验打磨全部完成。**

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
| 战斗反馈动画 | feat-050(AnimationFeedbackSystem) | ✅ completed |
| E2E 验证修复 | feat-051(helpers/game.js + smoke 重写) | ✅ completed |
| 死亡演出 | feat-052(DeathSequenceSystem) | ✅ completed |
| 低血量警告强化 | feat-053(LowHealthWarningSystem) | ✅ completed |
| Boss 战修复与节奏 | feat-054(BossSystem + fish.json) | ✅ completed |
| 无障碍 | (尚未实现,仍 P2) | 🔜 pending |

---

## 链接

- 详细分析:`IMPLEMENTATION_PRIORITY.md` / `OPTIMIZATION_ANALYSIS.md` / `README_IMPROVEMENTS.md`
- 当前状态:`feature_list.json` + `session-handoff.md`
- Spec 模板:`docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Plan 模板:`docs/superpowers/plans/YYYY-MM-DD-<topic>-plan.md`
