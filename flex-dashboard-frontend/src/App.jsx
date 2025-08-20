import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import PropertyPage from './pages/PropertyPage';
import GoogleReviewsPage from './pages/GoogleReviewsPage';
import { Box, AppBar, Toolbar, Button, Typography } from '@mui/material';
import { Dashboard, Home, Reviews } from '@mui/icons-material';

export default function App() {
  return (
    <BrowserRouter>
      {/* Navigation bar */}
      <AppBar position="sticky" sx={{ backgroundColor: '#284E4C' }} elevation={1}>
        <Toolbar>
          {/* Logo link to property page */}
          <Box 
            component={Link} 
            to="/property" 
            sx={{ 
              flexGrow: 1, 
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none'
            }}
          >
            <img 
              src="/TheFlexWhite_V3 Symbol & Wordmark.png" 
              alt="The Flex" 
              style={{ 
                height: '32px', 
                objectFit: 'contain',
                cursor: 'pointer'
              }} 
            />
          </Box>
          
          <Button
            component={Link}
            to="/dashboard"
            startIcon={<Dashboard />}
            sx={{
              color: 'white',
              textTransform: 'none',
              mr: 2
            }}
          >
            Manager Dashboard
          </Button>

          <Button
            component={Link}
            to="/google-reviews"
            startIcon={<Reviews />}
            sx={{
              color: 'white',
              textTransform: 'none',
              mr: 2
            }}
          >
            Google Reviews
          </Button>
          
          <Button 
            component={Link} 
            to="/property" 
            startIcon={<Home />}
            sx={{ 
              color: 'white',
              textTransform: 'none'
            }}
          >
            Public Property Page
          </Button>
        </Toolbar>
      </AppBar>

      {/* Route configuration */}
      <Routes>
        <Route path="/dashboard/*" element={<DashboardPage />} />
        <Route path="/property" element={<PropertyPage />} />
        <Route path="/google-reviews" element={<GoogleReviewsPage />} />
        <Route path="/" element={<DashboardPage />} /> {/* Fallback route */}
      </Routes>
    </BrowserRouter>
  );
}