import { jest } from '@jest/globals';

const mockDocRef = {
    set: jest.fn(),
    get: jest.fn()
};

const mockCollectionRef = {
    doc: jest.fn(() => mockDocRef)
};

const mockFirestore = {
    collection: jest.fn(() => mockCollectionRef)
};

const mockAuth = {
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    currentUser: null
};

global.firebase = {
    auth: () => mockAuth,
    firestore: () => mockFirestore,
    initializeApp: jest.fn()
};

export default { mockFirestore, mockAuth };