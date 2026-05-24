# Fish Eat Fish — GameScene 架构重构计划

## Context

Fish Eat Fish 是一款 Phaser.js 3.x HTML5 游戏，现有 530 个单元测试通过，harness 结构已搭建。

**本次重构的目标：**
1. 提升代码可维护性（GameScene 70KB / 1800+ 行过载）
2. 提升代码质量保障（E2E 测试缺失、内部状态不可观测）
3. 为后续无限地图功能打好架构基础

**用户选择的方向：**
- GameScene 拆分：提取独立系统类
- CollisionSystem：返回结构化 result，GameScene 处理后果
- TreasureSystem：独立系统，`onCollect` 回调
- RangedAttackSystem：独立系统，调用 `onEnemyAttack`
- SpawnSystem ↔ WaveSystem：DI + 查询接口
- SpawnSystem 副作用：回调注入 `onEnemyCreated(enemy)`
- scene.restart()：每个系统有 `reset(config)` 方法
- 单元测试策略：纯逻辑提取 + 回调输出，不 mock Phaser Scene
- E2E 验证：Playwright MCP + 针对性测试
- 状态暴露：DEBUG 模式 `window.__GAME_SCENE__` + debug overlay

---

## Harness 流程检查

| 要求 | 状态 | 说明 |
|------|------|------|
| CLAUDE.md | ✅ | 已完成（中文版） |
| feature_list.json | ✅ | 已更新，feat-025~040 为重构相关 |
| progress.md | ✅ | 已更新，记录当前阶段 |
| init.sh | ✅ | 含 npm test + http server + E2E |
| **session-handoff.md** | ❌ | **缺失**，多会话工作需要 |
| **Startup 流程** | ⚠️ | CLAUDE.md 有，但需补充 harness 目录说明 |

---

## 架构决策汇总

### 系统职责定义

| 系统 | 职责 | 接口要点 |
|------|------|---------|
| `WaveSystem` | 波次状态机（calm/surge/peak） | `getState()`，`getSpawnInterval()`，`reset(config)` |
| `SpawnSystem` | 敌鱼生成，依赖 WaveSystem 获取 interval | `onEnemyCreated(enemy)` 回调，`reset(config)` |
| `FloatingTextSystem` | 伤害/经验文字飘动 | `showDamage(x,y,dmg)`，`showExp(x,y,exp)`，`reset(config)` |
| `CollisionSystem` | 吃鱼碰撞检测，返回结构化 result | `onCollisionResult(result)` 回调，`reset(config)` |
| `TreasureSystem` | 宝箱碰撞 | `onCollect(box)` 回调，`reset(config)` |
| `RangedAttackSystem` | 炮弹碰撞 | `onHit(enemy, damage)` 回调，`reset(config)` |
| `PlayerControlSystem` | 键盘/鼠标输入处理 | `update(delta)`，`setSpeed(s)`，`reset(config)` |
| `HealthRegenSystem` | 脱战回血 | `update(delta)`，`takeDamage(amt)`，`getHp()`，`reset(config)` |

### CollisionSystem Result 对象

```javascript
{
    type: 'eat' | 'damaged' | 'blocked',
    fish: fish,
    expGain: 50,
    comboMultiplier: 1.1,
    score: 500,
    isLevelUp: false,
    canEat: true
}
```

GameScene 通过 `onCollisionResult(result)` 接收结果，处理所有副作用。

### 系统间通信

| 关系 | 通信方式 |
|------|---------|
| SpawnSystem ↔ WaveSystem | DI + 查询接口：`waveSystem.getSpawnInterval()` |
| SpawnSystem → GameScene | 回调：`onEnemyCreated(enemy)` |
| CollisionSystem → GameScene | 回调：`onCollisionResult(result)` |
| TreasureSystem → GameScene | 回调：`onCollect(box)` |
| RangedAttackSystem → GameScene | 回调：`onHit(enemy, damage)` |

### scene.restart() 处理

每个系统实现 `reset(config)` 方法，GameScene 在 `init()` 中将初始 config 传给所有系统的 `reset()`。

---

## 第一阶段：E2E 验证框架搭建（feat-025）

### 步骤

**Step 1: 暴露游戏内部状态（src/main.js）**

```javascript
window.__PHASER_GAME__ = game;

// src/scenes/GameScene.js create() 中
if (DEBUG_MODE) {
    window.__GAME_SCENE__ = this;
}
```

