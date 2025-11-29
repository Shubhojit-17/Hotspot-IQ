/**
 * App.jsx - Main Application Component
 * Hotspot IQ - Location Intelligence Platform
 */

import { useState, useCallback, useEffect } from 'react';

// Layout
import { Header } from './components/Layout';

// Components
import { BusinessTypeSelector } from './components/Filters';
import { SearchBar } from './components/Search';
import { MapView } from './components/Map';
import { AnalysisPanel, LoadingProgress } from './components/Dashboard';
import { ChatBot } from './components/Chat';

// Hooks
import { useAnalysis } from './hooks';

// API
import { geocodeLocation, reverseGeocode } from './services/api';

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
  // Theme state - default to dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference, default to dark
    const saved = localStorage.getItem('hotspotiq-theme');
    return saved ? saved === 'dark' : true;
  });

  // Toggle theme and save preference
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('hotspotiq-theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Step 1: Business Type
  const [businessType, setBusinessType] = useState(null);

  // Step 2: Proximity Filters
  const [selectedFilters, setSelectedFilters] = useState([]);
  // Step 2.5: Radius
  const [radius, setRadius] = useState(1000);

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

  // Handle map click - reverse geocode to get address
  const handleMapClick = useCallback(async (coords) => {
    // Set immediately with coordinates for responsiveness
    const tempName = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    setSelectedLocation({
      name: tempName,
      lat: coords.lat,
      lng: coords.lng,
    });

    // Reverse geocode using the selected radius to get area name for the whole region
    try {
      // Use the current radius for area-based reverse geocoding
      const result = await reverseGeocode(coords.lat, coords.lng, radius);
      if (result) {
        // Use area_name for display (cleaner, shows just the locality)
        // Fall back to formatted_address if area_name is not available
        const displayName = result.area_name || result.formatted_address || tempName;
        setSelectedLocation({
          name: displayName,
          lat: coords.lat,
          lng: coords.lng,
          pincode: result.pincode,
          landmark: result.landmark,
          fullAddress: result.formatted_address, // Keep full address for reference
          areasInRadius: result.areas_in_radius, // All areas found in the radius
        });
      }
    } catch (error) {
      console.error('Reverse geocode failed:', error);
      // Keep the coordinate-based name if reverse geocode fails
    }
  }, [radius]);

  // Update area name when radius changes (if we have a selected location)
  useEffect(() => {
    const updateAreaName = async () => {
      if (!selectedLocation?.lat || !selectedLocation?.lng) return;
      
      try {
        const result = await reverseGeocode(selectedLocation.lat, selectedLocation.lng, radius);
        if (result?.area_name) {
          setSelectedLocation(prev => ({
            ...prev,
            name: result.area_name,
            areasInRadius: result.areas_in_radius,
          }));
        }
      } catch (error) {
        console.error('Failed to update area name for new radius:', error);
      }
    };
    
    // Debounce the update to avoid too many API calls while sliding
    const timeoutId = setTimeout(updateAreaName, 500);
    return () => clearTimeout(timeoutId);
  }, [radius, selectedLocation?.lat, selectedLocation?.lng]);

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
    const result = await analyze(selectedLocation, businessType, selectedFilters, radius);

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
  }, [selectedLocation, businessType, selectedFilters, analyze, radius]);

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
    <div className="h-screen bg-canvas-base overflow-hidden">
      {/* Toast Notification for Validation Errors */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Floating Header - Above everything */}
      <Header isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />

      {/* Full-screen Map Layer */}
      <div className="absolute inset-0">
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
          setShowLandmarks={setShowLandmarks}
          setShowCompetitors={setShowCompetitors}
          businessType={businessType}
          radius={radius}
          analysis={analysis}
          onOpenPanel={() => setIsPanelOpen(true)}
          isLoading={isLoading}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Loading Progress - Fixed Top Right (above map controls) */}
      {(isLoading || loadingStatus.step === 'complete' || loadingStatus.step === 'error') && (
        <LoadingProgress status={loadingStatus} isLoading={isLoading} />
      )}

      {/* Command Panel - Left Sidebar */}
      <div className="fixed left-6 top-20 bottom-6 w-[340px] z-20 pointer-events-none">
        <div className="h-full backdrop-blur-xl bg-slate-900/80 border border-white/10 rounded-3xl shadow-2xl shadow-black/30 pointer-events-auto overflow-hidden flex flex-col">
          {/* Sidebar Header */}
          <div className="p-5 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              Location Analysis
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure your business search parameters</p>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Step 1: Location Search - Spotlight Style */}
            <div className="relative z-30">
              <SearchBar
                onLocationSelect={handleLocationSelect}
                disabled={false}
                selectedLocation={selectedLocation}
              />
            </div>

            {/* Step 2: Search Radius Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300">Search Radius</label>
                <span className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  {radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.5 km</span>
                <span>2.5 km</span>
                <span>5.0 km</span>
              </div>
            </div>

            {/* Step 3: Business Type - Icon Grid */}
            <div className="relative z-10">
              <BusinessTypeSelector
                value={businessType}
                onChange={(value) => {
                  setBusinessType(value);
                  clearAnalysis();
                }}
              />
            </div>
          </div>

          {/* Fixed Footer - Analyze Button */}
          <div className="p-5 border-t border-white/5 bg-slate-900/50">
            {selectedLocation ? (
              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className={`
                  w-full py-4 rounded-xl text-base font-semibold transition-all duration-300
                  flex items-center justify-center gap-2
                  ${canAnalyze 
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                `}
              >
                {isLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Analyzing...</span>
                  </>
                ) : isGeocoding ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Finding location...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Analyze Location</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-center text-sm text-slate-500 py-3">
                <p>Select a business type and location to begin</p>
              </div>
            )}
          </div>
        </div>
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
