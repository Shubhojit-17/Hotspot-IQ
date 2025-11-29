# 📋 Hotspot IQ — Implementation Roadmap

> **Track your progress!** Check off tasks as you complete them.
> 
> **Estimated Total Time:** 24-32 hours (Hackathon Sprint)

---

## 🏁 Phase 0: Project Setup & Foundation

### Environment Setup
- [x] Create project root directory structure
  ```
  hotspot-iq/
  ├── backend/
  ├── frontend/
  ├── docs/
  └── README.md
  ```
- [x] Initialize Git repository with `.gitignore`
- [x] Create `backend/.gitignore` (include `venv/`, `__pycache__/`, `.env`)
- [x] Create `frontend/.gitignore` (include `node_modules/`, `.env`, `dist/`)

### Backend Scaffolding
- [x] Create Python virtual environment (`python -m venv venv`)
- [x] Create `backend/requirements.txt`:
  ```
  flask==3.0.0
  flask-cors==4.0.0
  python-dotenv==1.0.0
  requests==2.31.0
  pandas==2.1.0
  openai==1.6.0
  duckduckgo-search==4.1.0
  ```
- [x] Install dependencies (`pip install -r requirements.txt`)
- [x] Create `backend/.env.example` with placeholder keys
- [x] Create `backend/.env` with actual API keys (DO NOT COMMIT!)
- [x] Create basic `backend/app.py` with Flask boilerplate
- [x] Add CORS configuration for frontend origin
- [ ] Test server starts on `http://localhost:5000`

### Frontend Scaffolding
- [x] Initialize Vite React project (`npm create vite@latest frontend -- --template react`)
- [x] Install core dependencies:
  ```bash
  npm install react-leaflet leaflet recharts axios tailwindcss postcss autoprefixer
  ```
- [x] Initialize Tailwind CSS (`npx tailwindcss init -p`)
- [x] Configure `tailwind.config.js` with content paths
- [x] Add Tailwind directives to `src/index.css`
- [x] Create `frontend/.env.example`
- [x] Create `frontend/.env` with `VITE_API_BASE_URL=http://localhost:5000/api`
- [ ] Test frontend starts on `http://localhost:5173`

### Project Structure
- [x] Create backend folder structure:
  ```
  backend/
  ├── app.py
  ├── config.py
  ├── requirements.txt
  ├── .env
  ├── services/
  │   ├── __init__.py
  │   ├── latlong_service.py
  │   ├── openai_service.py
  │   └── search_service.py
  ├── routes/
  │   ├── __init__.py
  │   ├── location_routes.py
  │   ├── analysis_routes.py
  │   └── chat_routes.py
  └── utils/
      ├── __init__.py
      └── score_calculator.py
  ```
- [x] Create frontend folder structure:
  ```
  frontend/src/
  ├── components/
  │   ├── Map/
  │   ├── Search/
  │   ├── Dashboard/
  │   ├── Chat/
  │   └── common/
  ├── hooks/
  ├── services/
  ├── utils/
  └── pages/
  ```

---

## 🔧 Phase 1: Backend — Core Services

### Configuration Module
- [x] Create `backend/config.py` with environment variable loading
- [x] Implement API key validation on startup
- [x] Add configuration for API base URLs

### LatLong Service Wrapper (`services/latlong_service.py`)
- [x] Create base HTTP client with API key header
- [x] Implement `autocomplete(query: str)` method
  - [x] Call LatLong Autocomplete API
  - [x] Parse and return formatted suggestions
  - [x] Handle API errors gracefully
- [x] Implement `reverse_geocode(lat: float, lng: float)` method
  - [x] Get address details from coordinates
  - [x] Extract landmarks and POI info
- [x] Implement `get_poi(lat: float, lng: float, category: str, radius: int)` method
  - [x] Fetch POIs by category (cafe, atm, gym, etc.)
  - [x] Return count and list of nearby POIs
- [x] Implement `get_isochrone(lat: float, lng: float, mode: str, time: int)` method
  - [x] Call Isochrone API
  - [x] Return GeoJSON polygon
- [x] Implement `get_digipin(lat: float, lng: float)` method
  - [x] Fetch Digipin code
  - [x] Return formatted address
- [x] Implement `distance_matrix(origins: list, destinations: list)` method
  - [x] Calculate drive times between points
  - [x] Parse duration and distance from response
- [ ] Add request caching (optional, for demo performance)
- [ ] Write unit tests for each method

### Score Calculator (`utils/score_calculator.py`)
- [x] Define score constants and weights:
  ```python
  LANDMARK_WEIGHTS = {
      'metro_station': 15,
      'bus_stop': 5,
      'school': 10,
      'college': 12,
      'hospital': 8,
      'mall': 15,
      'office_complex': 12
  }
  ```