DEBUG_MODE 通过 URL 参数 `?debug=true` 控制。

**Step 2: 添加 debug overlay**

GameScene 添加只读状态文本（DEBUG 模式可见）：
```
Wave: calm | HP: 50/50 | Score: 0 | Level: 1
```

**Step 3: 编写 Playwright E2E 冒烟测试**

```javascript
// e2e/smoke.spec.js
test('游戏加载成功，无崩溃', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('http://localhost:8080?debug=true');
    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
});

test('wave state 从 calm 开始', async ({ page }) => {
    await page.goto('http://localhost:8080?debug=true');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000);
    const waveState = await page.evaluate(() => window.__GAME_SCENE__?._waveSystem?.getState());
    expect(waveState).toBe('calm');
});
```

**Step 4: 修改 init.sh**

```bash
echo "[4/5] Starting HTTP server..."
cd /Users/yuefengjiang/AI/fish_eat
python3 -m http.server 8765 &
SERVER_PID=$!
sleep 2

echo "[5/5] Running E2E smoke tests..."
npx playwright test e2e/ --project=chromium

kill $SERVER_PID 2>/dev/null || true
```

### 验证
- `./init.sh` 全流程通过
- `npm test` 保持 530+ 测试通过

---

## 第二阶段：系统提取顺序（feat-026 ~ feat-033）

```
WaveSystem (Phase 2.1 / feat-026)
  ↓
SpawnSystem (Phase 2.2 / feat-027)
  ↓
FloatingTextSystem (Phase 2.3 / feat-028)
  ↓
CollisionSystem (Phase 2.4 / feat-029)
  ↓
TreasureSystem (Phase 2.5 / feat-030)
  ↓
RangedAttackSystem (Phase 2.6 / feat-031)
  ↓
PlayerControlSystem (Phase 2.7 / feat-032)
  ↓
HealthRegenSystem (Phase 2.8 / feat-033)
```

### 每步验证流程

每个 Phase 遵循同一模式：
1. 设计接口 → 确认输入/输出/回调
2. 写单元测试（不 mock Phaser）
3. 提取代码到独立文件
4. 更新 GameScene 调用新系统
5. 运行验证：
   ```bash
   npm test
   ./init.sh
   npx playwright test e2e/<feature>.spec.js
   ```
6. Review 通过后进入下一个

### Phase 2.1: WaveSystem (feat-026)

从 GameScene 提取行号：312-318（wave state 变量初始化）、1013-1046（wave state machine）。

```javascript
class WaveSystem {
    constructor(config) { /* 初始化状态 */ }
    update(delta) { /* 状态机逻辑 */ }
    getState() { return this._state; }
    getSpawnInterval() { return this._state === 'surge' ? this.config.surgeInterval : this.config.baseInterval; }
    reset(config) { /* 重置状态 */ }
}
```

### Phase 2.2: SpawnSystem (feat-027)

从 GameScene 提取：spawn timer 逻辑（行 1025-1058），`_getSpawnWeights()`、`_createEnemyConfig()`、`_createEnemy()` 等方法。

```javascript
class SpawnSystem {
    constructor(config) {
        this._waveSystem = config.waveSystem;  // DI
        this.onEnemyCreated = config.onEnemyCreated || (() => {});
    }
    update(delta) {
        const interval = this._waveSystem.getSpawnInterval();
        this._spawnTimer += delta;
        if (this._spawnTimer >= interval) {
            this._spawnTimer = 0;
            const enemy = this._doSpawn();
            this.onEnemyCreated(enemy);
        }
    }
    reset(config) { /* 重置状态 */ }
}
```

### Phase 2.3: FloatingTextSystem (feat-028)

从 GameScene 提取：行 1180-1202 `_showFloatingText()` 方法。

```javascript
class FloatingTextSystem {
    show(x, y, text, style) { /* 创建文字 + 动画 */ }
    showDamage(x, y, damage) { return this.show(x, y, `-${damage}`, { color: 0xff3333, size: 16 }); }
    showExp(x, y, exp) { return this.show(x, y, `+${exp}`, { color: 0x00ff44, size: 14 }); }
    reset(config) { /* 重置 */ }
}
```

### Phase 2.4: CollisionSystem (feat-029)

从 GameScene 提取：行 285-291（overlap 注册）、行 661-770（checkEat 逻辑）。

