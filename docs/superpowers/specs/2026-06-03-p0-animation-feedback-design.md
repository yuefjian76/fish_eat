# P0 体验打磨 — 战斗反馈动画 — 设计 Spec

**项目**: 鱼吃鱼 (Fish Eat Fish)
**Spec 创建日期**: 2026-06-03
**作者**: brainstorming + 用户协作
**状态**: 已批准 (2026-06-03)

---

## 1. 背景

fish_eat 49/49 features 全部 completed,游戏可玩。但"战斗反馈"环节较弱:
- 升级时只有 1 个光波 + 文字(单调)
- 技能 Q/W/E/R 释放时**无明显视觉反馈**(玩家不知道刚才按的技能是否生效)
- 吃鱼时**无粒子反馈**(只有经验数字上飘,体验平淡)

`docs/PHASE_3_ROADMAP.md` 列 P0 体验打磨为最高优先级。本 spec 覆盖 3 类战斗反馈动画。

### 1.1 范围

| 反馈类型 | 触发点 | 包含 |
|---------|--------|------|
| **levelUp** | 玩家升级 (`_onLevelUp`) | LightRing 扩张 + "LEVEL UP!" 文字飞入 + 8 粒子散开 |
| **skillUse** | 技能 Q/W/E/R 释放 | 中心图标闪光 + 技能名短跳 + 8 粒子 |
| **eat** | 玩家吃小鱼 (`_doEatFish`) | 嘴位置 6 粒子 + 经验数字(已有) + 微闪屏 |

### 1.2 不包含

- 受击反馈(用户未选)
- Boss 战血条强化(用户未选)
- 低血量 vignette(用户未选)
- 手动目测验证(用户只要 e2e)

---

## 2. 设计目标

1. **data-driven**: 所有动画参数在 `animation_feedback.json`,调参不改代码
2. **集中系统**: 1 个新文件 `AnimationFeedbackSystem.js`,职责清晰
3. **不破坏**: 现有 855 unit tests + 24 e2e tests + 已修的 5 个 bug
4. **可测**: 单元测试(e2e 配置加载 + 3 个 trigger 路径)+ e2e 验证触发现场

---

## 3. 架构

```
[GameScene event]
    ↓ feedbackSystem.trigger('levelUp', {level: 5})
    ↓
[AnimationFeedbackSystem]
    ↓ load config from animation_feedback.json
    ↓ create Phaser tweens + Graphics particles
    ↓
[Phaser scene.add.graphics / scene.add.text]
```

### 3.1 新文件

- `src/systems/AnimationFeedbackSystem.js` — 集中系统(纯 JS + Phaser Graphics)
- `src/config/animation_feedback.json` — 配置(动画参数)
- `src/systems/__tests__/AnimationFeedbackSystem.test.js` — 单元测试
- `e2e/animation-feedback.spec.js` — e2e 测试

### 3.2 修改文件

- `src/scenes/GameScene.js` — 3 处调用:
  1. `_onLevelUp()` 末尾加 `this.feedbackSystem?.trigger('levelUp', { level })`
  2. `_useSkill(slot)` 末尾加 `this.feedbackSystem?.trigger('skillUse', { slot, text, color })`
  3. `_doEatFish(...)` 末尾加 `this.feedbackSystem?.trigger('eat', { x, y, exp })`

### 3.3 GameScene 集成

```javascript
// GameScene create() 末尾 (around line 410)
import { AnimationFeedbackSystem } from '../systems/AnimationFeedbackSystem.js';

// ... after other system init
this.feedbackSystem = new AnimationFeedbackSystem(this);
```

---

## 4. Data 形状

