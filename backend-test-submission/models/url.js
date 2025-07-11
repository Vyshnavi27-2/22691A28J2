// backend-test-submission/models/url.js
const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    // The original long URL that is being shortened
    originalUrl: {
        type: String,
        required: true,
        unique: false, // Not unique because multiple shortcodes could point to the same long URL if desired
        trim: true,
        // Basic URL validation using a regex. More robust validation can be done in the controller.
        match: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
    },
    // The unique short code (e.g., "abcd1")
    shortCode: {
        type: String,
        required: true,
        unique: true, // This automatically creates a unique index, so no need for urlSchema.index({ shortCode: 1 });
        minlength: 5, // Enforce minimum length as per typical shorteners, though prompt says "abcd1" (5 chars)
        maxlength: 10, // A reasonable max length for generated codes
        trim: true
    },
    // Timestamp when the short URL was created
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Optional expiry date/time
    expiresAt: {
        type: Date,
        required: false,
        // Custom validation: expiresAt must be in the future if provided
        validate: {
            validator: function(v) {
                return v === null || v > Date.now();
            },
            message: props => `${props.value} is not a valid future expiry date!`
        }
    },
    // Number of times the short link has been clicked
    clicks: {
        type: Number,
        default: 0
    },
    // Detailed click data for analytics
    clickHistory: [
        {
            timestamp: { type: Date, default: Date.now },
            source: { type: String, default: 'Unknown' }, // e.g., referrer, user-agent info for coarse source
            location: { type: String, default: 'Unknown' } // Coarse-grained geographical location (e.g., city, country)
        }
    ]
});

// Create a TTL index for automatic document deletion after expiry
// 'expiresAt' should be a Date type. 'expireAfterSeconds: 0' means it expires at the exact date/time specified.
urlSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });


const Url = mongoose.model('Url', urlSchema);

module.exports = Url;