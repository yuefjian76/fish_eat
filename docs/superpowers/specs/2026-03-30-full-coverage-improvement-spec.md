# Full Test Coverage Improvement Spec

> **Goal:** Improve test coverage to 80%+ for all 7 remaining modules using TDD approach.

## Modules Below 80% Functions Coverage

| Module | Current | Target | Priority |
|--------|---------|--------|----------|
| DebugLogger.js | 33.33% | 80%+ | MEDIUM |
| SkillSystem.js | 13.63% | 80%+ | HIGH |
| FishFactory.js | 0% | 80%+ | HIGH |
| TreasureBox.js | 0% | 80%+ | HIGH |
| DriftBottleSystem.js | 0% | 80%+ | MEDIUM |
| GrowthSystem.js | 0% | 80%+ | HIGH |
| LuckSystem.js | 0% | 80%+ | LOW |

## Strategy

**Approach:** TDD with pure function extraction where possible

For each module:
1. Identify all public methods and pure functions
2. Write failing tests first (TDD)
3. Implement minimal code to pass tests
4. Repeat until 80%+ coverage

## Per-Module Coverage Targets

### 1. DebugLogger.js (33% → 80%)
**Key methods to test:**
- `setLevel(level)` - dynamic level setting
- `getLevelName()` - level name string
- `debug(message)`, `info(message)`, `warn(message)`, `error(message)` - log level filtering
- `getInstance()` - singleton pattern
- Pure: `_format(level, message)` - message formatting

### 2. SkillSystem.js (13.63% → 80%)
**Key methods to test:**
- `setPlayer(player, scene)` - player setup
- `isOnCooldown(skillId)` - cooldown check
- `isSkillUnlocked(skillId, playerLevel)` - skill lock by level
- `isActive(skillId)` - active skill check
- `useSkill(key, levelOverride)` - skill activation
- `update(delta)` - cooldown update
- `getCooldownRemaining(skillId)` - cooldown time
- `getCooldownPercent(skillId)` - cooldown percentage
- `isPlayerShielded()` - shield status
- `isPlayerSpeedBuffed()` - speed buff status

### 3. FishFactory.js (0% → 80%)
**Key methods to test:**
- `createPlayerFishFromSprite(scene, scale, frame)` - sprite creation
- `createEnemyFromSprite(scene, type, scale, frame)` - enemy sprite
- `createPlayerFish(scene, fishType, size, color)` - player fish with glow
- `createFish(scene, fishType, size, color)` - procedural fish
- `drawClownfish(graphics, size, color, darkerColor)` - clownfish shape
- `drawShrimp(graphics, size, color, darkerColor)` - shrimp shape
- `drawShark(graphics, size, color, darkerColor)` - shark shape
- `drawDefaultFish(graphics, size, color, darkerColor)` - default shape

### 4. TreasureBox.js (0% → 80%)
**Key methods to test:**
- `setScene(scene)` - scene setup
- `createExquisiteChest()` - chest creation
- `createRewardLabel()` - reward label creation
- `collect(player)` - collection logic

### 5. DriftBottleSystem.js (0% → 80%)
**Key methods to test:**
- `setScene(scene)` - scene setup
- `setLuckSystem(luckSystem)` - luck system injection
- `selectEffect()` - random effect selection
- `trigger()` - trigger bottle
- `applyInstantEffect(effect)` - instant effect application
- `applyBuffEffect(effect)` - buff effect
- `applyDebuffEffect(effect)` - debuff effect
- `applyPermanentEffect(effect)` - permanent effect
- `isDoubleCoinsActive()` - double coins status
- `isCooldownAccelActive()` - cooldown acceleration status
- `getCooldownMultiplier()` - cooldown multiplier value

### 6. GrowthSystem.js (0% → 80%)
**Key methods to test:**
- `getExpForLevel(level)` - exp needed for level
- `getMaxLevel()` - max level value
- `addExperience(baseExp, currentTime, luckSystem)` - exp gain
- `checkLevelUp()` - level threshold check
- `checkSkillUnlocks()` - skill unlock check
- `getNewlyUnlockedSkills(oldLevel)` - newly unlocked skills
- `isSkillUnlocked(skillId)` - skill unlocked check
- `getUnlockedSkills()` - all unlocked skills
- `getLevelProgress()` - progress to next level
- `getExpToNextLevel()` - exp needed
- `getComboCount()` - combo count
- `getLevel()` - current level
- `getExp()` - current exp

### 7. LuckSystem.js (0% → 80%)
**Key methods to test:**
- `getLuck()` - current luck value
- `addLuck(amount)` - add luck
- `setLuck(value)` - set luck directly
- `calculateGoodChance(baseChance, luckInfluence)` - chance calculation

## Testing Pattern

For modules with Phaser dependencies:
- Extract pure functions that don't require Phaser scene
- Test pure functions directly
- Mock Phaser only where necessary (graphics creation)

## Output

Create comprehensive test files under `src/systems/__tests__/` for each module with coverage >80%.

## Success Criteria

- All 7 modules reach 80%+ functions coverage
- All new tests pass
- No regressions in existing tests (83 tests continue passing)
