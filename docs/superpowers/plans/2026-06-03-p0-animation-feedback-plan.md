# P0 体验打磨 — 战斗反馈动画 — 实现 Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 3 类战斗反馈动画(升级 / 技能 / 吃鱼),data-driven 配置,集中 AnimationFeedbackSystem,完整测试覆盖。

**Architecture:** 新建 `AnimationFeedbackSystem` 集中系统,读 `animation_feedback.json` 配置,接收 `trigger(type, params)` 创建 Phaser Graphics 粒子 + 文字 + 闪光。GameScene 4 处集成调用。8 单元 + 5 e2e 测试。

**Tech Stack:** Phaser.js 3.60 · Jest · Playwright · ES Modules

**Spec:** `docs/superpowers/specs/2026-06-03-p0-animation-feedback-design.md`

---

## 关键约束(读前必看)

1. **新文件优先**: AnimationFeedbackSystem + config + 2 个测试文件(4 个新文件)
2. **GameScene 4 处集成**: 不动其他 GameScene 逻辑,仅在已有方法末尾加 1 行 `trigger` 调用
3. **不破坏现有**: 855 unit + 24+ e2e 全部继续 pass
4. **单文件 commit per task**(用户已确认 15 增量 commit 模式)
5. **TDD**: 每个 component 先写 failing test,再写实现
6. **不重命名已有方法**: 用 grep 确认的 4 个实际位置:
   - `GameScene.onLevelUp()` line 1565
   - `GameScene.setupSkillKeys()` 4 个 key down (Q/W/E/R) line 1524/1538/1546/1554
   - `GameScene._handleCollisionResult` 内 `result.type === 'eat'` 分支 line 764
7. **不在 feature_list.json 写新 feat**: 这是 P0 体验打磨,本次完成后手动加 feat-050 条目

---

## 数据快照(从 main 分支实测,2026-06-03)

| 维度 | 值 |
|------|---|
| `UNIT_TESTS` | 855 passed + 1 skipped |
| `E2E_TOTAL` | 24+ (debug-api 16 + spawn-and-map 2 + breathing 1 + diagnose 1 + scrolling-bg 2 + scrolling-visual 2 + game-loads 1) |
| `FEATURE_COUNT` | 49 |
| `CURRENT_BRANCH` | main |
| `LATEST_COMMIT` | 2fb9640 (Phaser vendor fix) |

---

## Phase 1: 数据快照 + 锚点确认(本地完成,无需 subagent)

### Task 1: 现场 grep 实际锚点

**Files:** Read only (no modification)

- [ ] **Step 1.1: 读 GameScene.js 升级 / 技能 / 吃鱼 4 个触发点**

```bash
cd /Users/yuefengjiang/AI/fish_eat
echo "=== onLevelUp location ==="
grep -n "onLevelUp()" src/scenes/GameScene.js
echo "=== setupSkillKeys Q/W/E/R ==="
grep -n "this.skillKeys\.[QWER].on('down'" src/scenes/GameScene.js
echo "=== result.type === 'eat' ==="
grep -n "result.type === 'eat'" src/scenes/GameScene.js
```

期望输出(与 spec 风险标注一致):
- `onLevelUp()` line 1565
- `Q.on('down'`: line 1524
- `W.on('down'`: line 1538
- `E.on('down'`: line 1546
- `R.on('down'`: line 1554
- `result.type === 'eat'`: line 764

- [ ] **Step 1.2: 读 SkillSystem.js 看 useSkill 返回 shape**

```bash
grep -n "return {" src/systems/SkillSystem.js | head -10
```

期望: useSkill 返回 `{ success: bool, ... }`

- [ ] **Step 1.3: 看 skills.json 技能名 / 颜色**

```bash
cat src/config/skills.json | head -30
```

期望: 看到每个技能 (bite / shield / speed_up / heal) 的 name 字段

- [ ] **Step 1.4: 验证 init.sh baseline**

```bash
./init.sh 2>&1 | grep -E "Tests:" | head -1
```

期望: `Tests: 1 skipped, 855 passed, 856 total`

**完成 Task 1 验证**: 4 个 grep 命令的输出已读,baseline 855 tests pass,无 commit。

---

## Phase 2: 新建 AnimationFeedbackSystem + Config(2 task)

### Task 2: 写 config + 单元测试 + 实现(TDD)

