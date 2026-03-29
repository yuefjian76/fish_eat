/**
 * DriftBottleSystem - Manages drift bottle effects triggered on level up
 */
import { LuckSystem } from './LuckSystem.js';
import { logger } from './DebugLogger.js';

export class DriftBottleSystem {
    /**
     * @param {object} driftBottleData - Configuration from driftBottle.json
     */
    constructor(driftBottleData) {
        this.config = driftBottleData;
        this.effects = driftBottleData.effects;
        this.luckInfluence = driftBottleData.luckInfluence;
        this.luckSystem = new LuckSystem(0);

        this.activeEffects = {};
        this.doubleCoinsActive = false;
        this.cooldownAccelActive = false;
    }

    /**
     * Set scene reference for applying effects
     * @param {object} scene - Phaser scene reference
     */
    setScene(scene) {
        this.scene = scene;
    }

    /**
     * Set luck system reference
     * @param {LuckSystem} luckSystem - Luck system instance
     */
    setLuckSystem(luckSystem) {
        this.luckSystem = luckSystem;
    }

    /**
     * Select a random effect based on weights and luck
     * @returns {object} Selected effect
     */
    selectEffect() {
        // Calculate total weight and filter effects based on luck
        const goodChance = this.luckSystem.calculateGoodChance(
            this.luckInfluence.baseGoodChance,
            this.luckInfluence
        );

        // Determine if we pick a good or bad effect
        const roll = Math.random() * 100;
        const isGoodRoll = roll < goodChance;

        // Filter effects by type
        const eligibleEffects = this.effects.filter(effect => effect.good === isGoodRoll);

        // Calculate weights with luck modifier
        let totalWeight = 0;
        const weightedEffects = eligibleEffects.map(effect => {
            const modifiedWeight = this.luckSystem.modifyWeight(
                effect.weight,
                effect.good,
                this.luckInfluence
            );
            totalWeight += modifiedWeight;
            return { effect, weight: modifiedWeight };
        });

        // Random selection
        let random = Math.random() * totalWeight;
        for (const { effect, weight } of weightedEffects) {
            random -= weight;
            if (random <= 0) {
                return effect;
            }
        }

        // Fallback to first effect
        return weightedEffects[0]?.effect || this.effects[0];
    }

    /**
     * Trigger a drift bottle effect
     * @returns {object} Result of the effect
     */
    trigger() {
        const effect = this.selectEffect();
        logger.info(`Drift bottle triggered: ${effect.name} (${effect.type})`);

        const result = {
            effect: effect,
            success: true,
            message: effect.name
        };

        switch (effect.type) {
            case 'instant':
                this.applyInstantEffect(effect);
                break;
            case 'buff':
                this.applyBuffEffect(effect);
                break;
            case 'debuff':
                this.applyDebuffEffect(effect);
                break;
            case 'permanent':
                this.applyPermanentEffect(effect);
                break;
        }

        logger.info(`Drift bottle effect result: ${effect.name} - ${effect.description || 'no description'}`);

        return result;
    }

    /**
     * Apply instant effect
     */
    applyInstantEffect(effect) {
        const scene = this.scene;
        if (!scene) return;

        switch (effect.id) {
            case 'full_health':
                scene.hp = scene.maxHp;
                this.showEffectText(scene.player, `+${effect.name}`);
                break;
            case 'coins_50':
                scene.score += 50;
                this.showEffectText(scene.player, '+50 金币');
                break;
            case 'coins_100':
                scene.score += 100;
                this.showEffectText(scene.player, '+100 金币');
                break;
            case 'coins_minus_30':
                scene.score = Math.max(0, scene.score - 30);
                this.showEffectText(scene.player, '-30 金币', '#ff4444');
                break;
        }

        this.updateUI();
    }

