// backend-test-submission/routes/urlRoutes.js
const express = require('express');
const router = express.Router();
const urlController = require('../controllers/urlController'); // We'll create this next

// --- API Endpoints Specification ---

// 1. Create Short URL
// Description: Creates a new shortened URL.
// Method: POST
// Route: /shorturls (this router is already mounted at /shorturls in app.js, so just '/')
router.post('/', urlController.createShortUrl);

// 2. Retrieve Short URL Statistics
// Description: Retrieves usage statistics for a specific shortened URL.
// Method: GET
// Route: /shorturls/:shortcode (this router is already mounted at /shorturls, so '/:shortcode')
router.get('/:shortCode', urlController.getShortUrlStats);

module.exports = router;