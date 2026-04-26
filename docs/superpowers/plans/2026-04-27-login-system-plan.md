# 登录系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 Firebase 认证 + Firestore 数据存储的登录系统，支持用户名密码登录、游客模式、数据同步

**Architecture:** 
- AuthSystem 处理 Firebase Auth（注册/登录/登出）
- UserDataSystem 处理 Firestore 数据读写
- MenuScene 添加登录界面
- GameOverScene 游戏结束时同步数据

**Tech Stack:** Firebase Auth, Firestore, Phaser.js 3.x

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/config/firebase.json` | 创建 | Firebase 配置 |
| `src/systems/AuthSystem.js` | 创建 | Firebase Auth 封装 |
| `src/systems/UserDataSystem.js` | 创建 | Firestore 数据读写 |
| `src/scenes/MenuScene.js` | 修改 | 添加登录界面 |
| `src/scenes/GameOverScene.js` | 修改 | 游戏结束时同步数据 |

---

## Task 1: 创建 Firebase 配置文件

**Files:**
- 创建: `src/config/firebase.json`

- [ ] **Step 1: 创建 firebase.json 配置**

```json
{
  "apiKey": "YOUR_API_KEY",
  "authDomain": "YOUR_PROJECT.firebaseapp.com",
  "projectId": "YOUR_PROJECT_ID",
  "storageBucket": "YOUR_PROJECT.appspot.com",
  "messagingSenderId": "YOUR_SENDER_ID",
  "appId": "YOUR_APP_ID"
}
```

- [ ] **Step 2: 提交**

```bash
git add src/config/firebase.json
git commit -m "feat: add Firebase configuration template"
```

---

## Task 2: 创建 AuthSystem

**Files:**
- 创建: `src/systems/AuthSystem.js`
- 测试: `src/systems/__tests__/AuthSystem.test.js`

- [ ] **Step 1: 编写 AuthSystem 测试**

```javascript
import AuthSystem from '../AuthSystem.js';

// Mock Firebase
const mockAuth = {
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn()
};

jest.mock('firebase/auth', () => ({
    getAuth: () => mockAuth,
    createUserWithEmailAndPassword: (...args) => mockAuth.createUserWithEmailAndPassword(...args),
    signInWithEmailAndPassword: (...args) => mockAuth.signInWithEmailAndPassword(...args),
    signOut: () => mockAuth.signOut(),
    onAuthStateChanged: (...args) => mockAuth.onAuthStateChanged(...args)
}));

describe('AuthSystem', () => {
    let authSystem;

    beforeEach(() => {
        jest.clearAllMocks();
        authSystem = new AuthSystem();
    });

    describe('register', () => {
        it('should register new user with username and password', async () => {
            mockAuth.createUserWithEmailAndPassword.mockResolvedValue({
                user: { uid: 'test-uid' }
            });

            const result = await authSystem.register('testuser', 'password123');

            expect(result.user.uid).toBe('test-uid');
            expect(mockAuth.createUserWithEmailAndPassword)
                .toHaveBeenCalledWith(mockAuth, 'testuser@example.com', 'password123');
        });
    });

    describe('login', () => {
        it('should login existing user', async () => {
            mockAuth.signInWithEmailAndPassword.mockResolvedValue({
                user: { uid: 'test-uid' }
            });

            const result = await authSystem.login('testuser', 'password123');

            expect(result.user.uid).toBe('test-uid');
        });
    });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- --testPathPattern="AuthSystem" 2>&1 | tail -20`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: 编写 AuthSystem 实现**

```javascript
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
        this.currentUser = null;
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
        this.currentUser = credential.user;
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
        this.currentUser = credential.user;
        return credential;
    }

    /**
     * 登出
     */
    async logout() {
        await signOut(auth);
        this.currentUser = null;
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
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- --testPathPattern="AuthSystem" 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/systems/AuthSystem.js src/systems/__tests__/AuthSystem.test.js
git commit -m "feat: add AuthSystem for Firebase authentication"
```

---

## Task 3: 创建 UserDataSystem

**Files:**
- 创建: `src/systems/UserDataSystem.js`
- 测试: `src/systems/__tests__/UserDataSystem.test.js`

- [ ] **Step 1: 编写 UserDataSystem 测试**

```javascript
import UserDataSystem from '../UserDataSystem.js';

const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
    getFirestore: () => ({}),
    doc: (...args) => mockDoc(...args),
    setDoc: (...args) => mockSetDoc(...args),
    getDoc: (...args) => mockGetDoc(...args)
}));

