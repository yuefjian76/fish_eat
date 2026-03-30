# 鱼吃鱼 - 视觉与玩法全面增强实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现视觉美化、技能解锁、PK增强、敌人AI改进

**Architecture:**
- 新建 BackgroundSystem 管理真实图片背景（从 OpenGameArt 下载）
- 修改 FishFactory 使用精灵图并添加色调区分
- Enemy 使用精灵图动画
- 技能系统增加 unlockLevel 字段控制可用性
- 战斗系统增加等级加成公式
- 敌人AI增加 FISHING/FLEEING 状态

**Tech Stack:** Phaser.js 3.x, JavaScript ES6+, Jest (TDD)

---

## 资源文件

从 OpenGameArt 下载的免费图片资源（CC0 许可）：

| 文件 | 用途 |
|------|------|
| `background_undersea.png` | 海底背景 |
| `midground_undersea.png` | 中景层（珊瑚） |
| `foregound-merged.png` | 前景层（海藻） |
| `far.png` | 远景层（视差效果） |
| `sand.png` | 沙地 |
| `bubbles_fx.png` | 气泡特效 |
| `player_swim_*.png` | 玩家游泳帧（7帧） |
| `enemy_fish_*.png` | 敌鱼帧（4帧） |
| `enemy_fish_big_*.png` | 大敌鱼帧（5帧） |

---

## 图层深度 (Depth) 规划

```
Depth 0-5:   背景层（background, far, midground, sand, foreground）
Depth 6:     气泡效果
Depth 10:    敌鱼
Depth 11:    敌鱼血条
Depth 15:    玩家鱼
Depth 16:    玩家鱼光晕
```

---

## 任务 1: BackgroundSystem - 海底背景装饰 ✅

**Files:**
- Create: `src/systems/BackgroundSystem.js`
- Modify: `src/scenes/BootScene.js` (加载图片资源)
- Assets: `src/assets/images/*.png` (从 OpenGameArt 下载)

**Status:** ✅ 已完成 - 使用真实图片替代程序生成

**实现要点:**
- 从 OpenGameArt 下载 CC0 许可图片资源
- 背景层 depth 0-5, 鱼 depth 10+
- 气泡动画 depth 6
- 玩家鱼 depth 15, 敌鱼 depth 10, 敌鱼血条 depth 11

---

## 任务 2: TreasureBox - 精美宝箱造型 ✅

**Files:**
- Modify: `src/entities/TreasureBox.js:1-169`
- Test: `src/systems/__tests__/TreasureBoxVisual.test.js`

**Status:** ✅ 已完成

---

## 任务 3: FishFactory - 玩家鱼美化 + 精灵图

**Files:**
- Modify: `src/entities/FishFactory.js`
- Assets: `src/assets/images/frames/player_swim_*.png`

**Status:** ✅ 已完成 - 使用精灵图 + 色调区分

**实现要点:**
- 玩家鱼使用 player_swim_* 精灵图
- 添加橙色色调 (setTint(0xff8844)) 区别于蓝色背景
- 玩家鱼 depth 15，带光晕 depth 16

---

## 任务 4: skills.json - 技能解锁配置 ✅

**Files:**
- Modify: `src/config/skills.json`

**Status:** ✅ 已完成

---

## 任务 5: SkillSystem - 技能锁定逻辑 ✅

**Files:**
- Modify: `src/systems/SkillSystem.js`
- Test: `src/systems/__tests__/SkillLock.test.js`

**Status:** ✅ 已完成

---

## 任务 6: BattleSystem - 等级加成 ✅

**Files:**
- Modify: `src/systems/BattleSystem.js`
- Test: `src/systems/__tests__/BattleScaling.test.js`

**Status:** ✅ 已完成

---

## 任务 7: Enemy - 敌人 AI 新状态 + 精灵图动画

**Files:**
- Modify: `src/entities/Enemy.js`
- Assets: `src/assets/images/frames/enemy_fish_*.png`, `enemy_fish_big_*.png`

**Status:** ✅ 已完成 - 使用精灵图 + 动画 + AI状态

**实现要点:**
- 敌鱼使用 enemy_fish_* 或 enemy_fish_big_* 精灵图
- 敌鱼添加橙色色调 (setTint(0xff8844)) 区别于蓝色背景
- 敌鱼 depth 10, 血条 depth 11
- 支持 FISHING 和 FLEEING 状态

---

## 任务 8: GameScene - 敌人等级分布 ✅

**Files:**
- Modify: `src/scenes/GameScene.js`
- Test: `src/systems/__tests__/EnemyLevelDist.test.js`

**Status:** ✅ 已完成

---

## 任务 9: GameScene - 集成所有系统 ✅

**Files:**
- Modify: `src/scenes/GameScene.js`

**Status:** ✅ 已完成

---

## 剩余问题

- [ ] 背景和鱼的颜色区分：已添加橙色色调 (0xff8844)
- [ ] 深度问题：已调整 depth 值
- [ ] 敌鱼看不到：检查 setTint 是否生效
- [ ] 玩家鱼大小调整

---

## 运行游戏

```bash
cd /Users/yuefengjiang/AI/fish_eat
python3 -m http.server 8080
# 打开 http://localhost:8080
```

---

## 预期测试覆盖

| 文件 | 测试覆盖 |
|------|----------|
| BackgroundSystem.js | createBubbles, createCoral, createSeaweed, update |
| SkillSystem.js | isSkillUnlocked, locked skill rejection |
| BattleSystem.js | calculateDamage level bonus, calculateDefense |
| Enemy.js | FLEEING trigger, FISHING target selection |
| TreasureBox.js | Glow color by type |
| FishFactory.js | Player glow effect, sprite animation |
