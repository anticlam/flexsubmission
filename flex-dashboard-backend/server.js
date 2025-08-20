require('dotenv').config();

const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const cors = require('cors'); // Cross-origin middleware
const axios = require('axios'); // HTTP client for external APIs

const app = express();
const PORT = process.env.PORT || 3001; // Server port

// Enable CORS for all routes
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// File storing review approval states
const APPROVALS_FILE = path.join(__dirname, 'review-approvals.json');

/**
 * Reads the review approvals from the JSON file
 * @returns {object} Object with review IDs as keys and approval status as values
 */
const readApprovals = async () => {
  try {
    const data = await fs.readFile(APPROVALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return empty object if file is missing or invalid
    return {};
  }
};

/**
 * Writes review approvals to disk
 * @param {object} approvals - Object with review IDs as keys and approval status as values
 */
const writeApprovals = async (approvals) => {
  await fs.writeFile(APPROVALS_FILE, JSON.stringify(approvals, null, 2));
};

/**
 * Normalizes a raw review object from the Hostaway API format
 * into a structured format suitable for the frontend dashboard.
 * @param {object} review - The raw review object.
 * @param {object} approvals - Object containing approval states for reviews
 * @param {string} dataSource - Source of the data ('real_api' or 'mock_data')
 * @returns {object} A normalized review object.
 */
const normalizeReview = (review, approvals = {}, dataSource = 'unknown') => {
  // Validate and safely process review categories
  const reviewCategories = Array.isArray(review.reviewCategory) ? review.reviewCategory : [];
  
  // Flatten review categories into a key-value object with validation
  const ratings = reviewCategories.reduce((acc, cat) => {
    if (cat && typeof cat.category === 'string' && typeof cat.rating === 'number') {
      acc[cat.category] = cat.rating;
    }
    return acc;
  }, {});

  // Calculate the average rating, falling back to overall rating
  const categoryRatings = Object.values(ratings);
  const averageRating = categoryRatings.length
    ? parseFloat((categoryRatings.reduce((sum, val) => sum + val, 0) / categoryRatings.length).toFixed(2))
    : review.rating || null;

  // Return the normalized review object with safe field access
  return {
    id: review.id || null,
    type: review.type || 'unknown',
    status: review.status || 'unknown',
    rating: averageRating,
    publicReview: review.publicReview || '',
    reviewCategory: reviewCategories,
    submittedAt: review.submittedAt || '',
    guestName: review.guestName || 'Unknown Guest',
    listingName: review.listingName || 'Unknown Property',
    // Include approval flag for website display
    displayOnWebsite: approvals[review.id] || false
  };
};


/**
 * Hostaway API integration
 */

// Cached access token
let hostawayAccessToken = null;
let tokenExpiry = null;

/**
 * Authenticate with Hostaway API using OAuth2
 */
const authenticateHostaway = async () => {
  try {
    if (hostawayAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return hostawayAccessToken; // Token still valid
    }

    console.log('🔑 Authenticating with Hostaway API...');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', process.env.HOSTAWAY_ACCOUNT_ID);
    params.append('client_secret', process.env.HOSTAWAY_API_KEY);
    params.append('scope', 'general');

    const response = await axios.post('https://api.hostaway.com/v1/accessTokens', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-control': 'no-cache'
      }
    });

    if (response.data && response.data.access_token) {
      hostawayAccessToken = response.data.access_token;
      // Set token expiry; default is one hour
      const expiresIn = response.data.expires_in || 3600; // default to 1 hour
      tokenExpiry = Date.now() + (expiresIn * 1000);
      
      console.log('✅ Hostaway authentication successful');
      return hostawayAccessToken;
    } else {
      throw new Error('No access token received');
    }
  } catch (error) {
    console.error('❌ Hostaway authentication failed:', error.response?.data || error.message);
    return null;
  }
};

/**
 * Retrieve reviews from Hostaway API
 */
const fetchHostawayReviews = async () => {
  try {
    const token = await authenticateHostaway();
    if (!token) {
      console.log('⚠️ Hostaway authentication failed, using mock data');
      return [];
    }

    console.log('📊 Fetching reviews from Hostaway API...');
    
    const response = await axios.get('https://api.hostaway.com/v1/reviews', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 100,
        includeResources: 'listing,conversation,reservation'
      }
    });

    if (response.data && response.data.status === 'success') {
      console.log(`✅ Retrieved ${response.data.result?.length || 0} reviews from Hostaway`);
      return response.data.result || [];
    } else {
      console.log('⚠️ No reviews found in Hostaway API response');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching Hostaway reviews:', error.response?.data || error.message);
    
    // Ignore 404 or no-review errors in the sandbox
    if (error.response?.status === 404 || error.response?.data?.message?.includes('no reviews')) {
      console.log('ℹ️ No reviews available in Hostaway sandbox (expected)');
    }
    
    return [];
  }
};