- [x] Implement `calculate_footfall_proxy(landmarks: dict, poi_data: dict)` function
- [x] Implement `calculate_landmark_value(landmarks: dict)` function
- [x] Implement `calculate_competitor_density(competitors: list, radius: float)` function
- [x] Implement `calculate_opportunity_score(footfall, landmark_value, competitor_density)` function
  - [x] Formula: `(footfall * landmark_value) / (competitor_density + 1)`
  - [x] Normalize to 0-100 scale
- [x] Implement `get_score_interpretation(score: int)` function
  - [x] Return category (Prime/Moderate/High Risk)
  - [x] Return recommendation text
- [ ] Write unit tests with sample data

### Location Routes (`routes/location_routes.py`)
- [x] Create Flask Blueprint for location routes
- [x] Implement `GET /api/autocomplete`
  - [x] Accept `query` parameter
  - [x] Call LatLong service
  - [x] Return JSON suggestions
- [x] Implement `GET /api/reverse-geocode`
  - [x] Accept `lat`, `lng` parameters
  - [x] Return address and landmark info
- [x] Implement `GET /api/digipin`
  - [x] Accept `lat`, `lng` parameters
  - [x] Return Digipin code

### Analysis Routes (`routes/analysis_routes.py`)
- [x] Create Flask Blueprint for analysis routes
- [x] Implement `POST /api/analyze`
  - [x] Accept JSON body: `{ lat, lng, business_type, filters }`
  - [x] Orchestrate multiple LatLong API calls:
    - [x] Get nearby competitors (same business type)
    - [x] Get nearby landmarks
    - [x] Get reverse geocode data
  - [x] Calculate opportunity score
  - [x] Return comprehensive analysis response
- [x] Implement `POST /api/isochrone`
  - [x] Accept JSON body: `{ lat, lng, mode, time_minutes }`
  - [x] Return GeoJSON polygon
- [x] Add input validation with error messages

### Integration & Testing
- [x] Register all blueprints in `app.py`
- [ ] Test all endpoints with Postman/curl
- [x] Handle and log API errors
- [x] Add request logging middleware

---

## 🎨 Phase 1: Frontend — Core UI

### API Service Layer (`services/api.js`)
- [x] Create Axios instance with base URL from env
- [x] Implement `searchLocations(query)` function
- [x] Implement `analyzeLocation(lat, lng, businessType, filters)` function
- [x] Implement `getIsochrone(lat, lng, mode, time)` function
- [x] Implement `getDigipin(lat, lng)` function
- [x] Implement `chat(message, context)` function
- [x] Add error handling wrapper

### Layout & Navigation
- [x] Create `components/Layout/Header.jsx` with logo and tagline
- [ ] Create `components/Layout/Sidebar.jsx` for filters
- [x] Create main `App.jsx` layout structure
- [x] Add responsive grid (sidebar + map + dashboard)

### Search Component (`components/Search/`)
- [x] Create `SearchBar.jsx` with autocomplete input
- [x] Implement debounced API calls (300ms delay)
- [x] Create `SearchSuggestions.jsx` dropdown list
- [x] Handle suggestion selection → update map
- [x] Add loading spinner during search
- [x] Style with Tailwind (rounded, shadow, etc.)

### Step 1: Business Type Selector (FIRST in user flow)
- [x] Create `components/Filters/BusinessTypeSelector.jsx`
- [x] Add dropdown with business types (with icons):
  - [x] ☕ Cafe / Coffee Shop
  - [x] 🍽️ Restaurant / Fast Food
  - [x] 🛍️ Retail Store
  - [x] 💪 Gym / Fitness Center
  - [x] 💊 Pharmacy / Medical Store
  - [x] 💇 Salon / Spa
  - [x] 📱 Electronics Store
  - [x] 👕 Clothing / Fashion
  - [x] 📚 Bookstore / Stationery
  - [x] 🏢 Other (custom input field appears)
- [x] Store selected business type in global state
- [x] Map business type to competitor POI categories:
  ```javascript
  const COMPETITOR_MAPPING = {
    'cafe': ['cafe', 'coffee_shop', 'bakery'],
    'restaurant': ['restaurant', 'fast_food', 'food_court'],
    'gym': ['gym', 'fitness_center', 'sports_club'],
    // ... etc
  };
  ```
- [x] Disable "Analyze" button until business type is selected
- [x] Show validation message if user tries to skip