**Files:**
- Create: `src/config/animation_feedback.json`
- Create: `src/systems/__tests__/AnimationFeedbackSystem.test.js`
- Create: `src/systems/AnimationFeedbackSystem.js`

- [ ] **Step 2.1: 写 config**

Write `src/config/animation_feedback.json`:

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

- [ ] **Step 2.2: 写 failing 单元测试**

Write `src/systems/__tests__/AnimationFeedbackSystem.test.js`:

```javascript
import { AnimationFeedbackSystem } from '../AnimationFeedbackSystem.js';

const makeScene = (config = null) => {
    const scene = {
        add: {
            graphics: jest.fn(() => ({ setDepth: jest.fn(), setScrollFactor: jest.fn(), fillStyle: jest.fn(), fillCircle: jest.fn(), destroy: jest.fn(), alpha: 0 })),
            text: jest.fn((x, y, content, style) => ({ x, y, content, style, setOrigin: jest.fn(() => ({ setDepth: jest.fn(), destroy: jest.fn() })), setDepth: jest.fn(), destroy: jest.fn() })),
            container: jest.fn(() => ({ add: jest.fn(), setDepth: jest.fn(), destroy: jest.fn() })),
        },
        tweens: { add: jest.fn(({ onComplete }) => { if (onComplete) onComplete(); }) },
        cache: { json: { get: jest.fn(() => config) } },
        logger: { warn: jest.fn() },
        scale: { width: 1024, height: 768 },
    };
    return scene;
};

const fullConfig = {
    levelUp: { ring: { radius: [0, 200], duration: 800, alpha: [1, 0], colors: ['#FFD700'] }, text: { content: 'LEVEL UP!', color: '#FFD700', fontSize: 48, yStart: 200, yEnd: 100, duration: 1200 }, particles: { count: 8, colors: ['#FFD700'], distance: 100, duration: 600 } },
    skillUse: { flash: { duration: 300, alpha: 0.5, color: '#FFFFFF' }, text: { color: '#00FF00', fontSize: 28, yOffset: -50, duration: 600 }, particles: { count: 8, distance: 60, duration: 400 } },
    eat: { flash: { duration: 50, alpha: 0.2, color: '#FFFF00' }, particles: { count: 6, colors: ['#FFFF00'], distance: 40, duration: 300 } },
};

describe('AnimationFeedbackSystem', () => {
    test('constructor loads config from cache', () => {
        const scene = makeScene(fullConfig);
        const sys = new AnimationFeedbackSystem(scene);
        expect(sys.config).toBe(fullConfig);
    });

    test('constructor accepts config directly', () => {
        const scene = makeScene(null);
        const sys = new AnimationFeedbackSystem(scene, fullConfig);
        expect(sys.config).toBe(fullConfig);
    });

    test('trigger("levelUp", {level: 5}) creates animations', () => {
        const scene = makeScene(fullConfig);
        const sys = new AnimationFeedbackSystem(scene);
        sys.trigger('levelUp', { level: 5 });
        expect(scene.add.graphics).toHaveBeenCalled();
        expect(scene.add.text).toHaveBeenCalled();
    });

    test('trigger("skillUse", {slot: "Q"}) creates flash + text + particles', () => {
        const scene = makeScene(fullConfig);
        const sys = new AnimationFeedbackSystem(scene);
        sys.trigger('skillUse', { slot: 'Q', text: '撕咬', color: '#FF4444' });
        expect(scene.add.graphics).toHaveBeenCalled();
        expect(scene.add.text).toHaveBeenCalled();
    });

    test('trigger("eat", {x, y, exp}) creates particles', () => {
        const scene = makeScene(fullConfig);
        const sys = new AnimationFeedbackSystem(scene);
        sys.trigger('eat', { x: 500, y: 400, exp: 10 });
        expect(scene.add.graphics).toHaveBeenCalled();
    });

    test('trigger("unknown", {}) returns null and logs warn', () => {
        const scene = makeScene(fullConfig);
        const sys = new AnimationFeedbackSystem(scene);
        const result = sys.trigger('unknown', {});
        expect(result).toBeNull();
        expect(scene.logger.warn).toHaveBeenCalled();
    });

    test('trigger("levelUp") without config returns null and logs warn', () => {
        const scene = makeScene(null);
        const sys = new AnimationFeedbackSystem(scene, null);
        const result = sys.trigger('levelUp', { level: 5 });
        expect(result).toBeNull();
        expect(scene.logger.warn).toHaveBeenCalled();
    });

    test('trigger("levelUp") with missing levelUp key returns null', () => {
        const scene = makeScene({ skillUse: {}, eat: {} });
        const sys = new AnimationFeedbackSystem(scene);
        const result = sys.trigger('levelUp', { level: 5 });
        expect(result).toBeNull();
        expect(scene.logger.warn).toHaveBeenCalled();
    });
});
```

