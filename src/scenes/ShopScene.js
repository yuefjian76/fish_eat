// ShopScene - In-game shop for permanent upgrades
class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;

        // Load upgrade data
        this.upgradesData = this.cache.json.get('upgradesData');
        this.currency = this._getCurrency();

        // Dark background
        this.add.rectangle(cx, H / 2, W, H, 0x000022, 0.95);

        // Title
        this.add.text(cx, 60, '商店', {
            fontSize: '56px', fontFamily: 'Arial Black, Arial',
            color: '#ffd700', stroke: '#000', strokeThickness: 5
        }).setOrigin(0.5);

        // Currency display
        this._updateCurrencyDisplay(cx, 110);

        // Load current upgrade levels
        this.upgradeLevels = this._loadUpgradeLevels();

        // Draw upgrade cards
        this._drawUpgradeCards(cx);

        // Back button
        const backBtn = this._makeButton(cx, H - 60, '返回菜单', 0x444466);
        backBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        this.cameras.main.fadeIn(300, 0, 0, 0);
    }

    _updateCurrencyDisplay(cx, y) {
        if (this.currencyText) this.currencyText.destroy();
        this.currencyText = this.add.text(cx, y, `💰 金币: ${this.currency}`, {
            fontSize: '24px', fontFamily: 'Arial',
            color: '#ffd700', stroke: '#000', strokeThickness: 2
        }).setOrigin(0.5);
    }

    _drawUpgradeCards(cx) {
        const startY = 160;
        const cardH = 80;
        const cardW = 700;
        const gap = 12;
        const keys = Object.keys(this.upgradesData);

        keys.forEach((key, i) => {
            const ach = this.upgradesData[key];
            const y = startY + i * (cardH + gap);
            const currentLevel = this.upgradeLevels[key] || 0;
            const isMaxed = currentLevel >= ach.maxLevel;
            const cost = ach.costPerLevel * (currentLevel + 1);
            const canAfford = this.currency >= cost && !isMaxed;

            // Card background
            const card = this.add.graphics();
            card.fillStyle(canAfford ? 0x112244 : 0x111122, 0.9);
            card.fillRoundedRect(cx - cardW / 2, y, cardW, cardH, 8);
            card.lineStyle(1, canAfford ? 0x4488ff : 0x333355, 0.5);
            card.strokeRoundedRect(cx - cardW / 2, y, cardW, cardH, 8);
            card.setInteractive(new Phaser.Geom.Rectangle(cx - cardW / 2, y, cardW, cardH), Phaser.Geom.Rectangle.Contains);
            card.setDepth(1);

            // Name
            this.add.text(cx - cardW / 2 + 16, y + 14, ach.name, {
                fontSize: '22px', fontFamily: 'Arial',
                color: canAfford ? '#ffffff' : '#888888'
            }).setDepth(2);

            // Description
            this.add.text(cx - cardW / 2 + 16, y + 42, ach.description, {
                fontSize: '14px', fontFamily: 'Arial',
                color: '#aaaaaa'
            }).setDepth(2);

            // Level indicator
            this.add.text(cx + cardW / 2 - 16, y + 14, `Lv.${currentLevel}/${ach.maxLevel}`, {
                fontSize: '16px', fontFamily: 'Arial',
                color: '#aaaaaa'
            }).setOrigin(1, 0).setDepth(2);

            // Cost or MAX
            const costColor = isMaxed ? '#00ff88' : (canAfford ? '#ffd700' : '#ff4444');
            const costText = isMaxed ? '已满级' : `💰 ${cost}`;
            this.add.text(cx + cardW / 2 - 16, y + cardH - 16, costText, {
                fontSize: '18px', fontFamily: 'Arial',
                color: costColor
            }).setOrigin(1, 1).setDepth(2);

            // Buy button
            if (!isMaxed) {
                const buyBtn = this._makeSmallButton(cx + cardW / 2 - 120, y + cardH - 16, '+', canAfford ? 0x008844 : 0x333333);
                if (canAfford) {
                    buyBtn.on('pointerdown', () => this._buyUpgrade(key, cost));
                }
            }

            card.on('pointerover', () => {
                card.clear();
                card.fillStyle(canAfford ? 0x1a3366 : 0x1a1a33, 0.9);
                card.fillRoundedRect(cx - cardW / 2, y, cardW, cardH, 8);
                card.lineStyle(2, canAfford ? 0x66aaff : 0x444466, 0.8);
                card.strokeRoundedRect(cx - cardW / 2, y, cardW, cardH, 8);
            });

            card.on('pointerout', () => {
                card.clear();
                card.fillStyle(canAfford ? 0x112244 : 0x111122, 0.9);
                card.fillRoundedRect(cx - cardW / 2, y, cardW, cardH, 8);
                card.lineStyle(1, canAfford ? 0x4488ff : 0x333355, 0.5);
                card.strokeRoundedRect(cx - cardW / 2, y, cardW, cardH, 8);
            });
        });
    }

    _buyUpgrade(key, cost) {
        this.currency -= cost;
        this.upgradeLevels[key] = (this.upgradeLevels[key] || 0) + 1;
        this._saveUpgradeLevels();
        this._saveCurrency();
        this._redraw();
    }

    _redraw() {
        // Remove all interactive cards and redraw
        this._updateCurrencyDisplay(this.scale.width / 2, 110);
        this._drawUpgradeCards(this.scale.width / 2);
    }

    _getCurrency() {
        try {
            return parseInt(localStorage.getItem('fishEat_currency') || '0');
        } catch { return 0; }
    }

    _saveCurrency() {
        try {
            localStorage.setItem('fishEat_currency', this.currency.toString());
        } catch {}
    }

    _loadUpgradeLevels() {
        try {
            return JSON.parse(localStorage.getItem('fishEat_upgrades') || '{}');
        } catch { return {}; }
    }

    _saveUpgradeLevels() {
        try {
            localStorage.setItem('fishEat_upgrades', JSON.stringify(this.upgradeLevels));
        } catch {}
    }

    /** Get upgrade level for a given upgrade key */
    static getUpgradeLevel(key) {
        try {
            const levels = JSON.parse(localStorage.getItem('fishEat_upgrades') || '{}');
            return levels[key] || 0;
        } catch { return 0; }
    }

    _makeButton(x, y, label, bgColor) {
        const hex = '#' + bgColor.toString(16).padStart(6, '0');
        const btn = this.add.text(x, y, label, {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffffff',
            backgroundColor: hex, padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setDepth(10);
        btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, btn.width, btn.height), Phaser.Geom.Rectangle.Contains);
        return btn;
    }

    _makeSmallButton(x, y, label, bgColor) {
        const hex = '#' + bgColor.toString(16).padStart(6, '0');
        const btn = this.add.text(x, y, label, {
            fontSize: '22px', fontFamily: 'Arial', color: '#ffffff',
            backgroundColor: hex, padding: { x: 14, y: 6 }
        }).setOrigin(0, 1).setDepth(10);
        btn.setInteractive(new Phaser.Geom.Rectangle(0, 0, btn.width, btn.height), Phaser.Geom.Rectangle.Contains);
        return btn;
    }
}