### Step 2: Proximity Preference Filters (SECOND in user flow)
- [x] Create `components/Filters/ProximityFilters.jsx`
- [x] Create `components/Filters/FilterChip.jsx` (individual chip component)
- [x] Add checkbox filter options with icons:
  - [x] 🚇 Near Metro Station
  - [x] 🚌 Near Bus Stop
  - [x] 🏫 Near School
  - [x] 🎓 Near College/University
  - [x] 🏥 Near Hospital
  - [x] 🏬 Near Mall/Shopping Complex
  - [x] 🏢 Near Office/IT Park
  - [x] 🏠 Near Residential Area
  - [x] 🛕 Near Temple/Religious Place
  - [x] 🌳 Near Park/Recreation
  - [x] 🏦 Near ATM/Bank
  - [x] 🍺 Near Bar/Pub
- [x] Implement multi-select toggle functionality
- [x] Visual feedback: selected chips glow green, unselected are muted
- [x] Store selected filters array in global state
- [x] Add "Clear All" and "Select Popular" quick actions
- [x] Map filter names to POI categories for API calls:
  ```javascript
  const FILTER_POI_MAPPING = {
    'near_metro': 'metro_station',
    'near_school': 'school',
    'near_college': 'college',
    // ... etc
  };
  ```

### Map Component (`components/Map/`)
- [x] Create `MapContainer.jsx` with React-Leaflet
- [x] Set default center to Bangalore (12.9716, 77.5946)
- [x] Add OpenStreetMap tile layer
- [x] Create `LocationMarker.jsx` for selected location
- [x] Create `CompetitorMarkers.jsx` for nearby competitors
- [x] Create `LandmarkMarkers.jsx` with different icons
- [ ] Create `HeatmapLayer.jsx` for opportunity visualization
- [x] Implement click-to-select location
- [x] Add zoom controls and fullscreen button

### Dashboard Component (`components/Dashboard/`)
- [x] Create `ScoreCard.jsx` — large opportunity score display
  - [x] Color coded: green/yellow/red
  - [x] Score interpretation text
- [x] Create `CompetitorCard.jsx` — competitor count & list
- [x] Create `LandmarksCard.jsx` — nearby landmarks breakdown
- [x] Create `MetricsGrid.jsx` — footfall, density stats
- [x] Style cards with shadows and hover effects

### Charts (`components/Dashboard/Charts/`)
- [x] Create `CompetitorChart.jsx` — bar chart of competitor types
- [x] Create `LandmarkRadar.jsx` — radar chart of landmark categories
- [x] Create `ScoreGauge.jsx` — circular gauge for score
- [x] Use Recharts with consistent color theme

### State Management
- [x] Create `hooks/useLocation.js` — manage selected location
- [x] Create `hooks/useAnalysis.js` — manage analysis data
- [x] Create `hooks/useFilters.js` — manage filter selections
- [x] Wire up state flow: Search → Map → Analysis → Dashboard

### Integration Testing
- [ ] Test search → select → analyze flow
- [ ] Verify map updates correctly
- [ ] Verify dashboard shows correct data
- [ ] Test error states (API down, no results)
- [ ] Test loading states

---

## 🚀 Phase 2: Advanced Features

### Isochrone Visualization
- [ ] Create `components/Map/IsochroneLayer.jsx`
- [ ] Add mode selector (walk/bike/car)
- [ ] Add time selector (5/10/15/30 mins)
- [ ] Fetch isochrone on selection change
- [ ] Render GeoJSON polygon on map
- [ ] Style polygon with semi-transparent fill
- [ ] Add legend for isochrone

### OpenAI Service (`services/openai_service.py`)
- [ ] Create OpenAI client initialization
- [ ] Design system prompt for location advisor:
  ```
  You are Hotspot IQ, an expert location intelligence advisor for 
  businesses in India. Analyze the provided data about a location 
  and give practical, actionable advice.
  ```
- [ ] Implement `generate_advice(user_question, location_data)` function
- [ ] Format location data as context for GPT
- [ ] Handle rate limits and errors
- [ ] Add response streaming (optional)

### Chat Routes (`routes/chat_routes.py`)
- [ ] Create Flask Blueprint for chat
- [ ] Implement `POST /api/chat`
  - [ ] Accept JSON: `{ message, context: { lat, lng } }`
  - [ ] Fetch location data from LatLong
  - [ ] Build prompt with context
  - [ ] Call OpenAI service
  - [ ] Return AI response

### Chat Widget (`components/Chat/`)
- [ ] Create `ChatWidget.jsx` — floating button + panel
- [ ] Create `ChatMessage.jsx` — message bubble component
- [ ] Create `ChatInput.jsx` — input with send button
- [ ] Implement message history state
- [ ] Add typing indicator during AI response
- [ ] Style as floating widget (bottom-right)
- [ ] Add minimize/maximize toggle
- [ ] Add suggested questions:
  - [ ] "Is this good for a [business_type]?"
  - [ ] "What's the competition like?"
  - [ ] "What landmarks are nearby?"

