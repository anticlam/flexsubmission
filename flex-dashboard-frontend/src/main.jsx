import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Global styles are handled by MUI
// import './index.css'

// Import ThemeProvider, CssBaseline, and the custom theme
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Provide the theme to all components */}
    <ThemeProvider theme={theme}>
      {/* Apply baseline CSS and background color */}
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)