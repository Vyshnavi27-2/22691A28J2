// frontend-test-submission/src/App.js
import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { appLogger } from './logger'; // Import the custom frontend logger

// Import your page components (make sure these files exist in src/pages/)
import UrlShortenerPage from './pages/UrlShortenerPage';
import UrlStatisticsPage from './pages/UrlStatisticsPage';

function App() {
    // State to manage which page is currently displayed
    const [currentPage, setCurrentPage] = useState('shortener'); // 'shortener' or 'statistics'

    appLogger.info('App component rendered', { currentPage });

    // Function to render the active page component
    const renderPage = () => {
        switch (currentPage) {
            case 'shortener':
                return <UrlShortenerPage />;
            case 'statistics':
                return <UrlStatisticsPage />;
            default:
                // Fallback to shortener page if currentPage is somehow invalid
                return <UrlShortenerPage />;
        }
    };

    return (
        <React.Fragment>
            {/* AppBar (Navigation Bar) - Material UI component */}
            <AppBar position="static" sx={{ backgroundColor: '#20232a' }}>
                <Toolbar>
                    {/* Application Title */}
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Affordmed URL Shortener
                    </Typography>

                    {/* Navigation Button for URL Shortener Page */}
                    <Button
                        color="inherit"
                        onClick={() => {
                            setCurrentPage('shortener');
                            appLogger.info('Navigated to URL Shortener Page');
                        }}
                    >
                        Shorten URL
                    </Button>

                    {/* Navigation Button for URL Statistics Page */}
                    <Button
                        color="inherit"
                        onClick={() => {
                            setCurrentPage('statistics');
                            appLogger.info('Navigated to URL Statistics Page');
                        }}
                    >
                        View Statistics
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Main Content Area - Material UI Container for consistent layout */}
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ my: 4 }}>
                    {renderPage()} {/* Render the currently selected page */}
                </Box>
            </Container>
        </React.Fragment>
    );
}

export default App;