### Digipin Integration
- [ ] Add Digipin fetch to analysis flow
- [ ] Create `components/Dashboard/DigipinCard.jsx`
- [ ] Display Digipin code prominently
- [ ] Add "Copy to Clipboard" button
- [ ] Add "Share Location" button (generate shareable link)

### UI Polish
- [ ] Add loading skeletons for all cards
- [ ] Add error boundaries
- [ ] Add empty states with helpful messages
- [ ] Implement toast notifications
- [ ] Add keyboard shortcuts (Escape to close, Enter to search)

---

## 🔮 Phase 3: Moonshot Features

### DuckDuckGo Search Service (`services/search_service.py`)
- [ ] Install and configure `duckduckgo-search`
- [ ] Implement `search_infrastructure_news(location: str)` function
- [ ] Search queries:
  - [ ] "Infrastructure projects in {location}"
  - [ ] "New metro {location}"
  - [ ] "Real estate development {location}"
  - [ ] "Commercial construction {location}"
- [ ] Parse and deduplicate results
- [ ] Extract relevant snippets

### Growth Radar Feature
- [ ] Create `routes/growth_routes.py`
- [ ] Implement `POST /api/growth-radar`
  - [ ] Accept location name
  - [ ] Call search service
  - [ ] Analyze sentiment (positive/negative impact)
  - [ ] Return structured developments list
- [ ] Create `components/Dashboard/GrowthRadar.jsx`
  - [ ] List upcoming developments
  - [ ] Show impact indicator (bullish/bearish)
  - [ ] Link to source articles

### Supply Chain Validator
- [ ] Implement `POST /api/supply-chain` endpoint
  - [ ] Accept store and warehouse coordinates
  - [ ] Call LatLong Distance Matrix API
  - [ ] Calculate drive time
  - [ ] Apply logic:
    - [ ] < 30 mins: ✅ Excellent
    - [ ] 30-45 mins: ⚠️ Acceptable
    - [ ] > 45 mins: ❌ High Logistics Cost
  - [ ] Return feasibility assessment
- [ ] Create `components/SupplyChain/WarehouseInput.jsx`
  - [ ] Search for warehouse location
  - [ ] Display on map with route line
- [ ] Create `components/SupplyChain/FeasibilityCard.jsx`
  - [ ] Show drive time and distance
  - [ ] Color-coded status
  - [ ] Recommendation text

### Advanced Map Features
- [ ] Add draw polygon tool for custom areas
- [ ] Add multiple location comparison
- [ ] Add "Find best location" auto-suggestion
- [ ] Add street view integration (if available)

---

## 🎁 Phase 4: Demo & Polish (Hackathon Prep)

### Demo Data & Fallbacks
- [ ] Create mock data for demo locations (Indiranagar, Koramangala, HSR)
- [ ] Add fallback data if APIs fail
- [ ] Pre-cache common searches

### Performance Optimization
- [ ] Add API response caching (Redis or in-memory)
- [ ] Implement request debouncing
- [ ] Lazy load map components
- [ ] Optimize bundle size

### UI/UX Polish
- [ ] Add onboarding tour for first-time users
- [ ] Add tooltips explaining each metric
- [ ] Ensure mobile responsiveness
- [ ] Add dark mode toggle (optional)
- [ ] Add print/export report feature

### Documentation & Presentation
- [ ] Record demo video (2-3 minutes)
- [ ] Create presentation slides
- [ ] Prepare live demo script
- [ ] Document known limitations
- [ ] Prepare FAQ for judges

### Final Testing
- [ ] End-to-end testing of all flows
- [ ] Test with real API keys
- [ ] Test error scenarios
- [ ] Test on multiple browsers
- [ ] Performance testing

---

## 📊 Progress Tracker

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Phase 0 | 18 | 16 | ✅ Almost Done |
| Phase 1 Backend | 28 | 26 | ✅ Almost Done |
| Phase 1 Frontend | 35 | 35 | ✅ Complete |
| Phase 2 | 25 | 0 | ⬜ Not Started |
| Phase 3 | 18 | 0 | ⬜ Not Started |
| Phase 4 | 16 | 0 | ⬜ Not Started |
| **Total** | **140** | **77** | **55%** |

---

## 🏃 Quick Start Commands

```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check Flask-CORS config, verify frontend URL |
| API key errors | Verify `.env` file exists and keys are valid |
| Map not loading | Check Leaflet CSS import in index.html |
| Blank dashboard | Check browser console for API errors |

---

**Good luck with the hackathon! 🚀**
