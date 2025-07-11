// backend-test-submission/controllers/urlController.js
const Url = require('../models/url');
const { nanoid } = require('nanoid'); // For generating unique short codes (version 3.x.x)
// Import the application logger directly from the middleware setup file.
// This resolves the circular dependency with app.js.
const { appLogger } = require('../middlewares/logger');

// Helper function to validate URL format (more robust than schema regex for user input)
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

// Helper function to calculate expiry date
const calculateExpiry = (validityMinutes) => {
    if (validityMinutes && validityMinutes > 0) {
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + validityMinutes);
        return expiryDate;
    }
    return null; // No expiry if validity is 0, null, or undefined
};

/**
 * @desc Creates a new shortened URL
 * @route POST /shorturls
 * @access Public
 */
exports.createShortUrl = async (req, res) => {
    const { url: originalUrl, validity, shortcode: customShortCode } = req.body;

    appLogger.info('Attempting to create short URL', { originalUrl, validity, customShortCode });

    // 1. Validate Input
    if (!originalUrl) {
        appLogger.warn('Create Short URL: Missing original URL', { body: req.body });
        return res.status(400).json({ message: 'Original URL is required.' });
    }
    if (!isValidUrl(originalUrl)) {
        appLogger.warn('Create Short URL: Invalid URL format', { originalUrl });
        return res.status(400).json({ message: 'Invalid URL format.' });
    }
    // Check if validity is provided and if it's a number and positive
    if (validity !== undefined && (typeof validity !== 'number' || validity <= 0)) {
        appLogger.warn('Create Short URL: Invalid validity period', { validity });
        return res.status(400).json({ message: 'Validity must be a positive integer in minutes.' });
    }

    try {
        let shortCodeToUse = customShortCode;

        // 2. Handle Custom Shortcode
        if (customShortCode) {
            // Check if custom shortcode already exists
            const existingUrl = await Url.findOne({ shortCode: customShortCode });
            if (existingUrl) {
                appLogger.warn('Create Short URL: Custom shortcode already in use', { customShortCode });
                return res.status(409).json({ message: 'Custom shortcode is already in use.' }); // 409 Conflict
            }
            // Basic validation for custom shortcode format (alphanumeric, 5-10 chars)
            if (!/^[a-zA-Z0-9]{5,10}$/.test(customShortCode)) {
                appLogger.warn('Create Short URL: Invalid custom shortcode format', { customShortCode });
                return res.status(400).json({ message: 'Custom shortcode must be 5-10 alphanumeric characters.' });
            }
        } else {
            // 3. Generate Unique Shortcode if not provided
            let uniqueCodeFound = false;
            let attempts = 0;
            const MAX_ATTEMPTS = 5; // Prevent infinite loops for extremely rare collisions

            while (!uniqueCodeFound && attempts < MAX_ATTEMPTS) {
                shortCodeToUse = nanoid(5); // Generate a 5-character short code
                const existing = await Url.findOne({ shortCode: shortCodeToUse });
                if (!existing) {
                    uniqueCodeFound = true;
                }
                attempts++;
            }

            if (!uniqueCodeFound) {
                appLogger.error('Create Short URL: Failed to generate a unique shortcode', { attempts });
                return res.status(500).json({ message: 'Failed to generate a unique shortcode. Please try again.' });
            }
        }

        // 4. Calculate Expiry Date (defaults to 30 minutes if not provided or invalid)
        const expiresAt = calculateExpiry(validity || 30);

        // 5. Save to Database
        const newUrl = new Url({
            originalUrl,
            shortCode: shortCodeToUse,
            expiresAt
        });

        const savedUrl = await newUrl.save();
        appLogger.info('Short URL created successfully', { shortCode: savedUrl.shortCode, originalUrl: savedUrl.originalUrl, expiry: savedUrl.expiresAt });

        // 6. Respond with Success (Status Code: 201)
        res.status(201).json({
            shortCode: savedUrl.shortCode,
            originalUrl: savedUrl.originalUrl,
            expiry: savedUrl.expiresAt ? savedUrl.expiresAt.toISOString() : null, // ISO 8601 format
            message: 'Short URL created successfully.'
        });

    } catch (error) {
        appLogger.error('Error creating short URL', { error: error.message, stack: error.stack, body: req.body });
        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while creating short URL.' });
    }
};

/**
 * @desc Retrieves usage statistics for a specific shortened URL
 * @route GET /shorturls/:shortCode
 * @access Public
 */
