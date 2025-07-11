// frontend-test-submission/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import the main App component
import './index.css'; // Import global CSS styles
import { appLogger } from './logger'; // Import the custom frontend logger

// Log application startup using the custom logger
appLogger.info('React application starting up.');

// Get the root DOM element where the React app will be mounted
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App component into the root element
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
