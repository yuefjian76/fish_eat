/**
 * AuthSystem - Firebase Auth 封装
 * 处理用户注册、登录、登出
 */
export class AuthSystem {
    constructor() {
        this.auth = firebase.auth();
    }

    /**
     * 注册新用户
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {object} user credential
     */
    async register(username, password) {
        const email = `${username}@fisheatuser.com`;
        const credential = await this.auth.createUserWithEmailAndPassword(email, password);
        return credential;
    }

    /**
     * 登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {object} user credential
     */
    async login(username, password) {
        const email = `${username}@fisheatuser.com`;
        const credential = await this.auth.signInWithEmailAndPassword(email, password);
        return credential;
    }

    /**
     * 登出
     */
    async logout() {
        try {
            await this.auth.signOut();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    /**
     * 获取当前用户
     * @returns {object|null} user or null
     */
    getCurrentUser() {
        return this.auth.currentUser;
    }

    /**
     * 监听登录状态变化
     * @param {function} callback - 状态变化回调
     */
    onAuthStateChanged(callback) {
        this.auth.onAuthStateChanged(callback);
    }
}

export default AuthSystem;