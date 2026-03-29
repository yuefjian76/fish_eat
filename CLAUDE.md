# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**鱼吃鱼 (Fish Eat Fish)** — A single-player Phaser.js 3.x HTML5 game where players control a fish to eat smaller fish, fight AI enemies, level up, and unlock skills.

## Commands

**Start the game:**
```bash
cd /Users/yuefengjiang/AI/fish_eat
python3 -m http.server 8080
# Open http://localhost:8080 in browser
```

**Debug mode** (enables verbose console logging):
```
http://localhost:8080?debug=true
```

**Push to remote:**
```bash
git push -u origin main
```

## Architecture

**Phaser.js 3.x** with ES modules. The game uses Phaser's built-in arcade physics (no gravity, top-down movement).

### Scene Flow
```
BootScene → MenuScene → GameScene + UIScene → GameOverScene
                                      ↑___________|
```

**5 Scenes:**
- `BootScene` — Loading screen with progress bar
- `MenuScene` — Title screen with difficulty selection
- `GameScene` — Core gameplay loop
- `UIScene` — HUD overlay (runs parallel to GameScene)
- `GameOverScene` — Results screen with restart option

### Key Systems

| System | File | Responsibility |
|--------|------|----------------|
| Battle | `systems/BattleSystem.js` | Damage calculation, type effectiveness |
| Skill | `systems/SkillSystem.js` | Cooldowns, skill execution (Q/W/E/R) |
| Growth | `systems/GrowthSystem.js` | EXP, leveling, combo tracking |
| Drift Bottle | `systems/DriftBottleSystem.js` | Random good/bad effects on level-up |
| Luck | `systems/LuckSystem.js` | Affects drift bottle probability |
| Debug | `systems/DebugLogger.js` | Timestamped log levels (DEBUG/INFO/WARN/ERROR) |

### Data-Driven Design

All game content is defined in JSON config files under `src/config/`:
- `fish.json` — Fish types, HP, speed, size, strengths/weaknesses
- `skills.json` — Skill definitions with cooldowns and effects
- `levels.json` — EXP table and skill unlock thresholds
- `maps.json` — Theme backgrounds (deep sea, tropical, polar)
- `difficulty.json` — Enemy count and AI strength per difficulty
- `drops.json` — Treasure box drop rates and rewards
- `driftBottle.json` — Drift bottle effects with weights

### Entity Pattern

- `entities/Player.js` — Player fish (future expansion)
- `entities/Enemy.js` — AI fish with WANDERING/CHASING/ATTACKING states
- `entities/TreasureBox.js` — Collectible rewards

### Controls

| Key | Action |
|-----|--------|
| Arrow keys | Move |
| Shift | Speed boost |
| Q/W/E/R | Skills (bite/shield/speed_up/heal) |
| Mouse | Alternative movement |

### Game Mechanics

- **Eat rule:** Player must be >20% larger than target
- **Type effectiveness:** Rock-paper-scissors style (shark > small fish > shrimp > shark)
- **Level-up:** Grants size boost, unlocks skills, triggers drift bottle
- **Difficulty:** Easy/Normal/Hard with increasing enemy count and AI aggression

## File Structure

```
src/
├── main.js              # Phaser config + game init
├── config/              # JSON data files
├── scenes/              # Phaser scenes
├── entities/            # Game object classes
├── systems/             # Game logic systems
└── ui/                  # UI components
```