- [ ] **Step 2.3: 跑测试验证 fail**

```bash
cd /Users/yuefengjiang/AI/fish_eat
npx jest src/systems/__tests__/AnimationFeedbackSystem.test.js 2>&1 | tail -10
```

Expected: FAIL with "Cannot find module '../AnimationFeedbackSystem.js'"

- [ ] **Step 2.4: 写最小实现**

Write `src/systems/AnimationFeedbackSystem.js`:

```javascript
/**
 * AnimationFeedbackSystem - data-driven combat feedback animations
 *
 * Reads animation_feedback.json config; exposes trigger(type, params) for 3 types:
 * - levelUp: ring expand + "LEVEL UP!" text + 8 particles
 * - skillUse: flash + skill name text + 8 particles
 * - eat: small flash + 6 particles at fish position
 */
export class AnimationFeedbackSystem {
    constructor(scene, config = null) {
        this.scene = scene;
        this.config = config || (scene?.cache?.json?.get('animationFeedback') ?? null);
    }

    trigger(type, params = {}) {
        if (!this.config) {
            this._warn('config missing');
            return null;
        }
        if (!this.config[type]) {
            this._warn(`type "${type}" missing in config`);
            return null;
        }
        switch (type) {
            case 'levelUp': return this._playLevelUp(params);
            case 'skillUse': return this._playSkillUse(params);
            case 'eat': return this._playEat(params);
            default:
                this._warn(`unknown type: ${type}`);
                return null;
        }
    }

    _playLevelUp({ level }) {
        const cfg = this.config.levelUp;
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;

        // Ring expand + fade
        const ring = this.scene.add.graphics();
        ring.setDepth(100);
        ring.setScrollFactor(0);
        const [r0, r1] = cfg.ring.radius;
        const [a0, a1] = cfg.ring.alpha;
        ring.fillStyle(parseInt(cfg.ring.colors[0].slice(1), 16), a0);
        ring.fillCircle(cx, cy, r0);
        this.scene.tweens.add({
            targets: ring,
            scaleX: { from: 1, to: r1 / Math.max(r0, 1) },
            scaleY: { from: 1, to: r1 / Math.max(r0, 1) },
            alpha: { from: a0, to: a1 },
            duration: cfg.ring.duration,
            onComplete: () => ring.destroy(),
        });

        // "LEVEL UP!" text flying in
        const text = this.scene.add.text(cx, cfg.text.yStart, cfg.text.content, {
            fontSize: `${cfg.text.fontSize}px`,
            color: cfg.text.color,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4,
        }).setOrigin(0.5).setDepth(101);
        this.scene.tweens.add({
            targets: text,
            y: cfg.text.yEnd,
            alpha: { from: 1, to: 0 },
            duration: cfg.text.duration,
            delay: 200,
            onComplete: () => text.destroy(),
        });

        // 8 particles outward
        this._spawnParticles(cx, cy, cfg.particles, 100);
    }

    _playSkillUse({ slot, text, color }) {
        const cfg = this.config.skillUse;
        const player = this.scene.player;
        if (!player) return null;
        const px = player.x;
        const py = player.y;

        // Flash overlay
        const flash = this.scene.add.graphics();
        flash.setDepth(99);
        flash.setScrollFactor(0);
        flash.fillStyle(parseInt(cfg.flash.color.slice(1), 16), cfg.flash.alpha);
        flash.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        this.scene.tweens.add({
            targets: flash,
            alpha: { from: cfg.flash.alpha, to: 0 },
            duration: cfg.flash.duration,
            onComplete: () => flash.destroy(),
        });

        // Skill name text
        const label = this.scene.add.text(px, py + cfg.text.yOffset, text || slot, {
            fontSize: `${cfg.text.fontSize}px`,
            color: color || cfg.text.color,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5).setDepth(102);
        this.scene.tweens.add({
            targets: label,
            y: py + cfg.text.yOffset - 30,
            alpha: { from: 1, to: 0 },
            duration: cfg.text.duration,
            onComplete: () => label.destroy(),
        });

        // 8 particles around player
        this._spawnParticles(px, py, cfg.particles, 102);
    }

    _playEat({ x, y, exp }) {
        const cfg = this.config.eat;
        // Small flash
        const flash = this.scene.add.graphics();
        flash.setDepth(50);
        flash.setScrollFactor(0);
        flash.fillStyle(parseInt(cfg.flash.color.slice(1), 16), cfg.flash.alpha);
        flash.fillCircle(0, 0, 30);
        flash.x = x;
        flash.y = y;
        this.scene.tweens.add({
            targets: flash,
            alpha: { from: cfg.flash.alpha, to: 0 },
            scaleX: { from: 1, to: 2 },
            scaleY: { from: 1, to: 2 },
            duration: cfg.flash.duration,
            onComplete: () => flash.destroy(),
        });
        // 6 particles at fish position
        this._spawnParticles(x, y, cfg.particles, 51);
    }

    _spawnParticles(x, y, cfg, depth) {
        const colors = cfg.colors || ['#FFFFFF'];
        const count = cfg.count;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const dist = cfg.distance;
            const color = colors[i % colors.length];
            const p = this.scene.add.graphics();
            p.setDepth(depth);
            p.setScrollFactor(0);
            p.fillStyle(parseInt(color.slice(1), 16), 1);
            p.fillCircle(0, 0, 4);
            p.x = x;
            p.y = y;
            this.scene.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: { from: 1, to: 0 },
                duration: cfg.duration,
                onComplete: () => p.destroy(),
            });
        }
    }

    _warn(msg) {
        this.scene?.logger?.warn?.(`AnimationFeedbackSystem: ${msg}`);
    }
}
```

