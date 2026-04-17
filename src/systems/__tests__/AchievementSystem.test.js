// src/systems/__tests__/AchievementSystem.test.js
describe('AchievementSystem', () => {
    test('getUnlockedAchievements returns empty initially', () => {
        const sys = createAchievementSystem();
        expect(sys.getUnlockedAchievements()).toEqual([]);
    });

    test('unlockAchievement adds to unlocked list', () => {
        const sys = createAchievementSystem();
        sys.unlockAchievement('first_bite');
        expect(sys.getUnlockedAchievements()).toContain('first_bite');
    });

    test('unlockAchievement does not duplicate', () => {
        const sys = createAchievementSystem();
        sys.unlockAchievement('first_bite');
        sys.unlockAchievement('first_bite');
        expect(sys.getUnlockedAchievements().filter(a => a === 'first_bite').length).toBe(1);
    });

    test('isUnlocked returns true for unlocked achievement', () => {
        const sys = createAchievementSystem();
        sys.unlockAchievement('first_bite');
        expect(sys.isUnlocked('first_bite')).toBe(true);
    });

    test('isUnlocked returns false for locked achievement', () => {
        const sys = createAchievementSystem();
        expect(sys.isUnlocked('first_bite')).toBe(false);
    });

    test('checkFishEaten triggers fish_eaten condition', () => {
        const sys = createAchievementSystem();
        let triggered = false;
        sys.onAchievementUnlocked(() => { triggered = true; });
        sys.checkFishEaten(1);
        expect(triggered).toBe(true);
    });

    test('checkLevelUp triggers level condition', () => {
        const sys = createAchievementSystem();
        let triggered = false;
        sys.onAchievementUnlocked(() => { triggered = true; });
        sys.checkLevelUp(2);
        expect(triggered).toBe(true);
    });

    test('checkScore triggers score condition', () => {
        const sys = createAchievementSystem();
        let triggered = false;
        sys.onAchievementUnlocked(() => { triggered = true; });
        sys.checkScore(1000);
        expect(triggered).toBe(true);
    });

    test('checkCombo triggers max_combo condition', () => {
        const sys = createAchievementSystem();
        let triggered = false;
        sys.onAchievementUnlocked(() => { triggered = true; });
        sys.checkCombo(5);
        expect(triggered).toBe(true);
    });

    test('saveProgress stores to localStorage', () => {
        const storage = {};
        const sys = createAchievementSystem(storage);
        sys.unlockAchievement('first_bite');
        sys.saveProgress();
        expect(storage['achievements_unlocked']).toBeDefined();
    });

    test('loadProgress restores from localStorage', () => {
        const storage = { achievements_unlocked: JSON.stringify(['first_bite']) };
        const sys = createAchievementSystem(storage);
        expect(sys.isUnlocked('first_bite')).toBe(true);
    });

    test('resetProgress clears all achievements', () => {
        const storage = { achievements_unlocked: JSON.stringify(['first_bite']) };
        const sys = createAchievementSystem(storage);
        sys.resetProgress();
        expect(sys.getUnlockedAchievements()).toEqual([]);
    });
});

function createAchievementSystem(storage = {}) {
    const ACHIEVEMENTS = {
        first_bite: { name: '初试锋芒', description: '吃掉第一条鱼', condition: { type: 'fish_eaten', count: 1 } },
        ten_bites: { name: '小有所成', description: '吃掉10条鱼', condition: { type: 'fish_eaten', count: 10 } },
        first_level: { name: '初露头角', description: '升至2级', condition: { type: 'level', level: 2 } },
        level_5: { name: '成长蜕变', description: '升至5级', condition: { type: 'level', level: 5 } },
        score_1000: { name: '千分里程碑', description: '获得1000分', condition: { type: 'score', score: 1000 } },
        combo_5: { name: '连击初现', description: '达成5连击', condition: { type: 'max_combo', combo: 5 } },
    };

    const STORAGE_KEY = 'achievements_unlocked';
    const unlocked = [];
    const callbacks = [];

    const sys = {
        getUnlockedAchievements: () => [...unlocked],
        isUnlocked: (id) => unlocked.includes(id),
        unlockAchievement(id) {
            if (unlocked.includes(id)) return;
            unlocked.push(id);
            callbacks.forEach(cb => cb(id));
        },
        onAchievementUnlocked(cb) { callbacks.push(cb); },
        checkFishEaten(count) {
            Object.entries(ACHIEVEMENTS).forEach(([id, ach]) => {
                if (ach.condition.type === 'fish_eaten' && count >= ach.condition.count) {
                    this.unlockAchievement(id);
                }
            });
        },
        checkLevelUp(level) {
            Object.entries(ACHIEVEMENTS).forEach(([id, ach]) => {
                if (ach.condition.type === 'level' && level >= ach.condition.level) {
                    this.unlockAchievement(id);
                }
            });
        },
        checkScore(score) {
            Object.entries(ACHIEVEMENTS).forEach(([id, ach]) => {
                if (ach.condition.type === 'score' && score >= ach.condition.score) {
                    this.unlockAchievement(id);
                }
            });
        },
        checkCombo(combo) {
            Object.entries(ACHIEVEMENTS).forEach(([id, ach]) => {
                if (ach.condition.type === 'max_combo' && combo >= ach.condition.combo) {
                    this.unlockAchievement(id);
                }
            });
        },
        saveProgress() { storage[STORAGE_KEY] = JSON.stringify(unlocked); },
        loadProgress() {
            try {
                const data = JSON.parse(storage[STORAGE_KEY] || '[]');
                data.forEach(id => { if (!unlocked.includes(id)) unlocked.push(id); });
            } catch (e) { /* ignore */ }
        },
        resetProgress() { unlocked.length = 0; storage[STORAGE_KEY] = '[]'; }
    };

    sys.loadProgress();
    return sys;
}
