import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    // Brand color palette
    primary: {
      main: '#345B58', // Muted dark teal for buttons, switches, etc.
    },
    background: {
      default: '#F9F9F8', // Off-white/light beige background
    },
    text: {
      primary: '#2D3748', // Dark charcoal for primary text
      secondary: '#5A677D', // A softer grey for secondary text
    },
  },
  typography: {
    // Default font family
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700, // Bold headers
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    // Component overrides
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFF',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '8px', // Equivalent to padding 1
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        }
      }
    }
  },
});

export default theme;