- [ ] **Step 2.5: 跑测试验证 pass**

```bash
cd /Users/yuefengjiang/AI/fish_eat
npx jest src/systems/__tests__/AnimationFeedbackSystem.test.js 2>&1 | tail -10
```

Expected: `Tests: 8 passed, 8 total`

- [ ] **Step 2.6: 跑全套回归确认无破坏**

```bash
./init.sh 2>&1 | grep -E "Tests:" | head -1
```

Expected: `Tests: 1 skipped, 855 passed, 856 total`(无新增 unit tests,因为 npx jest 单跑已加 8 个新测试 = 863 total,8 from this test file 是 855 + 8 - 但 jest --config 模式可能计数不同,以实测为准)

**完成 Task 2 验证**: 8 单元测试通过,baseline 855 unit tests 不破坏。

- [ ] **Step 2.7: 单文件 commit**

```bash
git add src/config/animation_feedback.json src/systems/__tests__/AnimationFeedbackSystem.test.js src/systems/AnimationFeedbackSystem.js
git commit -m "feat(feedback): AnimationFeedbackSystem + data-driven animation_feedback.json

- AnimationFeedbackSystem 集中系统, trigger(type, params) 3 个 type
- animation_feedback.json: 3 type 配置 (levelUp / skillUse / eat)
- 8 单元测试覆盖 (config loading + 3 trigger + 错误处理)
- 855 现有 unit tests 不破坏"
```

---

### Task 3: GameScene 集成 — 升级动画

**Files:**
- Modify: `src/scenes/GameScene.js` (~line 1565 `onLevelUp`)
- Modify: `src/scenes/GameScene.js` (~line 410 `create()` 末尾 + import)

- [ ] **Step 3.1: 读 GameScene 顶部 import 区块**

```bash
head -25 /Users/yuefengjiang/AI/fish_eat/src/scenes/GameScene.js
```

期望: 看到现有 system imports(line 1-25)

- [ ] **Step 3.2: 加 import**

在最后一个 system import 之后,加:

```javascript
import { AnimationFeedbackSystem } from '../systems/AnimationFeedbackSystem.js';
```

- [ ] **Step 3.3: 找 create() 末尾位置**

```bash
grep -n "create() {\|^    }$" /Users/yuefengjiang/AI/fish_eat/src/scenes/GameScene.js | head -10
```

