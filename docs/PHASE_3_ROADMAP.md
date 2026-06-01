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
