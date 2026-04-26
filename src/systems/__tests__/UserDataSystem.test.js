import { jest } from '@jest/globals';
import UserDataSystem from '../UserDataSystem.js';
import { mockSetDoc, mockGetDoc, setDoc, getDoc } from 'firebase/firestore';

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
