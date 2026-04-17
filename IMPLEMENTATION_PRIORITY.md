# 🎯 Fish Eat Fish - 实施优先级矩阵

## 快速查阅表

### 🚨 立即着手 (Next 3 Days)
| # | 方案 | 改动文件 | 难度 | 工时 | ROI | 说明 |
|----|------|---------|------|------|-----|------|
| 1 | 视觉层次重构 | 创建`DEPTH_LAYERS.js`, 修改全局depth值 | 简单 | 1天 | 🔥🔥🔥 | 立竿见影改善视觉噪点 |
| 2 | 打击反馈系统 | 创建`ImpactSystem.js`, 修改`GameScene.js`/`Enemy.js` | 中等 | 3天 | 🔥🔥🔥🔥 | 核心爽快感来源 |
| 3 | 克制系统强化 | 创建`TypeAdvantageSystem.js`, 修改敌人伤害计算 | 中等 | 2天 | 🔥🔥🔥🔥 | 提升策略深度 |

### ⚡ 第二周优先 (Week 2)
| # | 方案 | 改动文件 | 难度 | 工时 | ROI | 说明 |
|----|------|---------|------|------|-----|------|
| 4 | 节奏感系统 | 创建`PacingSystem.js`, 修改生成逻辑 | 中等 | 2天 | 🔥🔥🔥 | 动态难度提升沉浸感 |
| 5 | 进度里程碑 | 创建`MilestoneSystem.js`, 配置`milestones.json` | 简单 | 1.5天 | 🔥🔥 | 增加中期目标感 |
| 6 | 技能系统多样 | 扩展`skills.json`, 创建`SkillSynergySystem.js` | 复杂 | 4天 | 🔥🔥🔥 | 提升重玩价值 |

### 📅 第三周后 (Week 3+)
| # | 方案 | 改动文件 | 难度 | 工时 | ROI | 说明 |
|----|------|---------|------|------|-----|------|
| 7 | 动作演出系统 | 创建`AnimationDirector.js`, 重构敌人行为 | 复杂 | 5天 | 🔥🔥🔥🔥 | 大幅提升可读性 |
| 8 | 音频分层 | 扩展`AudioSystem.js` | 简单 | 1天 | 🔥🔥 | 听觉反馈分层 |
| 9 | 动态背景 | 修改`BackgroundSystem.js` | 简单 | 1天 | 🔥 | 增强沉浸感 |
| 10 | 群体AI | 修改`Enemy.js`, 新增方法 | 中等 | 2天 | 🔥🔥 | 敌人更聪明 |
| 11 | 极限模式 | 修改`MenuScene.js`/`GameScene.js` | 简单 | 1天 | 🔥🔥 | 新游戏模式 |
| 12 | 无障碍选项 | 创建`SettingsScene.js` | 简单 | 2天 | 🔥 | 提升可访问性 |

---

## 详细改动清单

### 方案1: 视觉层次重构 (推荐首先实施)

**创建文件**: `src/config/DEPTH_LAYERS.js`
```javascript
export const DEPTH_LAYERS = {
  // 背景 (1-10)
  BACKGROUND_EFFECTS: 1,        // 气泡、光线、粒子
  BACKGROUND_DECOR: 5,          // 岩石、海草、珊瑚
  
  // 游戏物体 (50-110)
  ENEMIES: 50,
  ENEMY_HEALTH_BAR: 52,
  PLAYER: 100,
  PLAYER_HEALTH_BAR: 102,
  PLAYER_SHIELD: 101,
  PROJECTILES: 110,
  
  // 视觉反馈 (120-160)
  PARTICLES: 120,               // 进食粒子、特效
  FLOATING_TEXT: 150,           // 伤害数字、治疗数字
  WORLD_UI: 160,                // 等级提升、波次提示
  
  // HUD (99-210)
  HUD_BACKGROUND: 99,
  HUD_BARS: 100,
  HUD_TEXT: 101,
  HUD_COMBO: 200,
  HUD_TIMER: 201,
  HUD_NOTIFICATIONS: 210,
  
  // 最前层 (300+)
  MODAL_OVERLAY: 300
};
```

**应用到GameScene.js**:
```javascript
import { DEPTH_LAYERS } from '../config/DEPTH_LAYERS.js';

create() {
  // ... 现有代码 ...
  
  // 应用深度值
  this.player.setDepth(DEPTH_LAYERS.PLAYER);
  this.playerHealthBar.setDepth(DEPTH_LAYERS.PLAYER_HEALTH_BAR);
  // ... 为所有物体设置正确的深度值
}

createEatParticles(x, y) {
  // ... 现有代码 ...
  particle.setDepth(DEPTH_LAYERS.PARTICLES);
}

showDamageIndicator(target, damage) {
  // ... 现有代码 ...
  text.setDepth(DEPTH_LAYERS.FLOATING_TEXT);
}
```

