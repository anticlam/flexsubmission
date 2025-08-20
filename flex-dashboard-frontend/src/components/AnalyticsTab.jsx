import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  Tooltip,
  Autocomplete,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Popper,
} from '@mui/material';
import {
  Star,
  Home,
  RateReview,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { PieChart } from '@mui/x-charts/PieChart';
import { RadarChart } from '@mui/x-charts/RadarChart';
import { LineChart } from '@mui/x-charts/LineChart';

const COLORS = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'];

// Custom Popper for dropdown width
const CustomPopper = (props) => {
  return (
    <Popper
      {...props}
      style={{
        ...props.style,
        minWidth: '300px', // Minimum dropdown width
      }}
      placement="bottom-start"
    />
  );
};

const AnalyticsTab = ({ reviews, onNavigateToReviews }) => {
  const [selectedProperty, setSelectedProperty] = useState('all');

  const uniqueProperties = useMemo(() => 
    ['All Properties', ...[...new Set(reviews.map(r => r.listingName))]]
  , [reviews]);

  const analytics = useMemo(() => {
    const filteredReviews = selectedProperty === 'all' 
      ? reviews 
      : reviews.filter(r => r.listingName === selectedProperty);

    if (!filteredReviews || filteredReviews.length === 0) return null;

    // Dynamically detect categories from actual data
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

    const propertyStats = {};
    
    // Initialize category averages dynamically
    const availableCategories = detectCategories(filteredReviews);
    const categoryAverages = {};
    availableCategories.forEach(category => {
      categoryAverages[category] = { total: 0, count: 0 };
    });
    const ratingDistribution = { 'Excellent (9-10)': 0, 'Good (7-8)': 0, 'Average (5-6)': 0, 'Poor (1-4)': 0 };

    filteredReviews.forEach(review => {
      const property = review.listingName;
      if (!propertyStats[property]) {
        propertyStats[property] = {
          totalReviews: 0, totalRating: 0, lowRatings: 0
        };
      }
      propertyStats[property].totalReviews++;

      if (review.rating) {
        propertyStats[property].totalRating += review.rating;
        if (review.rating >= 9) ratingDistribution['Excellent (9-10)']++;
        else if (review.rating >= 7) ratingDistribution['Good (7-8)']++;
        else if (review.rating >= 5) ratingDistribution['Average (5-6)']++;
        else ratingDistribution['Poor (1-4)']++;
      }

      if (review.reviewCategory && review.reviewCategory.length > 0) {
        review.reviewCategory.forEach(cat => {
          if (categoryAverages[cat.category]) {
            categoryAverages[cat.category].total += cat.rating;
            categoryAverages[cat.category].count++;
            if (cat.rating <= 6) propertyStats[property].lowRatings++;
          }
        });
      }
    });

    const totalReviews = filteredReviews.length;
    const reviewsWithRating = filteredReviews.filter(r => r.rating);
    const overallAverage = reviewsWithRating.length > 0
      ? reviewsWithRating.reduce((sum, r) => sum + r.rating, 0) / reviewsWithRating.length
      : 0;

    const categoryChartData = Object.entries(categoryAverages)
      .map(([name, { total, count }]) => ({
        subject: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        A: count > 0 ? (total / count) : 0,
        fullMark: 10,
      }));

    const ratingPieData = Object.entries(ratingDistribution)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0);

    const propertiesByRating = Object.entries(propertyStats)
      .map(([name, stats]) => ({
        name,
        ...stats,
        averageRating: stats.totalReviews > 0 ? stats.totalRating / stats.totalReviews : 0,
      }))
      .sort((a, b) => b.averageRating - a.averageRating);

    // Compute average rating over time
    const timeSeriesData = filteredReviews
      .filter(review => review.submittedAt && review.rating)
      .map(review => ({
        date: new Date(review.submittedAt),
        rating: review.rating
      }))
      .sort((a, b) => a.date - b.date);

    // Group by month and calculate averages
    const monthlyAverages = timeSeriesData.reduce((acc, { date, rating }) => {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, count: 0, date: new Date(date.getFullYear(), date.getMonth(), 1) };
      }
      acc[monthKey].total += rating;
      acc[monthKey].count += 1;
      return acc;
    }, {});

    const ratingOverTimeData = Object.values(monthlyAverages)
      .map(({ total, count, date }) => ({
        date,
        averageRating: total / count
      }))
      .sort((a, b) => a.date - b.date);

    return {
      totalReviews,
      overallAverage,
      uniquePropertiesCount: Object.keys(propertyStats).length,
      categoryChartData,
      ratingPieData,
      propertiesByRating,
      ratingOverTimeData,
    };
  }, [reviews, selectedProperty]);

  if (!analytics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">No data available for the selected property.</Typography>
      </Box>
    );
  }

  const { 
    totalReviews, overallAverage, uniquePropertiesCount, 
    categoryChartData, ratingPieData, propertiesByRating, ratingOverTimeData 
  } = analytics || {};

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: '100%', width: '100%', zoom: 0.9 }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Analytics Dashboard
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            fullWidth
            options={uniqueProperties}
            value={selectedProperty === 'all' ? 'All Properties' : selectedProperty}
            onChange={(event, newValue) => {
              setSelectedProperty(newValue === 'All Properties' ? 'all' : newValue || 'all');
            }}
            PopperComponent={CustomPopper}
            renderInput={(params) => 
              <TextField 
                {...params} 
                label="Filter by Property" 
                variant="outlined"
                sx={{ minWidth: '200px' }}
              />
            }
          />
        </Grid>
      </Grid>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card component={Paper} elevation={2} sx={{ textAlign: 'center', p: 2 }}><CardContent>
            <Star sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{overallAverage.toFixed(1)}</Typography>
            <Typography variant="body1" color="text.secondary">Overall Avg Rating</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card 
            component={Paper} 
            elevation={2} 
            sx={{ 
              textAlign: 'center', 
              p: 2,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                elevation: 4,
                transform: 'translateY(-2px)',
                backgroundColor: 'primary.light',
                '& .MuiTypography-root': {
                  color: 'white'
                },
                '& .MuiSvgIcon-root': {
                  color: 'white'
                }
              }
            }}
            onClick={() => {
              if (onNavigateToReviews) {
                onNavigateToReviews(selectedProperty === 'all' ? 'all' : selectedProperty);
              }
            }}
          >
            <CardContent>
              <RateReview sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{totalReviews}</Typography>
              <Typography variant="body1" color="text.secondary">Total Reviews</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card component={Paper} elevation={2} sx={{ textAlign: 'center', p: 2 }}><CardContent>
            <Home sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{uniquePropertiesCount}</Typography>
            <Typography variant="body1" color="text.secondary">Properties</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Card component={Paper} elevation={2} sx={{ height: '100%', p: 2 }}><CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Rating Distribution</Typography>
            <Box sx={{ height: 350, overflow: 'visible' }}>
              <PieChart
                series={[
                  {
                    data: ratingPieData.map((item, index) => ({
                      id: index,
                      value: item.value,
                      label: `${item.name} (${item.value})`,
                      color: COLORS[index % COLORS.length]
                    })),
                  },
                ]}
                width={400}
                height={350}
                margin={{ top: 20, right: 60, bottom: 20, left: 60 }}
              />
            </Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card component={Paper} elevation={2} sx={{ height: '100%', p: 2 }}><CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Category Performance</Typography>
            <Box sx={{ height: 350, overflow: 'visible' }}>
              <RadarChart
                height={350}
                width={400}
                series={[{
                  label: selectedProperty === 'all' ? 'All Properties' : selectedProperty,
                  data: categoryChartData.map(item => item.A),
                  color: '#8884d8',
                }]}
                radar={{ max: 10, metrics: categoryChartData.map(item => item.subject) }}
                margin={{ top: 20, right: 60, bottom: 20, left: 60 }}
              />
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Average Rating Over Time Chart */}
        {ratingOverTimeData && ratingOverTimeData.length > 0 && (
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Card component={Paper} elevation={2} sx={{ p: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Average Rating Over Time
                </Typography>
                <Box sx={{ height: 350, overflow: 'visible' }}>
                  <LineChart
                    height={350}
                    series={[
                      {
                        data: ratingOverTimeData.map(item => item.averageRating),
                        label: selectedProperty === 'all' ? 'All Properties' : selectedProperty,
                        color: '#2196F3',
                        area: true,
                      },
                    ]}
                    xAxis={[
                      {
                        data: ratingOverTimeData.map(item => item.date),
                        scaleType: 'time',
                        valueFormatter: (date) => {
                          return date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short' 
                          });
                        },
                      },
                    ]}
                    yAxis={[
                      {
                        min: 0,
                        max: 10,
                        valueFormatter: (value) => value.toFixed(1),
                      },
                    ]}
                    margin={{ top: 20, right: 60, bottom: 60, left: 60 }}
                    grid={{ vertical: true, horizontal: true }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Property Performance Table */}
        {selectedProperty === 'all' && propertiesByRating.length > 0 && (
          <Grid item xs={12} sx={{ mt: 4 }}>
            <Card component={Paper} elevation={2}><CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Property Performance Summary</Typography>
              <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 440 }}>
                  <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Property</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Avg Rating</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total Reviews</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Issues Detected</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {propertiesByRating.map((prop) => (
                        <TableRow hover role="checkbox" tabIndex={-1} key={prop.name}>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                cursor: 'pointer',
                                color: 'primary.main',
                                fontWeight: 'medium',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: 'primary.dark',
                                },
                                transition: 'color 0.2s ease-in-out'
                              }}
                              onClick={() => setSelectedProperty(prop.name)}
                            >
                              {prop.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={prop.averageRating.toFixed(1)} 
                              color={prop.averageRating >= 8 ? 'success' : prop.averageRating >= 6 ? 'warning' : 'error'}
                              size="small"
                              icon={<Star />}
                            />
                          </TableCell>
                          <TableCell align="center">{prop.totalReviews}</TableCell>
                          <TableCell align="center">
                            {prop.lowRatings > 0 ? (
                              <Tooltip title={`${prop.lowRatings} low ratings (<=6) detected`}>
                                <Chip label={prop.lowRatings} color="error" size="small" icon={<Warning />} />
                              </Tooltip>
                            ) : (
                              <CheckCircle color="success" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </CardContent></Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default AnalyticsTab;
