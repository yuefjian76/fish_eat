import { jest } from '@jest/globals';
import UserDataSystem from '../UserDataSystem.js';

describe('UserDataSystem', () => {
    let userDataSystem;
    let mockFirestore;
    let mockDocRef;

    beforeEach(() => {
        jest.clearAllMocks();
        mockFirestore = firebase.firestore();
        // Get reference to the mock doc
        mockDocRef = mockFirestore.collection().doc();
        userDataSystem = new UserDataSystem();
    });

    describe('saveUserData', () => {
        it('should save user data to Firestore', async () => {
            mockDocRef.set.mockResolvedValue(true);

            const userData = { level: 5, exp: 1000 };
            await userDataSystem.saveUserData('uid123', userData);

            expect(mockDocRef.set).toHaveBeenCalled();
        });
    });

    describe('loadUserData', () => {
        it('should load user data from Firestore', async () => {
            mockDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({ level: 5, exp: 1000 })
            });

            const data = await userDataSystem.loadUserData('uid123');
            expect(data).toEqual({ level: 5, exp: 1000 });
        });

        it('should return null if user data does not exist', async () => {
            mockDocRef.get.mockResolvedValue({ exists: false });

            const data = await userDataSystem.loadUserData('uid123');
            expect(data).toBeNull();
        });
    });
});