**应用到UIScene.js**:
```javascript
create() {
  const DEPTH = DEPTH_LAYERS;
  
  this.hpBarBg.setDepth(DEPTH.HUD_BACKGROUND);
  this.hpBar.setDepth(DEPTH.HUD_BARS);
  this.hpLabel.setDepth(DEPTH.HUD_TEXT);
  
  this.expBarBg.setDepth(DEPTH.HUD_BACKGROUND);
  this.expBar.setDepth(DEPTH.HUD_BARS);
  
  this.comboText.setDepth(DEPTH.HUD_COMBO);
  this.skillUnlockText.setDepth(DEPTH.HUD_NOTIFICATIONS);
}
```

---

### 方案2: 统一打击反馈系统

**创建文件**: `src/systems/ImpactSystem.js`
```javascript
export class ImpactSystem {
  constructor(scene) {
    this.scene = scene;
    this.damageThresholds = {
      MINOR: 10,      // 0-10 伤害
      NORMAL: 25,     // 10-25 伤害
      HEAVY: 50,      // 25-50 伤害
      CRITICAL: 999   // 50+ 伤害
    };
    
    this.impactProfiles = {
      MINOR: {
        shake: [20, 0.002],
        flash: 100,
        flashColor: [255, 200, 100],
        scale: 1.1,
        duration: 100,
        audioPitch: 1.0
      },
      NORMAL: {
        shake: [60, 0.005],
        flash: 200,
        flashColor: [255, 150, 100],
        scale: 1.2,
        duration: 120,
        audioPitch: 1.2
      },
      HEAVY: {
        shake: [100, 0.008],
        flash: 300,
        flashColor: [255, 100, 100],
        scale: 1.4,
        duration: 150,
        audioPitch: 1.5
      },
      CRITICAL: {
        shake: [150, 0.012],
        flash: 400,
        flashColor: [255, 50, 50],
        scale: 1.6,
        duration: 200,
        audioPitch: 1.8
      }
    };
  }
  
  getProfileByDamage(damage) {
    if (damage < this.damageThresholds.MINOR) return this.impactProfiles.MINOR;
    if (damage < this.damageThresholds.NORMAL) return this.impactProfiles.NORMAL;
    if (damage < this.damageThresholds.HEAVY) return this.impactProfiles.HEAVY;
    return this.impactProfiles.CRITICAL;
  }
  
  playImpact(scene, target, damage, damageType = 'normal') {
    if (!target || !target.active) return;
    
    const profile = this.getProfileByDamage(damage);
    
    // 1. 屏幕效果
    scene.cameras.main.shake(profile.shake[0], profile.shake[1]);
    scene.cameras.main.flash(profile.flash, ...profile.flashColor, false);
    
    // 2. 目标放大动画
    scene.tweens.add({
      targets: target,
      scaleX: profile.scale,
      scaleY: profile.scale,
      duration: profile.duration,
      ease: 'Back.easeOut',
      yoyo: true
    });
    
    // 3. 音频反馈
    this.playImpactAudio(scene, profile, damageType);
    
    // 4. 伤害数字显示
    this.showDamageNumber(scene, target, damage, profile);
  }
  
  playImpactAudio(scene, profile, damageType) {
    if (!scene.audioSystem) return;
    
    const audioMap = {
      eat: 'eat_normal',
      hit: 'hit_impact',
      skill: 'skill_cast'
    };
    
    scene.audioSystem.play(audioMap[damageType] || 'hit_impact');
  }
  
  showDamageNumber(scene, target, damage, profile) {
    const colors = {
      MINOR: '#FFFF00',    // 黄
      NORMAL: '#FF6666',   // 红
      HEAVY: '#FF3333',    // 深红
      CRITICAL: '#FF0000'  // 亮红
    };
    
    // 确定伤害等级
    let level = 'MINOR';
    if (damage >= this.damageThresholds.CRITICAL) level = 'CRITICAL';
    else if (damage >= this.damageThresholds.HEAVY) level = 'HEAVY';
    else if (damage >= this.damageThresholds.NORMAL) level = 'NORMAL';
    
    const text = scene.add.text(target.x, target.y - 30, `-${damage}`, {
      fontSize: `${16 + (level === 'CRITICAL' ? 8 : 0)}px`,
      fontFamily: 'Arial Black',
      color: colors[level],
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: level === 'CRITICAL' ? 'bold' : 'normal'
    });
    
    text.setOrigin(0.5);
    text.setDepth(150);
    
    // 不同等级的飘浮动画
    const duration = 600 + (level === 'CRITICAL' ? 400 : 0);
    const distance = 40 + (level === 'CRITICAL' ? 20 : 0);
    
    scene.tweens.add({
      targets: text,
      alpha: 0,
      y: target.y - 30 - distance,
      scaleX: level === 'CRITICAL' ? 1.5 : 1.0,
      scaleY: level === 'CRITICAL' ? 1.5 : 1.0,
      duration: duration,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy()
    });
  }
}
```

