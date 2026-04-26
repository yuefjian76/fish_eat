/**
 * UserDataSystem - localStorage 用户数据读写
 * 处理用户数据保存、加载、同步
 */
export class UserDataSystem {
    constructor() {
        this.STORAGE_KEY = 'fishEat_userData';
    }

    /**
     * 保存用户数据到 localStorage
     * @param {string} uid - 用户 ID
     * @param {object} data - 用户数据
     */
    saveUserData(uid, data) {
        const allData = this.loadAllUserData();
        allData[uid] = {
            ...data,
            updatedAt: Date.now()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
    }

    /**
     * 从 localStorage 加载用户数据
     * @param {string} uid - 用户 ID
     * @returns {object|null} 用户数据或 null
     */
    loadUserData(uid) {
        const allData = this.loadAllUserData();
        return allData[uid] || null;
    }

    /**
     * 加载所有用户数据
     * @returns {object}
     */
    loadAllUserData() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.warn('Failed to parse local user data:', e);
            return {};
        }
    }

    /**
     * 删除用户数据
     * @param {string} uid - 用户 ID
     */
    deleteUserData(uid) {
        const allData = this.loadAllUserData();
        delete allData[uid];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allData));
    }

    /**
     * 同步数据到 localStorage
     * @param {object} data - 用户数据
     */
    syncToLocal(data) {
        if (!data) return;
        // Sync currency
        if (data.currency !== undefined) {
            localStorage.setItem('fishEat_currency', String(data.currency));
        }
        // Sync upgrades/skills
        if (data.upgrades !== undefined) {
            localStorage.setItem('fishEat_upgrades', JSON.stringify(data.upgrades));
        }
        // Sync unlocked difficulties
        if (data.unlockedDifficulties !== undefined) {
            localStorage.setItem('fishEat_unlockedDifficulties', JSON.stringify(data.unlockedDifficulties));
        }
        // Sync max level
        if (data.maxLevel !== undefined) {
            localStorage.setItem('fishEat_maxLevel', String(data.maxLevel));
        }
        // Sync selected fish
        if (data.selectedFish !== undefined) {
            localStorage.setItem('fishEat_selectedFish', data.selectedFish);
        }
        // Also save full data for reference
        localStorage.setItem('fishEat_userData', JSON.stringify(data));
    }

    /**
     * 从 localStorage 加载数据
     * @returns {object|null}
     */
    loadFromLocal() {
        try {
            const stored = localStorage.getItem('fishEat_userData');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.warn('Failed to parse local user data:', e);
            return null;
        }
    }

    /**
     * 合并本地和远程数据（远程优先）
     * @param {object} local - 本地数据
     * @param {object} remote - 远程数据
     * @returns {object} 合并后的数据
     */
    mergeLocalAndRemote(local, remote) {
        if (!local) return remote;
        if (!remote) return local;
        return { ...local, ...remote };
    }
}

export default UserDataSystem;