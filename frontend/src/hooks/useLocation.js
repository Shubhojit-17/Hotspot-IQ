/**
 * useLocation Hook
 * Manages selected location state
 */

import { useState, useCallback } from 'react';
import { searchLocations, geocodeLocation } from '../services/api';

export default function useLocation() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await searchLocations(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error.message || 'Failed to search locations');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectLocation = useCallback(async (location) => {
    // If location already has coordinates, use it directly
    if (location.lat && location.lng) {
      setSelectedLocation(location);
      setSearchResults([]);
      return;
    }
    
    // Otherwise, geocode the location name to get coordinates
    setIsGeocoding(true);
    setSearchError(null);
    
    try {
      const geocoded = await geocodeLocation(location.name);
      setSelectedLocation({
        name: location.name,
        lat: geocoded.lat,
        lng: geocoded.lng,
        address: geocoded.address,
        geoid: location.geoid
      });
      setSearchResults([]);
    } catch (error) {
      console.error('Geocode error:', error);
      setSearchError('Could not find coordinates for this location');
      // Still set the location but without coordinates
      setSelectedLocation({
        ...location,
        lat: null,
        lng: null,
        needsGeocode: true
      });
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  const selectFromCoords = useCallback((lat, lng, name = null) => {
    setSelectedLocation({
      lat,
      lng,
      name: name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });
  }, []);

  const clearLocation = useCallback(() => {
    setSelectedLocation(null);
    setSearchResults([]);
    setSearchError(null);
  }, []);

  return {
    // State
    selectedLocation,
    searchResults,
    isSearching,
    isGeocoding,
    searchError,
    
    // Actions
    search,
    selectLocation,
    selectFromCoords,
    clearLocation,
  };
}
