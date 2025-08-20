import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Container, Typography, Box, Grid, Card, CardContent, Chip, Stack,
  Button, TextField, Select, MenuItem, InputAdornment
} from '@mui/material';
import { 
  People, Bed, Bathtub, Chair, Wifi, Kitchen, AcUnit,
  CalendarToday, ChatBubbleOutline, ShieldOutlined
} from '@mui/icons-material';

// Mock data for the property
const propertyData = {
  name: '2 Bed Balcony Flat Chelsea Harbour',
  guests: 5,
  bedrooms: 2,
  bathrooms: 1,
  beds: 3,
  description: "This apartment in Chelsea Harbour is in an amazing location. It's spacious, bright, and fitted with top-quality amenities to make your stay comfortable. The area is peaceful yet close to shops, restaurants, and the river. It's a fantastic spot for anyone looking for a touch of luxury and convenience...",
  amenities: [
    { name: 'Wifi', icon: <Wifi /> },
    { name: 'Kitchen', icon: <Kitchen /> },
    { name: 'Air Conditioning', icon: <AcUnit /> },
    { name: 'Heating', icon: <Chair /> },
  ],
};

const StatItem = ({ icon, value, label }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    {icon}
    <Typography variant="body1">
      {value} {label}
    </Typography>
  </Stack>
);

