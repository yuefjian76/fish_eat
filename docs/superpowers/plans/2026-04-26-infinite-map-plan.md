# 无限地图扩展系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现无限地图扩展系统，玩家可以向任意方向无限探索，世界根据距离动态切换主题区域

**Architecture:** 使用 MapExpansionSystem 追踪玩家世界坐标和区域，通过 BackgroundExpansion 管理动态背景拼接。主题区域根据同心圆距离划分，到达临界点自动触发过渡动画。

**Tech Stack:** Phaser 3.x Arcade Physics, ES6 Modules

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/config/zones.json` | 创建 | 主题区域配置 |
| `src/systems/MapExpansionSystem.js` | 创建 | 世界坐标追踪、区域计算、过渡触发 |
| `src/systems/BackgroundExpansion.js` | 创建 | 扩展 BackgroundSystem，支持动态背景拼接 |
| `src/scenes/GameScene.js` | 修改 | 集成 MapExpansionSystem |
| `src/systems/__tests__/MapExpansionSystem.test.js` | 创建 | 单元测试 |

---

## Task 1: 创建主题区域配置文件

**Files:**
- 创建: `src/config/zones.json`

- [ ] **Step 1: 编写 zones.json 配置文件**

```json
{
  "zones": [
    {
      "id": "shallow",
      "name": "浅海",
      "minDistance": 0,
      "maxDistance": 1000,
      "tint": 16777215,
      "bubbleColor": 11185165,
      "enemyLevelRange": [1, 3],
      "bossType": null,
      "backgrounds": ["bg_tropical_theme", "background_tropical_theme", "background_tropical_theme3"],
      "midgrounds": ["midground_tropical_theme"]
    },
    {
      "id": "coral",
      "name": "珊瑚礁",
      "minDistance": 1000,
      "maxDistance": 2500,
      "tint": 16774785,
      "bubbleColor": 16768281,
      "enemyLevelRange": [3, 6],
      "bossType": null,
      "backgrounds": ["bg_undersea_theme", "background_undersea_theme2", "background_undersea_theme3"],
      "midgrounds": ["midground_undersea_theme"]
    },
    {
      "id": "deep",
      "name": "深海",
      "minDistance": 2500,
      "maxDistance": 4500,
      "tint": 131079,
      "bubbleColor": 8924896,
      "enemyLevelRange": [6, 9],
      "bossType": null,
      "backgrounds": ["bg_undersea_theme", "background_undersea_theme2"],
      "midgrounds": ["midground_undersea_theme"]
    },
    {
      "id": "abyss",
      "name": "深渊",
      "minDistance": 4500,
      "maxDistance": 999999,
      "tint": 32768,
      "bubbleColor": 3277440,
      "enemyLevelRange": [9, 12],
      "bossType": "boss_sea_dragon",
      "backgrounds": ["bg_undersea_theme"],
      "midgrounds": ["midground_undersea_theme"]
    }
  ]
}
```

- [ ] **Step 2: 验证 JSON 格式**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/config/zones.json'))" && echo "Valid JSON"`

---

## Task 2: 创建 MapExpansionSystem

**Files:**
- 创建: `src/systems/MapExpansionSystem.js`
- 测试: `src/systems/__tests__/MapExpansionSystem.test.js`

- [ ] **Step 1: 编写 MapExpansionSystem 测试**

