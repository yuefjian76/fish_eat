// GameOverScene - Rich stats game over screen
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        const W = 1024, H = 768;
        const cx = W / 2;

        // Handle difficulty unlocks + save stats
        this.handleUnlocks(data);
        this.saveStats(data);

        // Load best stats for comparison
        const bestScore = this._getStat('fishEat_highScore', 0);
        const bestLevel = this._getStat('fishEat_maxLevel', 1);
        const isNewScoreRecord = data.score > (this._getStat('fishEat_highScore', -1));
        const isNewLevelRecord = data.level > (this._getStat('fishEat_prevMaxLevel', 0));

        // ─── Dark overlay ────────────────────────────────────────────────────
        this.add.rectangle(cx, H / 2, W, H, 0x000011, 0.85);

        // ─── Title ───────────────────────────────────────────────────────────
        const titleColor = data.score > 0 ? '#ff6644' : '#ff2222';
        this.add.text(cx, 90, '游戏结束', {
            fontSize: '64px',
            fontFamily: 'Arial Black, Arial',
            color: titleColor,
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // ─── Stats panel ─────────────────────────────────────────────────────
        const panelY = 200;
        const panelH = 280;
        const panelW = 560;

        // Panel background
        const panel = this.add.graphics();
        panel.fillStyle(0x001133, 0.7);
        panel.lineStyle(2, 0x4488ff, 0.6);
        panel.fillRoundedRect(cx - panelW / 2, panelY, panelW, panelH, 12);
        panel.strokeRoundedRect(cx - panelW / 2, panelY, panelW, panelH, 12);

        // Stats rows
        const rows = [
            { label: '最终分数', value: data.score?.toLocaleString() || '0', record: isNewScoreRecord, best: bestScore?.toLocaleString() || '0' },
            { label: '最高等级', value: `Lv.${data.level || 1}`, record: isNewLevelRecord, best: `Lv.${bestLevel}` },
            { label: '击杀数量', value: `${data.kills || 0} 条鱼`, record: false, best: null },
            { label: '生存时间', value: this._formatTime(data.survivalTime || 0), record: false, best: null },
        ];

        rows.forEach((row, i) => {
            const ry = panelY + 30 + i * 58;
            const lx = cx - panelW / 2 + 30;
            const rx = cx + panelW / 2 - 30;

            // Label
            this.add.text(lx, ry, row.label, {
                fontSize: '20px', fontFamily: 'Arial', color: '#aabbcc'
            });

            // Value (highlight if record)
            const valueColor = row.record ? '#FFD700' : '#ffffff';
            const valueSuffix = row.record ? ' 🏆 新纪录!' : (row.best ? ` (最佳: ${row.best})` : '');
            this.add.text(rx, ry, `${row.value}${valueSuffix}`, {
                fontSize: '20px', fontFamily: 'Arial Black, Arial',
                color: valueColor, stroke: row.record ? '#000000' : undefined, strokeThickness: row.record ? 2 : 0
            }).setOrigin(1, 0);

            // Divider
            if (i < rows.length - 1) {
                const div = this.add.graphics();
                div.lineStyle(1, 0x334455, 0.7);
                div.lineBetween(lx, ry + 38, rx, ry + 38);
            }
        });

        // ─── Unlock message ───────────────────────────────────────────────
        if (data.unlocked) {
            const unlockBg = this.add.graphics();
            unlockBg.fillStyle(0x003300, 0.8);
            unlockBg.fillRoundedRect(cx - 200, panelY + panelH + 10, 400, 42, 8);
            this.add.text(cx, panelY + panelH + 31, `🔓 解锁: ${data.unlocked} 难度!`, {
                fontSize: '20px', fontFamily: 'Arial', color: '#00ff88',
                stroke: '#000000', strokeThickness: 2
            }).setOrigin(0.5);
        }

        // ─── Buttons ────────────────────────────────────────────────────────
        const btnY = panelY + panelH + (data.unlocked ? 70 : 20);

        const restartBtn = this._makeButton(cx - 120, btnY + 50, '重新开始', 0x008844);
        restartBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { difficulty: data.difficulty || 'easy' });
            this.scene.launch('UIScene');
        });

        const menuBtn = this._makeButton(cx + 120, btnY + 50, '返回菜单', 0x444466);
        menuBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // Animate elements in
        this.cameras.main.fadeIn(300, 0, 0, 0);
    }

    _makeButton(x, y, label, bgColor) {
        const hex = '#' + bgColor.toString(16).padStart(6, '0');
        const btn = this.add.text(x, y, label, {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffffff',
            backgroundColor: hex, padding: { x: 28, y: 12 }
        }).setOrigin(0.5).setInteractive();

        btn.on('pointerover', () => btn.setStyle({ color: '#FFD700' }));
        btn.on('pointerout', () => btn.setStyle({ color: '#ffffff' }));
        return btn;
    }

    _formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    _getStat(key, defaultVal) {
        try {
            const v = localStorage.getItem(key);
            return v !== null ? parseInt(v) : defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    saveStats(data) {
        try {
            const score = data.score || 0;
            const level = data.level || 1;
            const prevMax = this._getStat('fishEat_highScore', 0);
            if (score > prevMax) localStorage.setItem('fishEat_highScore', score);

            const prevLevel = this._getStat('fishEat_maxLevel', 1);
            if (level > prevLevel) localStorage.setItem('fishEat_maxLevel', level);
        } catch (e) {}
    }

    handleUnlocks(data) {
        const difficulty = data.difficulty || 'easy';
        const level = data.level || 1;

        let unlockedDifficulties = ['easy'];
        try {
            const saved = localStorage.getItem('fishEat_unlockedDifficulties');
            if (saved) unlockedDifficulties = JSON.parse(saved);
        } catch (e) {}

        const newlyUnlocked = [];
        if (difficulty === 'easy' && !unlockedDifficulties.includes('normal')) {
            unlockedDifficulties.push('normal');
            newlyUnlocked.push('普通');
        }
        if (level >= 10 && !unlockedDifficulties.includes('hard')) {
            unlockedDifficulties.push('hard');
            newlyUnlocked.push('困难');
        }

        try {
            localStorage.setItem('fishEat_unlockedDifficulties', JSON.stringify(unlockedDifficulties));
            if (newlyUnlocked.length > 0) {
                data.unlocked = newlyUnlocked.join(', ');
            }
        } catch (e) {}
    }
}

export default GameOverScene;
