/**
 * Hotspot IQ - API Service Layer
 * Handles all communication with the Flask backend
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 120000, // 2 minutes to handle longer analysis calls
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Search for locations using autocomplete
 * @param {string} query - Search term
 * @returns {Promise<Array>} Location suggestions
 */
export const searchLocations = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await api.get('/autocomplete', { params: { query, limit: 10 } });
    const suggestions = response.data.suggestions || [];
    
    // LatLong autocomplete returns { name, geoid } without coordinates
    // We need to geocode to get coordinates when user selects a location
    return suggestions.map(s => ({
      name: s.name,
      place_id: s.place_id || s.geoid?.toString() || s.name,
      geoid: s.geoid,
      // lat/lng may be null from autocomplete - will be geocoded on selection
      lat: s.lat,
      lng: s.lng
    }));
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

/**
 * Geocode a location name to get coordinates
 * @param {string} address - Location name/address
 * @returns {Promise<Object>} Location with coordinates
 */
export const geocodeLocation = async (address) => {
  try {
    const response = await api.get('/geocode', { params: { address } });
    return response.data;
  } catch (error) {
    console.error('Geocode error:', error);
    throw error;
  }
};

/**
 * Analyze a location for business potential
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} businessType - Type of business
 * @param {Array<string>} filters - Proximity filters
 * @param {boolean} isMajor - Whether this is a major area (larger radius)
 * @returns {Promise<Object>} Analysis results
 * @throws {Error} With validation error message if location is invalid
 */
export const analyzeLocation = async (lat, lng, businessType, filters = [], isMajor = false) => {
  try {
    const response = await api.post('/analyze', {
      lat,
      lng,
      business_type: businessType,
      filters,
      is_major: isMajor,
    });
    return response.data;
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Extract validation error from backend response
    if (error.response?.data) {
      const data = error.response.data;
      
      // Check if this is a validation failure
      if (data.validation_failed || data.error_type) {
        const validationError = new Error(data.error || data.message || 'Location validation failed');
        validationError.isValidationError = true;
        validationError.errorType = data.error_type;
        throw validationError;
      }
      
      // Regular error with message from backend
      if (data.error) {
        throw new Error(data.error);
      }
    }
    
    throw error;
  }
};

/**
 * Get isochrone polygon for reachability
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} distanceKm - Distance in kilometers (default: 1.0)
 * @returns {Promise<Object>} GeoJSON Feature
 * 
 * Also supports legacy mode/time format which is converted on backend:
 * @param {string} mode - Travel mode (walk, bike, car) - optional
 * @param {number} timeMinutes - Travel time in minutes - optional
 */
export const getIsochrone = async (lat, lng, distanceKmOrMode = 1.0, timeMinutes = null) => {
  try {
    let payload = { lat, lng };
    
    // Support both new format (distance_km) and legacy (mode + time_minutes)
    if (typeof distanceKmOrMode === 'number' && timeMinutes === null) {
      payload.distance_km = distanceKmOrMode;
    } else if (typeof distanceKmOrMode === 'string') {
      payload.mode = distanceKmOrMode;
      payload.time_minutes = timeMinutes || 15;
    } else {
      payload.distance_km = distanceKmOrMode;
    }
    
    const response = await api.post('/isochrone', payload);
    return response.data;
  } catch (error) {
    console.error('Isochrone error:', error);
    throw error;
  }
};

/**
 * Get Digipin for a location
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Digipin data
 */
export const getDigipin = async (lat, lng) => {
  try {
    const response = await api.get('/digipin', { params: { lat, lng } });
    return response.data;
  } catch (error) {
    console.error('Digipin error:', error);
    throw error;
  }
};

/**
 * Send chat message to AI assistant
 * @param {string} message - User message
 * @param {Object} context - Location context
 * @returns {Promise<Object>} AI response
 */
export const chat = async (message, context = {}) => {
  try {
    const response = await api.post('/chat', {
      message,
      context,
    });
    return response.data;
  } catch (error) {
    console.error('Chat error:', error);
    throw error;
  }
};

/**
 * Check supply chain feasibility
 * @param {number} storeLat - Store latitude
 * @param {number} storeLng - Store longitude
 * @param {number} warehouseLat - Warehouse latitude
 * @param {number} warehouseLng - Warehouse longitude
 * @returns {Promise<Object>} Supply chain analysis
 */
export const checkSupplyChain = async (storeLat, storeLng, warehouseLat, warehouseLng) => {
  try {
    const response = await api.post('/supply-chain', {
      store_lat: storeLat,
      store_lng: storeLng,
      warehouse_lat: warehouseLat,
      warehouse_lng: warehouseLng,
    });
    return response.data;
  } catch (error) {
    console.error('Supply chain error:', error);
    throw error;
  }
};

/**
 * Health check
 * @returns {Promise<Object>} Health status
 */
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default api;