```javascript
import { MapExpansionSystem } from '../MapExpansionSystem.js';

describe('MapExpansionSystem', () => {
  let system;
  let mockScene;

  beforeEach(() => {
    mockScene = {
      load: { json: jest.fn() },
      cache: { json: { get: jest.fn() } }
    };
  });

  describe('distance calculation', () => {
    it('should calculate distance from origin correctly', () => {
      const zoneData = { zones: [{ id: 'shallow', minDistance: 0, maxDistance: 1000 }] };
      mockScene.cache.json.get.mockReturnValue(zoneData);
      
      system = new MapExpansionSystem(mockScene);
      system.updatePlayerPosition(300, 400);
      
      const dist = system.getDistanceFromOrigin();
      expect(dist).toBe(500); // sqrt(300^2 + 400^2)
    });
  });

  describe('zone detection', () => {
    it('should return shallow zone for distance < 1000', () => {
      const zoneData = { zones: [{ id: 'shallow', minDistance: 0, maxDistance: 1000 }] };
      mockScene.cache.json.get.mockReturnValue(zoneData);
      
      system = new MapExpansionSystem(mockScene);
      system.updatePlayerPosition(500, 0); // distance = 500
      
      expect(system.getCurrentZone().id).toBe('shallow');
    });

    it('should return coral zone for distance >= 1000', () => {
      const zoneData = {
        zones: [
          { id: 'shallow', minDistance: 0, maxDistance: 1000 },
          { id: 'coral', minDistance: 1000, maxDistance: 2500 }
        ]
      };
      mockScene.cache.json.get.mockReturnValue(zoneData);
      
      system = new MapExpansionSystem(mockScene);
      system.updatePlayerPosition(1500, 0); // distance = 1500
      
      expect(system.getCurrentZone().id).toBe('coral');
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- --testPathPattern="MapExpansionSystem" 2>&1 | tail -30`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 编写 MapExpansionSystem 实现**

```javascript
/**
 * MapExpansionSystem - 无限地图扩展核心系统
 * 追踪玩家世界坐标，计算当前区域，触发主题过渡
 */
export class MapExpansionSystem {
  /**
   * @param {object} scene - Phaser scene reference
   */
  constructor(scene) {
    this.scene = scene;
    this.worldX = 0;
    this.worldY = 0;
    this.currentZone = null;
    this.zones = [];
    this.onZoneChange = null; // 回调：zoneChangeCallback(zone)
    
    this._loadZoneData();
  }

  _loadZoneData() {
    // 从 zones.json 加载区域配置
    this.scene.load.json('zonesData', 'src/config/zones.json');
    this.scene.load.once('complete', () => {
      const data = this.scene.cache.json.get('zonesData');
      this.zones = data.zones;
      // 初始化当前区域
      this.currentZone = this.zones[0];
    });
  }

  /**
   * 更新玩家世界坐标
   * @param {number} x - 世界X坐标
   * @param {number} y - 世界Y坐标
   */
  updatePlayerPosition(x, y) {
    this.worldX = x;
    this.worldY = y;
    this._checkZoneTransition();
  }

  /**
   * 获取距离原点的距离
   * @returns {number} 距离
   */
  getDistanceFromOrigin() {
    return Math.sqrt(this.worldX * this.worldX + this.worldY * this.worldY);
  }

  /**
   * 获取当前所在区域
   * @returns {object} 当前 ThemeZone
   */
  getCurrentZone() {
    return this.currentZone;
  }

  /**
   * 检查是否需要区域过渡
   */
  _checkZoneTransition() {
    const distance = this.getDistanceFromOrigin();
    const newZone = this._getZoneForDistance(distance);
    
    if (newZone && newZone.id !== this.currentZone?.id) {
      const oldZone = this.currentZone;
      this.currentZone = newZone;
      
      if (this.onZoneChange) {
        this.onZoneChange(newZone, oldZone);
      }
    }
  }

  /**
   * 根据距离获取对应区域
   * @param {number} distance - 距离原点的距离
   * @returns {object|null} ThemeZone
   */
  _getZoneForDistance(distance) {
    for (const zone of this.zones) {
      if (distance >= zone.minDistance && distance < zone.maxDistance) {
        return zone;
      }
    }
    // 返回最远的区域
    return this.zones[this.zones.length - 1];
  }

  /**
   * 获取敌人等级范围（根据当前区域）
   * @returns {number[]} [minLevel, maxLevel]
   */
  getEnemyLevelRange() {
    return this.currentZone?.enemyLevelRange || [1, 3];
  }

  /**
   * 获取当前区域的Boss类型
   * @returns {string|null}
   */
  getBossType() {
    return this.currentZone?.bossType || null;
  }

  destroy() {
    this.zones = [];
    this.currentZone = null;
  }
}

export default MapExpansionSystem;
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- --testPathPattern="MapExpansionSystem" 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/config/zones.json src/systems/MapExpansionSystem.js src/systems/__tests__/MapExpansionSystem.test.js
git commit -m "feat: add MapExpansionSystem for infinite map zone tracking"
```

