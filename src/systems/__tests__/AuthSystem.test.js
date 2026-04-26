import { jest } from '@jest/globals';
import AuthSystem from '../AuthSystem.js';

describe('AuthSystem', () => {
    let authSystem;
    let localStorageMock;

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock localStorage
        localStorageMock = {
            data: {},
            getItem(key) { return this.data[key] || null; },
            setItem(key, value) { this.data[key] = value; },
            removeItem(key) { delete this.data[key]; }
        };
        global.localStorage = localStorageMock;
        authSystem = new AuthSystem();
    });

    afterEach(() => {
        delete global.localStorage;
    });

    describe('register', () => {
        it('should register new user with username and password', async () => {
            const result = await authSystem.register('testuser', 'password123');

            expect(result.user.uid).toBe('testuser');
            expect(result.user.email).toBe('testuser@local');
        });

        it('should throw error if username already exists', async () => {
            await authSystem.register('testuser', 'password123');

            await expect(authSystem.register('testuser', 'newpassword'))
                .rejects.toThrow('用户名已存在');
        });

        it('should throw error if username too short', async () => {
            await expect(authSystem.register('ab', 'password123'))
                .rejects.toThrow('用户名至少3个字符');
        });

        it('should throw error if password too short', async () => {
            await expect(authSystem.register('testuser', '123'))
                .rejects.toThrow('密码至少4个字符');
        });
    });

    describe('login', () => {
        it('should login existing user', async () => {
            await authSystem.register('testuser', 'password123');

            // Create new instance to simulate page reload
            authSystem = new AuthSystem();
            const result = await authSystem.login('testuser', 'password123');

            expect(result.user.uid).toBe('testuser');
        });

        it('should throw error for non-existent user', async () => {
            await expect(authSystem.login('nonexistent', 'password123'))
                .rejects.toThrow('用户名不存在');
        });

        it('should throw error for wrong password', async () => {
            await authSystem.register('testuser', 'password123');

            authSystem = new AuthSystem();
            await expect(authSystem.login('testuser', 'wrongpassword'))
                .rejects.toThrow('密码错误');
        });
    });

    describe('getCurrentUser', () => {
        it('should return null when not logged in', () => {
            expect(authSystem.getCurrentUser()).toBeNull();
        });

        it('should return user when logged in', async () => {
            await authSystem.register('testuser', 'password123');
            expect(authSystem.getCurrentUser()).not.toBeNull();
            expect(authSystem.getCurrentUser().uid).toBe('testuser');
        });
    });

    describe('logout', () => {
        it('should logout user', async () => {
            await authSystem.register('testuser', 'password123');
            await authSystem.logout();
            expect(authSystem.getCurrentUser()).toBeNull();
        });
    });
});
