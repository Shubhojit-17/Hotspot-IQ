/**
 * useFilters Hook
 * Manages business type and proximity filter selections
 */

import { useState, useCallback, useMemo } from 'react';

// Popular filter presets
const POPULAR_FILTERS = ['metro', 'mall', 'office', 'college'];

export default function useFilters() {
  const [businessType, setBusinessType] = useState(null);
  const [proximityFilters, setProximityFilters] = useState([]);

  // Toggle a single proximity filter
  const toggleFilter = useCallback((filterId) => {
    setProximityFilters((prev) => {
      if (prev.includes(filterId)) {
        return prev.filter((f) => f !== filterId);
      }
      return [...prev, filterId];
    });
  }, []);

  // Select multiple filters at once
  const selectFilters = useCallback((filterIds) => {
    setProximityFilters(filterIds);
  }, []);

  // Select popular filters preset
  const selectPopularFilters = useCallback(() => {
    setProximityFilters(POPULAR_FILTERS);
  }, []);

  // Clear all proximity filters
  const clearFilters = useCallback(() => {
    setProximityFilters([]);
  }, []);

  // Clear everything (business type + filters)
  const clearAll = useCallback(() => {
    setBusinessType(null);
    setProximityFilters([]);
  }, []);

  // Check if a filter is selected
  const isFilterSelected = useCallback(
    (filterId) => proximityFilters.includes(filterId),
    [proximityFilters]
  );

  // Check if ready to analyze
  const canAnalyze = useMemo(() => {
    return businessType !== null;
  }, [businessType]);

  // Get filter summary for display
  const filterSummary = useMemo(() => {
    if (proximityFilters.length === 0) return 'No preferences set';
    if (proximityFilters.length === 1) return '1 preference';
    return `${proximityFilters.length} preferences`;
  }, [proximityFilters]);

  return {
    // State
    businessType,
    proximityFilters,
    canAnalyze,
    filterSummary,
    
    // Business Type Actions
    setBusinessType,
    
    // Proximity Filter Actions
    toggleFilter,
    selectFilters,
    selectPopularFilters,
    clearFilters,
    isFilterSelected,
    
    // Reset
    clearAll,
  };
}
