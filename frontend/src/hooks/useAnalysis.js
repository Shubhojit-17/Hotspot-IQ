/**
 * useAnalysis Hook
 * Manages location analysis state and API calls with progressive loading
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

  // Progressive loading status
  const [loadingStatus, setLoadingStatus] = useState({
    step: '',
    message: '',
    progress: 0,
    details: []
  });

  const updateStatus = (step, message, progress, detail = null) => {
    setLoadingStatus(prev => ({
      step,
      message,
      progress,
      details: detail ? [...prev.details, detail] : prev.details
    }));
  };

  const analyze = useCallback(async (location, businessType, filters, radius = 1000) => {
    if (!location || !businessType) {
      setError('Location and business type are required');
      return { success: false, isValidationError: false };
    }

    // Validate that we have coordinates
    if (location.lat == null || location.lng == null) {
      setError('Location coordinates are missing. Please select a different location.');
      return { success: false, isValidationError: false };
    }

    // Clear previous analysis data immediately (clears markers)
    setAnalysis(null);
    setIsochrone(null);
    setError(null);

    setIsLoading(true);
    setLoadingStatus({ step: 'init', message: 'Starting analysis...', progress: 0, details: [] });

    try {
      // Determine isochrone radius based on whether it's a major area
      const isMajorArea = location.is_major || false;
      // Use provided radius (converted to km) or fallback to defaults
      const isochroneRadius = radius ? (radius / 1000) : (isMajorArea ? 2.5 : 1.5);

      // Step 1: Initialize & Validate Location
      updateStatus('validation', 'Checking location validity...', 10, '🛡️ Location validated');
      await new Promise(r => setTimeout(r, 300)); // Brief delay for UI feedback

      // Step 2: Fetch isochrone (area boundary)
      updateStatus('boundary', 'Drawing search boundary...', 20);
      let isochroneData = null;
      try {
        isochroneData = await getIsochrone(location.lat, location.lng, isochroneRadius);
        updateStatus('boundary', 'Area boundary ready', 25, '🗺️ Area boundary loaded');
      } catch (err) {
        console.warn('Isochrone fetch failed:', err);
        updateStatus('boundary', 'Using circular boundary', 25, '🗺️ Using default circular area');
      }

      // Step 3: Run main analysis (includes validation + competitors + landmarks)
      updateStatus('analysis', 'Searching for businesses & landmarks...', 35);

      const analysisData = await analyzeLocation(
        location.lat,
        location.lng,
        businessType,
        filters,
        isMajorArea,
        radius
      );

      // Extract counts for status
      const competitorCount = analysisData.competitors?.count || 0;
      const nearbyList = analysisData.competitors?.nearby || [];
      const landmarkCount = analysisData.landmarks?.total || 0;
      const landmarkCategories = Object.keys(analysisData.landmarks?.by_category || {}).length;

      // Update with competitor results
      updateStatus('competitors', `Found ${competitorCount} competitors`, 55,
        `🏪 ${competitorCount} ${businessType}${competitorCount !== 1 ? 's' : ''} found nearby`);

      await new Promise(r => setTimeout(r, 400));

      // Update with landmark results  
      updateStatus('landmarks', `Identified ${landmarkCount} landmarks`, 70,
        `🏛️ ${landmarkCount} landmarks in ${landmarkCategories} categories`);

      await new Promise(r => setTimeout(r, 300));

      // Step 4: Get DIGIPIN (optional)
      updateStatus('digipin', 'Retrieving location code...', 80);
      let digipin = null;
      try {
        const digipinData = await getDigipin(location.lat, location.lng);
        digipin = digipinData?.digipin;
        if (digipin) {
          updateStatus('digipin', 'DIGIPIN retrieved', 85, `📌 DIGIPIN: ${digipin.substring(0, 10)}...`);
        } else {
          updateStatus('digipin', 'DIGIPIN not available', 85, '📌 Location code retrieved');
        }
      } catch {
        updateStatus('digipin', 'DIGIPIN skipped', 85, '📌 Location code skipped');
      }

      await new Promise(r => setTimeout(r, 200));

      // Step 5: Find recommended spots
      const spotsCount = analysisData.recommended_spots?.length || 0;
      updateStatus('spots', `Analyzing ${spotsCount} optimal locations...`, 95,
        `🎯 ${spotsCount} recommended spot${spotsCount !== 1 ? 's' : ''} identified`);
      await new Promise(r => setTimeout(r, 200));

      // Log raw response for debugging
      console.log('📊 Raw API Response:', JSON.stringify(analysisData, null, 2));

      // Normalize the API response to match frontend expectations
      const normalizedAnalysis = {
        // Recommended spots (new feature)
        recommended_spots: analysisData.recommended_spots || [],
        // Extract competitors from nested structure
        competitors: {
          count: analysisData.competitors?.count || 0,
          nearby: Array.isArray(analysisData.competitors?.nearby)
            ? analysisData.competitors.nearby
            : []
        },
        // Extract landmarks
        landmarks: {
          total: analysisData.landmarks?.total || 0,
          list: normalizeAllLandmarks(analysisData.landmarks),
          by_category: analysisData.landmarks?.by_category || {}
        },
        // Additional data
        footfall_proxy: analysisData.footfall_proxy || 'medium',
        location: location,
        digipin: digipin || analysisData.location?.digipin || '',
        address: analysisData.location?.address || {},
        business_type: analysisData.business_type || businessType,
      };

      // Log normalized data for debugging
      console.log('📊 Normalized Analysis:', {
        recommended_spots: normalizedAnalysis.recommended_spots,
        competitors: normalizedAnalysis.competitors,
        landmarks: normalizedAnalysis.landmarks
      });

      // Complete! - Show summary
      const summaryMsg = `${competitorCount} competitors, ${landmarkCount} landmarks, ${spotsCount} spots`;
      updateStatus('complete', summaryMsg, 100);

      setAnalysis(normalizedAnalysis);
      setIsochrone(isochroneData);

      return { success: true, isValidationError: false };
    } catch (err) {
      console.error('Analysis error:', err);

      // Check if this is a validation error (location invalid)
      const isValidationError = err.isValidationError || false;
      const errorMessage = err.message || 'Failed to analyze location';

      setError(errorMessage);
      setLoadingStatus(prev => ({
        ...prev,
        step: 'error',
        message: `❌ ${errorMessage}`,
        progress: 0
      }));

      // Keep analysis and isochrone null (no markers on map)
      setAnalysis(null);
      setIsochrone(null);

      return {
        success: false,
        isValidationError,
        errorType: err.errorType,
        errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setIsochrone(null);
    setError(null);
    setLoadingStatus({ step: '', message: '', progress: 0, details: [] });
  }, []);

  return {
    analysis,
    isochrone,
    isLoading,
    error,
    loadingStatus,
    analyze,
    clearAnalysis,
  };
}
