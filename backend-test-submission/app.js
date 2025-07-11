// backend-test-submission/app.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
// Load backend .env variables from the root of backend-test-submission
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Import both the middleware function and the application logger from middlewares/logger.js.
// This resolves the circular dependency warning.
const { loggerMiddleware, appLogger } = require('./middlewares/logger');

const app = express();

// --- Database Connection ---
/**
 * Establishes a connection to the MongoDB database.
 * Logs success or error using the custom application logger.
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        appLogger.info('MongoDB Connected Successfully');
        // console.log('MongoDB Connected Successfully'); // Temporary console.log for quick startup check, remove later in production
    } catch (err) {
        appLogger.error('MongoDB Connection Error', { error: err.message, stack: err.stack });
        // console.error('MongoDB Connection Error:', err.message); // Temporary console.error for quick startup check
        process.exit(1); // Exit process with failure if DB connection fails
    }
};

// --- Core Middleware Setup ---
// Enable CORS for all origins (for development, adjust for production if needed)
// This is important for your frontend to communicate with the backend.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Body parser middleware to parse JSON request bodies
app.use(express.json());

// Body parser middleware to parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Integrate the custom logging middleware as the first application-specific middleware.
// This ensures all incoming requests are logged.
app.use(loggerMiddleware); // Use the middleware function here

// --- Routes Setup ---
// Import URL routes
const urlRoutes = require('./routes/urlRoutes');
// Mount the URL routes under the '/shorturls' path
app.use('/shorturls', urlRoutes);

// --- Redirect Route (Implicit Requirement for a URL Shortener) ---
// This route handles the actual redirection from a shortcode to the original URL.
// It also increments click count and logs click history.
const urlController = require('./controllers/urlController'); // Import controller for redirect
app.get('/:shortCode', urlController.redirectToOriginal); // This route will catch any shortcode directly at the root


// --- Error Handling Middleware ---
// This middleware should be placed at the very end of your middleware stack,
// after all routes and other middleware. It catches any errors that occur
// during request processing.
app.use((err, req, res, next) => {
    // Log the error using the custom application logger
    appLogger.error('Unhandled API Error', {
        method: req.method,
        url: req.originalUrl,
        error: err.message,
        stack: err.stack,
        body: req.body // Including request body for debugging purposes
    });

    // For development, print the error to the console for quick visibility.
    // In production, you might remove or configure this differently.
    // console.error('Unhandled Error:', err);

    // Send a generic 500 Internal Server Error response to the client.
    // Avoid sending sensitive error details to the client in a production environment.
    res.status(500).json({ message: 'An unexpected server error occurred.' });
});

// Export the Express app instance, the database connection function, and the application logger
module.exports = { app, connectDB, appLogger };
