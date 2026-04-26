import { jest } from '@jest/globals';

const mockAuth = {
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    currentUser: null
};

global.firebase = {
    auth: () => mockAuth,
    firestore: () => ({}),
    initializeApp: jest.fn()
};

export default mockAuth;