---

## Task 3: 创建 BackgroundExpansion 系统

**Files:**
- 创建: `src/systems/BackgroundExpansion.js`
- 扩展: `src/systems/BackgroundSystem.js`

- [ ] **Step 1: 阅读现有 BackgroundSystem 完整代码**

```javascript
// 理解现有的:
// - createBackground() 方法
// - _loadBackgroundImages() 方法
// - bgImages 对象结构
// - themeConfig 应用方式
```

- [ ] **Step 2: 编写 BackgroundExpansion 实现**

```javascript
/**
 * BackgroundExpansion - 扩展 BackgroundSystem 支持无限背景
 * 管理多张背景图像的动态拼接和主题过渡
 */
import BackgroundSystem from './BackgroundSystem.js';

export class BackgroundExpansion extends BackgroundSystem {
  constructor(scene, screenWidth = 1024, screenHeight = 768) {
    super(scene, screenWidth, screenHeight);
    
    // 额外的无限地图属性
    this.tileSize = 1024;
    this.renderDistance = 2048;
    this.loadedChunks = new Map();
    this.currentZone = null;
    
    // 世界坐标偏移（原点的世界坐标）
    this.worldOriginX = 0;
    this.worldOriginY = 0;
  }

  /**
   * 根据玩家世界坐标更新背景
   * @param {number} worldX - 玩家世界X
   * @param {number} worldY - 玩家世界Y
   * @param {object} zone - 当前区域配置
   */
  updateBackground(worldX, worldY, zone) {
    // 更新世界原点偏移
    this.worldOriginX = worldX - this.screenWidth / 2;
    this.worldOriginY = worldY - this.screenHeight / 2;
    
    // 更新背景图层位置（parallax效果）
    this._updateLayerPositions();
    
    // 检查是否需要区域过渡
    if (zone && zone.id !== this.currentZone?.id) {
      this.transitionToZone(zone);
    }
  }

  /**
   * 更新背景图层位置实现parallax
   */
  _updateLayerPositions() {
    const offsetX = this.worldOriginX * 0.02;
    const offsetY = this.worldOriginY * 0.02;

    if (this.bgImages.background) {
      this.bgImages.background.x = this.screenWidth / 2 - offsetX;
      this.bgImages.background.y = this.screenHeight / 2 - offsetY;
    }
    if (this.bgImages.far) {
      this.bgImages.far.x = this.screenWidth / 2 - offsetX * 0.3;
      this.bgImages.far.y = this.screenHeight / 2 - offsetY * 0.3;
    }
    if (this.bgImages.midground) {
      this.bgImages.midground.x = this.screenWidth / 2 - offsetX * 0.5;
      this.bgImages.midground.y = this.screenHeight / 2 - offsetY * 0.5;
    }
  }

  /**
   * 过渡到新区域
   * @param {object} newZone - 新区域配置
   * @param {number} duration - 过渡时长(ms)
   */
  transitionToZone(newZone, duration = 500) {
    if (!newZone) return;
    
    const oldZone = this.currentZone;
    this.currentZone = newZone;
    
    // 更新气泡颜色
    this.themeConfig.bubbleColor = newZone.bubbleColor;
    
    // 应用新主题色调
    this._applyThemeTint(newZone.tint, newZone.bubbleColor);
    
    // 选择新背景
    const backgrounds = newZone.backgrounds;
    const newBgKey = backgrounds[Phaser.Math.Between(0, backgrounds.length - 1)];
    
    // 如果背景改变，执行过渡
    if (this.bgImages.background?.texture?.key !== newBgKey) {
      this._transitionBackground(newBgKey, duration);
    }
    
    logger.debug(`Zone transition: ${oldZone?.id || 'none'} -> ${newZone.id}`);
  }

  /**
   * 背景图像过渡动画
   */
  _transitionBackground(newBgKey, duration) {
    const oldBg = this.bgImages.background;
    
    // 创建新背景图像
    const newBg = this.scene.add.image(
      this.screenWidth / 2,
      this.screenHeight / 2,
      newBgKey
    );
    newBg.setDisplaySize(this.screenWidth, this.screenHeight);
    newBg.setDepth(0);
    newBg.setAlpha(0);
    
    if (newZone.tint !== 0xFFFFFF) {
      newBg.setTint(newZone.tint);
    }
    
    // 淡入新背景
    this.scene.tweens.add({
      targets: newBg,
      alpha: 1,
      duration: duration / 2,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (oldBg) oldBg.destroy();
        this.bgImages.background = newBg;
      }
    });
    
    // 淡出旧背景
    if (oldBg) {
      this.scene.tweens.add({
        targets: oldBg,
        alpha: 0,
        duration: duration / 2,
        ease: 'Sine.easeIn'
      });
    }
  }

  destroy() {
    this.loadedChunks.clear();
    super.destroy();
  }
}

export default BackgroundExpansion;
```

