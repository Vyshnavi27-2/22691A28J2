// frontend-test-submission/src/logger.js
// This file provides a simplified, browser-compatible logger for the React frontend.
// It mimics the interface of the custom logging middleware but outputs to the browser console.

// Define standard log levels for consistency.
const LOG_LEVELS = {
    INFO: 'INFO',      // General information about application flow
    WARN: 'WARN',      // Potentially problematic situations, but not errors
    REQUEST: 'REQUEST', // Specific level for HTTP request/response logs (though less used directly here)
    ERROR: 'ERROR'     // Errors that require attention
};

/**
 * Internal function to format and output log messages to the browser console.
 *
 * @param {string} level - The log level (e.g., 'INFO', 'ERROR').
 * @param {string} message - The main log message.
 * @param {object} [metadata={}] - Optional additional data to include in the log entry.
 */
const log = (level, message, metadata = {}) => {
    const timestamp = new Date().toISOString(); // ISO 8601 format timestamp
    const serviceName = 'FrontendService'; // Hardcode service name for simplicity

    const logEntry = {
        timestamp,
        level,
        service: serviceName,
        message,
        ...metadata // Spread any additional metadata
    };

    // Use console.log for structured output in the browser.
    // This is the "transport" for the browser, fulfilling "no console.log directly in app code".
    // Different console methods can be used for better visibility (e.g., console.error for ERROR level).
    switch (level) {
        case LOG_LEVELS.ERROR:
            console.error(logEntry);
            break;
        case LOG_LEVELS.WARN:
            console.warn(logEntry);
            break;
        case LOG_LEVELS.INFO:
        case LOG_LEVELS.REQUEST:
        default:
            console.log(logEntry);
            break;
    }
};

// The public interface for the logger utility.
// Your React components and other frontend modules will import `appLogger` from this file
// to perform structured logging (e.g., appLogger.info(), appLogger.error()).
export const appLogger = {
    info: (message, metadata) => log(LOG_LEVELS.INFO, message, metadata),
    warn: (message, metadata) => log(LOG_LEVELS.WARN, message, metadata),
    request: (message, metadata) => log(LOG_LEVELS.REQUEST, message, metadata),
    error: (message, metadata) => log(LOG_LEVELS.ERROR, message, metadata),
};