**在GameScene中集成**:
```javascript
import { ImpactSystem } from '../systems/ImpactSystem.js';

create() {
  // ... 现有代码 ...
  this.impactSystem = new ImpactSystem(this);
}

checkEat(player, fish) {
  // ... 现有代码到 L438 ...
  
  // 改前:
  // if (this.audioSystem) this.audioSystem.play(isBig ? 'eat_big' : 'eat');
  
  // 改后:
  const expGain = fish.fishData.exp;
  if (this.impactSystem) {
    this.impactSystem.playImpact(this, fish, expGain, 'eat');
  }
  
  // ... 继续现有代码 ...
}

onEnemyAttack(enemy, damage) {
  // ... 现有代码到 L707 ...
  
  // 改前:
  // this.cameras.main.shake(100, 0.005);
  // if (this.audioSystem) this.audioSystem.play('hurt');
  
  // 改后:
  if (this.impactSystem) {
    this.impactSystem.playImpact(this, this.player, damage, 'hit');
  }
  
  // ... 继续现有代码 ...
}
```

---

### 方案3: 鱼种克制系统强化

**创建文件**: `src/systems/TypeAdvantageSystem.js`
```javascript
export class TypeAdvantageSystem {
  constructor(fishData) {
    this.fishData = fishData;
    this.buildAdvantageMap();
  }
  
  buildAdvantageMap() {
    this.advantages = {};
    for (const [type, config] of Object.entries(this.fishData)) {
      this.advantages[type] = {
        strongAgainst: config.strongAgainst || [],
        weakTo: config.weakTo || []
      };
    }
  }
  
  /**
   * 获取类型优势信息
   * 返回 { multiplier: 伤害倍数, text: 显示文本, color: 颜色 }
   */
  getAdvantage(attackerType, targetType) {
    const advantage = this.advantages[attackerType];
    if (!advantage) return { multiplier: 1.0, text: null, color: null };
    
    if (advantage.strongAgainst.includes(targetType)) {
      return {
        multiplier: 1.8,
        text: '克制！',
        color: '#FF6600',
        sound: 'advantage'
      };
    }
    
    if (advantage.weakTo.includes(targetType)) {
      return {
        multiplier: 0.6,
        text: '被克制',
        color: '#4488FF',
        sound: 'disadvantage'
      };
    }
    
    return { multiplier: 1.0, text: null, color: null };
  }
  
  /**
   * 计算最终伤害，考虑类型优势
   */
  calculateFinalDamage(baseDamage, attackerType, targetType) {
    const advantage = this.getAdvantage(attackerType, targetType);
    return Math.floor(baseDamage * advantage.multiplier);
  }
}
```

**修改Enemy.js中的attackPlayer方法**:
```javascript
attackPlayer(player) {
  const currentTime = this.scene.time.now;
  if (currentTime - this.lastAttackTime < this.attackCooldown) {
    return 0;
  }
  
  this.lastAttackTime = currentTime;
  this.state = Enemy.STATE.ATTACKING;
  
  const sizeDamage = 2 + Math.floor(Math.log(this.fishConfig.size) * 3);
  const levelMultiplier = 1 + ((this.aiLevel || 1) - 1) * 0.5;
  let baseDamage = Math.max(5, Math.min(Math.floor(sizeDamage * levelMultiplier), 30));
  
  // 新增: 应用类型优势
  if (this.scene.typeAdvantageSystem) {
    const advantage = this.scene.typeAdvantageSystem.getAdvantage(
      this.fishType, 
      'clownfish'
    );
    baseDamage = Math.floor(baseDamage * advantage.multiplier);
    
    // 如果有音效，播放优势/劣势音效
    if (advantage.sound && this.scene.audioSystem) {
      this.scene.audioSystem.play(advantage.sound);
    }
  }
  
  return baseDamage;
}
```