const PropertyPage = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/reviews/hostaway')
      .then(response => { 
        // Handle Hostaway API format: {status: "success", result: [...]}
        if (response.data.status === "success") {
          console.log(`📊 Property page loaded ${response.data.result.length} reviews from Hostaway API`);
          setReviews(response.data.result);
        } else {
          console.error("Invalid API response format");
        }
      })
      .catch(error => { console.error("Failed to fetch reviews:", error); });
  }, []);

  const approvedReviews = useMemo(() => {
    // In production this would use a property ID, but for now we match the name.
    return reviews.filter(review =>
      review.listingName === "2 Bed Balcony Flat Chelsea Harbour" && review.displayOnWebsite
    );
  }, [reviews]);

  return (
    // Page container with background color and padding
    <Box sx={{ backgroundColor: '#FFFDF6', py: 4, minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 4, sm: 6, md: 8 } }}>

        {/* Image gallery */}
        <Box 
          sx={{ 
            mb: 3, 
            height: { xs: '300px', sm: '400px', md: '500px' }, 
            borderRadius: '16px', 
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            gap: '2px'
          }}
        >
          {/* Main large image - Living Room */}
          <Box 
            component="img"
            src="/2-bed-balcony-flat-chelsea-harbor-images/livingroom.jpg"
            alt="Living room with modern furnishing and balcony access"
            sx={{ 
              width: 'calc(50% - 1px)', 
              height: '100%',
              objectFit: 'cover',
              cursor: 'pointer',
              transition: 'transform 0.3s ease-in-out',
              borderRadius: '6px',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }} 
          />
          
          {/* Grid of 4 larger images */}
          <Box sx={{ 
            width: 'calc(50% - 1px)',
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px' 
          }}>
            {/* Top row */}
            <Box sx={{ 
              height: 'calc(50% - 1px)', 
              display: 'flex', 
              gap: '2px' 
            }}>
              <Box 
                component="img"
                src="/2-bed-balcony-flat-chelsea-harbor-images/balcony.jpg"
                alt="Private balcony with stunning harbor views"
                sx={{ 
                  width: 'calc(50% - 1px)',
                  height: '100%', 
                  objectFit: 'cover',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-in-out',
                  borderRadius: '6px',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }} 
              />
              <Box 
                component="img"
                src="/2-bed-balcony-flat-chelsea-harbor-images/bedroom.jpg"
                alt="Master bedroom with comfortable bedding"
                sx={{ 
                  width: 'calc(50% - 1px)',
                  height: '100%', 
                  objectFit: 'cover',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-in-out',
                  borderRadius: '6px',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }} 
              />
            </Box>
            
            {/* Bottom row */}
            <Box sx={{ 
              height: 'calc(50% - 1px)', 
              display: 'flex', 
              gap: '2px' 
            }}>
              <Box 
                component="img"
                src="/2-bed-balcony-flat-chelsea-harbor-images/bedroom2.jpg"
                alt="Second bedroom with natural lighting"
                sx={{ 
                  width: 'calc(50% - 1px)',
                  height: '100%', 
                  objectFit: 'cover',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-in-out',
                  borderRadius: '6px',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }} 
              />
              <Box 
                component="img"
                src="/2-bed-balcony-flat-chelsea-harbor-images/shower.jpg"
                alt="Modern bathroom with shower facilities"
                sx={{ 
                  width: 'calc(50% - 1px)',
                  height: '100%', 
                  objectFit: 'cover',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease-in-out',
                  borderRadius: '6px',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }} 
              />
            </Box>
          </Box>
        </Box>

        {/* Property title and stats */}
        <Box sx={{ px: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            {propertyData.name}
          </Typography>
          <Stack direction="row" spacing={3} sx={{ my: 2, color: 'text.secondary' }}>
            <StatItem icon={<People />} value={propertyData.guests} label="guests" />
            <StatItem icon={<Bed />} value={propertyData.bedrooms} label="bedrooms" />
            <StatItem icon={<Bathtub />} value={propertyData.bathrooms} label="bathrooms" />
          </Stack>
        </Box>

        <Grid container spacing={4} sx={{ mt: 2 }}>
          {/* Left column: details, amenities, reviews */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Use white backgrounds for clarity */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }} gutterBottom>
                  About this property
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {propertyData.description}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }} gutterBottom>
                  Amenities
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {propertyData.amenities.map(item => (
                    <Grid size={{ xs: 12, sm: 6 }} key={item.name}>
                      <StatItem icon={item.icon} value="" label={item.name} />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }} gutterBottom>
                  Guest Reviews
                </Typography>
                {approvedReviews.length > 0 ? (
                  approvedReviews.map(review => (
                    <Box key={review.id} sx={{ borderTop: 1, borderColor: 'grey.200', pt: 2, mt: 2 }}>
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{review.guestName}</Typography>
                          <Chip label={`Overall: ${review.rating || 'N/A'}`} color="primary" />
                       </Box>
                       
                       {/* Category ratings display */}
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
                       
                      <Typography variant="body1" color="text.secondary">{review.publicReview}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Go to the dashboard and approve some reviews for this property to see them here.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right column: booking widget */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ position: 'sticky', top: 24 }}>
              <Card
                sx={{
                  p: 0, // No padding on the card
                  backgroundColor: '#FFF',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  overflow: 'hidden' // Ensure children respect border radius
                }}
              >
                {/* Header */}
                <Box sx={{ p: 3, backgroundColor: '#284E4C', color: 'white' }}>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                    Book your stay
                  </Typography>
                  <Typography variant="body1">
                    Select dates to see the total price
                  </Typography>
                </Box>

                {/* Form body */}
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    {/* Date Input */}
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Select dates"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarToday sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        sx: { backgroundColor: '#F7F9F9', borderRadius: '8px' }
                      }}
                    />

                    {/* Guest Select */}
                    <Select
                      fullWidth
                      defaultValue={1}
                      sx={{ backgroundColor: '#F7F9F9', borderRadius: '8px' }}
                      startAdornment={
                        <InputAdornment position="start">
                          <People sx={{ color: 'text.secondary', ml: 1 }} />
                        </InputAdornment>
                      }
                    >
                      {[...Array(propertyData.guests)].map((_, i) => (
                        <MenuItem key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'guest' : 'guests'}
                        </MenuItem>
                      ))}
                    </Select>
                  </Stack>

                  {/* Buttons */}
                  <Button 
                    fullWidth 
                    variant="contained" 
                    size="large" 
                    startIcon={<CalendarToday />}
                    sx={{ 
                      mt: 2, 
                      py: 1.5,
                      backgroundColor: '#6c757d', // A neutral, solid color
                      '&:hover': {
                        backgroundColor: '#5a6268'
                      }
                    }}
                  >
                    Check availability
                  </Button>
                  
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    size="large" 
                    startIcon={<ChatBubbleOutline />}
                    sx={{ 
                      mt: 1.5, 
                      py: 1.5,
                      borderColor: 'grey.400',
                      color: 'text.primary'
                    }}
                  >
                    Send Inquiry
                  </Button>

                  {/* Instant Confirmation */}
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mt: 3, color: 'text.secondary' }}>
                    <ShieldOutlined sx={{ fontSize: '1.1rem' }} />
                    <Typography variant="body2">
                      Instant confirmation
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PropertyPage;