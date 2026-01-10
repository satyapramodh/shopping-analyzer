/**
 * Structured Logging Utility
 * 
 * Provides consistent logging throughout the application with different log levels.
 * Replaces scattered console.log statements with structured, contextual logging.
 * 
 * @module utils/logger
 * @author Costco Dashboard Team
 * @since 1.0.0
 */

/**
 * Log levels in order of severity
 * @enum {string}
 */
export const LogLevel = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

/**
 * Logger class for structured application logging
 */
export class Logger {
    /**
     * Creates a logger instance
     * @param {string} [namespace='App'] - Logger namespace for identifying log source
     */
    constructor(namespace = 'App') {
        this.namespace = namespace;
        this.enabled = true;
    }

    /**
     * Internal logging method
     * @private
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} [context={}] - Additional context
     */
    _log(level, message, context = {}) {
        if (!this.enabled) return;

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            namespace: this.namespace,
            message,
            ...context
        };

        const consoleMethod = console[level] || console.log;
        consoleMethod(
            `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}] ${message}`,
            context && Object.keys(context).length > 0 ? context : ''
        );

        return logEntry;
    }

    /**
     * Logs debug information
     * @param {string} message - Debug message
     * @param {Object} [context={}] - Additional context
     * @example
     * logger.debug('Processing receipt', { receiptId: 123 });
     */
    debug(message, context = {}) {
        return this._log(LogLevel.DEBUG, message, context);
    }

    /**
     * Logs informational messages
     * @param {string} message - Info message
     * @param {Object} [context={}] - Additional context
     * @example
     * logger.info('Data loaded successfully', { recordCount: 500 });
     */
    info(message, context = {}) {
        return this._log(LogLevel.INFO, message, context);
    }

    /**
     * Logs warning messages
     * @param {string} message - Warning message
     * @param {Object} [context={}] - Additional context
     * @example
     * logger.warn('Missing warehouse data', { warehouseId: 847 });
     */
    warn(message, context = {}) {
        return this._log(LogLevel.WARN, message, context);
    }

    /**
     * Logs error messages
     * @param {string} message - Error message
     * @param {Error|Object} [error={}] - Error object or context
     * @example
     * logger.error('API request failed', error);
     */
    error(message, error = {}) {
        const context = error instanceof Error
            ? {
                errorMessage: error.message,
                errorStack: error.stack,
                errorName: error.name
            }
            : error;

        return this._log(LogLevel.ERROR, message, context);
    }

    /**
     * Enables logging
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disables logging
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Creates a child logger with extended namespace
     * @param {string} childNamespace - Child namespace to append
     * @returns {Logger} New logger instance
     * @example
     * const apiLogger = logger.child('API');
     * apiLogger.info('Request sent'); // Logs: [App:API] Request sent
     */
    child(childNamespace) {
        return new Logger(`${this.namespace}:${childNamespace}`);
    }
}

/**
 * Default application logger instance
 * @type {Logger}
 */
export const logger = new Logger('CostcoDashboard');

/**
 * Creates a scoped logger for a specific module
 * @param {string} moduleName - Module name
 * @returns {Logger} Logger instance for the module
 * @example
 * const chartLogger = createLogger('ChartService');
 * chartLogger.info('Chart created', { chartId: 'monthly-spend' });
 */
export function createLogger(moduleName) {
    return new Logger(moduleName);
}
