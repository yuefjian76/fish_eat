// GameOverScene - Game over screen with restart and menu buttons
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        const centerX = 512;
        const centerY = 384;

        // Handle difficulty unlocks based on game results
        this.handleUnlocks(data);

        this.add.rectangle(centerX, centerY, 1024, 768, 0x000000, 0.7);

        this.add.text(centerX, 200, '游戏结束', {
            fontSize: '64px',
            fontFamily: 'Arial',
            color: '#ff4444'
        }).setOrigin(0.5);

        this.add.text(centerX, 300, `最终分数: ${data.score || 0}`, {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(centerX, 360, `最终等级: ${data.level || 1}`, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffaa00'
        }).setOrigin(0.5);

        // Show unlock message if applicable
        if (data.unlocked) {
            this.add.text(centerX, 410, `解锁: ${data.unlocked}`, {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#00ff00'
            }).setOrigin(0.5);
        }

        // Restart button
        const restartBtn = this.add.text(centerX, 480, '重新开始', {
            fontSize: '36px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#00aa66',
            padding: { x: 40, y: 16 }
        }).setOrigin(0.5).setInteractive();

        restartBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { difficulty: data.difficulty || 'easy' });
            this.scene.launch('UIScene');
        });

        // Menu button
        const menuBtn = this.add.text(centerX, 560, '返回菜单', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            backgroundColor: '#666666',
            padding: { x: 30, y: 12 }
        }).setOrigin(0.5).setInteractive();

        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }

    /**
     * Handle difficulty unlocks based on game results
     * @param {object} data - Game data including difficulty, level, score
     */
    handleUnlocks(data) {
        const difficulty = data.difficulty || 'easy';
        const level = data.level || 1;

        // Load current unlocked difficulties
        let unlockedDifficulties = ['easy'];
        try {
            const saved = localStorage.getItem('fishEat_unlockedDifficulties');
            if (saved) {
                unlockedDifficulties = JSON.parse(saved);
            }
        } catch (e) {
            unlockedDifficulties = ['easy'];
        }

        const newlyUnlocked = [];

        // Check if completing easy unlocks normal
        if (difficulty === 'easy' && !unlockedDifficulties.includes('normal')) {
            // Beat easy mode - unlock normal (survived the difficulty)
            unlockedDifficulties.push('normal');
            newlyUnlocked.push('普通');
        }

        // Check if level 10 unlocks hard
        if (level >= 10 && !unlockedDifficulties.includes('hard')) {
            unlockedDifficulties.push('hard');
            newlyUnlocked.push('困难');
        }

        // Save updated unlocks
        try {
            localStorage.setItem('fishEat_unlockedDifficulties', JSON.stringify(unlockedDifficulties));
            if (newlyUnlocked.length > 0) {
                data.unlocked = newlyUnlocked.join(', ');
            }
        } catch (e) {
            console.warn('Failed to save unlocks');
        }

        // Also save max level reached
        try {
            const maxLevel = localStorage.getItem('fishEat_maxLevel');
            if (!maxLevel || level > parseInt(maxLevel)) {
                localStorage.setItem('fishEat_maxLevel', level.toString());
            }
        } catch (e) {
            console.warn('Failed to save max level');
        }
    }
}

export default GameOverScene;
