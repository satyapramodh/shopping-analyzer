/**
 * Custom Error Classes
 * 
 * Provides specific error types for better error handling and debugging.
 * Each error class includes context-specific information.
 * 
 * @module utils/errors
 * @author Costco Dashboard Team
 * @since 1.0.0
 */

/**
 * Base error class for all application errors
 * @extends Error
 */
export class AppError extends Error {
    /**
     * Creates an application error
     * @param {string} message - Error message
     * @param {Object} [context={}] - Additional error context
     */
    constructor(message, context = {}) {
        super(message);
        this.name = this.constructor.name;
        this.context = context;
        this.timestamp = new Date().toISOString();
        
        // Maintains proper stack trace for where error was thrown (V8 engines only)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Converts error to JSON for logging
     * @returns {Object} Error as JSON object
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

/**
 * Error thrown when API requests fail
 * @extends AppError
 */
export class APIError extends AppError {
    /**
     * Creates an API error
     * @param {number} status - HTTP status code
     * @param {*} response - API response body
     * @param {string} [message] - Custom error message
     */
    constructor(status, response, message) {
        const msg = message || `API Error: ${status}`;
        super(msg, { status, response });
        this.status = status;
        this.response = response;
    }
}

/**
 * Error thrown when network requests fail
 * @extends AppError
 */
export class NetworkError extends AppError {
    /**
     * Creates a network error
     * @param {string} [message='Network request failed'] - Error message
     * @param {Object} [context={}] - Additional context
     */
    constructor(message = 'Network request failed', context = {}) {
        super(message, context);
    }
}

/**
 * Error thrown when data validation fails
 * @extends AppError
 */
export class DataValidationError extends AppError {
    /**
     * Creates a data validation error
     * @param {string} field - Field name that failed validation
     * @param {*} value - Invalid value
     * @param {string} [reason] - Reason for validation failure
     */
    constructor(field, value, reason) {
        const message = reason 
            ? `Invalid ${field}: ${reason}`
            : `Invalid ${field}: ${value}`;
        super(message, { field, value, reason });
        this.field = field;
        this.value = value;
        this.reason = reason;
    }
}

/**
 * Error thrown when required data is not found
 * @extends AppError
 */
export class DataNotFoundError extends AppError {
    /**
     * Creates a data not found error
     * @param {string} resourceType - Type of resource not found
     * @param {*} identifier - Resource identifier
     */
    constructor(resourceType, identifier) {
        const message = `${resourceType} not found: ${identifier}`;
        super(message, { resourceType, identifier });
        this.resourceType = resourceType;
        this.identifier = identifier;
    }
}

/**
 * Error thrown when configuration is invalid or missing
 * @extends AppError
 */
export class ConfigurationError extends AppError {
    /**
     * Creates a configuration error
     * @param {string} setting - Configuration setting name
     * @param {string} [reason] - Reason for error
     */
    constructor(setting, reason) {
        const message = reason
            ? `Configuration error for ${setting}: ${reason}`
            : `Invalid configuration: ${setting}`;
        super(message, { setting, reason });
        this.setting = setting;
    }
}

/**
 * Error thrown when chart operations fail
 * @extends AppError
 */
export class ChartError extends AppError {
    /**
     * Creates a chart error
     * @param {string} chartId - Chart identifier
     * @param {string} operation - Operation that failed
     * @param {Error} [cause] - Original error that caused this
     */
    constructor(chartId, operation, cause) {
        const message = `Chart error (${chartId}): ${operation}`;
        super(message, { chartId, operation, cause: cause?.message });
        this.chartId = chartId;
        this.operation = operation;
        this.cause = cause;
    }
}

/**
 * Error thrown when state operations fail
 * @extends AppError
 */
export class StateError extends AppError {
    /**
     * Creates a state error
     * @param {string} stateKey - State key that failed
     * @param {string} operation - Operation attempted (get, set, delete)
     */
    constructor(stateKey, operation) {
        const message = `State error: Cannot ${operation} '${stateKey}'`;
        super(message, { stateKey, operation });
        this.stateKey = stateKey;
        this.operation = operation;
    }
}
