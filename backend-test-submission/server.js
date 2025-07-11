// backend-test-submission/server.js
const { app, connectDB, appLogger } = require('./app');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Ensure .env is loaded here too for PORT

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    // Connect to MongoDB
    await connectDB();

    // Start the Express server
    app.listen(PORT, () => {
        appLogger.info(`Microservice running on port ${PORT}`);
        console.log(`Microservice running on http://localhost:${PORT}`); // Temporary console.log
    });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    appLogger.error('Unhandled Rejection', { error: err.message, stack: err.stack, promise });
    console.error('Unhandled Rejection:', err.message);
    // Optionally close server and exit process
    // server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    appLogger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    console.error('Uncaught Exception:', err.message);
    // Exit process with failure
    process.exit(1);
});