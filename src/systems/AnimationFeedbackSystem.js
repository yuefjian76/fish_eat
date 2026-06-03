/**
 * AnimationFeedbackSystem - data-driven combat feedback animations
 *
 * Reads animation_feedback.json config; exposes trigger(type, params) for 3 types:
 * - levelUp: ring expand + "LEVEL UP!" text + 8 particles
 * - skillUse: flash + skill name text + 8 particles
 * - eat: small flash + 6 particles at fish position
 */
export class AnimationFeedbackSystem {
    constructor(scene, config = null) {
        this.scene = scene;
        this.config = config || (scene?.cache?.json?.get('animationFeedback') ?? null);
    }

    trigger(type, params = {}) {
        if (!this.config) {
            this._warn('config missing');
            return null;
        }
        if (!this.config[type]) {
            this._warn(`type "${type}" missing in config`);
            return null;
        }
        switch (type) {
            case 'levelUp': return this._playLevelUp(params);
            case 'skillUse': return this._playSkillUse(params);
            case 'eat': return this._playEat(params);
            default:
                this._warn(`unknown type: ${type}`);
                return null;
        }
    }

    _playLevelUp({ level }) {
        const cfg = this.config.levelUp;
        const cx = this.scene.scale.width / 2;
        const cy = this.scene.scale.height / 2;

        // Ring expand + fade
        const ring = this.scene.add.graphics();
        ring.setDepth(100);
        ring.setScrollFactor(0);
        const [r0, r1] = cfg.ring.radius;
        const [a0, a1] = cfg.ring.alpha;
        ring.fillStyle(parseInt(cfg.ring.colors[0].slice(1), 16), a0);
        ring.fillCircle(cx, cy, r0);
        this.scene.tweens.add({
            targets: ring,
            scaleX: { from: 1, to: r1 / Math.max(r0, 1) },
            scaleY: { from: 1, to: r1 / Math.max(r0, 1) },
            alpha: { from: a0, to: a1 },
            duration: cfg.ring.duration,
            onComplete: () => ring.destroy(),
        });

        // "LEVEL UP!" text flying in
        const text = this.scene.add.text(cx, cfg.text.yStart, cfg.text.content, {
            fontSize: `${cfg.text.fontSize}px`,
            color: cfg.text.color,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 4,
        });
        text.setOrigin(0.5);
        text.setDepth(101);
        this.scene.tweens.add({
            targets: text,
            y: cfg.text.yEnd,
            alpha: { from: 1, to: 0 },
            duration: cfg.text.duration,
            delay: 200,
            onComplete: () => text.destroy(),
        });

        // 8 particles outward
        this._spawnParticles(cx, cy, cfg.particles, 100);
    }

    _playSkillUse({ slot, text, color }) {
        const cfg = this.config.skillUse;
        const player = this.scene.player;
        if (!player) return null;
        const px = player.x;
        const py = player.y;

        // Flash overlay
        const flash = this.scene.add.graphics();
        flash.setDepth(99);
        flash.setScrollFactor(0);
        flash.fillStyle(parseInt(cfg.flash.color.slice(1), 16), cfg.flash.alpha);
        flash.fillRect(0, 0, this.scene.scale.width, this.scene.scale.height);
        this.scene.tweens.add({
            targets: flash,
            alpha: { from: cfg.flash.alpha, to: 0 },
            duration: cfg.flash.duration,
            onComplete: () => flash.destroy(),
        });

        // Skill name text
        const label = this.scene.add.text(px, py + cfg.text.yOffset, text || slot, {
            fontSize: `${cfg.text.fontSize}px`,
            color: color || cfg.text.color,
            fontFamily: 'Arial Black',
            stroke: '#000000',
            strokeThickness: 3,
        });
        label.setOrigin(0.5);
        label.setDepth(102);
        this.scene.tweens.add({
            targets: label,
            y: py + cfg.text.yOffset - 30,
            alpha: { from: 1, to: 0 },
            duration: cfg.text.duration,
            onComplete: () => label.destroy(),
        });

        // 8 particles around player
        this._spawnParticles(px, py, cfg.particles, 102);
    }

    _playEat({ x, y, exp }) {
        const cfg = this.config.eat;
        // Small flash
        const flash = this.scene.add.graphics();
        flash.setDepth(50);
        flash.setScrollFactor(0);
        flash.fillStyle(parseInt(cfg.flash.color.slice(1), 16), cfg.flash.alpha);
        flash.fillCircle(0, 0, 30);
        flash.x = x;
        flash.y = y;
        this.scene.tweens.add({
            targets: flash,
            alpha: { from: cfg.flash.alpha, to: 0 },
            scaleX: { from: 1, to: 2 },
            scaleY: { from: 1, to: 2 },
            duration: cfg.flash.duration,
            onComplete: () => flash.destroy(),
        });
        // 6 particles at fish position
        this._spawnParticles(x, y, cfg.particles, 51);
    }

    _spawnParticles(x, y, cfg, depth) {
        const colors = cfg.colors || ['#FFFFFF'];
        const count = cfg.count;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const dist = cfg.distance;
            const color = colors[i % colors.length];
            const p = this.scene.add.graphics();
            p.setDepth(depth);
            p.setScrollFactor(0);
            p.fillStyle(parseInt(color.slice(1), 16), 1);
            p.fillCircle(0, 0, 4);
            p.x = x;
            p.y = y;
            this.scene.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: { from: 1, to: 0 },
                duration: cfg.duration,
                onComplete: () => p.destroy(),
            });
        }
    }

    _warn(msg) {
        this.scene?.logger?.warn?.(`AnimationFeedbackSystem: ${msg}`);
    }
}
