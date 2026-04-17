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

    /**
     * Show achievement notification popup.
     * @param {string} name - Achievement name
     * @param {string} description - Achievement description
     */
    showAchievementNotification(name, description) {
        const W = this.scale.width;
        const x = W / 2;
        const y = 80;

        // Background panel
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.85);
        bg.fillRoundedRect(x - 180, y - 25, 360, 60, 8);
        bg.setDepth(100);

        // Gold border
        bg.lineStyle(2, 0xffd700, 1);
        bg.strokeRoundedRect(x - 180, y - 25, 360, 60, 8);

        // Achievement label
        const label = this.add.text(x - 160, y - 15, '🏆 成就解锁', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffd700',
            stroke: '#000',
            strokeThickness: 1
        });
        label.setDepth(101);

        // Achievement name
        const achText = this.add.text(x - 160, y + 5, name, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 1
        });
        achText.setDepth(101);

        // Description
        const descText = this.add.text(x + 20, y + 5, description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#aaaaaa',
            stroke: '#000',
            strokeThickness: 1
        });
        descText.setDepth(101);

        // Fade in and slide down
        const container = this.add.container(x, y - 30, [bg, label, achText, descText]);
        container.setDepth(100);
        container.setAlpha(0);

        this.tweens.add({
            targets: container,
            alpha: 1,
            y: y,
            duration: 300,
            ease: 'Power2'
        });

        // Fade out and slide up after delay
        this.time.delayedCall(2500, () => {
            this.tweens.add({
                targets: container,
                alpha: 0,
                y: y - 20,
                duration: 400,
                ease: 'Power2',
                onComplete: () => {
                    bg.destroy();
                    label.destroy();
                    achText.destroy();
                    descText.destroy();
                    container.destroy();
                }
            });
        });
    }

    /**
     * Show boss arrival warning overlay.
     * @param {string} bossType - 'squid'|'sharkKing'|'seaDragon'
     */
    showBossWarning(bossType) {
        const W = this.scale.width;
        const cx = W / 2;
        const cy = W / 4;

        // Boss name map
        const bossNames = {
            squid: '大王乌贼',
            sharkKing: '鲨鱼之王',
            seaDragon: '海龙'
        };
        const name = bossNames[bossType] || 'BOSS';

        // Flashing warning background
        const warningBg = this.add.graphics();
        warningBg.fillStyle(0xff0000, 0);
        warningBg.fillRect(0, 0, W, this.scale.height);
        warningBg.setDepth(180);
        warningBg.setAlpha(0);

        // Warning text
        const warningText = this.add.text(cx, cy, '⚠ BOSS 来袭 ⚠', {
            fontSize: '52px',
            fontFamily: 'Arial',
            color: '#ff0000',
            stroke: '#000',
            strokeThickness: 6
        });
        warningText.setOrigin(0.5);
        warningText.setDepth(181);
        warningText.setAlpha(0);
        warningText.setScale(0.5);

        // Boss name subtitle
        const subText = this.add.text(cx, cy + 50, name, {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 3
        });
        subText.setOrigin(0.5);
        subText.setDepth(181);
        subText.setAlpha(0);

        // Flash in
        this.tweens.add({
            targets: [warningBg, warningText, subText],
            alpha: 1,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });

        // Red flash pulse
        this.tweens.add({
            targets: warningBg,
            alpha: 0.3,
            duration: 200,
            yoyo: true,
            repeat: 7,
            onComplete: () => {
                warningBg.destroy();
            }
        });

        // Fade out after 3 seconds
        this.time.delayedCall(3000, () => {
            this.tweens.add({
                targets: [warningText, subText],
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    warningText.destroy();
                    subText.destroy();
                }
            });
        });
    }

    /**
     * Show pause menu overlay.
     */
    showPauseMenu() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        // Darken background
        this._pauseOverlay = this.add.graphics();
        this._pauseOverlay.fillStyle(0x000000, 0.7);
        this._pauseOverlay.fillRect(0, 0, W, H);
        this._pauseOverlay.setDepth(200);

        // Pause text
        this._pauseText = this.add.text(cx, cy - 40, '游戏暂停', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 4
        });
        this._pauseText.setOrigin(0.5);
        this._pauseText.setDepth(201);

        // Resume hint
        this._pauseHint = this.add.text(cx, cy + 20, '按 ESC 继续', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        });
        this._pauseHint.setOrigin(0.5);
        this._pauseHint.setDepth(201);

        // Fade in
        this._pauseOverlay.setAlpha(0);
        this._pauseText.setAlpha(0);
        this._pauseHint.setAlpha(0);
        this.tweens.add({
            targets: [this._pauseOverlay, this._pauseText, this._pauseHint],
            alpha: 1,
            duration: 200
        });
    }

    /**
     * Hide pause menu overlay.
     */
    hidePauseMenu() {
        if (this._pauseOverlay) {
            this.tweens.add({
                targets: [this._pauseOverlay, this._pauseText, this._pauseHint],
                alpha: 0,
                duration: 150,
                onComplete: () => {
                    if (this._pauseOverlay) this._pauseOverlay.destroy();
                    if (this._pauseText) this._pauseText.destroy();
                    if (this._pauseHint) this._pauseHint.destroy();
                    this._pauseOverlay = null;
                    this._pauseText = null;
                    this._pauseHint = null;
                }
            });
        }
    }
}

export default UIScene;