exports.getShortUrlStats = async (req, res) => {
    const { shortCode } = req.params;
    appLogger.info('Attempting to retrieve short URL stats', { shortCode });

    try {
        const urlEntry = await Url.findOne({ shortCode });

        // 1. Check if shortCode exists
        if (!urlEntry) {
            appLogger.warn('Get Short URL Stats: Shortcode not found', { shortCode });
            return res.status(404).json({ message: 'Short URL not found.' });
        }

        // 2. Check for expiry (client-side check, TTL index handles actual deletion)
        if (urlEntry.expiresAt && urlEntry.expiresAt < new Date()) {
            // Note: The TTL index will eventually delete this document from MongoDB.
            // This check provides immediate feedback to the client.
            appLogger.warn('Get Short URL Stats: Shortcode has expired', { shortCode, expiresAt: urlEntry.expiresAt });
            return res.status(410).json({ message: 'Short URL has expired.' }); // 410 Gone
        }

        appLogger.info('Short URL stats retrieved successfully', { shortCode, clicks: urlEntry.clicks });

        // 3. Respond with Statistics
        res.status(200).json({
            shortCode: urlEntry.shortCode,
            originalUrl: urlEntry.originalUrl,
            createdAt: urlEntry.createdAt.toISOString(),
            expiresAt: urlEntry.expiresAt ? urlEntry.expiresAt.toISOString() : null,
            totalClicks: urlEntry.clicks,
            clickHistory: urlEntry.clickHistory.map(click => ({
                timestamp: click.timestamp.toISOString(),
                source: click.source,
                location: click.location
            }))
        });

    } catch (error) {
        appLogger.error('Error retrieving short URL stats', { error: error.message, stack: error.stack, shortCode });
        res.status(500).json({ message: 'Server error while retrieving short URL statistics.' });
    }
};

/**
 * @desc Redirects to the original URL and records click
 * @route GET /:shortCode (This is a root-level route, not under /shorturls)
 * @access Public
 * This is an implicit requirement for a URL shortener to function.
 */
exports.redirectToOriginal = async (req, res) => {
    const { shortCode } = req.params;
    appLogger.info('Attempting to redirect short URL', { shortCode, ip: req.ip, userAgent: req.headers['user-agent'] });

    try {
        const urlEntry = await Url.findOne({ shortCode });

        if (!urlEntry) {
            appLogger.warn('Redirect: Shortcode not found', { shortCode });
            return res.status(404).send('Short URL not found.'); // Standard 404 for redirects
        }

        if (urlEntry.expiresAt && urlEntry.expiresAt < new Date()) {
            appLogger.warn('Redirect: Shortcode has expired', { shortCode, expiresAt: urlEntry.expiresAt });
            return res.status(410).send('Short URL has expired.');
        }

        // Increment click count and add to history
        urlEntry.clicks += 1;
        urlEntry.clickHistory.push({
            timestamp: new Date(),
            source: req.headers['referer'] || req.headers['user-agent'] || 'Direct/Unknown',
            location: req.ip // A very coarse "location" (IP address), for real geo-location, you'd use a service.
        });
        await urlEntry.save(); // Save the updated entry with new click data

        appLogger.info('Redirect successful', { shortCode, originalUrl: urlEntry.originalUrl });
        res.redirect(urlEntry.originalUrl); // Perform the HTTP 302 redirect

    } catch (error) {
        appLogger.error('Error during redirect', { error: error.message, stack: error.stack, shortCode });
        res.status(500).send('Server error during redirect.');
    }
};
// backend-test-submission/controllers/urlController.js
// ... (existing code) ...

/**
 * @desc Retrieves a list of all shortened URLs (without detailed click history)
 * @route GET /shorturls
 * @access Public
 */
exports.getAllShortUrls = async (req, res) => {
    appLogger.info('Attempting to retrieve list of all short URLs');
    try {
        // Fetch only necessary fields for the list view
        const urls = await Url.find({}, 'shortCode originalUrl createdAt expiresAt clicks');
        appLogger.info('Retrieved list of all short URLs', { count: urls.length });
        res.status(200).json(urls.map(url => ({
            shortCode: url.shortCode,
            originalUrl: url.originalUrl,
            createdAt: url.createdAt.toISOString(),
            expiresAt: url.expiresAt ? url.expiresAt.toISOString() : null,
            totalClicks: url.clicks // Include totalClicks for the list view
        })));
    } catch (error) {
        appLogger.error('Error retrieving all short URLs list', { error: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server error while retrieving URL list.' });
    }
};

// ... (rest of the existing exports) ...