describe('UserDataSystem', () => {
    let userDataSystem;

    beforeEach(() => {
        jest.clearAllMocks();
        userDataSystem = new UserDataSystem();
    });

    describe('saveUserData', () => {
        it('should save user data to Firestore', async () => {
            mockSetDoc.mockResolvedValue(true);

            const userData = { level: 5, exp: 1000 };
            await userDataSystem.saveUserData('uid123', userData);

            expect(mockSetDoc).toHaveBeenCalled();
        });
    });

    describe('loadUserData', () => {
        it('should load user data from Firestore', async () => {
            mockGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => ({ level: 5, exp: 1000 })
            });

            const data = await userDataSystem.loadUserData('uid123');
            expect(data).toEqual({ level: 5, exp: 1000 });
        });

        it('should return null if user data does not exist', async () => {
            mockGetDoc.mockResolvedValue({ exists: () => false });

            const data = await userDataSystem.loadUserData('uid123');
            expect(data).toBeNull();
        });
    });
});
```

- [ ] **Step 2: 运行测试验证失败**

Run: `npm test -- --testPathPattern="UserDataSystem" 2>&1 | tail -20`
Expected: FAIL

- [ ] **Step 3: 编写 UserDataSystem 实现**

```javascript
/**
 * UserDataSystem - Firestore 用户数据读写
 * 处理用户数据保存、加载、同步
 */
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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
```

- [ ] **Step 4: 运行测试验证通过**

Run: `npm test -- --testPathPattern="UserDataSystem" 2>&1 | tail -20`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/systems/UserDataSystem.js src/systems/__tests__/UserDataSystem.test.js
git commit -m "feat: add UserDataSystem for Firestore data sync"
```

---

## Task 4: 修改 MenuScene 添加登录界面

**Files:**
- 修改: `src/scenes/MenuScene.js`

- [ ] **Step 1: 添加 AuthSystem 和 UserDataSystem 导入**

在文件顶部添加：
```javascript
import AuthSystem from '../systems/AuthSystem.js';
import UserDataSystem from '../systems/UserDataSystem.js';
```

- [ ] **Step 2: 在 create() 中初始化系统**

```javascript
// Auth and UserData systems
this.authSystem = new AuthSystem();
this.userDataSystem = new UserDataSystem();

// Listen for auth state changes
this.authSystem.onAuthStateChanged((user) => {
    this._onAuthStateChanged(user);
});
```

- [ ] **Step 3: 添加登录表单 UI**

在 `createMenu()` 方法中添加登录表单：
```javascript
// Login form container
this.loginContainer = this.add.container(512, 384);

// Username input
this.usernameInput = this.add.text(0, -50, '', {
    fontSize: '24px',
    fontFamily: 'Arial',
    color: '#ffffff',
    backgroundColor: '#333333',
    padding: { x: 10, y: 5 }
}).setOrigin(0.5);

// Password input  
this.passwordInput = this.add.text(0, 0, '', {
    fontSize: '24px',
    fontFamily: 'Arial',
    color: '#ffffff',
    backgroundColor: '#333333',
    padding: { x: 10, y: 5 }
}).setOrigin(0.5);

// Login/Signup buttons
this.loginBtn = this.add.text(-80, 60, '登录', {
    fontSize: '20px',
    fontFamily: 'Arial',
    color: '#00ff88',
    backgroundColor: '#222222',
    padding: { x: 15, y: 8 }
}).setOrigin(0.5).setInteractive();

this.signupBtn = this.add.text(80, 60, '注册', {
    fontSize: '20px',
    fontFamily: 'Arial',
    color: '#ffffff',
    backgroundColor: '#222222', 
    padding: { x: 15, y: 8 }
}).setOrigin(0.5).setInteractive();

this.guestBtn = this.add.text(0, 110, '游客模式', {
    fontSize: '16px',
    fontFamily: 'Arial',
    color: '#888888'
}).setOrigin(0.5).setInteractive();

this.loginContainer.add([this.usernameInput, this.passwordInput, this.loginBtn, this.signupBtn, this.guestBtn]);

// Button handlers
this.loginBtn.on('pointerdown', () => this._handleLogin());
this.signupBtn.on('pointerdown', () => this._handleSignup());
this.guestBtn.on('pointerdown', () => this._handleGuestMode());
```

