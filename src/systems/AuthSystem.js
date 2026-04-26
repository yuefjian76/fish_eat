/**
 * AuthSystem - Firebase Auth 封装
 * 处理用户注册、登录、登出
 */
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import firebaseConfig from '../config/firebase.json';

let app = null;
let auth = null;

export class AuthSystem {
    constructor() {
        this._initFirebase();
    }

    _initFirebase() {
        if (!app) {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
        }
    }

    /**
     * 注册新用户
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {object} user credential
     */
    async register(username, password) {
        const email = `${username}@fisheatuser.com`;
        const credential = await createUserWithEmailAndPassword(auth, email, password);
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
        const credential = await signInWithEmailAndPassword(auth, email, password);
        return credential;
    }

    /**
     * 登出
     */
    async logout() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    /**
     * 获取当前用户
     * @returns {object|null} user or null
     */
    getCurrentUser() {
        return auth?.currentUser || null;
    }

    /**
     * 监听登录状态变化
     * @param {function} callback - 状态变化回调
     */
    onAuthStateChanged(callback) {
        onAuthStateChanged(auth, callback);
    }
}

export default AuthSystem;