期望: `create() {` 起始行 + `}` 结束行

- [ ] **Step 3.4: 读 create() 最后 ~20 行**

```bash
sed -n '405,425p' /Users/yuefengjiang/AI/fish_eat/src/scenes/GameScene.js
```

期望: 看到现有 system init 末尾

- [ ] **Step 3.5: 找 BootScene / main.js 看 cache.json.get 来源**

```bash
grep -rn "cache.json.get\|load.json" /Users/yuefengjiang/AI/fish_eat/src/scenes/BootScene.js /Users/yuefengjiang/AI/fish_eat/src/main.js 2>&1 | head -5
```

期望: BootScene 现有 load.json 调用,看在哪里加 `load.json('animationFeedback', ...)`

- [ ] **Step 3.6: 找 BootScene preload 区**

```bash
grep -n "preload\|this.load" /Users/yuefengjiang/AI/fish_eat/src/scenes/BootScene.js | head -5
```

- [ ] **Step 3.7: 读 BootScene preload 现有 calls**

```bash
sed -n '/preload/,/create/p' /Users/yuefengjiang/AI/fish_eat/src/scenes/BootScene.js | head -30
```

- [ ] **Step 3.8: 在 BootScene preload 加 load.json**

在现有 `this.load.json(...)` 调用后,加:

```javascript
this.load.json('animationFeedback', 'src/config/animation_feedback.json');
```

(如果路径在 main.js 配置,改 main.js;否则 BootScene)

- [ ] **Step 3.9: 找 onLevelUp 函数末尾**

```bash
grep -n "onLevelUp" /Users/yuefengjiang/AI/fish_eat/src/scenes/GameScene.js
```

期望: line 1565

- [ ] **Step 3.10: 读 onLevelUp 末尾 ~15 行**

```bash
sed -n '1565,1585p' /Users/yuefengjiang/AI/fish_eat/src/scenes/GameScene.js
```

- [ ] **Step 3.11: 在 onLevelUp 末尾加 trigger**

在 `onLevelUp()` 函数最后 `}` 之前,加:

```javascript
        this.feedbackSystem?.trigger('levelUp', { level: this.level });
```

- [ ] **Step 3.12: 找 create() 末尾,加 this.feedbackSystem 实例化**

在 create() 函数最后 `}` 之前(找一个明确的"sections" 区块),加:

```javascript
        // Animation feedback system
        this.feedbackSystem = new AnimationFeedbackSystem(this);
```

(放在 `this.collisionSystem = new CollisionSystem(...)` 之后)

- [ ] **Step 3.13: 跑回归**

```bash
cd /Users/yuefengjiang/AI/fish_eat
./init.sh 2>&1 | grep -E "Tests:" | head -1
```

Expected: `Tests: 1 skipped, 855 passed, 856 total`(本次只加 1 行 import + 2 行 init + 1 行 trigger,无新 unit test)

- [ ] **Step 3.14: 单文件 commit**

```bash
git add src/scenes/GameScene.js src/scenes/BootScene.js  # (或 main.js 视 Step 3.5)
git commit -m "feat(feedback): GameScene 集成 levelUp 动画触发

- import AnimationFeedbackSystem
- create() 末尾 this.feedbackSystem = new AnimationFeedbackSystem(this)
- onLevelUp() 末尾 feedbackSystem.trigger('levelUp', { level })
- BootScene preload animation_feedback.json
- 855 unit tests 不破坏"
```

---

### Task 4: GameScene 集成 — 技能反馈(Q/W/E/R)

**Files:**
- Modify: `src/scenes/GameScene.js` (`setupSkillKeys` 4 个 key down handlers, line 1524/1538/1546/1554)

- [ ] **Step 4.1: 读 setupSkillKeys 完整**

```bash
sed -n '1522,1560p' /Users/yuefengjiang/AI/fish_eat/src/scenes/GameScene.js
```

- [ ] **Step 4.2: 4 处 key down handler 末尾加 trigger**

在 `Q.on('down')` 末尾(在 `}` 关闭前),加:

```javascript
            this.feedbackSystem?.trigger('skillUse', { slot: 'Q', text: '撕咬', color: '#FF4444' });
```

在 `W.on('down')` 末尾,加:

```javascript
            this.feedbackSystem?.trigger('skillUse', { slot: 'W', text: '护盾', color: '#4444FF' });
```

