// UIScene - HUD overlay showing score, exp, level, hp with progress bars + vignette
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.scoreText = null;
        this.levelText = null;
        this.themeText = null;
        this.skillUnlockText = null;
        this.comboText = null;
        this.comboTween = null;

        // Progress bar graphics
        this.hpBar = null;
        this.expBar = null;
        this.vignetteGraphics = null;
        this._lastVignetteAlpha = -1; // dirty flag for vignette
    }

    create() {
        // Kill any lingering vignette tweens from a previous run of this scene
        this._vignettePulsing = false;
        if (this.vignetteGraphics) {
            this.tweens.killTweensOf(this.vignetteGraphics);
            this.vignetteGraphics.destroy();
            this.vignetteGraphics = null;
        }

        const W = this.scale.width;  // 1024
        const BAR_W = 300;
        const BAR_H = 14;
        const BAR_X = W / 2 - BAR_W / 2;

        // ─── Score (top left) ───────────────────────────────────────────────
        this.scoreText = this.add.text(16, 16, '0', {
            fontSize: '26px',
            fontFamily: 'Arial Black, Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.scoreText.setDepth(100);

        // ─── Level badge (left of bars) ─────────────────────────────────────
        this.levelText = this.add.text(BAR_X - 8, 18, 'Lv.1', {
            fontSize: '18px',
            fontFamily: 'Arial Black, Arial',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.levelText.setOrigin(1, 0);
        this.levelText.setDepth(100);

        // ─── HP bar (top center) ─────────────────────────────────────────────
        this.hpBarBg = this.add.graphics();
        this.hpBarBg.fillStyle(0x000000, 0.5);
        this.hpBarBg.fillRoundedRect(BAR_X, 14, BAR_W, BAR_H, 4);
        this.hpBarBg.setDepth(99);

        this.hpBar = this.add.graphics();
        this.hpBar.setDepth(100);

        this.hpLabel = this.add.text(BAR_X + BAR_W + 6, 14, '♥ 100', {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#ff6666',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.hpLabel.setDepth(100);

        // ─── EXP bar (below HP) ──────────────────────────────────────────────
        this.expBarBg = this.add.graphics();
        this.expBarBg.fillStyle(0x000000, 0.5);
        this.expBarBg.fillRoundedRect(BAR_X, 32, BAR_W, BAR_H - 4, 3);
        this.expBarBg.setDepth(99);

        this.expBar = this.add.graphics();
        this.expBar.setDepth(100);

        this.expLabel = this.add.text(BAR_X + BAR_W + 6, 32, '0/100', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#88ffcc',
            stroke: '#000000',
            strokeThickness: 2
        });
        this.expLabel.setDepth(100);

        // ─── Theme display (top right) ───────────────────────────────────────
        this.themeText = this.add.text(W - 16, 16, '', {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#88ccff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.themeText.setOrigin(1, 0);
        this.themeText.setDepth(100);

        // ─── Vignette (low HP danger overlay) ───────────────────────────────
        this.vignetteGraphics = this.add.graphics();
        this.vignetteGraphics.setDepth(98); // below HUD but above game

        // ─── Combo display (center, shown when combo >= 2) ───────────────────
        this.comboText = this.add.text(W / 2, 90, '', {
            fontSize: '40px',
            fontFamily: 'Arial Black, Arial',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        });
        this.comboText.setOrigin(0.5);
        this.comboText.setDepth(200);
        this.comboText.setVisible(false);

        // ─── Skill unlock notification (centered) ────────────────────────────
        this.skillUnlockText = this.add.text(W / 2, 300, '', {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.skillUnlockText.setOrigin(0.5);
        this.skillUnlockText.setDepth(200);
        this.skillUnlockText.setVisible(false);

        // Draw initial bars
        this._drawHpBar(1.0, 1.0);
        this._drawExpBar(0, 1.0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal bar renderers
    // ─────────────────────────────────────────────────────────────────────────

    _hpRatio(hp, maxHp) {
        if (maxHp <= 0) return 1;
        return Math.max(0, Math.min(1, hp / maxHp));
    }

    _expRatio(exp, maxExp) {
        if (maxExp <= 0) return 1;
        return Math.max(0, Math.min(1, exp / maxExp));
    }

    _hpColor(ratio) {
        if (ratio >= 0.6) return 0x00dd44;
        if (ratio >= 0.3) return 0xffcc00;
        return 0xff2222;
    }

    _vignetteAlpha(hpRatio) {
        const THRESHOLD = 0.3;
        if (hpRatio >= THRESHOLD) return 0;
        return 0.8 * (1 - hpRatio / THRESHOLD);
    }

    _drawHpBar(hp, maxHp) {
        const W = this.scale.width;
        const BAR_W = 300;
        const BAR_H = 14;
        const BAR_X = W / 2 - BAR_W / 2;
        const ratio = this._hpRatio(hp, maxHp);
        const color = this._hpColor(ratio);

        this.hpBar.clear();
        if (ratio > 0) {
            this.hpBar.fillStyle(color, 1);
            this.hpBar.fillRoundedRect(BAR_X, 14, BAR_W * ratio, BAR_H, { tl: 4, bl: 4, tr: ratio >= 0.98 ? 4 : 0, br: ratio >= 0.98 ? 4 : 0 });
        }

        // Bright highlight strip (only when bar is non-empty)
        if (ratio > 0) {
            this.hpBar.fillStyle(0xffffff, 0.2);
            this.hpBar.fillRect(BAR_X, 15, BAR_W * ratio, 3);
        }

        if (this.hpLabel) {
            this.hpLabel.setText(`♥ ${Math.floor(hp)}/${Math.floor(maxHp)}`);
        }
    }

    _drawExpBar(exp, maxExp) {
        const W = this.scale.width;
        const BAR_W = 300;
        const BAR_H = 10;
        const BAR_X = W / 2 - BAR_W / 2;
        const ratio = this._expRatio(exp, maxExp);

        this.expBar.clear();
        if (ratio > 0) {
            this.expBar.fillStyle(0x4488ff, 1);
            this.expBar.fillRoundedRect(BAR_X, 32, BAR_W * ratio, BAR_H, { tl: 3, bl: 3, tr: ratio >= 0.98 ? 3 : 0, br: ratio >= 0.98 ? 3 : 0 });

            this.expBar.fillStyle(0xaaddff, 0.3);
            this.expBar.fillRect(BAR_X, 33, BAR_W * ratio, 3);
        }

        if (this.expLabel) {
            this.expLabel.setText(`${Math.floor(exp)}/${Math.floor(maxExp)}`);
        }
    }

    _drawVignette(hpRatio) {
        if (!this.vignetteGraphics) return;
        const alpha = this._vignetteAlpha(hpRatio);
        if (Math.abs(alpha - this._lastVignetteAlpha) < 0.01) return; // skip tiny changes
        this._lastVignetteAlpha = alpha;

        this.vignetteGraphics.clear();
        if (alpha <= 0) return;

        // Draw red vignette using 4 gradient strips around screen edges
        const W = this.scale.width;
        const H = this.scale.height;
        const DEPTH = 60;

        // Top strip
        this.vignetteGraphics.fillGradientStyle(0xff0000, 0xff0000, 0xff0000, 0xff0000, alpha, alpha, 0, 0);
        this.vignetteGraphics.fillRect(0, 0, W, DEPTH);
        // Bottom strip
        this.vignetteGraphics.fillGradientStyle(0xff0000, 0xff0000, 0xff0000, 0xff0000, 0, 0, alpha, alpha);
        this.vignetteGraphics.fillRect(0, H - DEPTH, W, DEPTH);
        // Left strip
        this.vignetteGraphics.fillGradientStyle(0xff0000, 0xff0000, 0xff0000, 0xff0000, alpha, 0, 0, alpha);
        this.vignetteGraphics.fillRect(0, 0, DEPTH, H);
        // Right strip
        this.vignetteGraphics.fillGradientStyle(0xff0000, 0xff0000, 0xff0000, 0xff0000, 0, alpha, alpha, 0);
        this.vignetteGraphics.fillRect(W - DEPTH, 0, DEPTH, H);

        // Pulse the vignette when critical HP
        if (hpRatio < 0.15 && !this._vignettePulsing) {
            this._vignettePulsing = true;
            this.tweens.add({
                targets: this.vignetteGraphics,
                alpha: { from: 1, to: 0.4 },
                duration: 600,
                yoyo: true,
                repeat: -1
            });
        } else if (hpRatio >= 0.15 && this._vignettePulsing) {
            this._vignettePulsing = false;
            this.tweens.killTweensOf(this.vignetteGraphics);
            this.vignetteGraphics.setAlpha(1);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    updateUI(score, exp, level, hp, maxHp, expForNextLevel = null) {
        if (this.scoreText) this.scoreText.setText(`${score}`);
        if (this.levelText) this.levelText.setText(`Lv.${level}`);

        const maxExp = expForNextLevel !== null ? expForNextLevel : (level * 100);
        this._drawHpBar(hp, maxHp);
        this._drawExpBar(exp, maxExp);
        this._drawVignette(this._hpRatio(hp, maxHp));
    }

    /**
     * Update combo display
     */
    updateCombo(count) {
        if (!this.comboText) return;

        if (count <= 1) {
            this.comboText.setVisible(false);
            return;
        }

        const comboLabels = ['', '', '双连击!', '三连击!', '四连击!', '五连击!'];
        const label = count < comboLabels.length ? comboLabels[count] : `${count}连击!`;
        const colors = ['#FFD700', '#FF8C00', '#FF4500', '#FF0000', '#FF00FF'];
        const color = colors[Math.min(count - 2, colors.length - 1)];

        this.comboText.setText(label);
        this.comboText.setColor(color);
        this.comboText.setVisible(true);
        this.comboText.setScale(1.6);
        this.comboText.setAlpha(1);

        if (this.comboTween) this.comboTween.stop();
        this.comboTween = this.tweens.add({
            targets: this.comboText,
            scale: 1.0,
            duration: 250,
            ease: 'Back.easeOut'
        });
    }

    /**
     * Update theme display
     */
    updateTheme(themeName) {
        if (this.themeText) {
            this.themeText.setText(`🌊 ${themeName}`);
        }
    }

    /**
     * Show skill unlock notification
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
        this.skillUnlockText.setText(`✨ 解锁技能: ${names}`);
        this.skillUnlockText.setVisible(true);
        this.skillUnlockText.setAlpha(1);

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
