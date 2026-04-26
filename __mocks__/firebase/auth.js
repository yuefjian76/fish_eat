import { jest } from '@jest/globals';

const mockAuth = {
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn()
};

export const getAuth = () => mockAuth;
export const createUserWithEmailAndPassword = mockAuth.createUserWithEmailAndPassword;
export const signInWithEmailAndPassword = mockAuth.signInWithEmailAndPassword;
export const signOut = mockAuth.signOut;
export const onAuthStateChanged = mockAuth.onAuthStateChanged;

export { mockAuth };
export default mockAuth;
