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
    setLoadingStatus({ step: 'init', message: 'Starting analysis...', progress: 0, details: [] });

    try {
      // Determine isochrone radius based on whether it's a major area
      const isMajorArea = location.is_major || false;
      const isochroneRadius = isMajorArea ? 2.5 : 1.5;
      
      // Step 1: Initialize
      updateStatus('location', '📍 Setting up location...', 10);
      await new Promise(r => setTimeout(r, 200)); // Brief delay for UI feedback

      // Step 2: Fetch isochrone (area boundary)
      updateStatus('boundary', '🗺️ Drawing area boundary...', 20);
      let isochroneData = null;
      try {
        isochroneData = await getIsochrone(location.lat, location.lng, isochroneRadius);
        updateStatus('boundary', '✅ Area boundary ready', 25, '🗺️ Area boundary loaded');
      } catch (err) {
        console.warn('Isochrone fetch failed:', err);
        updateStatus('boundary', '⚠️ Using circular boundary', 25, '⚠️ Using default circular area');
      }

      // Step 3: Run main analysis (competitors + landmarks)
      updateStatus('analysis', '🔍 Searching for competitors...', 30);
      
      const analysisData = await analyzeLocation(
        location.lat, 
        location.lng, 
        businessType, 
        filters, 
        isMajorArea
      );

      // Extract counts for status
      const competitorCount = analysisData.competitors?.count || 0;
      const landmarkCount = analysisData.landmarks?.total || 0;
      
      updateStatus('competitors', `✅ Found ${competitorCount} competitors`, 60, 
        `🏪 ${competitorCount} ${businessType}s found in area`);
      
      await new Promise(r => setTimeout(r, 300));
      
      updateStatus('landmarks', `✅ Found ${landmarkCount} landmarks`, 75,
        `🏛️ ${landmarkCount} landmarks identified`);

      // Step 4: Get DIGIPIN (optional)
      updateStatus('digipin', '📌 Getting location code...', 85);
      let digipin = null;
      try {
        const digipinData = await getDigipin(location.lat, location.lng);
        digipin = digipinData?.digipin;
        if (digipin) {
          updateStatus('digipin', '✅ DIGIPIN retrieved', 90, `📌 DIGIPIN: ${digipin}`);
        }
      } catch {
        // DIGIPIN is optional, ignore errors
      }

      // Step 5: Find recommended spots
      const spotsCount = analysisData.recommended_spots?.length || 0;
      updateStatus('spots', `🎯 Found ${spotsCount} optimal locations...`, 95);
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

      // Complete!
      updateStatus('complete', '✅ Analysis complete!', 100, 
        `🎯 Found ${spotsCount} recommended locations`);

      setAnalysis(normalizedAnalysis);
      setIsochrone(isochroneData);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze location');
      setLoadingStatus(prev => ({
        ...prev,
        step: 'error',
        message: `❌ ${err.message || 'Analysis failed'}`,
        progress: 0
      }));
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
