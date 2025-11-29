/**
 * useAnalysis Hook
 * Manages location analysis state and API calls
 */

import { useState, useCallback } from 'react';
import { analyzeLocation, getIsochrone, getDigipin } from '../services/api';

/**
 * Helper to normalize landmarks from API response
 * API returns: { list: [...], by_category: {...}, total: N }
 * We need: [{ name, category, lat, lng }, ...]
 */
function normalizeAllLandmarks(landmarksData) {
  if (!landmarksData) return [];
  
  // If it's already an array, return it
  if (Array.isArray(landmarksData)) return landmarksData;
  
  // Check for 'list' property first (our API structure)
  if (Array.isArray(landmarksData.list)) {
    return landmarksData.list;
  }
  
  // If it has by_category with arrays, flatten all categories into one array
  if (landmarksData.by_category && typeof landmarksData.by_category === 'object') {
    const allLandmarks = [];
    Object.entries(landmarksData.by_category).forEach(([category, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          allLandmarks.push({
            ...item,
            category: category,
          });
        });
      }
    });
    if (allLandmarks.length > 0) return allLandmarks;
  }
  
  return [];
}

export default function useAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [isochrone, setIsochrone] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (location, businessType, filters) => {
    if (!location || !businessType) {
      setError('Location and business type are required');
      return;
    }

    // Validate that we have coordinates
    if (location.lat == null || location.lng == null) {
      setError('Location coordinates are missing. Please select a different location.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Run analysis and isochrone requests in parallel
      const [analysisData, isochroneData] = await Promise.all([
        analyzeLocation(location.lat, location.lng, businessType, filters),
        getIsochrone(location.lat, location.lng, 1.0).catch((err) => {
          console.warn('Isochrone fetch failed:', err);
          return null;
        }), // 1km radius isochrone
      ]);

      // Try to get DIGIPIN (may not be available)
      let digipin = null;
      try {
        const digipinData = await getDigipin(location.lat, location.lng);
        digipin = digipinData?.digipin;
      } catch {
        // DIGIPIN is optional, ignore errors
      }

      // Normalize the API response to match frontend expectations
      const normalizedAnalysis = {
        score: analysisData.opportunity_score || 0,
        interpretation: analysisData.interpretation?.category || '',
        recommendation: analysisData.recommendation || analysisData.interpretation?.recommendation || '',
        // Extract competitors array from nested structure
        competitors: Array.isArray(analysisData.competitors?.nearby) 
          ? analysisData.competitors.nearby 
          : Array.isArray(analysisData.competitors) 
            ? analysisData.competitors 
            : [],
        competitor_count: analysisData.competitors?.count || 0,
        // Extract landmarks - convert from by_category object to array
        landmarks: normalizeAllLandmarks(analysisData.landmarks),
        landmarks_summary: analysisData.landmarks?.by_category || {},
        // Additional data
        footfall_index: analysisData.breakdown?.footfall_proxy || 0,
        competitor_density: analysisData.breakdown?.competitor_density || 0,
        landmark_value: analysisData.breakdown?.landmark_value || 0,
        location: location,
        digipin: digipin || analysisData.location?.digipin || '',
        address: analysisData.location?.address || {},
        business_type: analysisData.business_type || businessType,
      };

      setAnalysis(normalizedAnalysis);
      setIsochrone(isochroneData);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze location');
      setAnalysis(null);
      setIsochrone(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setIsochrone(null);
    setError(null);
  }, []);

  return {
    analysis,
    isochrone,
    isLoading,
    error,
    analyze,
    clearAnalysis,
  };
}