/**
 * Read mock reviews from file
 */
const readMockReviews = async () => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'mock-reviews.json'), 'utf8');
    const reviewsData = JSON.parse(data);
    return reviewsData.result || [];
  } catch (error) {
    console.error('❌ Error reading mock reviews:', error);
    return [];
  }
};

/**
 * @api {get} /api/reviews/hostaway Get and Normalize Hostaway Reviews
 * @apiName GetHostawayReviews
 * @apiGroup Reviews
 *
 * @apiSuccess {Object[]} reviews List of normalized reviews.
 * @apiSuccess {Number} reviews.id Review ID.
 * @apiSuccess {String} reviews.guestName Name of the guest.
 * @apiSuccess {String} reviews.listingName Name of the property listing.
 * @apiSuccess {String} reviews.channel The channel the review came from (e.g., Hostaway).
 * @apiSuccess {String} reviews.date The submission date of the review.
 * @apiSuccess {Number} reviews.overallRating The calculated average rating.
 * @apiSuccess {String} reviews.body The public text of the review.
 * @apiSuccess {Object} reviews.ratings An object with detailed category ratings.
 * @apiSuccess {Boolean} reviews.displayOnWebsite A flag for website visibility.
 */
app.get('/api/reviews/hostaway', async (req, res) => {
  try {
    console.log('🔍 Starting Hostaway reviews fetch...');
    
    // Attempt to fetch from Hostaway API first
    let reviewsToProcess = [];
    let dataSource = 'unknown';
    
    try {
      console.log('🌐 Attempting to fetch from real Hostaway API...');
      const realHostawayReviews = await fetchHostawayReviews();
      
      if (realHostawayReviews && realHostawayReviews.length > 0) {
        reviewsToProcess = realHostawayReviews;
        dataSource = 'real_api';
        console.log(`✅ Using ${reviewsToProcess.length} reviews from REAL Hostaway API`);
      } else {
        throw new Error('No reviews from real API, falling back to mock');
      }
    } catch (apiError) {
      console.log('⚠️ Real Hostaway API unavailable, using mock data');
      console.log('📁 Fetching mock reviews...');
      
      // Fallback to mock data
      const mockReviews = await readMockReviews();
      reviewsToProcess = mockReviews;
      dataSource = 'mock_data';
      console.log(`🔄 Using ${reviewsToProcess.length} reviews from MOCK data`);
    }

    // Read approval states
    const approvals = await readApprovals();

    // Filter for relevant reviews and normalize
    const normalizedReviews = reviewsToProcess
      // We only care about reviews written by guests about the property
      .filter(review => review.type === 'guest-to-host')
      // Map each valid review to our clean, normalized structure
      .map(review => normalizeReview(review, approvals, dataSource));
      
    console.log(`📊 Processed ${normalizedReviews.length} normalized reviews from ${dataSource}`);
    
    // Return in exact Hostaway API format as specified in requirements
    res.status(200).json({
      status: "success",
      result: normalizedReviews
    });
    
  } catch (error) {
    console.error('❌ Error in /api/reviews/hostaway:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve reviews.',
      error: error.message,
      source: 'error'
    });
  }
});

/**
 * @api {put} /api/reviews/:id/approval Update Review Approval Status
 * @apiName UpdateReviewApproval
 * @apiGroup Reviews
 *
 * @apiParam {Number} id Review ID.
 * @apiParam {Boolean} displayOnWebsite Whether the review should be displayed on website.
 *
 * @apiSuccess {String} message Success message.
 * @apiSuccess {Boolean} displayOnWebsite Updated approval status.
 */
app.put('/api/reviews/:id/approval', async (req, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { displayOnWebsite } = req.body;

    if (typeof displayOnWebsite !== 'boolean') {
      return res.status(400).json({ message: 'displayOnWebsite must be a boolean value.' });
    }

    // Read current approvals
    const approvals = await readApprovals();
    
    // Update the approval status for this review
    approvals[reviewId] = displayOnWebsite;
    
    // Save back to file
    await writeApprovals(approvals);
    
    res.status(200).json({ 
      message: 'Review approval status updated successfully.',
      displayOnWebsite: displayOnWebsite
    });
  } catch (error) {
    console.error('Error updating review approval:', error);
    res.status(500).json({ message: 'Failed to update review approval status.' });
  }
});