- [ ] **Step 3: 运行测试**

Run: `npm test 2>&1 | tail -20`
Expected: PASS (无新测试但现有测试通过)

- [ ] **Step 4: 提交**

```bash
git add src/systems/BackgroundExpansion.js
git commit -m "feat: add BackgroundExpansion for infinite background rendering"
```

---

## Task 4: 集成到 GameScene

**Files:**
- 修改: `src/scenes/GameScene.js` (约 30-50 行)

- [ ] **Step 1: 阅读 GameScene 中 BackgroundSystem 的使用方式**

查找：
- `this.backgroundSystem` 创建位置
- `this.backgroundSystem.createBackground()` 调用
- `this.backgroundSystem.update()` 调用

- [ ] **Step 2: 添加 MapExpansionSystem 到 GameScene init()**

在 `init(data)` 方法中添加（约 line 90 附近）:
```javascript
// MapExpansionSystem for infinite map
this.mapExpansion = new MapExpansionSystem(this);
this.mapExpansion.onZoneChange = (newZone, oldZone) => {
  this._onZoneChange(newZone, oldZone);
};
```

- [ ] **Step 3: 添加 _onZoneChange 回调方法**

在 GameScene 中添加（约 line 185 附近）:
```javascript
/**
 * 区域变化回调
 * @param {object} newZone - 新区域
 * @param {object} oldZone - 旧区域
 */
_onZoneChange(newZone, oldZone) {
  // 更新背景系统
  if (this.backgroundSystem?.transitionToZone) {
    this.backgroundSystem.transitionToZone(newZone);
  }
  
  // 显示区域提示
  this._showZoneIndicator(newZone);
  
  logger.info(`Entering ${newZone.name}`);
}

/**
 * 显示区域进入提示
 */
_showZoneIndicator(zone) {
  if (this.zoneText) {
    this.zoneText.destroy();
  }
  
  this.zoneText = this.add.text(this.player.x, this.player.y - 100, 
    `>> ${zone.name} <<`, {
    fontSize: '24px',
    fontFamily: 'Arial',
    color: '#00ff88',
    stroke: '#000000',
    strokeThickness: 4
  });
  this.zoneText.setDepth(50);
  this.zoneText.setOrigin(0.5);
  
  // 向上飘动并消失
  this.tweens.add({
    targets: this.zoneText,
    y: this.player.y - 200,
    alpha: 0,
    duration: 2000,
    ease: 'Sine.easeOut',
    onComplete: () => this.zoneText?.destroy()
  });
}
```

- [ ] **Step 4: 在 create() 中集成 BackgroundExpansion**

找到 `this.backgroundSystem = new BackgroundSystem(this, this.screenWidth, this.screenHeight);` (约 line 150)
替换为:
```javascript
// 使用 BackgroundExpansion 替代 BackgroundSystem
this.backgroundSystem = new BackgroundExpansion(this, this.screenWidth, this.screenHeight);
this.backgroundSystem.createBackground();
```

- [ ] **Step 5: 在 update() 中更新地图系统**