在 `E.on('down')` 末尾,加:

```javascript
            this.feedbackSystem?.trigger('skillUse', { slot: 'E', text: '加速', color: '#44FF44' });
```

在 `R.on('down')` 末尾,加:

```javascript
            this.feedbackSystem?.trigger('skillUse', { slot: 'R', text: '治疗', color: '#FFFF44' });
```

(每处加在 `});` 关闭 callback 之前)

- [ ] **Step 4.3: 跑回归**

```bash
cd /Users/yuefengjiang/AI/fish_eat
./init.sh 2>&1 | grep -E "Tests:" | head -1
```

Expected: `Tests: 1 skipped, 855 passed, 856 total`

- [ ] **Step 4.4: 单文件 commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat(feedback): 4 技能 key down 触发 skillUse 动画

- Q '撕咬' 红 / W '护盾' 蓝 / E '加速' 绿 / R '治疗' 黄
- feedbackSystem.trigger('skillUse', { slot, text, color })
- 855 unit tests 不破坏"
```

---

### Task 5: GameScene 集成 — 吃鱼反馈

**Files:**
- Modify: `src/scenes/GameScene.js` (`_handleCollisionResult` 内 `result.type === 'eat'` 分支, line 764+)

- [ ] **Step 5.1: 读 result.type === 'eat' 分支**

```bash
sed -n '764,810p' /Users/yuefengjiang/AI/fish_eat/src/scenes/GameScene.js
```

- [ ] **Step 5.2: 在 showExp 之后加 trigger**

在 line 790 `this.floatingTextSystem.showExp(fish.x, fish.y, expResult.expGained);` 之后,加:

```javascript
            this.feedbackSystem?.trigger('eat', { x: fish.x, y: fish.y, exp: expResult.expGained });
```

- [ ] **Step 5.3: 跑回归**

```bash
cd /Users/yuefengjiang/AI/fish_eat
./init.sh 2>&1 | grep -E "Tests:" | head -1
```

Expected: `Tests: 1 skipped, 855 passed, 856 total`

- [ ] **Step 5.4: 单文件 commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat(feedback): 吃鱼触发 eat 动画 (粒子 + 微闪屏)

- _handleCollisionResult result.type === 'eat' 分支末尾
- feedbackSystem.trigger('eat', { x, y, exp })
- showExp 之后(经验数字 + 粒子 + flash 同步显示)
- 855 unit tests 不破坏"
```

---

## Phase 3: e2e 测试

### Task 6: 写 e2e + 跑全套验证

**Files:**
- Create: `e2e/animation-feedback.spec.js`

- [ ] **Step 6.1: 写 e2e 测试**

Write `e2e/animation-feedback.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

test.describe('AnimationFeedbackSystem', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8765?debug=true', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        // Click start button to enter GameScene
        const canvasBounds = await page.evaluate(() => {
            const rect = document.querySelector('canvas')?.getBoundingClientRect();
            return rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null;
        });
        await page.mouse.click(canvasBounds.x + 512, canvasBounds.y + 520);
        await page.waitForTimeout(2000);
    });

    test('feedbackSystem exists in GameScene after start', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game?.scene.scenes.find(s => s.scene.key === 'GameScene');
            return {
                exists: !!scene?.feedbackSystem,
                hasConfig: !!scene?.feedbackSystem?.config,
                hasLevelUp: !!scene?.feedbackSystem?.config?.levelUp,
                hasSkillUse: !!scene?.feedbackSystem?.config?.skillUse,
                hasEat: !!scene?.feedbackSystem?.config?.eat,
            };
        });
        expect(result.exists).toBe(true);
        expect(result.hasConfig).toBe(true);
        expect(result.hasLevelUp).toBe(true);
        expect(result.hasSkillUse).toBe(true);
        expect(result.hasEat).toBe(true);
    });

    test('trigger("levelUp") creates display objects', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.scenes.find(s => s.scene.key === 'GameScene');
            const before = scene.add.displayList.length;
            scene.feedbackSystem.trigger('levelUp', { level: 5 });
            const after = scene.add.displayList.length;
            return { before, after, delta: after - before };
        });
        expect(result.delta).toBeGreaterThan(0);  // at least ring + text + particles
    });

    test('trigger("skillUse") creates flash + text + particles', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.scenes.find(s => s.scene.key === 'GameScene');
            const before = scene.add.displayList.length;
            scene.feedbackSystem.trigger('skillUse', { slot: 'Q', text: '撕咬', color: '#FF4444' });
            const after = scene.add.displayList.length;
            return { before, after, delta: after - before };
        });
        expect(result.delta).toBeGreaterThan(5);  // flash + text + 8 particles
    });

    test('trigger("eat") creates particles', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.scenes.find(s => s.scene.key === 'GameScene');
            const before = scene.add.displayList.length;
            scene.feedbackSystem.trigger('eat', { x: 500, y: 400, exp: 10 });
            const after = scene.add.displayList.length;
            return { before, after, delta: after - before };
        });
        expect(result.delta).toBeGreaterThan(0);  // flash + 6 particles
    });

    test('trigger("unknown") returns null and does not throw', async ({ page }) => {
        const result = await page.evaluate(() => {
            const game = window.__PHASER_GAME__;
            const scene = game.scene.scenes.find(s => s.scene.key === 'GameScene');
            return scene.feedbackSystem.trigger('unknown', {});
        });
        expect(result).toBeNull();
    });
});
```

