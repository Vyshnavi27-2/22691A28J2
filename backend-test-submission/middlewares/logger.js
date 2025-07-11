// backend-test-submission/middlewares/logger.js
const createLoggerMiddleware = require('logging-middleware');
const path = require('path');
const fs = require('fs');

// Load environment variables from the backend's .env file
require('dotenv').config({ path: path.resolve(__dirname, '../../backend-test-submission/.env') });

const LOG_FILE_PATH = process.env.BACKEND_LOG_FILE_PATH;

// Ensure the logs directory exists before attempting to write logs
if (LOG_FILE_PATH) {
    const logDir = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
}

// Initialize the logger middleware.
// This 'loggerMiddlewareInstance' is the actual Express middleware function.
const loggerMiddlewareInstance = createLoggerMiddleware({
    logFilePath: LOG_FILE_PATH,
    serviceName: 'BackendService'
});

// Export both the Express middleware function (to be used with app.use)
// and the application-specific logger utility (to be used in controllers, etc.).
module.exports = {
    loggerMiddleware: loggerMiddlewareInstance, // The Express middleware function itself
    appLogger: loggerMiddlewareInstance.logger // The utility logger object (info, warn, error, request methods)
};
