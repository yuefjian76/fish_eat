import { jest } from '@jest/globals';
import AuthSystem from '../AuthSystem.js';
import { mockAuth, createUserWithEmailAndPassword } from 'firebase/auth';

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
                .toHaveBeenCalledWith(mockAuth, 'testuser@fisheatuser.com', 'password123');
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
