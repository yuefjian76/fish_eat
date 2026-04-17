/**
 * AchievementSystem - Tracks and unlocks game achievements
 * Persists unlocked achievements to localStorage.
 */
import achievementsData from '../config/achievements.json';

const STORAGE_KEY = 'achievements_unlocked';

export class AchievementSystem {
    constructor(scene) {
        this.scene = scene;
        this.achievements = achievementsData;
        this._unlocked = [];
        this._listeners = [];
        this._notificationQueue = [];
        this._isShowingNotification = false;
        this._loadProgress();
    }

    // ─────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────

    /** Get list of all unlocked achievement IDs */
    getUnlockedAchievements() {
        return [...this._unlocked];
    }

    /** Check if a specific achievement is unlocked */
    isUnlocked(achievementId) {
        return this._unlocked.includes(achievementId);
    }

    /** Register callback for when any achievement is unlocked */
    onAchievementUnlocked(callback) {
        this._listeners.push(callback);
    }

    /** Check fish eaten count against achievements */
    checkFishEaten(count) {
        Object.entries(this.achievements).forEach(([id, ach]) => {
            if (ach.condition.type === 'fish_eaten' && count >= ach.condition.count) {
                this._tryUnlock(id);
            }
        });
    }

    /** Check player level against achievements */
    checkLevelUp(level) {
        Object.entries(this.achievements).forEach(([id, ach]) => {
            if (ach.condition.type === 'level' && level >= ach.condition.level) {
                this._tryUnlock(id);
            }
        });
    }

    /** Check score against achievements */
    checkScore(score) {
        Object.entries(this.achievements).forEach(([id, ach]) => {
            if (ach.condition.type === 'score' && score >= ach.condition.score) {
                this._tryUnlock(id);
            }
        });
    }

    /** Check max combo against achievements */
    checkCombo(combo) {
        Object.entries(this.achievements).forEach(([id, ach]) => {
            if (ach.condition.type === 'max_combo' && combo >= ach.condition.combo) {
                this._tryUnlock(id);
            }
        });
    }

    /** Check survival time against achievements */
    checkSurvivalTime(seconds) {
        Object.entries(this.achievements).forEach(([id, ach]) => {
            if (ach.condition.type === 'survival_time' && seconds >= ach.condition.seconds) {
                this._tryUnlock(id);
            }
        });
    }

    /** Check treasure opened count against achievements */
    checkTreasureOpened(count) {
        Object.entries(this.achievements).forEach(([id, ach]) => {
            if (ach.condition.type === 'treasure_opened' && count >= ach.condition.count) {
                this._tryUnlock(id);
            }
        });
    }

    /** Check drift bottles collected against achievements */
    checkDriftBottles(count) {
        Object.entries(this.achievements).forEach(([id, ach]) => {
            if (ach.condition.type === 'drift_bottles' && count >= ach.condition.count) {
                this._tryUnlock(id);
            }
        });
    }

    /** Show achievement notification if not already showing one */
    showNotification(achievementId) {
        const ach = this.achievements[achievementId];
        if (!ach) return;

        this._notificationQueue.push(ach);
        if (!this._isShowingNotification) {
            this._processNotificationQueue();
        }
    }

    /** Clear all saved progress */
    resetProgress() {
        this._unlocked = [];
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) { /* ignore */ }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Private
    // ─────────────────────────────────────────────────────────────────────

    _tryUnlock(achievementId) {
        if (this._unlocked.includes(achievementId)) return;
        this._unlocked.push(achievementId);
        this._saveProgress();
        this._listeners.forEach(cb => cb(achievementId));
        this.showNotification(achievementId);
    }

    _loadProgress() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            data.forEach(id => {
                if (!this._unlocked.includes(id)) this._unlocked.push(id);
            });
        } catch (e) { /* ignore */ }
    }

    _saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this._unlocked));
        } catch (e) { /* ignore */ }
    }

    _processNotificationQueue() {
        if (this._notificationQueue.length === 0) {
            this._isShowingNotification = false;
            return;
        }

        this._isShowingNotification = true;
        const ach = this._notificationQueue.shift();

        // Show notification in UI scene
        if (this.scene && this.scene.scene.get('UIScene')) {
            this.scene.scene.get('UIScene').showAchievementNotification(ach.name, ach.description);
        }

        // Process next after delay
        this.scene.time.delayedCall(2500, () => this._processNotificationQueue());
    }
}
