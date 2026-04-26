import { jest } from '@jest/globals';

const mockDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();

export const getFirestore = () => ({});
export const doc = (...args) => mockDoc(...args);
export const setDoc = (...args) => mockSetDoc(...args);
export const getDoc = (...args) => mockGetDoc(...args);
export const updateDoc = (...args) => mockUpdateDoc(...args);
export const deleteDoc = (...args) => mockDeleteDoc(...args);

export {
    mockDoc,
    mockSetDoc,
    mockGetDoc,
    mockUpdateDoc,
    mockDeleteDoc
};

export default {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc
};
