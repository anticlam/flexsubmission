import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, Card, CardContent, Chip, Box, CircularProgress, 
  Grid, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Slider, Divider, Autocomplete, TextField, Tabs, Tab
} from '@mui/material';
import AnalyticsTab from '../components/AnalyticsTab';

// Review card component
const ReviewCard = ({ review, onToggleDisplay }) => (
  <Card sx={{ mb: 2, width: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6">{review.listingName}</Typography>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            By {review.guestName} on {new Date(review.submittedAt).toLocaleDateString()} via Hostaway
          </Typography>
        </Box>
        <Chip label={`Overall: ${review.rating || 'N/A'}`} color="primary" />
      </Box>
      
      {/* Category Ratings Display */}
      {review.reviewCategory && review.reviewCategory.length > 0 && (
        <Box sx={{ my: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
          <Grid container spacing={1}>
            {review.reviewCategory.map(cat => (
              <Grid item xs="auto" key={cat.category}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {cat.category.replace('_', ' ')}:
                  </Typography>
                  <Chip 
                    label={`${cat.rating}/10`} 
                    size="small" 
                    color={cat.rating >= 9 ? 'success' : cat.rating >= 7 ? 'warning' : 'error'}
                    variant="outlined"
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      <Typography variant="body1" sx={{ my: 2 }}>
        {review.publicReview}
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={review.displayOnWebsite}
            onChange={() => onToggleDisplay(review.id)}
            color="success"
          />
        }
        label="Show on public website"
      />
    </CardContent>
  </Card>
);


export default function DashboardPage() {
  // Router hooks
  const location = useLocation();
  const navigate = useNavigate();
  
  // State management
  const [reviews, setReviews] = useState([]); // Original, unmodified list from API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Determine current tab from URL
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/analytics')) return 1;
    return 0; // Default to reviews management
  };
  
  const currentTab = getCurrentTab();

  // Helper function to detect available categories from reviews
  const detectCategories = (reviews) => {
    const categories = new Set();
    reviews.forEach(review => {
      if (Array.isArray(review.reviewCategory)) {
        review.reviewCategory.forEach(cat => {
          if (cat && cat.category) {
            categories.add(cat.category);
          }
        });
      }
    });
    return Array.from(categories).sort();
  };

  // State for our filter and sort controls
  const [propertyFilter, setPropertyFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [publicDisplayFilter, setPublicDisplayFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category range filters (dynamically initialized from actual data)
  const [categoryFilters, setCategoryFilters] = useState({});

  // URL routing effect
  useEffect(() => {
    // Handle initial URL routing and default redirects
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/') {
      // Default to reviews management tab
      navigate('/dashboard/reviews', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Data fetching
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/reviews/hostaway');
        
        // Handle Hostaway API format: {status: "success", result: [...]}
        if (response.data.status === "success") {
          console.log(`📊 Loaded ${response.data.result.length} reviews from Hostaway API`);
          setReviews(response.data.result);
          
          // Initialize category filters dynamically from actual data
          const availableCategories = detectCategories(response.data.result);
          const initialCategoryFilters = {};
          availableCategories.forEach(category => {
            initialCategoryFilters[category] = [0, 10];
          });
          setCategoryFilters(initialCategoryFilters);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        setError('Failed to fetch reviews. Is the backend server running?');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Event handlers
  const handleDisplayToggle = async (reviewId) => {
    // Find the current review to get its current state
    const currentReview = reviews.find(review => review.id === reviewId);
    if (!currentReview) return;

    const newDisplayStatus = !currentReview.displayOnWebsite;

    try {
      // Call the API to persist the change
      const response = await axios.put(`http://localhost:3001/api/reviews/${reviewId}/approval`, {
        displayOnWebsite: newDisplayStatus
      });

      if (response.status === 200) {
        // Update the local state only after successful API call
        setReviews(currentReviews =>
          currentReviews.map(review =>
            review.id === reviewId
              ? { ...review, displayOnWebsite: newDisplayStatus }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Failed to update review approval status:', error);
    }
  };

  // Derived state & memoization
  // These values are calculated from the original 'reviews' state
  const uniqueProperties = useMemo(() => [...new Set(reviews.map(r => r.listingName))], [reviews]);
  const uniqueChannels = useMemo(() => ['Hostaway'], []); // Currently only Hostaway reviews

  // Core logic: applying filters and sorting.
  const displayableReviews = useMemo(() => {
    let processedReviews = [...reviews];

    // 1. Apply Filters
    if (propertyFilter !== 'all') {
      processedReviews = processedReviews.filter(r => r.listingName === propertyFilter);
    }
    if (channelFilter !== 'all') {
      processedReviews = processedReviews.filter(() => 'Hostaway' === channelFilter);
    }
    if (publicDisplayFilter !== 'all') {
      if (publicDisplayFilter === 'shown') {
        processedReviews = processedReviews.filter(review => review.displayOnWebsite === true);
      } else if (publicDisplayFilter === 'hidden') {
        processedReviews = processedReviews.filter(review => review.displayOnWebsite === false);
      }
      // If 'all', no filtering needed
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      processedReviews = processedReviews.filter(review => 
        review.publicReview?.toLowerCase().includes(query) ||
        review.guestName?.toLowerCase().includes(query) ||
        review.listingName?.toLowerCase().includes(query)
      );
    }
    
    // Apply category range filters
    processedReviews = processedReviews.filter(review => {
      if (!review.reviewCategory) return true;
      
      return Object.entries(categoryFilters).every(([category, [minRating, maxRating]]) => {
        if (minRating === 0 && maxRating === 10) return true; // No filter applied
        
        // Gracefully handle missing categories - don't filter out the review
        if (!Array.isArray(review.reviewCategory)) return true;
        
        const categoryRating = review.reviewCategory.find(cat => cat.category === category);
        if (!categoryRating) return true; // Skip filtering for missing categories instead of excluding
        
        return categoryRating.rating >= minRating && categoryRating.rating <= maxRating;
      });
    });

    // 2. Apply Sorting
    switch (sortBy) {
      case 'date-desc':
        processedReviews.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        break;
      case 'date-asc':
        processedReviews.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
        break;
      case 'rating-desc':
        processedReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'rating-asc':
        processedReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      // Category-specific sorting (dynamic for any category)
      default: {
        // Check if it's a category sorting format (category-direction)
        if (sortBy.includes('-') && (sortBy.endsWith('-desc') || sortBy.endsWith('-asc'))) {
          const [categoryName, direction] = sortBy.split('-');
          processedReviews.sort((a, b) => {
            const aCategory = Array.isArray(a.reviewCategory) ? a.reviewCategory.find(cat => cat.category === categoryName) : null;
            const bCategory = Array.isArray(b.reviewCategory) ? b.reviewCategory.find(cat => cat.category === categoryName) : null;
            
            // Handle missing categories by sorting them to the end
            if (!aCategory && !bCategory) return 0;
            if (!aCategory) return 1; // a goes to end
            if (!bCategory) return -1; // b goes to end
            
            const aRating = aCategory.rating;
            const bRating = bCategory.rating;
            return direction === 'desc' ? bRating - aRating : aRating - bRating;
          });
        }
        break;
      }
    }

    return processedReviews;
  }, [reviews, propertyFilter, channelFilter, publicDisplayFilter, searchQuery, categoryFilters, sortBy]);

  // --- Render Logic ---
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" sx={{ mt: 5 }}>{error}</Typography>
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    if (newValue === 0) {
      navigate('/dashboard/reviews');
    } else if (newValue === 1) {
      navigate('/dashboard/analytics');
    }
  };

  // Function to navigate to Reviews Management with property filter
  const navigateToReviewsWithFilter = (propertyName) => {
    setPropertyFilter(propertyName);
    navigate('/dashboard/reviews');
  };

  return (
    <Box sx={{ backgroundColor: '#FFFDF6', py: 4, minHeight: 'calc(100vh - 64px)' }}>
      <Container maxWidth={false} sx={{ px: { xs: 4, sm: 6, md: 8 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reviews Dashboard
        </Typography>
        
        {/* Tab navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="dashboard tabs">
            <Tab label="Reviews Management" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        {/* Tab content */}
        {currentTab === 0 && (
          <Grid container spacing={3}>
            {/* Left sidebar: category range filters */}
            <Grid size={{ xs: 12, lg: 3 }}>
              <Card sx={{ position: 'sticky', top: 20 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Category Filters
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Set minimum thresholds for each category
                  </Typography>
                  
                  {Object.entries(categoryFilters).map(([category, [min, max]]) => (
                    <Box key={category} sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ mb: 1, textTransform: 'capitalize' }}>
                        {category.replace('_', ' ')}: {min === 0 && max === 10 ? 'Any' : `${min} - ${max}`}
                      </Typography>
                      <Slider
                        value={[min, max]}
                        onChange={(e, newValue) => setCategoryFilters(prev => ({ ...prev, [category]: newValue }))}
                        min={0}
                        max={10}
                        step={1}
                        marks={[
                          { value: 0, label: '0' },
                          { value: 5, label: '5' },
                          { value: 10, label: '10' }
                        ]}
                        valueLabelDisplay="auto"
                        color={min >= 8 ? 'success' : min >= 6 ? 'warning' : 'primary'}
                      />
                    </Box>
                  ))}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary">
                    Showing {displayableReviews.length} of {reviews.length} reviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* --- Main Content Area --- */}
            <Grid size={{ xs: 12, lg: 9 }}>
              {/* Search bar */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search reviews by content, guest name, or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Box>
              
              {/* Top controls */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Autocomplete
                    fullWidth
                    autoHighlight
                    options={['All Properties', ...uniqueProperties]}
                    value={propertyFilter === 'all' ? 'All Properties' : propertyFilter}
                    onChange={(event, newValue) => {
                      setPropertyFilter(newValue === 'All Properties' ? 'all' : newValue || 'all');
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Filter by Property" variant="outlined" />
                    )}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option =>
                        option.toLowerCase().includes(inputValue.toLowerCase())
                      );
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Autocomplete
                    fullWidth
                    autoHighlight
                    options={['All Channels', ...uniqueChannels]}
                    value={channelFilter === 'all' ? 'All Channels' : channelFilter}
                    onChange={(event, newValue) => {
                      setChannelFilter(newValue === 'All Channels' ? 'all' : newValue || 'all');
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Filter by Channel" variant="outlined" />
                    )}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option =>
                        option.toLowerCase().includes(inputValue.toLowerCase())
                      );
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Autocomplete
                    fullWidth
                    autoHighlight
                    options={[
                      { value: 'all', label: 'All Reviews' },
                      { value: 'shown', label: 'Shown on Public Site' },
                      { value: 'hidden', label: 'Hidden from Public Site' }
                    ]}
                    value={[
                      { value: 'all', label: 'All Reviews' },
                      { value: 'shown', label: 'Shown on Public Site' },
                      { value: 'hidden', label: 'Hidden from Public Site' }
                    ].find(option => option.value === publicDisplayFilter) || { value: 'all', label: 'All Reviews' }}
                    onChange={(event, newValue) => {
                      setPublicDisplayFilter(newValue?.value || 'all');
                    }}
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                      <TextField {...params} label="Public Display Status" variant="outlined" />
                    )}
                    filterOptions={(options, { inputValue }) => {
                      return options.filter(option =>
                        option.label.toLowerCase().includes(inputValue.toLowerCase())
                      );
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  {(() => {
                    // Create dynamic sort options based on available categories
                    const baseSortOptions = [
                      { value: 'date-desc', label: 'Date (Newest First)' },
                      { value: 'date-asc', label: 'Date (Oldest First)' },
                      { value: 'rating-desc', label: 'Overall Rating (High to Low)' },
                      { value: 'rating-asc', label: 'Overall Rating (Low to High)' }
                    ];
                    
                    // Add category-specific sorting options dynamically
                    const categorySortOptions = Object.keys(categoryFilters).flatMap(category => [
                      { 
                        value: `${category}-desc`, 
                        label: `${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')} (High to Low)` 
                      },
                      { 
                        value: `${category}-asc`, 
                        label: `${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')} (Low to High)` 
                      }
                    ]);
                    
                    const sortOptions = [...baseSortOptions, ...categorySortOptions];
                    
                    return (
                      <Autocomplete
                        fullWidth
                        autoHighlight
                        options={sortOptions}
                        value={sortOptions.find(option => option.value === sortBy) || sortOptions[0]}
                        onChange={(event, newValue) => {
                          setSortBy(newValue?.value || 'date-desc');
                        }}
                        getOptionLabel={(option) => option.label}
                        renderInput={(params) => (
                          <TextField {...params} label="Sort By" variant="outlined" />
                        )}
                        filterOptions={(options, { inputValue }) => {
                          return options.filter(option =>
                            option.label.toLowerCase().includes(inputValue.toLowerCase())
                          );
                        }}
                      />
                    );
                  })()}
                </Grid>
              </Grid>
              
              {/* Review list */}
              <Box sx={{ mt: 3 }}>
                {displayableReviews.length > 0 ? (
                  displayableReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} onToggleDisplay={handleDisplayToggle} />
                  ))
                ) : (
                  <Typography>No reviews match the current filters.</Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        )}
        
        {/* Analytics tab */}
        {currentTab === 1 && (
          <AnalyticsTab 
            reviews={reviews} 
            onNavigateToReviews={navigateToReviewsWithFilter}
          />
        )}
      </Container>
    </Box>
  );
}