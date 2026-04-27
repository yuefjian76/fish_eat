// GameOverScene - Rich stats game over screen
import AuthSystem from '../systems/AuthSystem.js';
import UserDataSystem from '../systems/UserDataSystem.js';

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
        this.authSystem = null;
        this.userDataSystem = null;
    }

    create(data) {
        const W = 1024, H = 768;
        const cx = W / 2;

        // Read previous bests BEFORE saving, so we can detect new records
        const prevBestScore = this._getStat('fishEat_highScore', -1);
        const prevBestLevel = this._getStat('fishEat_maxLevel', 0);

        // Initialize Auth and UserData systems
        this.authSystem = new AuthSystem();
        this.userDataSystem = new UserDataSystem();

        // Handle difficulty unlocks + save stats (writes new records to localStorage)
        this.handleUnlocks(data);
        this.saveStats(data);

        // Sync game data to localStorage if logged in
        const user = this.authSystem.getCurrentUser();
        if (user) {
            this._syncGameDataToLocal(user.uid);
        }

        // Load updated best stats for display
        const bestScore = this._getStat('fishEat_highScore', 0);
        const bestLevel = this._getStat('fishEat_maxLevel', 1);
        // Compare against values read BEFORE saving to correctly detect new records
        const isNewScoreRecord = data.score > prevBestScore;
        const isNewLevelRecord = data.level > prevBestLevel;

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

        // ─── Currency earned display ───────────────────────────────────────
        const currencyEarned = Math.floor((data.score || 0) / 10);
        const currencyBg = this.add.graphics();
        currencyBg.fillStyle(0x332200, 0.8);
        currencyBg.fillRoundedRect(cx - 160, panelY + panelH + (data.unlocked ? 62 : 10), 320, 36, 6);
        this.add.text(cx, panelY + panelH + (data.unlocked ? 80 : 28), `💰 本局获得 ${currencyEarned} 金币`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#ffd700',
            stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5);

        // ─── Buttons ────────────────────────────────────────────────────────
        const btnY = panelY + panelH + (data.unlocked ? 120 : 58);

        const restartBtn = this._makeButton(cx - 120, btnY + 50, '重新开始', 0x008844);
        restartBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { difficulty: data.difficulty || 'easy' });
            this.scene.launch('UIScene');
        });

        const shopBtn = this._makeButton(cx + 140, btnY + 50, '商店', 0x886600);
        shopBtn.on('pointerdown', () => {
            this.scene.start('ShopScene');
        });

        const menuBtn = this._makeButton(cx - 140, btnY + 50, '返回菜单', 0x444466);
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

            // Award currency based on score (1 coin per 10 score)
            const currencyEarned = Math.floor(score / 10);
            const prevCurrency = parseInt(localStorage.getItem('fishEat_currency') || '0');
            localStorage.setItem('fishEat_currency', (prevCurrency + currencyEarned).toString());
        } catch (e) { console.warn('saveStats failed:', e); }
    }

    handleUnlocks(data) {
        const difficulty = data.difficulty || 'easy';
        const level = data.level || 1;

        let unlockedDifficulties = ['easy'];
        try {
            const saved = localStorage.getItem('fishEat_unlockedDifficulties');
            if (saved) unlockedDifficulties = JSON.parse(saved);
        } catch (e) { console.warn('saveStats failed:', e); }

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
        } catch (e) { console.warn('saveStats failed:', e); }
    }

    async _syncGameDataToLocal(uid) {
        try {
            const localData = {
                currency: parseInt(localStorage.getItem('fishEat_currency') || '0'),
                highScore: parseInt(localStorage.getItem('fishEat_highScore') || '0'),
                maxLevel: parseInt(localStorage.getItem('fishEat_maxLevel') || '1'),
                unlockedDifficulties: JSON.parse(localStorage.getItem('fishEat_unlockedDifficulties') || '["easy"]'),
                upgrades: JSON.parse(localStorage.getItem('fishEat_upgrades') || '{}'),
                selectedFish: localStorage.getItem('fishEat_selectedFish') || 'clownfish'
            };
            await this.userDataSystem.saveUserData(uid, localData);
        } catch (e) {
            console.warn('Failed to sync user data:', e);
        }
    }
}

export default GameOverScene;
