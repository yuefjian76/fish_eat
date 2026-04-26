export default {
    testEnvironment: 'node',
    transform: {},
    moduleFileExtensions: ['js', 'mjs'],
    testMatch: ['**/*.test.js'],
    verbose: true,
    collectCoverageFrom: ['src/**/*.js'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    setupFiles: ['<rootDir>/tests/setup.js'],
    moduleNameMapper: {
        '^firebase/app$': '<rootDir>/__mocks__/firebase/app.js',
        '^firebase/auth$': '<rootDir>/__mocks__/firebase/auth.js',
        '^firebase/firestore$': '<rootDir>/__mocks__/firebase/firestore.js'
    }
};