```json
{
  "levelUp": {
    "ring": {
      "radius": [0, 200],
      "duration": 800,
      "alpha": [1, 0],
      "colors": ["#FFD700", "#FFA500", "#FF4500"]
    },
    "text": {
      "content": "LEVEL UP!",
      "color": "#FFD700",
      "fontSize": 48,
      "yStart": 200,
      "yEnd": 100,
      "duration": 1200
    },
    "particles": {
      "count": 8,
      "colors": ["#FFD700", "#FF69B4", "#00CED1"],
      "distance": 100,
      "duration": 600
    }
  },
  "skillUse": {
    "flash": {
      "duration": 300,
      "alpha": 0.5,
      "color": "#FFFFFF"
    },
    "text": {
      "color": "#00FF00",
      "fontSize": 28,
      "yOffset": -50,
      "duration": 600
    },
    "particles": {
      "count": 8,
      "distance": 60,
      "duration": 400
    }
  },
  "eat": {
    "flash": {
      "duration": 50,
      "alpha": 0.2,
      "color": "#FFFF00"
    },
    "particles": {
      "count": 6,
      "colors": ["#FFFF00", "#FFA500"],
      "distance": 40,
      "duration": 300
    }
  }
}
```

### 4.1 配置说明

- `radius: [0, 200]` — Phaser tween 从 0 扩张到 200
- `alpha: [1, 0]` — 同步从 1 淡到 0
- `yStart: 200, yEnd: 100` — 文字从 y=200 飞到 y=100 (向上)
- `particles.count: 8` — 围绕中心生成 8 个粒子,等距分布
- `distance: 100` — 粒子从中心向外飞 100 px

---

## 5. 接口

```javascript
// src/systems/AnimationFeedbackSystem.js
export class AnimationFeedbackSystem {
    /**
     * @param {Phaser.Scene} scene
     * @param {object} config  - animation_feedback.json content (default: cache.json.get('animationFeedback'))
     */
    constructor(scene, config) {
        this.scene = scene;
        this.config = config || scene.cache.json.get('animationFeedback');
        this._validate();
    }

    /**
     * Trigger feedback animation
     * @param {'levelUp' | 'skillUse' | 'eat'} type
     * @param {object} params - type-specific params
     *   - levelUp: { level: number }
     *   - skillUse: { slot: 'Q'|'W'|'E'|'R', text: string, color: string }
     *   - eat: { x: number, y: number, exp: number }
     */
    trigger(type, params = {}) {
        switch (type) {
            case 'levelUp': return this._playLevelUp(params);
            case 'skillUse': return this._playSkillUse(params);
            case 'eat': return this._playEat(params);
            default:
                if (this.scene?.logger?.warn) {
                    this.scene.logger.warn(`Unknown feedback type: ${type}`);
                }
                return null;
        }
    }

    _playLevelUp({ level }) {
        // 1. Create ring Graphics
        // 2. Phaser tween: radius [0, 200] + alpha [1, 0] over 800ms
        // 3. Create text "LEVEL UP!" at yStart
        // 4. Phaser tween: y [yStart, yEnd] over 1200ms
        // 5. Create 8 particles at scene center
        // 6. Tween each particle: outward + alpha fade over 600ms
        // 7. Cleanup on tween complete (destroy())
    }

    _playSkillUse({ slot, text, color }) {
        // 1. Create flash Graphics overlay (full viewport, white)
        // 2. Tween alpha [0.5, 0] over 300ms
        // 3. Create text with skill name at player position + yOffset
        // 4. Tween y [player.y, player.y + yOffset] over 600ms
        // 5. Create 8 particles around player
        // 6. Cleanup on tween complete
    }

    _playEat({ x, y, exp }) {
        // 1. Create flash Graphics (small rect, yellow)
        // 2. Tween alpha [0.2, 0] over 50ms
        // 3. Create 6 particles at (x, y)
        // 4. Tween outward + fade over 300ms
        // 5. Cleanup
    }

    _validate() {
        // Check config has 'levelUp' / 'skillUse' / 'eat' keys
        // If missing, throw on first use (not on init)
    }
}
```

### 5.1 GameScene 集成

