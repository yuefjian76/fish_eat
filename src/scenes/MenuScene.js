// MenuScene - Start menu with title and difficulty selection
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        this.difficultyData = null;
        this.unlockedDifficulties = ['easy'];
        this.selectedDifficulty = 'easy';
    }

    preload() {
        this.load.json('difficultyData', 'src/config/difficulty.json');
    }

    create() {
        const centerX = 512;
        const centerY = 384;

        // Load difficulty configuration
        this.difficultyData = this.cache.json.get('difficultyData');

        // Load unlocked difficulties from localStorage
        this.loadUnlockedDifficulties();

        // Title
        this.add.text(centerX, 120, '鱼吃鱼', {
            fontSize: '72px',
            fontFamily: 'Arial',
            color: '#00ff88',
            fontStyle: 'bold'
        }).setOrigin(0.5);

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

        // Start button
        const startBtn = this.add.text(centerX, 520, '开始游戏', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#00aa66',
            padding: { x: 40, y: 16 }
        }).setOrigin(0.5).setInteractive();

        startBtn.on('pointerover', () => startBtn.setStyle({ color: '#ffff00' }));
        startBtn.on('pointerout', () => startBtn.setStyle({ color: '#ffffff' }));
        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { difficulty: this.selectedDifficulty });
            this.scene.launch('UIScene');
        });

        // Instructions
        this.add.text(centerX, 620, '使用方向键或鼠标控制鱼\n大的鱼可以吃掉小的鱼', {
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
}

export default MenuScene;
