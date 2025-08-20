import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Autocomplete,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Divider,
  Stack,
  InputAdornment,
  Collapse,
  Fade
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

// Debounce helper for API calls
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const GoogleReviewsPage = () => {
  const [query, setQuery] = useState('');
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [results, setResults] = useState([]);
  const [expandedPlace, setExpandedPlace] = useState(null); // Selected place details
  const [expandedPlaceId, setExpandedPlaceId] = useState(null); // Track expanded place
  const [loading, setLoading] = useState(false);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(null); // Track place loading state
  const [error, setError] = useState(null);
  const [selectedAutocompleteValue, setSelectedAutocompleteValue] = useState(null);
  
  const searchInputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300); // 300ms debounce delay

  // Fetch autocomplete suggestions when the user types
  useEffect(() => {
    const fetchAutocomplete = async () => {
      if (debouncedQuery && debouncedQuery.length >= 2) {
        setAutocompleteLoading(true);
        try {
          const res = await axios.get('http://localhost:3001/api/google-places/autocomplete', {
            params: { 
              input: debouncedQuery,
              types: 'establishment' // Business or property results
            }
          });
          if (res.data.status === 'success') {
            setAutocompleteOptions(res.data.predictions || []);
          }
        } catch (error) {
          console.log('Autocomplete error:', error);
          setAutocompleteOptions([]);
        } finally {
          setAutocompleteLoading(false);
        }
      } else {
        setAutocompleteOptions([]);
      }
    };

    fetchAutocomplete();
  }, [debouncedQuery]);

  const handleSearch = async (searchQuery) => {
    const queryToSearch = searchQuery || query;
    if (!queryToSearch || !queryToSearch.trim()) return;
    
    setLoading(true);
    setError(null);
    setResults([]);
    setExpandedPlace(null); // Reset expanded place for new search
    setExpandedPlaceId(null);
    
    try {
      const res = await axios.get('http://localhost:3001/api/google-places/search', {
        params: { query: queryToSearch.trim() }
      });
      if (res.data.status === 'success') {
        setResults(res.data.results);
        if (res.data.results.length === 0) {
          setError('No places found for your search query.');
        }
      } else {
        setError('Search failed');
      }
    } catch {
      setError('Search failed - please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  };

  const handleAutocompleteSelect = (event, newValue) => {
    if (newValue) {
      setSelectedAutocompleteValue(newValue);
      setQuery(newValue.description);
      // Search immediately when an option is chosen
      setTimeout(() => handleSearch(newValue.description), 100);
    }
  };

  const loadDetails = async (placeId) => {
    // Collapse if the same place is selected again
    if (expandedPlaceId === placeId) {
      setExpandedPlace(null);
      setExpandedPlaceId(null);
      return;
    }

    setLoadingDetails(placeId);
    setError(null);
    
    try {
      const res = await axios.get(`http://localhost:3001/api/google-places/reviews/${placeId}`);
      if (res.data.status === 'success') {
        setExpandedPlace(res.data.data);
        setExpandedPlaceId(placeId);
      } else {
        setError('Failed to load details');
      }
    } catch {
      setError('Failed to load details');
    } finally {
      setLoadingDetails(null);
    }
  };


  return (
    <Box sx={{ backgroundColor: '#FFFDF6', py: 4, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          Google Reviews Explorer
        </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Search for properties and businesses to explore their Google reviews. 
        Use this tool to research competitive analysis and understand guest feedback patterns.
      </Typography>

      {/* Search Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Stack spacing={3}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon color="primary" />
            Search Places
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Autocomplete
              fullWidth
              freeSolo
              options={autocompleteOptions}
              value={selectedAutocompleteValue}
              onChange={handleAutocompleteSelect}
              onInputChange={(event, newInputValue) => {
                setQuery(newInputValue);
                if (!newInputValue) {
                  setSelectedAutocompleteValue(null);
                }
              }}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.description || '';
              }}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {option.structured_formatting?.main_text || option.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.structured_formatting?.secondary_text || ''}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    {option.types?.slice(0, 3).map((type, idx) => (
                      <Chip 
                        key={idx} 
                        label={type.replace(/_/g, ' ')} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: '20px' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
              loading={autocompleteLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  ref={searchInputRef}
                  label="Search for places, properties, or businesses"
                  placeholder="Try 'hotels in London' or 'restaurants near me'"
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {autocompleteLoading && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />
            
            <Button 
              variant="contained" 
              onClick={() => handleSearch()}
              disabled={loading || !query || !query.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ 
                minWidth: '120px',
                height: '56px', // Match text field height
                whiteSpace: 'nowrap'
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            💡 Tip: Press Enter to search, or select from autocomplete suggestions
          </Typography>
        </Stack>
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SearchIcon color="primary" />
              Search Results ({results.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Click on any result to view Google reviews
            </Typography>
          </Box>
          <List sx={{ p: 0 }}>
            {results.map((place, index) => (
              <React.Fragment key={place.place_id}>
                <ListItem
                  component="button"
                  onClick={() => loadDetails(place.place_id)}
                  sx={{ 
                    py: 2,
                    border: 'none',
                    background: 'transparent',
                    width: '100%',
                    textAlign: 'left',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    '&:hover': { 
                      backgroundColor: 'action.hover',
                      cursor: 'pointer'
                    },
                    ...(expandedPlaceId === place.place_id && {
                      backgroundColor: 'action.selected'
                    })
                  }}
                >
                  {/* Main Place Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" component="span">
                            {place.name}
                          </Typography>
                          {place.rating && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StarIcon sx={{ color: '#ffa726', fontSize: '1.2rem' }} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {place.rating}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ({place.user_ratings_total || 0} reviews)
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                      secondary={
                        <Stack spacing={1} sx={{ mt: 1 }} component="div">
                          <Typography variant="body2" color="text.secondary" component="div">
                            📍 {place.formatted_address}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {place.types?.slice(0, 4).map((type, idx) => (
                              <Chip 
                                key={idx} 
                                label={type.replace(/_/g, ' ')} 
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </Box>
                        </Stack>
                      }
                    />
                    
                    {/* Expand/Collapse Icon */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                      {loadingDetails === place.place_id && (
                        <CircularProgress size={20} />
                      )}
                      {expandedPlaceId === place.place_id ? (
                        <ExpandLessIcon color="primary" />
                      ) : (
                        <ExpandMoreIcon color="action" />
                      )}
                    </Box>
                  </Box>

                  {/* Expanded Review Details */}
                  <Collapse in={expandedPlaceId === place.place_id} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                      {expandedPlace && (
                        <Fade in={expandedPlaceId === place.place_id}>
                          <Box>
                            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
                              Google Reviews for {expandedPlace.place_name}
                            </Typography>
                            
                            {expandedPlace.overall_rating && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                                <StarIcon sx={{ color: '#ffa726', fontSize: '1.5rem' }} />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  {expandedPlace.overall_rating}
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                  ({expandedPlace.total_ratings} total reviews)
                                </Typography>
                              </Box>
                            )}
                            
                            {expandedPlace.reviews.length > 0 ? (
                              <Stack spacing={2}>
                                {expandedPlace.reviews.map((review, idx) => (
                                  <Paper key={idx} variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                                    <Stack spacing={1.5}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box>
                                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                            {review.author_name}
                                          </Typography>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {[...Array(5)].map((_, starIdx) => (
                                              <StarIcon
                                                key={starIdx}
                                                sx={{
                                                  fontSize: '1rem',
                                                  color: starIdx < review.rating ? '#ffa726' : '#e0e0e0'
                                                }}
                                              />
                                            ))}
                                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                              {review.relative_time_description}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Box>
                                      
                                      {review.text && (
                                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                                          {review.text}
                                        </Typography>
                                      )}
                                    </Stack>
                                  </Paper>
                                ))}
                              </Stack>
                            ) : (
                              <Alert severity="info">
                                No reviews are publicly available for this place.
                              </Alert>
                            )}
                          </Box>
                        </Fade>
                      )}
                    </Box>
                  </Collapse>
                </ListItem>
                {index < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Loading State */}
      {loading && !results.length && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={40} />
        </Box>
      )}
      </Container>
    </Box>
  );
};

export default GoogleReviewsPage;