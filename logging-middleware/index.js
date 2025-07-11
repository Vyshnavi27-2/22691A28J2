// logging-middleware/index.js
// Check if running in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

let fs;
let path;
let logStream; // Declare logStream here

if (!isBrowser) {
    // Only require 'fs' and 'path' if not in a browser environment
    fs = require('fs');
    path = require('path');
}

// Enum for log levels
const LOG_LEVELS = {
    INFO: 'INFO',
    WARN: 'WARN',
    R: 'R', // Assuming 'R' might be for 'Request' or general runtime
    ERROR: 'ERROR'
};

/**
 * Custom logging middleware for Express applications (backend) and utility logger for frontend.
 * This middleware logs request and response information, as well as custom messages.
 *
 * @param {object} options - Configuration options for the logger.
 * @param {string} options.logFilePath - The path to the log file (relevant for Node.js).
 * @param {string} options.serviceName - The name of the service using the logger (e.g., "Backend", "Frontend").
 * @returns {function} Express middleware function (for Node.js) or a logger utility object (for browser).
 */
function createLoggerMiddleware(options = {}) {
    const { logFilePath, serviceName = 'UnknownService' } = options;

    if (!isBrowser) {
        // Node.js environment: set up file stream
        if (!logFilePath) {
            throw new Error('logFilePath is a mandatory option for the custom logger middleware in Node.js environment.');
        }
        logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // 'a' for append
    } else {
        // Browser environment: log to console (structured)
        // No file stream needed, logStream will be handled by console output
    }


    /**
     * Logs a message with a specific level.
     * @param {string} level - The log level (e.g., 'INFO', 'ERROR').
     * @param {string} message - The log message.
     * @param {object} [metadata={}] - Optional metadata to include in the log.
     */
    const log = (level, message, metadata = {}) => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            service: serviceName,
            message,
            ...metadata
        };
        const logLine = JSON.stringify(logEntry) + '\n';

        if (!isBrowser) {
            // Node.js: write to file
            if (logStream) { // Ensure logStream is initialized
                logStream.write(logLine);
            } else {
                console.error("Log stream not initialized for Node.js environment!");
            }
        } else {
            // Browser: log to console (structured output)
            // This is the "transport" for the browser, fulfilling "no console.log directly in app code"
            console.log(logEntry);
        }
    };

    // Expose the logger function for direct application logging
    const logger = {
        info: (message, metadata) => log(LOG_LEVELS.INFO, message, metadata),
        warn: (message, metadata) => log(LOG_LEVELS.WARN, message, metadata),
        request: (message, metadata) => log(LOG_LEVELS.R, message, metadata), // For specific request logging
        error: (message, metadata) => log(LOG_LEVELS.ERROR, message, metadata),
    };

    // For Node.js, return the Express middleware function
    if (!isBrowser) {
        const expressMiddleware = (req, res, next) => {
            const start = process.hrtime();

            res.on('finish', () => {
                const [seconds, nanoseconds] = process.hrtime(start);
                const durationMs = (seconds * 1000) + (nanoseconds / 1000000);

                logger.request(`HTTP Request`, {
                    method: req.method,
                    url: req.originalUrl,
                    ip: req.ip,
                    statusCode: res.statusCode,
                    responseDurationMs: durationMs,
                    userAgent: req.headers['user-agent'],
                    referrer: req.headers['referer']
                });
            });

            res.on('error', (err) => {
                logger.error(`HTTP Response Error`, {
                    method: req.method,
                    url: req.originalUrl,
                    error: err.message,
                    stack: err.stack
                });
            });

            next(); // Pass control to the next middleware or route handler
        };
        expressMiddleware.logger = logger; // Attach logger utility to the middleware function
        return expressMiddleware;
    } else {
        // For browser, just return the logger utility directly
        return { logger }; // Return an object with the logger property
    }
}

module.exports = createLoggerMiddleware;