找到玩家位置更新代码，在其后添加（约 line 480）:
```javascript
// 更新地图扩展系统
if (this.mapExpansion) {
  this.mapExpansion.updatePlayerPosition(this.player.x, this.player.y);
  
  if (this.backgroundSystem?.updateBackground) {
    const zone = this.mapExpansion.getCurrentZone();
    this.backgroundSystem.updateBackground(this.player.x, this.player.y, zone);
  }
  
  // 根据区域调整敌人等级范围
  const [minLevel, maxLevel] = this.mapExpansion.getEnemyLevelRange();
  this._currentEnemyLevelRange = [minLevel, maxLevel];
}
```

- [ ] **Step 6: 运行测试**

Run: `npm test 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: integrate MapExpansionSystem into GameScene"
```

---

## Task 5: 调整敌人刷新逻辑（根据区域）

**Files:**
- 修改: `src/scenes/GameScene.js` (spawnFish 相关)

- [ ] **Step 1: 阅读 spawnFish 和 calculateEnemyLevel 方法**

找到：
- `spawnFish()` 方法
- `calculateEnemyLevel()` 方法
- `_getSpawnWeights()` 方法

- [ ] **Step 2: 修改 calculateEnemyLevel 使用区域等级范围**

找到 `calculateEnemyLevel` 方法（约 line 394），修改为：
```javascript
calculateEnemyLevel(playerLevel) {
  // 使用区域等级范围（如果可用）
  const [zoneMin, zoneMax] = this._currentEnemyLevelRange || [1, 3];
  
  const survivalMinutes = Math.floor((Date.now() - this.gameStartTime) / 60000);
  const bonusRoll = Math.min(survivalMinutes * 0.05, 0.2);

  const roll = Math.random() - bonusRoll;
  if (roll < 0.70) {
    // 70% same level (within zone range)
    return Phaser.Math.Between(zoneMin, Math.min(zoneMax, playerLevel));
  } else if (roll < 0.88) {
    // 18% slightly higher
    return Phaser.Math.Between(Math.max(zoneMin, playerLevel - 1), zoneMax);
  } else {
    // 12% boss-tier (only in deep/abyss)
    return Phaser.Math.Between(playerLevel + 2, zoneMax);
  }
}
```

- [ ] **Step 3: 在 spawnFish 中应用区域强化**

找到 `spawnFish` 方法中的 `scaleFactor` 计算（约 line 490），修改为：
```javascript
// 如果在深渊区域，额外增加10%难度
const inAbyss = this.mapExpansion?.getCurrentZone()?.id === 'abyss';
const abyssBonus = inAbyss ? 1.1 : 1.0;
const scaleFactor = (1 + Math.max(0, levelDiff) * 0.15) * difficultyMult * abyssBonus;
```

- [ ] **Step 4: 运行测试**

Run: `npm test 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: adjust enemy spawning based on zone difficulty"
```

---

## Task 6: 验证完整功能

- [ ] **Step 1: 启动游戏测试**

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080
```

- [ ] **Step 2: 验证功能**

1. 玩家可以向任意方向移动到屏幕边缘
2. 背景随玩家移动有parallax效果
3. 当移动超过1000px时，显示"珊瑚礁"提示，背景色调变化
4. 当移动超过2500px时，显示"深海"提示
5. 当移动超过4500px时，显示"深渊"提示
6. 远处敌人明显比近处更强

- [ ] **Step 3: 性能检查**

打开浏览器 DevTools → Performance，验证 60fps

---

## 自检清单

- [ ] spec 覆盖：所有设计目标都有对应 task 实现
- [ ] 无 placeholder：所有 step 都有完整代码
- [ ] 类型一致性：方法名、参数与 spec 一致
- [ ] 测试覆盖：关键逻辑有单元测试

---

## 成功标准

1. ✅ 玩家可以向任意方向移动而不停止
2. ✅ 背景随位置平滑切换主题
3. ✅ 远处敌人明显比近处更强
4. ✅ 60fps 性能表现
5. ✅ 无明显加载卡顿