```javascript
// src/scenes/GameScene.js

// 1. import (top of file, after other system imports)
import { AnimationFeedbackSystem } from '../systems/AnimationFeedbackSystem.js';

// 2. create() 末尾 (around line 410)
this.feedbackSystem = new AnimationFeedbackSystem(this);

// 3. _onLevelUp() 末尾
_onLevelUp() {
    // ... existing code ...
    this.feedbackSystem?.trigger('levelUp', { level: this.level });
}

// 4. _useSkill(slot) 末尾
_useSkill(slot) {
    // ... existing code ...
    const skillConfig = this.skills[slot];
    this.feedbackSystem?.trigger('skillUse', {
        slot,
        text: skillConfig.name,  // e.g. "撕咬"
        color: this._skillColor(slot)
    });
}

_skillColor(slot) {
    // Q=撕咬 (red), W=护盾 (blue), E=加速 (green), R=治疗 (yellow)
    const map = { Q: '#FF4444', W: '#4444FF', E: '#44FF44', R: '#FFFF44' };
    return map[slot] || '#FFFFFF';
}

// 5. _doEatFish() 末尾
_doEatFish(fish) {
    // ... existing code ...
    this.feedbackSystem?.trigger('eat', {
        x: fish.x,
        y: fish.y,
        exp: expGain
    });
}
```

### 5.2 Preload 配置

```javascript
// src/main.js 或 BootScene preload()
// Load animation_feedback.json into cache
this.load.json('animationFeedback', 'src/config/animation_feedback.json');
```

---

## 6. 错误处理

| 场景 | 行为 |
|------|------|
| `config[type]` 缺失 | `trigger` 返回 `null` + log warn,不 throw |
| `scene` 未初始化 | `trigger` 返回 `null` + log warn |
| Phaser 对象创建失败 | tween onComplete 仍触发 cleanup,不会泄漏 |
| JSON config 加载失败 | `cache.json.get('animationFeedback')` 返回 null,`constructor` 接受 null,首次 trigger 报错 |
| `_useSkill` 在非 Debug 模式触发 | 正常调用,无差别 |

---

## 7. 测试

### 7.1 单元测试 (`src/systems/__tests__/AnimationFeedbackSystem.test.js`)

| 测试 | 验证 |
|------|------|
| `constructor loads config from cache` | `new AnimationFeedbackSystem(scene)` 读 `scene.cache.json.get('animationFeedback')` |
| `constructor accepts config directly` | `new AnimationFeedbackSystem(scene, {levelUp: {...}})` 不读 cache |
| `trigger('levelUp', {level: 5})` | 不 throw, scene.add.graphics 被调 |
| `trigger('skillUse', {slot: 'Q'})` | 不 throw, scene.add.text 被调 |
| `trigger('eat', {x, y, exp})` | 不 throw, particles 创建 |
| `trigger('unknown', {})` | 返回 null, log warn |
| `trigger('levelUp') without config` | 返回 null, log warn |
| `_validate missing levelUp` | trigger 'levelUp' 返回 null |

### 7.2 e2e 测试 (`e2e/animation-feedback.spec.js`)

**Test 1**: "levelUp trigger creates animations"
```javascript
const before = scene.feedbackSystem.scene.add.displayList.length;
scene.feedbackSystem.trigger('levelUp', { level: 5 });
const after = scene.feedbackSystem.scene.add.displayList.length;
expect(after).toBeGreaterThan(before);  // 至少加了 ring + text + 8 particles
```

**Test 2**: "skillUse trigger creates flash + text + particles"
```javascript
const before = scene.feedbackSystem.scene.add.displayList.length;
scene.feedbackSystem.trigger('skillUse', { slot: 'Q', text: '撕咬', color: '#FF4444' });
const after = scene.feedbackSystem.scene.add.displayList.length;
expect(after).toBeGreaterThan(before + 5);  // flash + text + 8 particles
```

