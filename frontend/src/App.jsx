/**
 * App.jsx - Main Application Component
 * Hotspot IQ - Location Intelligence Platform
 */

import { useState, useCallback } from 'react';

// Layout
import { Header } from './components/Layout';

// Components
import { BusinessTypeSelector, ProximityFilters } from './components/Filters';
import { SearchBar } from './components/Search';
import { MapView } from './components/Map';
import { AnalysisPanel } from './components/Dashboard';

// Hooks
import { useAnalysis } from './hooks';

// API
import { geocodeLocation } from './services/api';

export default function App() {
  // Step 1: Business Type
  const [businessType, setBusinessType] = useState(null);
  
  // Step 2: Proximity Filters
  const [selectedFilters, setSelectedFilters] = useState([]);
  
  // Step 3: Selected Location
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // Analysis state
  const { 
    analysis, 
    isochrone, 
    isLoading, 
    error, 
    analyze, 
    clearAnalysis 
  } = useAnalysis();
  
  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Handle location selection - geocode if needed
  const handleLocationSelect = useCallback(async (location) => {
    // If location already has coordinates, use it directly
    if (location.lat != null && location.lng != null) {
      setSelectedLocation(location);
      return;
    }
    
    // Otherwise, geocode the location name to get coordinates
    setIsGeocoding(true);
    try {
      const geocoded = await geocodeLocation(location.name);
      if (geocoded && geocoded.lat && geocoded.lng) {
        setSelectedLocation({
          name: location.name,
          lat: geocoded.lat,
          lng: geocoded.lng,
          address: geocoded.address,
          geoid: location.geoid,
          is_major: location.is_major || false,  // Preserve major area flag
          is_area: location.is_area || false,
        });
      } else {
        console.error('Geocoding returned no coordinates');
        // Show an alert or set an error state
        alert('Could not find coordinates for this location. Please try a different search.');
      }
    } catch (error) {
      console.error('Geocode error:', error);
      alert('Could not find coordinates for this location. Please try a different search.');
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Handle map click
  const handleMapClick = useCallback((coords) => {
    setSelectedLocation({
      name: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      lat: coords.lat,
      lng: coords.lng,
    });
  }, []);

  // Handle analyze button click
  const handleAnalyze = useCallback(async () => {
    if (!selectedLocation || !businessType) return;
    
    // Ensure we have coordinates
    if (selectedLocation.lat == null || selectedLocation.lng == null) {
      alert('Location coordinates are missing. Please select a location from the search results.');
      return;
    }
    
    await analyze(selectedLocation, businessType, selectedFilters);
    setIsPanelOpen(true);
  }, [selectedLocation, businessType, selectedFilters, analyze]);

  // Check if ready to analyze - need coordinates
  const canAnalyze = businessType && selectedLocation && selectedLocation.lat != null && selectedLocation.lng != null && !isLoading && !isGeocoding;

  return (
    <div className="h-screen flex flex-col bg-canvas-base">
      {/* Header */}
      <Header />

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Layer */}
        <MapView
          selectedLocation={selectedLocation}
          competitors={analysis?.competitors || []}
          landmarks={analysis?.landmarks || []}
          isochrone={isochrone}
          onMapClick={handleMapClick}
        />

        {/* Control Panel - Left Side */}
        <div className="absolute left-4 top-4 bottom-4 w-80 z-10 flex flex-col gap-4 overflow-y-auto pointer-events-none">
          <div className="pointer-events-auto space-y-4">
            {/* Step 1: Business Type - Highest z-index for dropdown */}
            <div className="glass-panel p-4 relative z-30">
              <BusinessTypeSelector
                value={businessType}
                onChange={(value) => {
                  setBusinessType(value);
                  clearAnalysis();
                }}
              />
            </div>

            {/* Step 2: Proximity Filters - Lower z-index */}
            <div className="glass-panel p-4 relative z-20">
              <ProximityFilters
                value={selectedFilters}
                onChange={setSelectedFilters}
              />
            </div>

            {/* Step 3: Location Search - Lowest z-index */}
            <div className="glass-panel p-4 relative z-10">
              <SearchBar
                onLocationSelect={handleLocationSelect}
                disabled={!businessType}
              />
            </div>

            {/* Analyze Button */}
            {selectedLocation && (
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className={`
                  w-full btn-primary py-4 text-lg font-semibold
                  ${!canAnalyze ? 'opacity-50 cursor-not-allowed' : 'animate-glow-pulse'}
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : isGeocoding ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Finding location...
                  </span>
                ) : (
                  '🔍 Analyze Location'
                )}
              </button>
            )}

            {/* Error message */}
            {error && (
              <div className="glass-panel p-4 border-destructive-glow/50 bg-destructive-glow/10">
                <p className="text-destructive-glow text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats - Bottom Right */}
        {selectedLocation && !isLoading && analysis && (
          <div className="absolute right-4 bottom-4 z-10">
            <button
              onClick={() => setIsPanelOpen(true)}
              className="glass-panel p-4 hover:bg-surface-elevated transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                {/* Score preview */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary-glow">
                    {analysis.score || '—'}
                  </p>
                  <p className="text-xs text-slate-500">Score</p>
                </div>
                
                <div className="w-px h-12 bg-surface-border" />
                
                {/* Stats preview */}
                <div className="text-left">
                  <p className="text-sm text-slate-300">
                    <span className="text-destructive-glow font-medium">{analysis.competitors?.length || 0}</span> competitors
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="text-accent-glow font-medium">{analysis.landmarks?.length || 0}</span> landmarks
                  </p>
                </div>
                
                {/* Expand hint */}
                <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Analysis Panel */}
      <AnalysisPanel
        analysis={analysis}
        isLoading={isLoading}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
      />
    </div>
  );
}
