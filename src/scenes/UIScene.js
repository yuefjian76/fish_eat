// UIScene - HUD overlay showing score, exp, level, hp
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.scoreText = null;
        this.expText = null;
        this.levelText = null;
        this.hpText = null;
        this.skillUnlockText = null;
    }

    create() {
        this.scoreText = this.add.text(20, 20, '分数: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });

        this.expText = this.add.text(20, 50, '经验: 0/100', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#00ff88'
        });

        this.levelText = this.add.text(20, 80, '等级: 1', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffaa00'
        });

        this.hpText = this.add.text(20, 110, '血量: 100/100', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ff4444'
        });

        // Skill unlock notification (centered, initially hidden)
        this.skillUnlockText = this.add.text(512, 300, '', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.skillUnlockText.setOrigin(0.5);
        this.skillUnlockText.setDepth(200);
        this.skillUnlockText.setVisible(false);
    }

    updateUI(score, exp, level, hp, maxHp, expForNextLevel = null) {
        this.scoreText.setText(`分数: ${score}`);
        const expDisplay = expForNextLevel !== null ? expForNextLevel : (level * 100);
        this.expText.setText(`经验: ${exp}/${expDisplay}`);
        this.levelText.setText(`等级: ${level}`);
        this.hpText.setText(`血量: ${hp}/${maxHp}`);
    }

    /**
     * Show skill unlock notification
     * @param {string[]} skills - Array of skill IDs that were unlocked
     */
    showSkillUnlock(skills) {
        if (!skills || skills.length === 0) return;

        const skillNames = {
            'bite': '撕咬',
            'shield': '护盾',
            'speed_up': '加速',
            'heal': '治疗'
        };

        const names = skills.map(s => skillNames[s] || s).join(', ');
        this.skillUnlockText.setText(`解锁技能: ${names}`);
        this.skillUnlockText.setVisible(true);
        this.skillUnlockText.setAlpha(1);

        // Fade out after 2 seconds
        this.time.delayedCall(2000, () => {
            this.tweens.add({
                targets: this.skillUnlockText,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    this.skillUnlockText.setVisible(false);
                }
            });
        });
    }
}

export default UIScene;