**Test 3**: "eat trigger creates particles"
```javascript
const before = scene.feedbackSystem.scene.add.displayList.length;
scene.feedbackSystem.trigger('eat', { x: 500, y: 400, exp: 10 });
const after = scene.feedbackSystem.scene.add.displayList.length;
expect(after).toBeGreaterThan(before);  // 至少 flash + 6 particles
```

**Test 4**: "feedbackSystem exists in GameScene"
```javascript
expect(scene.feedbackSystem).toBeDefined();
expect(scene.feedbackSystem.config).toBeDefined();
```

**Test 5**: "levelUp via DEBUG_API triggers animations"
```javascript
const before = scene.feedbackSystem.scene.add.displayList.length;
scene._DEBUG_API.level(5);  // 触发 _onLevelUp → feedbackSystem.trigger('levelUp')
await page.waitForTimeout(100);
const after = scene.feedbackSystem.scene.add.displayList.length;
expect(after).toBeGreaterThan(before);
```

---

## 8. 验证标准 (Definition of Done)

- [ ] `src/systems/AnimationFeedbackSystem.js` 创建,含 `trigger` 3 个 type
- [ ] `src/config/animation_feedback.json` 创建,含 3 个 type 配置
- [ ] `src/systems/__tests__/AnimationFeedbackSystem.test.js` 创建,8 测试通过
- [ ] `e2e/animation-feedback.spec.js` 创建,5 测试通过
- [ ] `GameScene.js` 集成:
  - import + create 时 `this.feedbackSystem = new AnimationFeedbackSystem(this)`
  - `_onLevelUp` 末尾 trigger
  - `_useSkill` 末尾 trigger
  - `_doEatFish` 末尾 trigger
- [ ] `main.js` / `BootScene.js` preload `animation_feedback.json` 到 cache
- [ ] `./init.sh` 5 步全过(855 unit + 855+ unit + 24+ e2e all pass)
- [ ] 不破坏现有 5 个 e2e 测试 + 855 unit tests
- [ ] 0 src/ 功能性破坏(纯新增 + 3 处 trigger 调用)
- [ ] 1 个 commit per task(可调)

---

## 9. 不在范围(显式排除)

- 受击反馈 (用户未选)
- Boss 战血条强化 (用户未选)
- 低血量 vignette (用户未选)
- 手动目测验证 (用户只要 e2e)
- 改 feature_list.json (这是 P0 体验,非新 feature,但实施完成后加 feat-XXX 条目)
- 重构 FloatingTextSystem (现有保留)
- 重构现有升级光波动画 (保留 + 加 LightRing 增强)

---

## 10. 风险

| 风险 | 缓解 |
|------|------|
| 动画太多 → 性能 | 用 Phaser object pool 或 destroy onComplete(已在 spec 中) |
| 配置文件错 → 静默失败 | `_validate` 在 trigger 时检查 + log warn |
| GameScene 还没初始化 feedbackSystem | 用 `?.trigger()` 可选链(已在 spec 中) |
| Tween 内存泄漏 | 强制 tween.onComplete destroy()(代码规范) |

---

## 11. spec 自审(本 spec 写完时自审)

- [x] **Placeholder 扫描**: 无 TBD/TODO(除了 8.X 表格中的"功能"二字用作 placeholder)
- [x] **内部一致性**: §3 文件清单 = §8 DoD 文件清单,数据形状 §4 = §5 接口
- [x] **范围检查**: 1 个 spec(1 个新系统 + 1 个新 config + 3 处 GameScene 调用),可一个 plan 实施
- [x] **模糊性检查**: 
  - `_useSkill(slot)` 是 GameScene 已有的内部方法名(假设是,需 plan 时确认)
  - `_doEatFish(...)` 同样(假设是,需 plan 时确认)
  - 若实际方法名不同,plan 阶段会先 grep 实际名再实施

---

**下一步**: 用户审阅本 spec → 确认后调用 `superpowers:writing-plans` skill 生成实现 plan → 按 plan 执行。