/**
 * @api {get} /api/google-places/autocomplete Get place predictions from Google
 * @apiName GooglePlacesAutocomplete
 * @apiGroup GooglePlaces
 * @apiDescription Provides autocomplete suggestions for place searches.
 *
 * @apiParam {String} input The partial search string from the user.
 * @apiParam {String} [types] The type of place to search for (e.g., 'establishment', 'geocode').
 *
 * @apiSuccess {Object} data The structured response.
 * @apiSuccess {String} data.status Indicates success.
 * @apiSuccess {Object[]} data.predictions A list of autocomplete predictions.
 * @apiSuccess {String} data.predictions.description The full text of the prediction.
 * @apiSuccess {String} data.predictions.place_id The Google Place ID for the prediction.
 */
app.get('/api/google-places/autocomplete', async (req, res) => {
  const { input, types } = req.query;

  if (!input) {
    return res.status(400).json({ message: 'Input query parameter is required' });
  }

  if (!process.env.GOOGLE_API_KEY) {
    console.error('❌ Google API key is not configured on the server.');
    return res.status(500).json({ message: 'Google API key not configured' });
  }

  try {
    const params = {
      input,
      key: process.env.GOOGLE_API_KEY,
      types: types || 'establishment', // Default type if none supplied
    };

    console.log('🔮 Fetching Google Autocomplete with params:', { input, types: params.types });

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', { params });

    if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
      console.error('❌ Google Autocomplete API error:', response.data.status, response.data.error_message);
      return res.status(500).json({ 
        message: 'Google Places Autocomplete API error',
        details: response.data.error_message || response.data.status
      });
    }

    res.status(200).json({
      status: 'success',
      predictions: response.data.predictions,
    });

  } catch (error) {
    console.error('❌ Error calling Google Autocomplete API:', error.message);
    res.status(500).json({ 
      message: 'An unexpected error occurred while fetching autocomplete suggestions.',
      error: error.message
    });
  }
});

/**
 * @api {get} /api/google-places/search Search for places using Google Places API
 * @apiName GooglePlacesSearch
 * @apiGroup GooglePlaces
 *
 * @apiParam {String} query The text query to search for (e.g., property name, address)
 * @apiParam {String} [location] Optional location bias (lat,lng format)
 * @apiParam {Number} [radius] Optional search radius in meters
 *
 * @apiSuccess {Object[]} places List of found places
 * @apiSuccess {String} places.place_id Unique place identifier
 * @apiSuccess {String} places.name Place name
 * @apiSuccess {String} places.formatted_address Full address
 * @apiSuccess {Number} places.rating Overall rating (1-5)
 * @apiSuccess {Number} places.user_ratings_total Total number of ratings
 * @apiSuccess {String[]} places.types Array of place types
 */
app.get('/api/google-places/search', async (req, res) => {
  try {
    const { query, location, radius } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ message: 'Google API key not configured' });
    }

    // Build the API URL
    let apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_API_KEY}`;
    
    if (location) {
      apiUrl += `&location=${location}`;
    }
    
    if (radius) {
      apiUrl += `&radius=${radius}`;
    }

    console.log('📍 Google Places API request:', { query, location, radius });

    const response = await axios.get(apiUrl);
    
    if (response.data.status !== 'OK') {
      console.error('❌ Google Places API error:', response.data.status, response.data.error_message);
      return res.status(400).json({ 
        message: 'Google Places API error', 
        status: response.data.status,
        error: response.data.error_message 
      });
    }

    // Normalize the response for our frontend
    const normalizedPlaces = response.data.results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating || null,
      user_ratings_total: place.user_ratings_total || 0,
      types: place.types || [],
      geometry: place.geometry,
      price_level: place.price_level || null
    }));

    console.log(`✅ Found ${normalizedPlaces.length} places for query: "${query}"`);
    
    res.status(200).json({
      status: 'success',
      results: normalizedPlaces,
      total_results: normalizedPlaces.length
    });

  } catch (error) {
    console.error('❌ Error in Google Places search:', error.message);
    res.status(500).json({ 
      message: 'Failed to search Google Places',
      error: error.message 
    });
  }
});

/**
 * @api {get} /api/google-places/details/:place_id Get detailed information about a place
 * @apiName GooglePlaceDetails
 * @apiGroup GooglePlaces
 *
 * @apiParam {String} place_id The place ID from Google Places
 * @apiParam {String} [fields] Comma-separated list of fields to return
 *
 * @apiSuccess {Object} place Detailed place information
 * @apiSuccess {String} place.place_id Unique place identifier
 * @apiSuccess {String} place.name Place name
 * @apiSuccess {String} place.formatted_address Full address
 * @apiSuccess {Number} place.rating Overall rating (1-5)
 * @apiSuccess {Number} place.user_ratings_total Total number of ratings
 * @apiSuccess {Object[]} place.reviews Array of up to 5 reviews
 * @apiSuccess {String} place.formatted_phone_number Phone number
 * @apiSuccess {String} place.website Website URL
 * @apiSuccess {Object} place.opening_hours Opening hours information
 */
app.get('/api/google-places/details/:place_id', async (req, res) => {
  try {
    const { place_id } = req.params;
    const { fields } = req.query;
    
    if (!place_id) {
      return res.status(400).json({ message: 'Place ID is required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ message: 'Google API key not configured' });
    }

    // Default fields for reviews and basic info
    const defaultFields = 'place_id,name,formatted_address,rating,user_ratings_total,reviews,formatted_phone_number,website,opening_hours,photos,types,geometry';
    const requestFields = fields || defaultFields;

    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${requestFields}&key=${process.env.GOOGLE_API_KEY}`;

    console.log('📍 Google Place Details API request:', { place_id, fields: requestFields });

    const response = await axios.get(apiUrl);
    
    if (response.data.status !== 'OK') {
      console.error('❌ Google Place Details API error:', response.data.status, response.data.error_message);
      return res.status(400).json({ 
        message: 'Google Place Details API error', 
        status: response.data.status,
        error: response.data.error_message 
      });
    }

    const place = response.data.result;
    
    // Normalize the reviews for consistent format
    const normalizedPlace = {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      rating: place.rating || null,
      user_ratings_total: place.user_ratings_total || 0,
      reviews: place.reviews ? place.reviews.map(review => ({
        author_name: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relative_time_description: review.relative_time_description,
        author_url: review.author_url,
        profile_photo_url: review.profile_photo_url
      })) : [],
      formatted_phone_number: place.formatted_phone_number || null,
      website: place.website || null,
      opening_hours: place.opening_hours || null,
      photos: place.photos || [],
      types: place.types || [],
      geometry: place.geometry
    };

    console.log(`✅ Retrieved details for place: "${place.name}" with ${normalizedPlace.reviews.length} reviews`);
    
    res.status(200).json({
      status: 'success',
      result: normalizedPlace
    });

  } catch (error) {
    console.error('❌ Error in Google Place Details:', error.message);
    res.status(500).json({ 
      message: 'Failed to get place details',
      error: error.message 
    });
  }
});

