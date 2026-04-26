/**
 * LocalAuthSystem - Local storage based authentication
 * No Firebase needed - uses localStorage to store user accounts
 */
export class LocalAuthSystem {
    constructor() {
        this._users = this._loadUsers();
        this._currentUser = null;
    }

    _loadUsers() {
        try {
            const stored = localStorage.getItem('fishEat_users');
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }

    _saveUsers() {
        localStorage.setItem('fishEat_users', JSON.stringify(this._users));
    }

    _hashPassword(password) {
        // Simple hash for demo - in production use proper hashing
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'pwd_' + Math.abs(hash).toString(16);
    }

    /**
     * 注册新用户
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {object} user object
     */
    async register(username, password) {
        if (!username || !password) {
            throw new Error('请输入用户名和密码');
        }

        if (username.length < 3) {
            throw new Error('用户名至少3个字符');
        }

        if (password.length < 4) {
            throw new Error('密码至少4个字符');
        }

        if (this._users[username]) {
            throw new Error('用户名已存在');
        }

        this._users[username] = {
            passwordHash: this._hashPassword(password),
            createdAt: Date.now()
        };
        this._saveUsers();

        this._currentUser = { uid: username, email: `${username}@local` };
        return { user: this._currentUser };
    }

    /**
     * 登录
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {object} user object
     */
    async login(username, password) {
        if (!username || !password) {
            throw new Error('请输入用户名和密码');
        }

        const user = this._users[username];
        if (!user) {
            throw new Error('用户名不存在');
        }

        if (user.passwordHash !== this._hashPassword(password)) {
            throw new Error('密码错误');
        }

        this._currentUser = { uid: username, email: `${username}@local` };
        return { user: this._currentUser };
    }

    /**
     * 登出
     */
    async logout() {
        this._currentUser = null;
    }

    /**
     * 获取当前用户
     * @returns {object|null} user or null
     */
    getCurrentUser() {
        return this._currentUser;
    }

    /**
     * 监听登录状态变化
     * @param {function} callback - 状态变化回调
     */
    onAuthStateChanged(callback) {
        // For local auth, just call callback with current state
        if (this._currentUser) {
            callback(this._currentUser);
        }
    }
}

export default LocalAuthSystem;