- [ ] **Step 6.2: 跑 e2e 验证 pass**

```bash
cd /Users/yuefengjiang/AI/fish_eat
npx playwright test e2e/animation-feedback.spec.js --project=chromium --reporter=line 2>&1 | tail -10
```

Expected: `5 passed`

- [ ] **Step 6.3: 跑全套 e2e 回归**

```bash
for f in e2e/*.spec.js; do
    echo "--- $f ---"
    npx playwright test "$f" --project=chromium --reporter=line 2>&1 | tail -3
done
```

Expected: 全部 pass(smoke 4 pre-existing failed 不计)

- [ ] **Step 6.4: 单文件 commit**

```bash
git add e2e/animation-feedback.spec.js
git commit -m "test(feedback): e2e 验证 feedbackSystem 集成

- 5 tests: system 存在 + 3 trigger 路径 + 错误处理
- GameScene 集成 + animation_feedback.json 加载
- 全套 e2e 24+ tests 不破坏"
```

---

## Phase 4: 最终验证 + 加 feat-050

### Task 7: 最终验证 + feature_list.json 加 feat-050

**Files:**
- Modify: `feature_list.json` (加 feat-050 条目)

- [ ] **Step 7.1: 跑 ./init.sh 5 步全过**

```bash
cd /Users/yuefengjiang/AI/fish_eat
./init.sh 2>&1 | tail -5
```

Expected: 5 步全过, `Tests: 1 skipped, 855 passed, 856 total` + 单元新增 8 个 = 863 total

- [ ] **Step 7.2: 跑全套 e2e 回归**

```bash
for f in e2e/*.spec.js; do
    echo "--- $f ---"
    npx playwright test "$f" --project=chromium --reporter=line 2>&1 | tail -3
done
```

Expected: 28+ e2e tests pass(smoke 4 pre-existing failed)

- [ ] **Step 7.3: 读 feature_list.json 末尾**

```bash
tail -10 /Users/yuefengjiang/AI/fish_eat/feature_list.json
```

- [ ] **Step 7.4: 加 feat-050 条目**

在 features 数组末尾(`]` 之前)加新对象:

```json
    {
      "id": "feat-050",
      "name": "Combat Feedback Animations (P0 Polish)",
      "description": "Data-driven combat feedback animations: levelUp ring + text + particles, skillUse flash + text + particles, eat flash + particles. AnimationFeedbackSystem with animation_feedback.json config.",
      "dependencies": [
        "feat-038"
      ],
      "status": "completed",
      "evidence": "AnimationFeedbackSystem.js + animation_feedback.json + 8 unit tests + 5 e2e tests, integrated in GameScene onLevelUp/setupSkillKeys (Q/W/E/R)/_handleCollisionResult. 863 unit + 28+ e2e tests pass."
    }
```

注意保持 JSON 格式(逗号,缩进)。如果前一个 feat-049 后没逗号,先加逗号。

- [ ] **Step 7.5: 验证 feature_list.json 合法 JSON**

```bash
cd /Users/yuefengjiang/AI/fish_eat
node -e "const f = require('./feature_list.json'); console.log('features:', f.features.length, 'pending:', f.features.filter(x => x.status === 'pending').length);"
```