/**
 * @api {get} /api/google-places/reviews/:place_id Get Google reviews for a specific place
 * @apiName GooglePlaceReviews
 * @apiGroup GooglePlaces
 *
 * @apiParam {String} place_id The place ID from Google Places
 *
 * @apiSuccess {Object} data Review data and metadata
 * @apiSuccess {String} data.place_name Name of the place
 * @apiSuccess {Number} data.overall_rating Overall rating (1-5)
 * @apiSuccess {Number} data.total_ratings Total number of ratings
 * @apiSuccess {Object[]} data.reviews Array of up to 5 reviews
 * @apiSuccess {String} data.reviews.author_name Review author name
 * @apiSuccess {Number} data.reviews.rating Individual review rating
 * @apiSuccess {String} data.reviews.text Review text
 * @apiSuccess {String} data.reviews.relative_time_description When review was posted
 */
app.get('/api/google-places/reviews/:place_id', async (req, res) => {
  try {
    const { place_id } = req.params;
    
    if (!place_id) {
      return res.status(400).json({ message: 'Place ID is required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ message: 'Google API key not configured' });
    }

    // Request only review-related fields to minimize cost
    const fields = 'place_id,name,rating,user_ratings_total,reviews';
    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${process.env.GOOGLE_API_KEY}`;

    console.log('📍 Google Place Reviews API request:', { place_id });

    const response = await axios.get(apiUrl);
    
    if (response.data.status !== 'OK') {
      console.error('❌ Google Place Reviews API error:', response.data.status, response.data.error_message);
      return res.status(400).json({ 
        message: 'Google Place Reviews API error', 
        status: response.data.status,
        error: response.data.error_message 
      });
    }

    const place = response.data.result;
    
    const reviewData = {
      place_id: place.place_id,
      place_name: place.name,
      overall_rating: place.rating || null,
      total_ratings: place.user_ratings_total || 0,
      reviews: place.reviews ? place.reviews.map(review => ({
        author_name: review.author_name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        relative_time_description: review.relative_time_description,
        author_url: review.author_url || null,
        profile_photo_url: review.profile_photo_url || null,
        language: review.language || null
      })) : [],
      source: 'google_places'
    };

    console.log(`✅ Retrieved ${reviewData.reviews.length} Google reviews for: "${place.name}"`);
    
    res.status(200).json({
      status: 'success',
      data: reviewData
    });

  } catch (error) {
    console.error('❌ Error in Google Place Reviews:', error.message);
    res.status(500).json({ 
      message: 'Failed to get Google reviews',
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`🔑 Google API Key configured: ${process.env.GOOGLE_API_KEY ? 'Yes' : 'No'}`);
});