/**
 * UserDataSystem - Firestore 用户数据读写
 * 处理用户数据保存、加载、同步
 */
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

let db = null;

export class UserDataSystem {
    constructor() {
        if (!db) {
            db = getFirestore();
        }
    }

    /**
     * 保存用户数据到 Firestore
     * @param {string} uid - 用户 ID
     * @param {object} data - 用户数据
     */
    async saveUserData(uid, data) {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            ...data,
            updatedAt: Date.now()
        }, { merge: true });
    }

    /**
     * 从 Firestore 加载用户数据
     * @param {string} uid - 用户 ID
     * @returns {object|null} 用户数据或 null
     */
    async loadUserData(uid) {
        const userRef = doc(db, 'users', uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
            return snapshot.data();
        }
        return null;
    }

    /**
     * 将数据同步到 localStorage
     * @param {object} data - 用户数据
     */
    syncToLocal(data) {
        localStorage.setItem('fishEat_userData', JSON.stringify(data));
    }

    /**
     * 从 localStorage 加载数据
     * @returns {object|null}
     */
    loadFromLocal() {
        const stored = localStorage.getItem('fishEat_userData');
        return stored ? JSON.parse(stored) : null;
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
        // 远程数据优先
        return { ...local, ...remote };
    }
}

export default UserDataSystem;