Expected: `features: 50 pending: 0`

- [ ] **Step 7.6: 单文件 commit**

```bash
git add feature_list.json
git commit -m "feat(050): combat feedback animations (P0 polish) — 50/49 done

- AnimationFeedbackSystem + data-driven animation_feedback.json
- 3 trigger types: levelUp / skillUse / eat
- GameScene 集成 4 处 (onLevelUp / Q/W/E/R / eat collision)
- 8 unit tests + 5 e2e tests
- 863 unit + 28+ e2e all pass
- 50 features completed (P0 polish bonus feat-050)"
```

---

## 完成定义 (Definition of Done)

- [ ] Task 1-7 全部勾选完成
- [ ] `src/systems/AnimationFeedbackSystem.js` 创建
- [ ] `src/config/animation_feedback.json` 创建
- [ ] `src/systems/__tests__/AnimationFeedbackSystem.test.js` 8 测试通过
- [ ] `e2e/animation-feedback.spec.js` 5 测试通过
- [ ] GameScene 集成 4 处(onLevelUp / Q/W/E/R / eat)
- [ ] BootScene preload animation_feedback.json
- [ ] `./init.sh` 5 步全过,unit tests ≥ 855 (本次新增 8)
- [ ] e2e 全套 ≥ 24 (本次新增 5)
- [ ] 0 broken ref
- [ ] 7 个 commit (Task 1 无 commit + Task 2-7 各 1)
- [ ] 50 features completed
- [ ] `src/` 现有功能不破坏
- [ ] `feature_list.json` 加 feat-050 标记 completed

---

## Plan 自审(spec coverage)

按 writing-plans 要求自审 3 个维度:

### 1. Spec coverage(每条 spec 需求都有任务对应)

| Spec § | 需求 | 对应 Task |
|--------|------|----------|
| §3.1 新建 AnimationFeedbackSystem | Task 2 |
| §3.1 新建 animation_feedback.json | Task 2 |
| §3.1 新建 单元测试 | Task 2 |
| §3.1 新建 e2e | Task 6 |
| §3.2 GameScene 集成 4 处 | Task 3 (levelUp) + Task 4 (4 skills) + Task 5 (eat) |
| §3.3 GameScene import + create 实例化 | Task 3 |
| §4 data 形状 | Task 2 (完整复制) |
| §5 接口 | Task 2 (实现) |
| §5.2 Preload 配置 | Task 3 |
| §6 错误处理 | Task 2 (8 单元测试覆盖) |
| §7.1 单元测试 | Task 2 (8 tests) |
| §7.2 e2e 测试 | Task 6 (5 tests) |
| §8 DoD 21 条 | Task 7 验证 |
| §11 风险 4 项 | Task 2-6 mitigations |

**结论**: 全部 spec 章节都有对应任务,**0 缺口**。

### 2. Placeholder 扫描

```bash
grep -E "TBD|TODO|implement later|fill in details|appropriate|similar to" docs/superpowers/plans/2026-06-03-p0-animation-feedback-plan.md
```

- 无 TBD / TODO / placeholder
- 完整代码在每个 Step 中

**结论**: **0 占位符**。

### 3. 类型 / 命名一致性

| 引用 | 出现位置 | 一致性 |
|------|---------|--------|
| `AnimationFeedbackSystem` | Task 2 创建 + Task 3/4/5 调用 + Task 6 验证 | ✓ |
| `trigger('levelUp', ...)` | Task 2 unit test + Task 3 调用 + Task 6 e2e | ✓ |
| `trigger('skillUse', ...)` | Task 2 unit test + Task 4 调用 + Task 6 e2e | ✓ |
| `trigger('eat', ...)` | Task 2 unit test + Task 5 调用 + Task 6 e2e | ✓ |
| `feedbackSystem` | GameScene 实例 + 调用 | ✓ |
| `onLevelUp()` | GameScene 实际方法(line 1565) | ✓ |
| `setupSkillKeys()` Q/W/E/R | GameScene 实际位置 1524/1538/1546/1554 | ✓ |
| `_handleCollisionResult` | GameScene 实际位置 line 764 | ✓ |

**结论**: 命名一致,无 `clearLayers()` vs `clearFullLayers()` 类问题。
