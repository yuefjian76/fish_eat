// MenuScene - Start menu with title and difficulty selection
import { DailyChallengeSystem } from '../systems/DailyChallengeSystem.js';

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.difficultyData = null;
        this.unlockedDifficulties = ['easy'];
        this.selectedDifficulty = 'easy';
    }

    preload() {
        this.load.json('difficultyData', 'src/config/difficulty.json');
        this.load.json('upgradesData', 'src/config/upgrades.json');
    }

    create() {
        const centerX = 512;
        const centerY = 384;

        // Load difficulty configuration
        this.difficultyData = this.cache.json.get('difficultyData');

        // Load unlocked difficulties from localStorage
        this.loadUnlockedDifficulties();

        // ─── Background swimming fish ───────────────────────────────────
        this._bgFishGroup = [];
        const fishColors = [0x3366aa, 0x44aa77, 0xaa5533, 0x556688, 0x668844];
        for (let i = 0; i < 8; i++) {
            const fish = this.add.ellipse(0, 0, 20, 12, fishColors[i % fishColors.length], 0.25);
            fish.setDepth(1);
            fish.setY(100 + Math.random() * 600);
            const dir = Math.random() > 0.5 ? 1 : -1;
            fish.setScale(dir, 1);
            const speed = 30 + Math.random() * 50;
            fish._speed = speed * dir;
            this._bgFishGroup.push(fish);
        }

        // Title
        const titleText = this.add.text(centerX, 120, '鱼吃鱼', {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Title float animation
        this.tweens.add({
            targets: titleText,
            y: 112,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.add.text(centerX, 200, 'Fish Eat Fish', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#888888'
        }).setOrigin(0.5);

        // Difficulty selection label
        this.add.text(centerX, 270, '选择难度', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Create difficulty buttons
        this.createDifficultyButtons(centerX, 330);

        // Daily challenge
        const challengeSystem = new DailyChallengeSystem();
        const challenge = challengeSystem.getChallenge();

        const challengeBtn = this.add.text(centerX, 460, `${challenge.emoji} 今日挑战: ${challenge.name} ${challenge.modifier.emoji}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#FFD700',
            backgroundColor: '#332200',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        challengeBtn.on('pointerover', () => challengeBtn.setStyle({ color: '#FFFF00' }));
        challengeBtn.on('pointerout', () => challengeBtn.setStyle({ color: '#FFD700' }));
        challengeBtn.on('pointerdown', () => {
            // Store challenge in a global or pass via scene data
            localStorage.setItem('fishEat_dailyChallenge', JSON.stringify(challenge));
            this.scene.start('GameScene', { difficulty: this.selectedDifficulty, fishType: this.selectedFish, dailyChallenge: true });
        });

        this.add.text(centerX, 488, `${challenge.desc} | ${challenge.modifier.desc}`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // Fish species selection (right side, vertical)
        this.add.text(centerX + 280, 200, '选择鱼种', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        const fishOptions = [
            { key: 'clownfish', name: '小丑鱼', emoji: '🐠', color: 0xFF6B6B },
            { key: 'shrimp', name: '小虾', emoji: '🦐', color: 0xFFB347 },
            { key: 'shark', name: '鲨鱼', emoji: '🦈', color: 0x87CEEB }
        ];

        const fishX = centerX + 280;
        const fishStartY = 240;
        const fishSpacing = 60;

        this.fishCards = {};
        fishOptions.forEach((fish, i) => {
            const y = fishStartY + i * fishSpacing;

            // Fish icon (smaller)
            const icon = this.add.text(fishX, y, fish.emoji, { fontSize: '28px' }).setOrigin(0.5).setDepth(6);

            // Fish name
            const name = this.add.text(fishX + 25, y, fish.name, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#ffffff'
            }).setOrigin(0, 0.5).setDepth(6);

            // Hit area
            const hitArea = this.add.rectangle(fishX, y, 120, 40, 0x000000, 0);
            hitArea.setDepth(7);
            hitArea.setInteractive({ useHandCursor: true });

            hitArea.on('pointerdown', () => this._selectFish(fish.key));
            icon.on('pointerdown', () => this._selectFish(fish.key));
            name.on('pointerdown', () => this._selectFish(fish.key));

            // Selection indicator
            const indicator = this.add.graphics();
            indicator.setDepth(5);

            this.fishCards[fish.key] = { icon, name, indicator, hitArea, y, color: fish.color };
        });

        // Select default
        this.selectedFish = 'clownfish';
        this._updateFishCards();

        // Start button
        this.startBtn = this.add.text(centerX, 520, '开始游戏', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#00aa66',
            padding: { x: 40, y: 16 }
        }).setOrigin(0.5).setInteractive();

        this.startBtn.on('pointerover', () => this.startBtn.setStyle({ color: '#ffff00' }));
        this.startBtn.on('pointerout', () => this.startBtn.setStyle({ color: '#ffffff' }));
        this.startBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { difficulty: this.selectedDifficulty, fishType: this.selectedFish });
            this.scene.launch('UIScene');
        });

        // ─── Shop button ───────────────────────────────────────────────
        const currency = this._getCurrency();
        this.shopBtn = this.add.text(centerX, 580, `🏪 商店  💰 ${currency}`, {
            fontSize: '22px',
            fontFamily: 'Arial',
            color: '#ffd700',
            backgroundColor: '#332200',
            padding: { x: 24, y: 10 }
        }).setOrigin(0.5).setInteractive();

        this.shopBtn.on('pointerover', () => this.shopBtn.setStyle({ color: '#ffcc00' }));
        this.shopBtn.on('pointerout', () => this.shopBtn.setStyle({ color: '#ffd700' }));
        this.shopBtn.on('pointerdown', () => {
            this.scene.start('ShopScene');
        });

        // Button breathing animations
        this.tweens.add({
            targets: this.startBtn,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1200,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        this.tweens.add({
            targets: this.shopBtn,
            scaleX: 1.03,
            scaleY: 1.03,
            duration: 1400,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // Instructions
        this.add.text(centerX, 660, '使用方向键或鼠标控制鱼\n大的鱼可以吃掉小的鱼', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#aaaaaa',
            align: 'center'
        }).setOrigin(0.5);

        // Show selected difficulty
        this.updateDifficultyInfo(centerX, 470);
    }

    /**
     * Load unlocked difficulties from localStorage
     */
    loadUnlockedDifficulties() {
        try {
            const saved = localStorage.getItem('fishEat_unlockedDifficulties');
            if (saved) {
                this.unlockedDifficulties = JSON.parse(saved);
            } else {
                this.unlockedDifficulties = ['easy'];
            }
        } catch (e) {
            this.unlockedDifficulties = ['easy'];
        }
    }

    /**
     * Save unlocked difficulties to localStorage
     */
    saveUnlockedDifficulties() {
        try {
            localStorage.setItem('fishEat_unlockedDifficulties', JSON.stringify(this.unlockedDifficulties));
        } catch (e) {
            console.warn('Failed to save unlocked difficulties');
        }
    }

    /**
     * Check if a difficulty is unlocked
     * @param {string} difficultyKey - The difficulty key to check
     * @returns {boolean} True if unlocked
     */
    isDifficultyUnlocked(difficultyKey) {
        return this.unlockedDifficulties.includes(difficultyKey);
    }

    /**
     * Unlock a difficulty
     * @param {string} difficultyKey - The difficulty to unlock
     */
    unlockDifficulty(difficultyKey) {
        if (!this.isDifficultyUnlocked(difficultyKey)) {
            this.unlockedDifficulties.push(difficultyKey);
            this.saveUnlockedDifficulties();
        }
    }

    /**
     * Create difficulty selection buttons
     * @param {number} centerX - Center X position
     * @param {number} startY - Starting Y position
     */
    createDifficultyButtons(centerX, startY) {
        const difficulties = ['easy', 'normal', 'hard'];
        const buttonWidth = 200;
        const buttonHeight = 60;
        const spacing = 20;
        const startX = centerX - (difficulties.length * buttonWidth + (difficulties.length - 1) * spacing) / 2;

        this.difficultyButtons = {};

        difficulties.forEach((diffKey, index) => {
            const x = startX + index * (buttonWidth + spacing);
            const diff = this.difficultyData.difficulties[diffKey];
            const isUnlocked = this.isDifficultyUnlocked(diffKey);

            // Button background
            const bgColor = isUnlocked ? 0x00aa66 : 0x444444;
            const textColor = isUnlocked ? '#ffffff' : '#888888';

            const btn = this.add.text(x + buttonWidth / 2, startY, diff.name + '\n' + diff.nameEn, {
                fontSize: '20px',
                fontFamily: 'Arial',
                color: textColor,
                backgroundColor: bgColor === 0x444444 ? '#444444' : undefined,
                align: 'center',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5).setInteractive({ enabled: isUnlocked });

            // Add lock icon if not unlocked
            if (!isUnlocked) {
                const lockText = this.add.text(x + buttonWidth / 2, startY - 15, '🔒', {
                    fontSize: '24px'
                }).setOrigin(0.5);
                lockText.lockedBtn = btn;
                btn.lockIcon = lockText;

                // Show unlock condition on hover
                btn.on('pointerover', () => {
                    const condition = diff.unlockCondition;
                    let conditionText = '';
                    if (condition) {
                        if (condition.type === 'beatDifficulty') {
                            conditionText = '需要先通关' + this.difficultyData.difficulties[condition.requiredDifficulty].name;
                        } else if (condition.type === 'reachLevel') {
                            conditionText = '需要达到' + condition.requiredLevel + '级';
                        }
                    }
                    if (conditionText && !this.lockMessage) {
                        this.lockMessage = this.add.text(centerX, startY + 60, conditionText, {
                            fontSize: '16px',
                            fontFamily: 'Arial',
                            color: '#ffaa00',
                            backgroundColor: '#333333',
                            padding: { x: 10, y: 5 }
                        }).setOrigin(0.5);
                    }
                });

                btn.on('pointerout', () => {
                    if (this.lockMessage) {
                        this.lockMessage.destroy();
                        this.lockMessage = null;
                    }
                });
            }

            // Click handler
            if (isUnlocked) {
                btn.on('pointerdown', () => {
                    this.selectDifficulty(diffKey);
                });
            }

            this.difficultyButtons[diffKey] = btn;
        });

        // Select default difficulty
        this.selectDifficulty(this.selectedDifficulty);
    }

    /**
     * Select a difficulty
     * @param {string} difficultyKey - The difficulty to select
     */
    selectDifficulty(difficultyKey) {
        this.selectedDifficulty = difficultyKey;

        // Update button styles
        Object.keys(this.difficultyButtons).forEach(key => {
            const btn = this.difficultyButtons[key];
            const isSelected = key === difficultyKey;
            const isUnlocked = this.isDifficultyUnlocked(key);

            if (isUnlocked) {
                const bgColor = isSelected ? 0xffaa00 : 0x00aa66;
                btn.setStyle({
                    backgroundColor: isSelected ? '#ffaa00' : '#00aa66',
                    color: '#ffffff'
                });
            }
        });

        // Update difficulty info
        this.updateDifficultyInfo(512, 470);
    }

    /**
     * Update difficulty info display
     * @param {number} centerX - Center X position
     * @param {number} y - Y position
     */
    updateDifficultyInfo(centerX, y) {
        if (this.difficultyInfoText) {
            this.difficultyInfoText.destroy();
        }

        const diff = this.difficultyData.difficulties[this.selectedDifficulty];
        const enemyInfo = `敌人数量: ${diff.enemyCount.min}-${diff.enemyCount.max}`;
        const aiInfo = `AI强度: ${diff.aiLevel}x`;

        this.difficultyInfoText = this.add.text(centerX, y, `${diff.name} - ${enemyInfo} | ${aiInfo}`, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#00ff88'
        }).setOrigin(0.5);
    }

    /**
     * Called when a difficulty is beaten (called from GameOverScene or similar)
     * @param {string} difficultyKey - The difficulty that was beaten
     */
    static onDifficultyBeat(difficultyKey) {
        // This is a static method that can be called to unlock difficulties
        const scene = this;
        const difficultyData = this.cache ? this.cache.json.get('difficultyData') : null;
        if (!difficultyData) return;

        const unlockedDifficulties = scene.unlockedDifficulties || ['easy'];

        // Check if beating this difficulty unlocks the next
        Object.keys(difficultyData.difficulties).forEach(key => {
            const diff = difficultyData.difficulties[key];
            if (diff.unlockCondition && diff.unlockCondition.type === 'beatDifficulty') {
                if (diff.unlockCondition.requiredDifficulty === difficultyKey) {
                    if (!unlockedDifficulties.includes(key)) {
                        unlockedDifficulties.push(key);
                    }
                }
            }
        });

        scene.unlockedDifficulties = unlockedDifficulties;
        scene.saveUnlockedDifficulties();
    }

    _getCurrency() {
        try {
            return parseInt(localStorage.getItem('fishEat_currency') || '0');
        } catch { return 0; }
    }

    _selectFish(key) {
        this.selectedFish = key;
        this._updateFishCards();
    }

    _updateFishCards() {
        Object.entries(this.fishCards).forEach(([k, v]) => {
            const isSelected = k === this.selectedFish;
            v.indicator.clear();
            // Draw selection indicator circle
            v.indicator.fillStyle(isSelected ? 0x00aa66 : 0x333333, isSelected ? 0.5 : 0.3);
            v.indicator.fillCircle(v.hitArea.x, v.hitArea.y, 25);
            v.indicator.lineStyle(2, isSelected ? 0xffd700 : v.color || 0x666666, 0.8);
            v.indicator.strokeCircle(v.hitArea.x, v.hitArea.y, 25);
            // Highlight selected
            if (isSelected) {
                v.icon.setScale(1.2);
            } else {
                v.icon.setScale(1.0);
            }
        });
    }

    update() {
        // Animate background fish
        if (this._bgFishGroup) {
            this._bgFishGroup.forEach(fish => {
                fish.x += fish._speed * this.game.loop.delta / 1000;
                if (fish._speed > 0 && fish.x > 1100) {
                    fish.x = -50;
                    fish.y = 100 + Math.random() * 600;
                } else if (fish._speed < 0 && fish.x < -50) {
                    fish.x = 1100;
                    fish.y = 100 + Math.random() * 600;
                }
            });
        }
    }
}

export default MenuScene;