**在UIScene中显示克制指示**:
```javascript
create() {
  // ... 现有代码 ...
  
  // 新增: 克制指示器
  this.advantageText = this.add.text(512, 70, '', {
    fontSize: '18px',
    fontFamily: 'Arial Black',
    color: '#FFD700',
    stroke: '#000000',
    strokeThickness: 3
  });
  this.advantageText.setOrigin(0.5);
  this.advantageText.setDepth(101);
  this.advantageText.setVisible(false);
}

update(score, exp, level, hp, maxHp, expForNextLevel) {
  // ... 现有代码 ...
  
  // 新增: 检查最近敌人的克制关系
  if (this.scene.typeAdvantageSystem && this.scene.gameScene) {
    const gameScene = this.scene.gameScene;
    if (gameScene.enemies && gameScene.enemies.length > 0) {
      let nearest = null;
      let minDist = Infinity;
      
      for (const enemy of gameScene.enemies) {
        const dist = Phaser.Math.Distance.Between(
          gameScene.player.x, gameScene.player.y,
          enemy.graphics.x, enemy.graphics.y
        );
        if (dist < minDist) {
          minDist = dist;
          nearest = enemy;
        }
      }
      
      if (nearest && minDist < 300) {
        const advantage = gameScene.typeAdvantageSystem.getAdvantage(
          'clownfish',
          nearest.fishType
        );
        
        if (advantage.text) {
          this.advantageText.setText(advantage.text);
          this.advantageText.setColor(advantage.color);
          this.advantageText.setVisible(true);
        } else {
          this.advantageText.setVisible(false);
        }
      } else {
        this.advantageText.setVisible(false);
      }
    }
  }
}
```

**在GameScene中初始化**:
```javascript
import { TypeAdvantageSystem } from '../systems/TypeAdvantageSystem.js';

create() {
  // ... preload和现有代码 ...
  this.fishData = this.cache.json.get('fishData');
  
  // 初始化克制系统
  this.typeAdvantageSystem = new TypeAdvantageSystem(this.fishData);
  
  // ... 继续现有代码 ...
}
```

---

## 代码修改检查清单

### 第一阶段检查 (完成后需要测试)

- [ ] 视觉层次重构
  - [ ] DEPTH_LAYERS.js 创建
  - [ ] GameScene 中所有物体设置正确depth
  - [ ] UIScene 中所有HUD元素设置正确depth
  - [ ] Enemy 健康条设置正确depth
  - [ ] 粒子特效设置正确depth

- [ ] 打击反馈系统
  - [ ] ImpactSystem.js 创建完整
  - [ ] GameScene.checkEat() 集成
  - [ ] GameScene.onEnemyAttack() 集成
  - [ ] SkillSystem.executeDamageSkill() 集成 (可选)
  - [ ] 测试各伤害等级的反馈效果

- [ ] 克制系统强化
  - [ ] TypeAdvantageSystem.js 创建
  - [ ] Enemy.attackPlayer() 修改
  - [ ] UIScene 添加克制指示文本
  - [ ] GameScene 初始化系统
  - [ ] 测试克制关系的伤害计算

---

## 测试用例

### 测试打击反馈
```
1. 击杀小鱼 (5-10伤害) → 应该是轻微震动 + 黄色数字
2. 击杀中鱼 (20-30伤害) → 应该是明显震动 + 红色数字
3. 被大鱼攻击 (40+伤害) → 应该是强烈震动 + 亮红色数字 + 更大文字
```

### 测试克制系统
```
1. 玩家(小丑鱼)接近鲨鱼 → HUD显示"被克制" (蓝色)
2. 玩家接近小虾 → HUD无提示 (无优劣)
3. 鲨鱼攻击玩家 → 伤害 × 1.8
4. 小虾攻击玩家 → 伤害正常
```

### 测试视觉层次
```
1. 启动游戏 → 背景清晰，敌人在中层，玩家突出
2. 生成粒子 → 粒子在敌人之上，不遮挡重要信息
3. 显示伤害数字 → 清晰可读，不与其他UI混淆
4. 显示combo文本 → 突出显示，不被玩家或敌人遮挡
```

---

## 性能影响评估

| 方案 | CPU | 内存 | 影响 | 优化建议 |
|------|-----|------|------|---------|
| 视觉层次 | +0% | +0% | 无 | 深度值只是标记，无性能损耗 |
| 打击反馈 | +2-3% | +1MB | 小 | 复用同一个ImpactSystem实例 |
| 克制系统 | +0.5% | +0.5MB | 微小 | 克制查表在create时构建 |

**总体影响**: <5% 性能开销，完全可接受

---

## 回滚计划

如果实施中发现问题，回滚步骤:

1. **视觉层次** - 删除DEPTH_LAYERS.js，移除所有setDepth()调用
2. **打击反馈** - 删除ImpactSystem.js，恢复原始shake/play调用
3. **克制系统** - 删除TypeAdvantageSystem.js，恢复原始伤害计算

每个方案都是独立的，不会产生级联问题。

---

**建议按这个顺序实施，每个方案完成后进行完整测试再进行下一个！**

