# 分析发现

> ⚠️ **截至 2026-06-01,本文档记录 2026-04 调研发现;2 Bug + 3 项"未实现"已全部修复,详见 `feature_list.json`**。
> 映射:Bug 1 → SkillBar.js 修复;Bug 2 → feat-003;连击 → feat-009;音效 → feat-014;特殊行为 → feat-005。

## 代码层面的关键发现

### Bug 1: 技能栏 Pie-Slice 偏移错误
文件: `src/ui/SkillBar.js` 第179行
```javascript
// 当前错误代码
slot.cooldownOverlay.slice(25, 0, 25, startAngle, endAngle, false);
// 应该是
slot.cooldownOverlay.slice(0, 0, 25, startAngle, endAngle, false);
```
技能格半径25px，圆心应在(0,0)，当前在(25,0)导致冷却弧形显示在错误位置。

> ✅ 已修复(SkillBar.js 第 179 行,详见 feat-007)

### Bug 2: 鼠标控制与键盘控制冲突
文件: `src/scenes/GameScene.js` 第178-186行
```javascript
this.input.on('pointermove', (pointer) => {
    // physics.moveTo 会设置速度，但在 update() 中键盘也设置速度
    // 当玩家接近鼠标位置时，moveTo 产生的速度会引起抖动
    this.physics.moveTo(this.player, targetX, targetY, 200);
});
```
鼠标每帧都调用 `moveTo`，与键盘 `setVelocity` 冲突，造成方向混乱。

> ✅ 已修复(feat-003 PlayerControlSystem 死区+缓动)

### 未实现功能: 连击系统
文件: `src/config/levels.json`
```json
"combo": {
    "timeWindow": 3,
    "bonusMultiplier": 0.2
}
```
配置存在但游戏中没有任何连击计数、显示或加成代码。

> ✅ 已实现(feat-009 ComboSystem)

### 缺失: 音效系统
整个项目没有任何音效相关代码。Phaser 支持 Web Audio API，可以用程序合成音效无需音频文件。

> ✅ 已实现(feat-014 AudioSystem + feat-039 AudioMusicSystem)

### 敌鱼特殊行为配置 vs 实现不匹配
`fish.json` 中定义了：
- eel: `"dash": true, "behavior": "dash"`
- octopus: `"stealth": true, "behavior": "stealth"`  
- seahorse: `"evasive": true, "behavior": "evasive"`
- jellyfish: `"aoe": true, "behavior": "floating"`
- anglerfish: `"behavior": "ranged"`

但 `Enemy.js` 中只有 `WANDERING/CHASING/ATTACKING/FLEEING` 状态，没有实现 dash/stealth/evasive/ranged 等行为。

> ✅ 已实现(feat-005 EnemySpecialBehaviors 5 种行为)

## 体验分析

### 目前缺少的"爽感"元素
1. **吃大鱼的成就感** - 没有特殊效果区分"吃小鱼"和"打败强敌"
> 状态:ImpactSystem 部分实现
2. **成长的可见性** - 鱼体积增长很小，玩家很难感受到进度
> 状态:feat-008 升级 size 1.5x + 光波动画
3. **音效反馈** - 游戏完全静音，所有操作没有声音回应
> 状态:✅ feat-014 + feat-039 已实现
4. **危机感** - 低血量时没有视觉警告（血条发红但不足够）
> 状态:HUD 低血量变色,屏幕震屏(部分)
5. **连击的满足感** - 连续吃鱼无任何额外奖励显示
> 状态:✅ feat-009 ComboSystem + HUD 显示

### 最高优先级改进（用最小代价获得最大体验提升）
1. **修复2个Bug** - 技能栏显示、鼠标控制 → 立竿见影
2. **实现连击UI** - 配置已在，只需实现显示 → 1-2小时
3. **升级动画** - Phaser tweens 即可实现 → 2小时
4. **进度条HUD** - 替换文字为图形进度条 → 1-2小时
5. **低血量警告** - 屏幕红边vignette效果 → 30分钟
