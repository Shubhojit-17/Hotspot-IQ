/**
 * App.jsx - Main Application Component
 * Hotspot IQ - Location Intelligence Platform
 */

import { useState, useCallback, useEffect } from 'react';

// Layout
import { Header } from './components/Layout';

// Components
import { BusinessTypeSelector, ProximityFilters } from './components/Filters';
import { SearchBar } from './components/Search';
import { MapView } from './components/Map';
import { AnalysisPanel, LoadingProgress } from './components/Dashboard';
import { ChatBot } from './components/Chat';

// Hooks
import { useAnalysis } from './hooks';

// API
import { geocodeLocation } from './services/api';

// Toast notification component
function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000); // Auto-close after 8 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error'
    ? 'bg-red-500/95 border-red-400'
    : type === 'warning'
      ? 'bg-amber-500/95 border-amber-400'
      : 'bg-emerald-500/95 border-emerald-400';

  const icon = type === 'error' ? (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ) : type === 'warning' ? (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 ${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl border-2 flex items-center gap-4 max-w-lg animate-slide-down`}>
      {icon}
      <div className="flex-1">
        <p className="font-semibold text-sm uppercase tracking-wide opacity-90">
          {type === 'error' ? 'Location Invalid' : type === 'warning' ? 'Warning' : 'Success'}
        </p>
        <p className="text-white/95 mt-1">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors p-1"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function App() {
  // Step 1: Business Type
  const [businessType, setBusinessType] = useState(null);

  // Step 2: Proximity Filters
  const [selectedFilters, setSelectedFilters] = useState([]);

  // Step 3: Selected Location
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  // Toast notification state
  const [toast, setToast] = useState(null);
  // Analysis state
  const {
    analysis,
    isochrone,
    isLoading,
    error,
    loadingStatus,
    analyze,
    clearAnalysis
  } = useAnalysis();

  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  // Map display toggles
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showCompetitors, setShowCompetitors] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

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
      setToast({
        message: 'Location coordinates are missing. Please select a location from the search results.',
        type: 'warning'
      });
      return;
    }

    // Clear any existing toast
    setToast(null);

    // Run analysis (this clears markers internally before fetching)
    const result = await analyze(selectedLocation, businessType, selectedFilters);

    // Handle validation errors
    if (!result.success) {
      if (result.isValidationError) {
        // Show validation error toast - map remains clear
        setToast({
          message: result.errorMessage,
          type: 'error'
        });
        // Don't open the panel on validation error
        return;
      }
      // For other errors, show warning toast
      setToast({
        message: result.errorMessage || 'Analysis failed. Please try again.',
        type: 'warning'
      });
      return;
    }

    // Success - open the panel
    setIsPanelOpen(true);
  }, [selectedLocation, businessType, selectedFilters, analyze]);

  // Handle viewing a recommended spot on the map
  const handleViewSpot = useCallback((spot) => {
    // This will cause the map to pan to the spot location
    // We can show a temporary marker or highlight
    console.log('View spot:', spot);
    // The spot marker is already on the map, just close the panel so user can see it
    setIsPanelOpen(false);
  }, []);

  // Check if ready to analyze - need coordinates
  const canAnalyze = businessType && selectedLocation && selectedLocation.lat != null && selectedLocation.lng != null && !isLoading && !isGeocoding;

  return (
    <div className="h-screen flex flex-col bg-canvas-base">
      {/* Toast Notification for Validation Errors */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <Header />

      {/* Main content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Layer */}
        <MapView
          selectedLocation={selectedLocation}
          competitors={analysis?.competitors?.nearby || []}
          landmarks={analysis?.landmarks?.list || []}
          recommendedSpots={analysis?.recommended_spots || []}
          isochrone={isochrone}
          onMapClick={handleMapClick}
          onSpotClick={handleViewSpot}
          showLandmarks={showLandmarks}
          showCompetitors={showCompetitors}
          businessType={businessType}
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
                  <span className="flex items-center gap-2">
                    <img src="/icons/search.svg" alt="" className="w-5 h-5" style={{ filter: 'brightness(0) invert(1)' }} />
                    Analyze Location
                  </span>
                )}
              </button>
            )}

            {/* Loading Progress Indicator */}
            {(isLoading || loadingStatus.step === 'complete') && (
              <LoadingProgress status={loadingStatus} isLoading={isLoading} />
            )}

            {/* Error message */}
            {error && (
              <div className="glass-panel p-4 border-destructive-glow/50 bg-destructive-glow/10">
                <p className="text-destructive-glow text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats - Top Right */}
        {selectedLocation && !isLoading && analysis && (
          <div className="absolute right-4 top-4 z-10 space-y-2">
            <button
              onClick={() => setIsPanelOpen(true)}
              className="glass-panel p-4 hover:bg-surface-elevated transition-colors cursor-pointer group w-full"
            >
              <div className="flex items-center gap-4">
                {/* Recommended spots preview */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">
                    {analysis.recommended_spots?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">Spots Found</p>
                </div>

                <div className="w-px h-12 bg-surface-border" />

                {/* Stats preview */}
                <div className="text-left">
                  <p className="text-sm text-slate-300">
                    <span className="text-destructive-glow font-medium">{analysis.competitors?.count || 0}</span> competitors
                  </p>
                  <p className="text-sm text-slate-300">
                    <span className="text-accent-glow font-medium">{analysis.landmarks?.total || 0}</span> landmarks
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

            {/* Map Layer Toggle Buttons */}
            <div className="glass-panel p-3 flex gap-2">
              <button
                onClick={() => setShowLandmarks(!showLandmarks)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${showLandmarks
                    ? 'bg-cyan-500 text-white'
                    : 'bg-surface-secondary text-slate-400 hover:bg-surface-elevated'
                  }`}
              >
                <img
                  src="/icons/building.svg"
                  alt=""
                  className="w-4 h-4"
                  style={{ filter: showLandmarks ? 'brightness(0) invert(1)' : 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }}
                />
                <span>{showLandmarks ? 'Landmarks ON' : 'Landmarks OFF'}</span>
              </button>
              <button
                onClick={() => setShowCompetitors(!showCompetitors)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${showCompetitors
                    ? 'bg-rose-500 text-white'
                    : 'bg-surface-secondary text-slate-400 hover:bg-surface-elevated'
                  }`}
              >
                <img
                  src="/icons/store.svg"
                  alt=""
                  className="w-4 h-4"
                  style={{ filter: showCompetitors ? 'brightness(0) invert(1)' : 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }}
                />
                <span>{showCompetitors ? 'Competitors ON' : 'Competitors OFF'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Panel */}
      <AnalysisPanel
        analysis={analysis}
        isLoading={isLoading}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onViewSpot={handleViewSpot}
        onOpenChat={() => setIsChatOpen(true)}
      />

      {/* Chat Bot */}
      <ChatBot
        selectedLocation={selectedLocation}
        businessType={businessType}
        analysis={analysis}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
