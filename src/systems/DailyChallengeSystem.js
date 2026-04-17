// src/systems/DailyChallengeSystem.js
export class DailyChallengeSystem {
    constructor() {
        this.seed = this._getTodaySeed();
        this.challenge = this._generateChallenge(this.seed);
    }

    _getTodaySeed() {
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        // Simple hash of date string
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    _seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    _generateChallenge(seed) {
        const challenges = [
            { id: 'speed_freak', name: '极速挑战', desc: '移动速度 x1.5', emoji: '⚡' },
            { id: 'giant_mode', name: '巨人模式', desc: '所有鱼体型 x1.5', emoji: '🦈' },
            { id: 'tiny_mode', name: '微小模式', desc: '所有鱼体型 x0.7', emoji: '🐟' },
            { id: 'no_skills', name: '无技能模式', desc: '技能冷却 x3', emoji: '🚫' },
            { id: 'highlander', name: '孤狼模式', desc: '只能有1只敌方鱼', emoji: '🐺' },
            { id: 'rich', name: '财富至上', desc: '金币获取 x3', emoji: '💰' },
            { id: 'ninja', name: '忍者挑战', desc: '敌人移动速度 x1.8', emoji: '🥷' },
            { id: 'turtle', name: '乌龟模式', desc: '玩家速度 x0.6', emoji: '🐢' }
        ];

        const idx = Math.floor(this._seededRandom(seed) * challenges.length);
        const baseChallenge = challenges[idx];

        // Mix in modifiers
        const modifiers = [
            { id: 'double_exp', desc: '经验值 x2', emoji: '📈' },
            { id: 'half_hp', desc: '玩家HP x0.5', emoji: '❤️' },
            { id: 'double_hp', desc: '玩家HP x2', emoji: '💖' }
        ];
        const modIdx = Math.floor(this._seededRandom(seed + 1) * modifiers.length);
        const modifier = modifiers[modIdx];

        return {
            ...baseChallenge,
            modifier: modifier,
            seed: seed,
            date: new Date().toISOString().split('T')[0]
        };
    }

    getChallenge() {
        return this.challenge;
    }

    getModifier() {
        return this.challenge.modifier;
    }

    // Apply challenge effects to game config
    applyToSpawnConfig(config) {
        const c = { ...config };
        switch (this.challenge.id) {
            case 'speed_freak':
                c.playerSpeedMultiplier = 1.5;
                break;
            case 'giant_mode':
                c.enemySizeMultiplier = 1.5;
                break;
            case 'tiny_mode':
                c.enemySizeMultiplier = 0.7;
                break;
            case 'ninja':
                c.enemySpeedMultiplier = 1.8;
                break;
            case 'turtle':
                c.playerSpeedMultiplier = 0.6;
                break;
            case 'highlander':
                c.maxEnemies = 1;
                break;
        }
        switch (this.challenge.modifier.id) {
            case 'double_exp':
                c.expMultiplier = 2;
                break;
            case 'half_hp':
                c.playerHpMultiplier = 0.5;
                break;
            case 'double_hp':
                c.playerHpMultiplier = 2;
                break;
        }
        return c;
    }

    isSkillDisabled() {
        return this.challenge.id === 'no_skills';
    }

    getSkillCooldownMultiplier() {
        return this.challenge.id === 'no_skills' ? 3 : 1;
    }

    getCurrencyMultiplier() {
        return this.challenge.id === 'rich' ? 3 : 1;
    }
}