```javascript
class CollisionSystem {
    constructor(config) {
        this.onCollisionResult = config.onCollisionResult || (() => {});
    }
    register() {
        return this.scene.physics.add.overlap(this.player, this.fishes, this._checkEat, null, this);
    }
    _checkEat(player, fish) {
        const result = {
            type: this._canEat(player, fish) ? 'eat' : 'blocked',
            fish: fish,
            expGain: fish.fishData.exp,
            canEat: this._canEat(player, fish)
        };
        this.onCollisionResult(result);
    }
    reset(config) { /* 重置 */ }
}
```

### Phase 2.5: TreasureSystem (feat-030)

从 GameScene 提取：行 294-300（overlap 注册）、`collectTreasureBox()` 逻辑。

### Phase 2.6: RangedAttackSystem (feat-031)

从 GameScene 提取：行 304-310（overlap 注册）、行 1129-1139（checkAnglerHit 逻辑）。

### Phase 2.7: PlayerControlSystem (feat-032)

从 GameScene 提取：行 241-283（输入初始化）、行 810-851（update 中的移动逻辑）。

### Phase 2.8: HealthRegenSystem (feat-033)

从 GameScene 提取：行 1017-1023（脱战回血逻辑）。

---

## 第三阶段：Bug 修复（feat-034 ~ feat-036）

与第二阶段并行。

| Bug | 修复位置 |
|-----|---------|
| BattleSystem 未实例化 (feat-034) | GameScene.create()，`new BattleSystem(this.fishData)` |
| BackgroundSystem 内存泄漏 (feat-035) | 合并 BackgroundExpansion 到 BackgroundSystem，修复 onLevelUp() |
| Level 10+ map key OOB (feat-036) | 扩展 maps.json levelMapping 到 27，或修复取模 |

---

## 第四阶段：相机滚动 + 视差（feat-037）

系统拆分完成、架构稳定后实现。

---

## 验证体系

| 验证层 | 命令 | 覆盖目标 |
|--------|------|---------|
| 单元测试 | `npm test` | 每个新系统的纯逻辑 |
| E2E 冒烟 | `npx playwright test e2e/smoke.spec.js` | 游戏加载 + 基础操作不报错 |
| E2E 针对性 | `npx playwright test e2e/<feature>.spec.js` | 每个新系统的行为验证 |
| 全流程 | `./init.sh` | install → test → http → e2e |

---

## 完成定义

每个 Phase 完成后，必须满足：
- [ ] 单元测试通过（新增测试覆盖新系统）
- [ ] E2E 针对性测试通过
- [ ] `./init.sh` 全流程通过
- [ ] GameScene 剩余代码行数减少（非增加）
- [ ] 所有系统有 `reset(config)` 方法
- [ ] 无新增全局状态泄露

---

## Harness 目录结构

```
fish_eat/
├── CLAUDE.md              # 主指令文件（中文）
├── feature_list.json      # 特性状态追踪
├── progress.md            # 会话进度日志
├── session-handoff.md     # 多会话交接（需创建）
├── init.sh                # 验证脚本
├── docs/
│   └── ARCHITECTURE_REFACTOR_PLAN.md  # 架构重构计划
├── e2e/                   # E2E 测试
│   └── smoke.spec.js
└── src/
    ├── main.js            # window.__PHASER_GAME__
    └── scenes/
        └── GameScene.js   # window.__GAME_SCENE__（DEBUG）
```

---

## 关键文件

| 文件 | 改动 |
|------|------|
| `src/main.js` | 加 `window.__PHASER_GAME__` |
| `src/scenes/GameScene.js` | DEBUG 模式暴露 window，加 debug overlay |
| `src/systems/WaveSystem.js` | 新建（feat-026） |
| `src/systems/SpawnSystem.js` | 新建（feat-027） |
| `src/systems/FloatingTextSystem.js` | 新建（feat-028） |
| `src/systems/CollisionSystem.js` | 新建（feat-029） |
| `src/systems/TreasureSystem.js` | 新建（feat-030） |
| `src/systems/RangedAttackSystem.js` | 新建（feat-031） |
| `src/systems/PlayerControlSystem.js` | 新建（feat-032） |
| `src/systems/HealthRegenSystem.js` | 新建（feat-033） |
| `src/systems/BackgroundExpansion.js` | 删除（合并到 BackgroundSystem） |
| `e2e/smoke.spec.js` | 新建（feat-025） |
| `session-handoff.md` | 新建（缺失，需创建） |
| `init.sh` | 加 E2E 测试步骤 |