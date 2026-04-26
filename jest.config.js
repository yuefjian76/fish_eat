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
        // Firebase uses global.firebase directly in compat mode, no module mapping needed
    }
};
