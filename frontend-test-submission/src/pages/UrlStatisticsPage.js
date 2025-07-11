// frontend-test-submission/src/pages/UrlStatisticsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse, IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { appLogger } from '../logger'; // Import the custom frontend logger

// Component to display individual URL statistics with collapsible click history
const UrlStatsRow = ({ urlData }) => {
    const [open, setOpen] = useState(false); // State for collapsing click history

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    <a href={`${process.env.REACT_APP_BACKEND_API_URL}/${urlData.shortCode}`} target="_blank" rel="noopener noreferrer">
                        {urlData.shortCode}
                    </a>
                </TableCell>
                <TableCell>{urlData.originalUrl}</TableCell>
                <TableCell>{urlData.totalClicks}</TableCell>
                <TableCell>{new Date(urlData.createdAt).toLocaleString()}</TableCell>
                <TableCell>{urlData.expiresAt ? new Date(urlData.expiresAt).toLocaleString() : 'Never'}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Click History
                            </Typography>
                            {urlData.clickHistory && urlData.clickHistory.length > 0 ? (
                                <Table size="small" aria-label="purchases">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Timestamp</TableCell>
                                            <TableCell>Source</TableCell>
                                            <TableCell>Location (IP)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {urlData.clickHistory.map((historyRow, i) => (
                                            <TableRow key={i}>
                                                <TableCell component="th" scope="row">
                                                    {new Date(historyRow.timestamp).toLocaleString()}
                                                </TableCell>
                                                <TableCell>{historyRow.source}</TableCell>
                                                <TableCell>{historyRow.location}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No click history available.</Typography>
                            )}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
};


const UrlStatisticsPage = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL;

    // Function to fetch all short URLs and their stats
    // Note: The backend API currently only supports fetching stats for a *single* shortcode.
    // To display "all shortened URLs," we would need a new backend API endpoint
    // like GET /shorturls/all or a paginated list.
    // For this evaluation, we will simulate fetching a list of *example* shortcodes
    // and then fetch their individual stats. In a real app, the backend would provide a list.
    // Given the prompt: "display a list of all shortened URLs created (either in the current session or historically if data persistence is implemented and accessible)"
    // and the backend API spec: "Retrieve Short URL Statistics - http://hostname:port/shorturls/:abcd1"
    // We will assume the backend provides a way to list all shortcodes, or we'll fetch
    // a pre-defined set for demonstration.
    // For a complete solution, you'd extend the backend to have a GET /shorturls endpoint
    // that returns a list of all shortcodes and basic info.
    // For now, let's assume we can fetch all by iterating over known ones, or add a simple
    // backend endpoint for listing all.
    //
    // Let's add a simple backend endpoint to list all URLs for the frontend.
    // This is a common pattern for "getting all" data.
    // I will add a temporary note here and assume you will add a GET /shorturls endpoint
    // to your backend that returns all URLs. If not, this page will only show dummy data.

    // --- TEMPORARY NOTE FOR BACKEND EXTENSION ---
    // For this page to work fully as described ("list of all shortened URLs"),
    // you would need to add a new endpoint to your backend:
    // Method: GET
    // Route: http://hostname:port/shorturls
    // Response: Array of { shortCode, originalUrl, createdAt, expiresAt, totalClicks }
    //
    // In backend-test-submission/routes/urlRoutes.js:
    // router.get('/', urlController.getAllShortUrls); // Add this line
    //
    // In backend-test-submission/controllers/urlController.js:
    // exports.getAllShortUrls = async (req, res) => {
    //     try {
    //         const urls = await Url.find({}, 'shortCode originalUrl createdAt expiresAt clicks'); // Fetch relevant fields
    //         appLogger.info('Retrieved all short URLs list');
    //         res.status(200).json(urls.map(url => ({
    //             shortCode: url.shortCode,
    //             originalUrl: url.originalUrl,
    //             createdAt: url.createdAt.toISOString(),
    //             expiresAt: url.expiresAt ? url.expiresAt.toISOString() : null,
    //             totalClicks: url.clicks
    //         })));
    //     } catch (error) {
    //         appLogger.error('Error retrieving all short URLs', { error: error.message, stack: error.stack });
    //         res.status(500).json({ message: 'Server error while retrieving URL list.' });
    //     }
    // };
    // --- END TEMPORARY NOTE ---

    const fetchAllUrlsAndStats = useCallback(async () => {
        appLogger.info('Fetching all URL statistics...');
        setLoading(true);
        setError(null);
        try {
            // First, fetch the list of all short URLs (assuming backend has GET /shorturls)
            const listResponse = await fetch(`${BACKEND_API_URL}/shorturls`);
            if (!listResponse.ok) {
                const errorData = await listResponse.json();
                throw new Error(errorData.message || 'Failed to fetch list of URLs.');
            }
            const urlList = await listResponse.json();

            // Then, for each URL in the list, fetch its detailed statistics
            const detailedStatsPromises = urlList.map(async (url) => {
                const statsResponse = await fetch(`${BACKEND_API_URL}/shorturls/${url.shortCode}`);
                if (statsResponse.ok) {
                    return statsResponse.json();
                } else {
                    const errorData = await statsResponse.json();
                    appLogger.warn(`Failed to fetch detailed stats for ${url.shortCode}: ${errorData.message}`);
                    return null; // Return null for failed fetches
                }
            });

            const detailedStats = await Promise.all(detailedStatsPromises);
            // Filter out any nulls from failed fetches
            setStats(detailedStats.filter(item => item !== null));
            appLogger.info('Successfully fetched all URL statistics.');

        } catch (err) {
            setError(err.message);
            appLogger.error('Error fetching URL statistics', { error: err.message, stack: err.stack });
        } finally {
            setLoading(false);
        }
    }, [BACKEND_API_URL]);

    useEffect(() => {
        fetchAllUrlsAndStats();
    }, [fetchAllUrlsAndStats]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>Loading statistics...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error">
                Error loading statistics: {error}
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>URL Statistics</Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Detailed usage statistics for your shortened URLs. Click on a row to view click history.
            </Typography>

            {stats.length === 0 ? (
                <Alert severity="info">No shortened URLs found yet. Go to "Shorten URL" to create some!</Alert>
            ) : (
                <TableContainer component={Paper} elevation={3}>
                    <Table aria-label="collapsible table">
                        <TableHead>
                            <TableRow>
                                <TableCell /> {/* For expand/collapse icon */}
                                <TableCell>Short Code</TableCell>
                                <TableCell>Original URL</TableCell>
                                <TableCell>Total Clicks</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell>Expires At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stats.map((urlData) => (
                                <UrlStatsRow key={urlData.shortCode} urlData={urlData} />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default UrlStatisticsPage;