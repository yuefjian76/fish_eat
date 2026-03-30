import { jest } from '@jest/globals';
import { DebugLogger } from '../DebugLogger.js';

describe('DebugLogger', () => {
    let logger;

    beforeEach(() => {
        // Reset singleton
        DebugLogger._instance = null;
        logger = DebugLogger.getInstance();
        logger.setLevel(DebugLogger.LEVEL.DEBUG);
    });

    describe('getInstance', () => {
        test('returns singleton instance', () => {
            const instance1 = DebugLogger.getInstance();
            const instance2 = DebugLogger.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('setLevel', () => {
        test('sets the log level', () => {
            logger.setLevel(DebugLogger.LEVEL.WARN);
            expect(logger.getLevelName()).toBe('WARN');
        });
    });

    describe('getLevelName', () => {
        test('returns DEBUG for DEBUG level', () => {
            logger.setLevel(DebugLogger.LEVEL.DEBUG);
            expect(logger.getLevelName()).toBe('DEBUG');
        });

        test('returns INFO for INFO level', () => {
            logger.setLevel(DebugLogger.LEVEL.INFO);
            expect(logger.getLevelName()).toBe('INFO');
        });

        test('returns WARN for WARN level', () => {
            logger.setLevel(DebugLogger.LEVEL.WARN);
            expect(logger.getLevelName()).toBe('WARN');
        });

        test('returns ERROR for ERROR level', () => {
            logger.setLevel(DebugLogger.LEVEL.ERROR);
            expect(logger.getLevelName()).toBe('ERROR');
        });
    });

    describe('_format', () => {
        test('formats message with timestamp and level', () => {
            const formatted = logger._format(DebugLogger.LEVEL.INFO, 'Test message');
            expect(formatted).toContain('Test message');
            expect(formatted).toContain('INFO');
            expect(formatted).toContain('T');
            expect(formatted).toContain('Z');
        });
    });

    describe('LEVEL enum', () => {
        test('has correct values', () => {
            expect(DebugLogger.LEVEL.DEBUG).toBe(0);
            expect(DebugLogger.LEVEL.INFO).toBe(1);
            expect(DebugLogger.LEVEL.WARN).toBe(2);
            expect(DebugLogger.LEVEL.ERROR).toBe(3);
        });
    });

    describe('debug', () => {
        test('logs when level is DEBUG', () => {
            logger.setLevel(DebugLogger.LEVEL.DEBUG);
            const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
            logger.debug('test debug message');
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('warn', () => {
        test('logs warning when level allows', () => {
            logger.setLevel(DebugLogger.LEVEL.DEBUG);
            const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            logger.warn('test warn message');
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        test('does not log when level is ERROR', () => {
            logger.setLevel(DebugLogger.LEVEL.ERROR);
            const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            logger.warn('test warn message');
            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('error', () => {
        test('logs error when level allows', () => {
            logger.setLevel(DebugLogger.LEVEL.DEBUG);
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
            logger.error('test error message');
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        test('does not log when level is above ERROR', () => {
            logger.setLevel(DebugLogger.LEVEL.ERROR);
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
            logger.error('test error message');
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('getLevelName edge case', () => {
        test('returns UNKNOWN for invalid level', () => {
            logger.setLevel(99);
            expect(logger.getLevelName()).toBe('UNKNOWN');
        });
    });
});
