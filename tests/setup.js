// tests/setup.js - Jest setup for browser globals
import { jest } from '@jest/globals';

global.window = {
    location: { search: '' }
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

// Firebase mock for compat API
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

// Mock Phaser Graphics class
class MockGraphics {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.active = true;
    }
    destroy() {}
    setCircle() {}
    setOffset() {}
    setBounce() {}
    setCollideWorldBounds() {}
    fillStyle() { return this; }
    fillEllipse() { return this; }
    fillTriangle() { return this; }
    lineStyle() { return this; }
    strokeEllipse() { return this; }
    lineBetween() { return this; }
}

// Mock Phaser
global.Phaser = {
    Math: {
        Between: jest.fn((min, max) => Math.floor(Math.random() * (max - min + 1)) + min),
        Distance: {
            Between: jest.fn((x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2))
        },
        Angle: {
            Between: jest.fn((x1, y1, x2, y2) => Math.atan2(y2-y1, x2-x1))
        }
    },
    Display: {
        Color: {
            ValueToColor: jest.fn().mockReturnValue({ r: 100, g: 100, b: 100 }),
            IntegerToColor: jest.fn().mockReturnValue({ r: 100, g: 100, b: 100 }),
            GetColor: jest.fn().mockReturnValue(0xffffff)
        }
    },
    GameObjects: {
        Graphics: MockGraphics
    }
};