    /**
     * Apply buff effect
     */
    applyBuffEffect(effect) {
        const scene = this.scene;
        if (!scene) return;

        switch (effect.id) {
            case 'double_coins':
                this.doubleCoinsActive = true;
                this.activeEffects.double_coins = {
                    startTime: scene.time.now,
                    duration: effect.duration
                };
                this.showEffectText(scene.player, effect.name, '#00ff00');
                // Auto-remove after duration
                scene.time.delayedCall(effect.duration, () => {
                    this.doubleCoinsActive = false;
                    this.activeEffects.double_coins = null;
                });
                break;
            case 'cooldown_accel':
                this.cooldownAccelActive = true;
                this.activeEffects.cooldown_accel = {
                    startTime: scene.time.now,
                    duration: effect.duration
                };
                this.showEffectText(scene.player, effect.name, '#00ff00');
                // Auto-remove after duration
                scene.time.delayedCall(effect.duration, () => {
                    this.cooldownAccelActive = false;
                    this.activeEffects.cooldown_accel = null;
                });
                break;
        }
    }

    /**
     * Apply debuff effect
     */
    applyDebuffEffect(effect) {
        const scene = this.scene;
        if (!scene) return;

        switch (effect.id) {
            case 'speed_down':
                const originalSpeed = scene.speed;
                scene.speed = originalSpeed * 0.7;
                this.showEffectText(scene.player, effect.name, '#ff4444');
                // Show visual indicator
                scene.player.setTint(0xff6666);
                // Restore after duration
                scene.time.delayedCall(effect.duration, () => {
                    scene.speed = originalSpeed;
                    scene.player.clearTint();
                });
                break;
            case 'vision_reduced':
                this.showEffectText(scene.player, effect.name, '#ff4444');
                // Vision reduction would need camera/follow logic
                // For now just show the effect
                break;
        }
    }

    /**
     * Apply permanent effect
     */
    applyPermanentEffect(effect) {
        const scene = this.scene;
        if (!scene) return;

        switch (effect.id) {
            case 'luck_up':
                this.luckSystem.addLuck(1);
                this.showEffectText(scene.player, `幸运值+1 (当前:${this.luckSystem.getLuck()})`, '#ffff00');
                break;
            case 'luck_down':
                this.luckSystem.addLuck(-1);
                this.showEffectText(scene.player, `幸运值-1 (当前:${this.luckSystem.getLuck()})`, '#ff4444');
                break;
        }
    }

    /**
     * Show effect text floating above player
     */
    showEffectText(target, text, color = '#ffffff') {
        const scene = this.scene;
        if (!scene || !target) return;

        const effectText = scene.add.text(target.x, target.y - 40, text, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: color,
            stroke: '#000000',
            strokeThickness: 3
        });
        effectText.setOrigin(0.5);
        effectText.setDepth(100);

        scene.tweens.add({
            targets: effectText,
            alpha: 0,
            y: target.y - 80,
            scale: 1.2,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => effectText.destroy()
        });
    }

    /**
     * Check if double coins is active
     * @returns {boolean}
     */
    isDoubleCoinsActive() {
        return this.doubleCoinsActive;
    }

    /**
     * Check if cooldown acceleration is active
     * @returns {boolean}
     */
    isCooldownAccelActive() {
        return this.cooldownAccelActive;
    }

    /**
     * Get cooldown multiplier based on accel buff
     * @returns {number} Multiplier (e.g., 0.5 means 50% faster cooldowns)
     */
    getCooldownMultiplier() {
        return this.cooldownAccelActive ? 0.5 : 1;
    }

    /**
     * Update UI after effect
     */
    updateUI() {
        const scene = this.scene;
        if (!scene) return;

        const uiScene = scene.scene.get('UIScene');
        if (uiScene && uiScene.updateUI) {
            const expForNextLevel = scene.growthSystem.getExpForLevel(scene.level + 1);
            uiScene.updateUI(scene.score, scene.exp, scene.level, scene.hp, scene.maxHp, expForNextLevel);
        }
    }

    /**
     * Reset for new game
     */
    reset() {
        this.luckSystem.reset();
        this.activeEffects = {};
        this.doubleCoinsActive = false;
        this.cooldownAccelActive = false;
    }
}

export default DriftBottleSystem;
