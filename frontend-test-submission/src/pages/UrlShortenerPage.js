// frontend-test-submission/src/pages/UrlShortenerPage.js
import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Paper, Grid, Alert, CircularProgress } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { appLogger } from '../logger'; // Import the custom frontend logger

const UrlShortenerPage = () => {
    // State to manage up to 5 URL input fields
    const [urlInputs, setUrlInputs] = useState(
        Array(5).fill({ originalUrl: '', validity: '', shortcode: '', result: null, error: null, loading: false })
    );
    const [globalError, setGlobalError] = useState(null);

    // Get the backend API URL from environment variables
    const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL;

    // Handle input changes for each URL field
    const handleInputChange = (index, field, value) => {
        const newInputs = [...urlInputs];
        newInputs[index][field] = value;
        // Clear previous error/result when input changes
        newInputs[index].result = null;
        newInputs[index].error = null;
        setUrlInputs(newInputs);
    };

    // Validate a single URL input
    const validateInput = (input) => {
        if (!input.originalUrl) {
            return 'Original URL is required.';
        }
        try {
            new URL(input.originalUrl); // Check if it's a valid URL format
        } catch (e) {
            return 'Invalid URL format.';
        }
        if (input.validity && (isNaN(input.validity) || parseInt(input.validity) <= 0)) {
            return 'Validity must be a positive number in minutes.';
        }
        if (input.shortcode && !/^[a-zA-Z0-9]{5,10}$/.test(input.shortcode)) {
            return 'Custom shortcode must be 5-10 alphanumeric characters.';
        }
        return null; // No error
    };

    // Handle shortening a single URL
    const handleShortenUrl = async (index) => {
        const input = urlInputs[index];
        const validationError = validateInput(input);

        if (validationError) {
            const newInputs = [...urlInputs];
            newInputs[index].error = validationError;
            setUrlInputs(newInputs);
            appLogger.warn('Client-side validation failed for URL input', { index, error: validationError, input });
            return;
        }

        const newInputs = [...urlInputs];
        newInputs[index].loading = true;
        newInputs[index].error = null; // Clear previous error
        newInputs[index].result = null; // Clear previous result
        setUrlInputs(newInputs);
        setGlobalError(null); // Clear any global error

        appLogger.info('Attempting to shorten URL via API', { index, originalUrl: input.originalUrl });

        try {
            const payload = {
                url: input.originalUrl,
            };
            if (input.validity) {
                payload.validity = parseInt(input.validity);
            }
            if (input.shortcode) {
                payload.shortcode = input.shortcode;
            }

            const response = await fetch(`${BACKEND_API_URL}/shorturls`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                newInputs[index].result = {
                    shortCode: data.shortCode,
                    originalUrl: data.originalUrl,
                    expiry: data.expiry,
                    shortenedUrl: `${BACKEND_API_URL}/${data.shortCode}` // Construct full shortened URL
                };
                appLogger.info('URL shortened successfully', { index, shortCode: data.shortCode });
            } else {
                newInputs[index].error = data.message || 'Failed to shorten URL.';
                appLogger.error('Failed to shorten URL from API', { index, status: response.status, message: data.message });
            }
        } catch (error) {
            newInputs[index].error = 'Network error or server unreachable.';
            appLogger.error('Network error during URL shortening', { index, error: error.message, stack: error.stack });
        } finally {
            newInputs[index].loading = false;
            setUrlInputs(newInputs);
        }
    };

    // Handle copying the shortened URL to clipboard
    const handleCopyClick = (shortenedUrl) => {
        // Using document.execCommand('copy') as navigator.clipboard.writeText() might not work in iframes
        const el = document.createElement('textarea');
        el.value = shortenedUrl;
        document.body.appendChild(el);
        el.select();
        try {
            document.execCommand('copy');
            appLogger.info('Shortened URL copied to clipboard', { shortenedUrl });
            setGlobalError({ message: 'Copied to clipboard!', severity: 'success' });
        } catch (err) {
            appLogger.error('Failed to copy URL to clipboard', { error: err.message });
            setGlobalError({ message: 'Failed to copy URL.', severity: 'error' });
        }
        document.body.removeChild(el);
        // Clear the message after a few seconds
        setTimeout(() => setGlobalError(null), 3000);
    };


    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Shorten Your URLs</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Enter up to 5 URLs to shorten them. You can optionally set a validity period (in minutes) and a custom shortcode.
            </Typography>

            {globalError && (
                <Alert severity={globalError.severity || 'info'} sx={{ mb: 2 }}>
                    {globalError.message}
                </Alert>
            )}

            <Grid container spacing={3}>
                {urlInputs.map((input, index) => (
                    <Grid item xs={12} md={6} key={index}>
                        <Paper elevation={3} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6">URL #{index + 1}</Typography>
                            <TextField
                                label="Original URL"
                                variant="outlined"
                                fullWidth
                                value={input.originalUrl}
                                onChange={(e) => handleInputChange(index, 'originalUrl', e.target.value)}
                                error={!!input.error} // Show error state if there's an error
                                helperText={input.error} // Display error message
                                disabled={input.loading}
                            />
                            <TextField
                                label="Validity (minutes, optional)"
                                variant="outlined"
                                fullWidth
                                type="number"
                                value={input.validity}
                                onChange={(e) => handleInputChange(index, 'validity', e.target.value)}
                                InputProps={{ inputProps: { min: 1 } }}
                                disabled={input.loading}
                            />
                            <TextField
                                label="Custom Shortcode (optional, 5-10 alphanumeric)"
                                variant="outlined"
                                fullWidth
                                value={input.shortcode}
                                onChange={(e) => handleInputChange(index, 'shortcode', e.target.value)}
                                disabled={input.loading}
                            />
                            <Button
                                variant="contained"
                                onClick={() => handleShortenUrl(index)}
                                disabled={input.loading}
                                startIcon={input.loading ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {input.loading ? 'Shortening...' : 'Shorten URL'}
                            </Button>

                            {input.result && (
                                <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1, backgroundColor: '#e8f5e9' }}>
                                    <Typography variant="subtitle1" color="success.main">Shortened Successfully!</Typography>
                                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                        Original: <a href={input.result.originalUrl} target="_blank" rel="noopener noreferrer">{input.result.originalUrl}</a>
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Typography variant="body1" fontWeight="bold" sx={{ wordBreak: 'break-all' }}>
                                            Short URL: <a href={input.result.shortenedUrl} target="_blank" rel="noopener noreferrer">{input.result.shortenedUrl}</a>
                                        </Typography>
                                        <Button
                                            size="small"
                                            onClick={() => handleCopyClick(input.result.shortenedUrl)}
                                            startIcon={<ContentCopyIcon />}
                                        >
                                            Copy
                                        </Button>
                                    </Box>
                                    {input.result.expiry && (
                                        <Typography variant="body2" color="text.secondary">
                                            Expires: {new Date(input.result.expiry).toLocaleString()}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default UrlShortenerPage;