- [ ] **Step 4: 添加处理方法**

```javascript
async _handleLogin() {
    const username = this._getUsernameInput();
    const password = this._getPasswordInput();
    
    if (!username || !password) {
        this._showError('请输入用户名和密码');
        return;
    }

    try {
        await this.authSystem.login(username, password);
    } catch (error) {
        this._showError('登录失败：' + error.message);
    }
}

async _handleSignup() {
    const username = this._getUsernameInput();
    const password = this._getPasswordInput();
    
    if (!username || !password) {
        this._showError('请输入用户名和密码');
        return;
    }

    try {
        await this.authSystem.register(username, password);
    } catch (error) {
        this._showError('注册失败：' + error.message);
    }
}

_handleGuestMode() {
    // Continue without login
    this.scene.start('GameScene');
}

async _onAuthStateChanged(user) {
    if (user) {
        // Load user data from Firestore
        const userData = await this.userDataSystem.loadUserData(user.uid);
        if (userData) {
            this.userDataSystem.syncToLocal(userData);
        }
        this.scene.start('GameScene');
    }
}

_showError(message) {
    if (this.errorText) this.errorText.destroy();
    this.errorText = this.add.text(512, 150, message, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#ff4444'
    }).setOrigin(0.5);
}
```

- [ ] **Step 5: 运行测试**

Run: `npm test 2>&1 | tail -10`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add src/scenes/MenuScene.js
git commit -m "feat: add login UI to MenuScene"
```

---

## Task 5: 修改 GameOverScene 添加数据同步

**Files:**
- 修改: `src/scenes/GameOverScene.js`

- [ ] **Step 1: 添加 AuthSystem 和 UserDataSystem 导入**

```javascript
import AuthSystem from '../systems/AuthSystem.js';
import UserDataSystem from '../systems/UserDataSystem.js';
```

- [ ] **Step 2: 在 create() 中初始化系统并同步数据**

```javascript
// Initialize systems
this.authSystem = new AuthSystem();
this.userDataSystem = new UserDataSystem();

// Sync game data to Firestore if logged in
const user = this.authSystem.getCurrentUser();
if (user) {
    this._syncGameDataToFirestore(user.uid);
}
```

- [ ] **Step 3: 添加 _syncGameDataToFirestore 方法**

```javascript
async _syncGameDataToFirestore(uid) {
    // Load existing localStorage data
    const localData = {
        currency: parseInt(localStorage.getItem('fishEat_currency') || '0'),
        highScore: parseInt(localStorage.getItem('fishEat_highScore') || '0'),
        maxLevel: parseInt(localStorage.getItem('fishEat_maxLevel') || '1'),
        unlockedDifficulties: JSON.parse(localStorage.getItem('fishEat_unlockedDifficulties') || '[]'),
        upgrades: JSON.parse(localStorage.getItem('fishEat_upgrades') || '{}')
    };

    // Save to Firestore
    await this.userDataSystem.saveUserData(uid, localData);
}
```

- [ ] **Step 4: 运行测试**

Run: `npm test 2>&1 | tail -10`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/scenes/GameOverScene.js
git commit -m "feat: sync game data to Firestore on game over"
```

---

## Task 6: 验证完整功能

- [ ] **Step 1: 启动游戏测试**

```bash
python3 -m http.server 8080
# 打开 http://localhost:8080
```

- [ ] **Step 2: 验证功能**

1. 菜单显示登录/注册表单
2. 可以注册新账号
3. 可以登录已注册账号
4. 可以点击游客模式跳过登录
5. 游戏结束数据自动同步到 Firestore
6. 重新登录后数据正确恢复

---

## 依赖项

需要在 `index.html` 中添加 Firebase SDK：

```html
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
```

并初始化：
```javascript
firebase.initializeApp({
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
});
```
