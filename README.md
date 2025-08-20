
<img width="2005" height="1025" alt="image" src="https://github.com/user-attachments/assets/b02d5c59-de65-4542-a73f-afa3342790b6" />
<img width="2008" height="1001" alt="image" src="https://github.com/user-attachments/assets/f5d64fde-7b9a-45cb-9b2b-d332d60b3ec6" />
<img width="1981" height="1037" alt="image" src="https://github.com/user-attachments/assets/9f425bfd-8e3c-4153-9525-352721b38d9b" />
<img width="2020" height="1002" alt="image" src="https://github.com/user-attachments/assets/9519a2c9-d4ff-45ad-a772-ebbf5a526254" />



# Flex Living - Developer Assessment
A developer assessment I did for this one company. I passed all of the technical interviews and assessments with flying colors. They were particularly impressed by this dashboard. Unfortunately, after wasting my time with all this hard work, the CEO (in a non-technical interview) decided I wasn't a good "culture fit" because he asked me a question where an expected answer was that I should ask companies' for their customers' log-ins so that I could collect their private data. Shady, scammy, company with an unqualified person cosplaying CEO. Stay away, both as a consumer and developer.

## 🚀 Quick Start


**Prerequisites**
- Node.js and npm installed
- Google Cloud Platform account with Places API enabled (for the sake of this assessment I have included the .env with my own API key. I will revoke the API key once this assessment is completed.  Hostaway credentials are also included in the same .env file in the flex-dashboard-backend directory.)

**First Time Setup:**
```bash
# From project root - install all dependencies
npm run install-all

# Start both servers
npm run start
#  This runs the start-all.js script that launches both backend (port 3001) and frontend (port 5173) concurrently.
```

**Access Points:**
- **Manager Dashboard**: http://localhost:5173/dashboard (or next available port)
- **Property Page**: http://localhost:5173/property (or next available port)
- **Google Reviews**: http://localhost:5173/google-reviews (or next available port)
- **Backend API**: http://localhost:3001/api


---
**Environment Variables Included:**
- `GOOGLE_API_KEY`: Google Places API authentication
- `HOSTAWAY_ACCOUNT_ID`: Hostaway API account identifier  
- `HOSTAWAY_API_KEY`: Hostaway API authentication key
- `PORT`: Backend server port (3001)
---

## Project Overview

This project implements a Reviews Dashboard for Flex Living property managers to assess property performance based on guest reviews. The solution includes a manager dashboard for review approval with advanced filtering, an analytics dashboard with interactive data visualizations, a public property page displaying approved reviews, and integrations with both Hostaway and Google Places APIs.


## Tech Stack

**Backend:**
- Node.js with Express 5.1.0
- OAuth2 authentication for Hostaway API
- Google Places API integration
- JSON file persistence (production-ready for database migration)
- CORS enabled for cross-origin requests

**Frontend:**
- React 19.1 with Vite 7.0.4
- Material-UI 7.2.0 with MUI X-Charts 8.9.0
- React Router for navigation
- Axios for API communication

**Development:**
- Concurrent server management via start-all.js
- ESLint configuration for code quality

## Key Design Decisions

### 1. Hybrid API Architecture
The system attempts real Hostaway API calls first, then gracefully falls back to mock data when no reviews are available.

### 2. Review Approval System
Created a persistent approval mechanism using JSON file storage that tracks which reviews should be displayed publicly. Each review has a `displayOnWebsite` boolean flag that managers can toggle in the dashboard.

### 3. Dual Dashboard Architecture
The system provides two complementary interfaces:

**Manager Dashboard (Review Management)**:
- **Advanced Filtering**: Property-specific filters, category range sliders, text search, and public display status filtering

**Analytics Dashboard (Business Intelligence)**:
- **Key Performance Indicators**: Total reviews, overall average rating, active property count
- **Interactive Data Visualizations**: 
  - Rating distribution pie chart 
  - Category performance radar chart for cleanliness, communication, etc.
  - Average rating over time line chart for trend analysis
- **Property Performance Analysis**: Comparative table with click-to-filter drill-down capability


### 4. Property Page Integration
Replicated Flex Living's property layout with an embedded reviews section that only displays manager-approved reviews for the specific property, ensuring brand control over public-facing content. Currently only "2 Bed Balcony Flat Chelsea Harbour" has a public property page, so for testing the "Show on public website" feature, reviews for this property should be tested (reviews for other properties will not be shown on this property page, as expected). 

## API Implementation

**Production-Ready Architecture**: The system implements bulletproof defensive coding with exact Hostaway API format compliance, dynamic category detection, and graceful handling of any API response variations.

### Core Endpoints

**GET /api/reviews/hostaway**
- **Full Hostaway API Format Compliance**: Mock data and responses match specification exactly
- Implements OAuth2 client credentials flow with Hostaway
- Returns normalized review data with approval status  
- Handles token refresh and API failures gracefully
- Dynamic category processing (adapts to any category structure)

**PUT /api/reviews/:id/approval**
- Updates review approval status
- Persists changes to review-approvals.json
- Provides immediate UI feedback

**Google Places Integration**
- **GET /api/google-places/search**: Property search functionality
- **GET /api/google-places/autocomplete**: Autocomplete search results
- **GET /api/google-places/details/:place_id**: Comprehensive property information
- **GET /api/google-places/reviews/:place_id**: Review extraction and normalization

### API Behaviors

The Hostaway integration uses a hybrid approach: it authenticates with the real API using provided credentials, attempts to fetch reviews, and falls back to mock data when the sandbox returns no results. 

## Google Reviews Findings

**Successfully Implemented**: Full Google Places API integration with three operational endpoints for search, details, and reviews.

**Key Findings:**
- **Review Quality**: High-quality reviews with author information and timestamps  
- **Limitations**: Standard API returns maximum 5 reviews per location; more requires Google Premium Plan. Currently, only the first page of search results is used, for a maximum of 20 results per search.
- **Integration Opportunities**: Complementary data source for competitive analysis and comprehensive review aggregation
**Recommendation**: Google reviews can be used as supplementary data alongside Hostaway reviews for comprehensive reputation management, as long as we can ensure that the site and google reviews listings match, and as long as cost is not an issue and proper rate-limiting is enabled.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.


