import { jest } from '@jest/globals';
import UserDataSystem from '../UserDataSystem.js';

describe('UserDataSystem', () => {
    let userDataSystem;
    let localStorageMock;
    const TEST_KEY = 'fishEat_userData';

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
        userDataSystem = new UserDataSystem();
    });

    afterEach(() => {
        delete global.localStorage;
    });

    describe('saveUserData', () => {
        it('should save user data to localStorage', () => {
            const userData = { level: 5, exp: 1000 };
            userDataSystem.saveUserData('uid123', userData);

            const stored = JSON.parse(localStorage.getItem(TEST_KEY));
            expect(stored.uid123).toBeDefined();
            expect(stored.uid123.level).toBe(5);
            expect(stored.uid123.exp).toBe(1000);
        });
    });

    describe('loadUserData', () => {
        it('should load user data from localStorage', () => {
            const data = { uid123: { level: 5, exp: 1000 } };
            localStorage.setItem(TEST_KEY, JSON.stringify(data));

            const loaded = userDataSystem.loadUserData('uid123');
            expect(loaded).toEqual({ level: 5, exp: 1000 });
        });

        it('should return null if user data does not exist', () => {
            const result = userDataSystem.loadUserData('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('syncToLocal', () => {
        it('should sync currency to localStorage', () => {
            userDataSystem.syncToLocal({ currency: 500 });
            expect(localStorage.getItem('fishEat_currency')).toBe('500');
        });

        it('should sync upgrades to localStorage', () => {
            const upgrades = { speed: 2, damage: 1 };
            userDataSystem.syncToLocal({ upgrades });
            expect(JSON.parse(localStorage.getItem('fishEat_upgrades'))).toEqual(upgrades);
        });

        it('should sync selectedFish to localStorage', () => {
            userDataSystem.syncToLocal({ selectedFish: 'shark' });
            expect(localStorage.getItem('fishEat_selectedFish')).toBe('shark');
        });
    });
});