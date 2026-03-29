/**
 * DebugLogger - Centralized logging system with configurable log levels
 */
export class DebugLogger {
    static LEVEL = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    };

    static _instance = null;

    constructor() {
        // Auto-enable DEBUG if URL has ?debug=true
        const urlParams = new URLSearchParams(window.location.search);
        const urlDebug = urlParams.get('debug') === 'true';

        // Default level: DEBUG if localStorage 'debugMode' is 'true', otherwise INFO
        const storedDebug = localStorage.getItem('debugMode') === 'true';
        this._level = urlDebug || storedDebug ? DebugLogger.LEVEL.DEBUG : DebugLogger.LEVEL.INFO;
    }

    /**
     * Get singleton instance
     */
    static getInstance() {
        if (DebugLogger._instance === null) {
            DebugLogger._instance = new DebugLogger();
        }
        return DebugLogger._instance;
    }

    /**
     * Set global log level
     * @param {number} level - Log level (DEBUG, INFO, WARN, ERROR)
     */
    setLevel(level) {
        this._level = level;
    }

    /**
     * Get current log level name
     * @returns {string} Level name
     */
    getLevelName() {
        switch (this._level) {
            case DebugLogger.LEVEL.DEBUG: return 'DEBUG';
            case DebugLogger.LEVEL.INFO: return 'INFO';
            case DebugLogger.LEVEL.WARN: return 'WARN';
            case DebugLogger.LEVEL.ERROR: return 'ERROR';
            default: return 'UNKNOWN';
        }
    }

    /**
     * Format log message with timestamp and level
     * @param {number} level - Log level
     * @param {string} message - Log message
     * @returns {string} Formatted message
     */
    _format(level, message) {
        const timestamp = new Date().toISOString();
        const levelName = ['DEBUG', 'INFO', 'WARN', 'ERROR'][level] || 'DEBUG';
        return `[${timestamp}] [${levelName}] ${message}`;
    }

    /**
     * Log debug message
     * @param {string} message - Message to log
     */
    debug(message) {
        if (this._level <= DebugLogger.LEVEL.DEBUG) {
            console.log(this._format(0, message));
        }
    }

    /**
     * Log info message
     * @param {string} message - Message to log
     */
    info(message) {
        if (this._level <= DebugLogger.LEVEL.INFO) {
            console.log(this._format(1, message));
        }
    }

    /**
     * Log warn message
     * @param {string} message - Message to log
     */
    warn(message) {
        if (this._level <= DebugLogger.LEVEL.WARN) {
            console.warn(this._format(2, message));
        }
    }

    /**
     * Log error message
     * @param {string} message - Message to log
     */
    error(message) {
        if (this._level <= DebugLogger.LEVEL.ERROR) {
            console.error(this._format(3, message));
        }
    }
}

// Singleton export
export const logger = DebugLogger.getInstance();
export default logger;
