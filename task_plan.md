# 鱼吃鱼 - 突破性用户体验提升规划 (更新版)

## 目标
从游戏体验核心出发，系统性分析并实现突破性的用户体验改进，使游戏从"能玩"升级到"好玩、爽玩"。

## 已完成功能清单（截至 2026-04-17）
- ✅ 5种鱼类特殊行为（鳗鱼冲刺、章鱼隐身、海马逃跑、水母AOE、灯笼鱼远程攻击）
- ✅ Web Audio 合成音效（eat/hurt/level_up/collect/skill 5种）
- ✅ 连击倍率系统（ComboSystem + UI显示）
- ✅ 进度条HUD + 低血量vignette红边效果
- ✅ 升级全屏光波动画 + 粒子效果
- ✅ 游戏结束统计面板（分数/等级/击杀/生存时间/新纪录）
- ✅ 流畅鼠标控制（死区+缓动区）
- ✅ Pie-Slice技能冷却UI修复
- ✅ Code Review Bug修复（物理体泄漏、tween堆积、overlap重注册、isNewRecord逻辑等）
- ✅ 435个单元测试全通过

---

## 新阶段改进计划（第二轮深度分析结果）

按性价比综合排序：

### 🔴 阶段A：核心体验（高性价比，简单-中等难度）

| # | 功能 | 文件 | 难度 | 预期效果 |
|---|------|------|------|---------|
| A1 | **刷怪权重系统** - 按玩家等级动态调整各鱼出现概率 | `GameScene.spawnFish()` | 简单 | 新手留存大幅提升 |
| A2 | **大小对比光晕提示** - 可吃绿边/危险红边实时显示 | `GameScene.update()` 或 `UIScene` | 简单 | 可读性/上手难度大幅改善 |
| A3 | **受伤击退效果** - 被攻击时短暂反向速度脉冲 | `GameScene.onEnemyAttack()` | 简单 | 打击感立竿见影 |
| A4 | **悬浮数字全覆盖** - 吃鱼显示+EXP，被打显示-HP | `GameScene.checkEat()` + `onEnemyAttack()` | 简单 | 反馈感明显提升 |

### 🔴 阶段B：沉浸感核心（高价值，中等难度）

| # | 功能 | 文件 | 难度 | 预期效果 |
|---|------|------|------|---------|
| B1 | **背景音乐（程序生成）** - Web Audio合成海洋氛围音+循环旋律 | `AudioSystem.js` 新增 `playBgm()` | 中等 | 沉浸感提升60%+ |
| B2 | **成就系统** - 10个里程碑成就，游戏结束展示 | 新建 `AchievementSystem.js` | 中等 | 重玩率显著提升 |

### 🟡 阶段C：体验打磨（中优先级）

| # | 功能 | 文件 | 难度 | 预期效果 |
|---|------|------|------|---------|
| C1 | **菜单动态化** - 鱼群游动背景、标题水波、按钮呼吸 | `MenuScene.create()` | 简单 | 第一印象提升 |
| C2 | **技能命中冻结帧** - 命中0.05秒全局暂停+敌鱼闪白 | `SkillSystem.executeDamageSkill()` | 简单 | 打击感核心技巧 |
| C3 | **出生无敌帧** - 出生3秒保护+明显闪烁 | `GameScene.create()` | 简单 | 减少新手沮丧感 |
| C4 | **波次刷怪节奏** - 平静期→波次涌入→再平静的呼吸节奏 | `GameScene` spawn timer | 中等 | 紧张感和节奏感 |
| C5 | **Boss战专属UI** - 大型血条+登场动画+音调变化 | `UIScene` + `BossSystem` | 中等 | Boss战氛围感 |
| C6 | **漂流瓶视觉化** - 全屏飘入卷轴动画+效果文字 | `DriftBottleSystem` + `GameScene` | 简单 | 特效满足感 |

### 🟢 阶段D：长线留存（低优先级）

| # | 功能 | 文件 | 难度 | 预期效果 |
|---|------|------|------|---------|
| D1 | **玩家鱼种选择** - 3种初始鱼种各有特性 | `MenuScene` + `GameScene` | 复杂 | 差异化体验 |
| D2 | **每日挑战模式** - 按日期种子生成特殊规则 | 新建 `DailyChallengeSystem.js` | 复杂 | 重玩价值 |

---

## 任务状态
| 阶段 | 状态 | 预计时间 |
|------|------|---------|
| 阶段A 核心体验 | pending | 1-2天 |
| 阶段B 沉浸感 | pending | 2-3天 |
| 阶段C 体验打磨 | pending | 2-3天 |
| 阶段D 留存设计 | pending | 4-6天 |

---

## 遇到的错误
| 错误 | 尝试次数 | 解决方案 |
|------|---------|---------|
| ComboSystem test 时间计算错误 | 1 | 修正 lastEatTime 参考点 |
| HUD boundary test 边界判断 | 1 | `>= 0.6` 代替 `> 0.6` |
| isNewScoreRecord 永远返回false | 1 | 先读 prevBest 再调 saveStats |
| isNewLevelRecord key不存在 | 1 | 改用 fishEat_maxLevel |
| 弹药物理体内存泄漏 | 1 | stop tween + remove body 再 destroy |
| vignette tween 堆积 | 1 | create() 顶部 killTweensOf |
| overlap 升级后失效 | 1 | onLevelUp 后重新注册 |
