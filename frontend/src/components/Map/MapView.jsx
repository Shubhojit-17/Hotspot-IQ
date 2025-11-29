/**
 * Map Container Component
 * The main map canvas using React-Leaflet
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import HeatmapOverlay from './HeatmapOverlay';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// =====================================================
// CONTEXTUAL VISIBILITY - Relevance Matrix
// =====================================================
// Maps business types to landmark categories with relevance scores (0.1 to 1.0)
// Higher score = more relevant for business success
const RELEVANCE_MATRIX = {
  cafe: {
    office: 0.95, school: 0.7, college: 0.9, university: 0.9, hospital: 0.5,
    mall: 0.8, metro_station: 0.9, bus_stop: 0.75, railway_station: 0.85,
    residential: 0.7, park: 0.8, temple: 0.4, bar: 0.85, restaurant: 0.6,
    hotel: 0.7, atm: 0.5, gym: 0.65, pharmacy: 0.3, default: 0.5
  },
  restaurant: {
    office: 0.95, school: 0.5, college: 0.85, university: 0.85, hospital: 0.6,
    mall: 0.85, metro_station: 0.8, bus_stop: 0.65, railway_station: 0.75,
    residential: 0.85, park: 0.6, temple: 0.65, bar: 0.9, restaurant: 0.4,
    hotel: 0.9, atm: 0.5, gym: 0.55, pharmacy: 0.3, default: 0.5
  },
  retail: {
    office: 0.7, school: 0.6, college: 0.75, university: 0.75, hospital: 0.5,
    mall: 0.95, metro_station: 0.9, bus_stop: 0.8, railway_station: 0.85,
    residential: 0.95, park: 0.5, temple: 0.6, bar: 0.4, restaurant: 0.6,
    hotel: 0.7, atm: 0.8, gym: 0.5, pharmacy: 0.6, default: 0.6
  },
  gym: {
    office: 0.9, school: 0.3, college: 0.85, university: 0.85, hospital: 0.4,
    mall: 0.7, metro_station: 0.75, bus_stop: 0.6, railway_station: 0.65,
    residential: 0.95, park: 0.85, temple: 0.2, bar: 0.3, restaurant: 0.5,
    hotel: 0.7, atm: 0.5, gym: 0.2, pharmacy: 0.6, default: 0.5
  },
  pharmacy: {
    office: 0.6, school: 0.7, college: 0.65, university: 0.65, hospital: 0.95,
    mall: 0.7, metro_station: 0.75, bus_stop: 0.7, railway_station: 0.7,
    residential: 0.95, park: 0.4, temple: 0.5, bar: 0.2, restaurant: 0.4,
    hotel: 0.6, atm: 0.6, gym: 0.5, pharmacy: 0.3, default: 0.5
  },
  salon: {
    office: 0.75, school: 0.3, college: 0.7, university: 0.7, hospital: 0.4,
    mall: 0.9, metro_station: 0.7, bus_stop: 0.6, railway_station: 0.65,
    residential: 0.95, park: 0.4, temple: 0.5, bar: 0.6, restaurant: 0.6,
    hotel: 0.8, atm: 0.5, gym: 0.7, pharmacy: 0.4, default: 0.5
  },
  electronics: {
    office: 0.85, school: 0.5, college: 0.9, university: 0.9, hospital: 0.4,
    mall: 0.95, metro_station: 0.85, bus_stop: 0.7, railway_station: 0.8,
    residential: 0.8, park: 0.3, temple: 0.3, bar: 0.3, restaurant: 0.5,
    hotel: 0.6, atm: 0.7, gym: 0.4, pharmacy: 0.3, default: 0.5
  },
  clothing: {
    office: 0.6, school: 0.5, college: 0.85, university: 0.85, hospital: 0.3,
    mall: 0.95, metro_station: 0.85, bus_stop: 0.7, railway_station: 0.8,
    residential: 0.85, park: 0.4, temple: 0.5, bar: 0.5, restaurant: 0.6,
    hotel: 0.7, atm: 0.7, gym: 0.5, pharmacy: 0.3, default: 0.5
  },
  bookstore: {
    office: 0.7, school: 0.95, college: 0.95, university: 0.95, hospital: 0.4,
    mall: 0.75, metro_station: 0.7, bus_stop: 0.6, railway_station: 0.7,
    residential: 0.7, park: 0.6, temple: 0.4, bar: 0.2, restaurant: 0.5,
    hotel: 0.5, atm: 0.5, gym: 0.3, pharmacy: 0.3, default: 0.5
  },
  other: {
    office: 0.6, school: 0.5, college: 0.5, university: 0.5, hospital: 0.5,
    mall: 0.7, metro_station: 0.7, bus_stop: 0.6, railway_station: 0.65,
    residential: 0.7, park: 0.5, temple: 0.5, bar: 0.5, restaurant: 0.5,
    hotel: 0.5, atm: 0.5, gym: 0.5, pharmacy: 0.5, default: 0.5
  }
};

// Get relevance score for a business type and landmark category
const getRelevanceScore = (businessType, landmarkCategory) => {
  const bt = businessType?.toLowerCase() || 'other';
  const lc = landmarkCategory?.toLowerCase().replace(/\s+/g, '_') || 'default';

  const businessScores = RELEVANCE_MATRIX[bt] || RELEVANCE_MATRIX['other'];
  return businessScores[lc] ?? businessScores['default'] ?? 0.5;
};

// Calculate marker style based on relevance
const getMarkerStyle = (businessType, landmarkCategory) => {
  const score = getRelevanceScore(businessType, landmarkCategory);

  // Opacity: 0.35 (low relevance) to 1.0 (high relevance)
  const opacity = 0.35 + (score * 0.65);

  // Scale: 0.7 (low relevance) to 1.15 (high relevance)
  const scale = 0.7 + (score * 0.45);

  // Size: 24px (low relevance) to 36px (high relevance)
  const size = Math.round(24 + (score * 12));

  // Z-index: 100 (low relevance) to 900 (high relevance)
  const zIndex = Math.round(100 + (score * 800));

  return { opacity, scale, size, zIndex, score };
};

// Landmark category to icon mapping
const LANDMARK_ICON_MAP = {
  metro_station: '/icons/metro.svg',
  metro: '/icons/metro.svg',
  bus_stop: '/icons/bus.svg',
  bus: '/icons/bus.svg',
  railway_station: '/icons/metro.svg',
  railway: '/icons/metro.svg',
  school: '/icons/school.svg',
  college: '/icons/college.svg',
  university: '/icons/college.svg',
  hospital: '/icons/hospital.svg',
  clinic: '/icons/hospital.svg',
  mall: '/icons/mall.svg',
  office: '/icons/office.svg',
  residential: '/icons/house.svg',
  temple: '/icons/temple.svg',
  church: '/icons/temple.svg',
  mosque: '/icons/temple.svg',
  park: '/icons/park.svg',
  atm: '/icons/bank.svg',
  bank: '/icons/bank.svg',
  bar: '/icons/bar.svg',
  pub: '/icons/bar.svg',
  restaurant: '/icons/restaurant.svg',
  cafe: '/icons/cafe.svg',
  hotel: '/icons/building.svg',
  pharmacy: '/icons/pharmacy.svg',
  gym: '/icons/gym.svg',
  supermarket: '/icons/mall.svg',
  default: '/icons/marker.svg',
};

// Custom marker icons with SVG - supports dynamic size/opacity for contextual visibility
// Size scaling is handled via CSS classes based on zoom level
const createCustomIcon = (color, iconPath, baseSize = 32, opacity = 1, zIndex = 500) => {
  const iconSize = baseSize;
  const innerIconSize = Math.round(baseSize * 0.5);

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${iconSize}px;
        height: ${iconSize}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        opacity: ${opacity};
        z-index: ${zIndex};
        position: relative;
      ">
        <div style="
          width: ${innerIconSize}px;
          height: ${innerIconSize}px;
          background-color: white;
          -webkit-mask: url('${iconPath}') center/contain no-repeat;
          mask: url('${iconPath}') center/contain no-repeat;
        "></div>
      </div>
    `,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2],
  });
};

// Cache for landmark icons - keyed by category + business type
const landmarkIconCache = {};

// Get landmark icon based on category with contextual visibility styling
const getLandmarkIcon = (category, businessType = null) => {
  const normalizedCategory = category?.toLowerCase().replace(/\s+/g, '_') || 'default';
  const bt = businessType?.toLowerCase() || 'other';
  const cacheKey = `${normalizedCategory}-${bt}`;

  // Return cached icon if available
  if (landmarkIconCache[cacheKey]) {
    return landmarkIconCache[cacheKey];
  }

  const iconPath = LANDMARK_ICON_MAP[normalizedCategory] || LANDMARK_ICON_MAP.default;

  // Get contextual visibility styling
  const style = getMarkerStyle(bt, normalizedCategory);

  // Create icon with contextual styling (CSS handles zoom scaling)
  const icon = createCustomIcon('#06b6d4', iconPath, style.size, style.opacity, style.zIndex);
  landmarkIconCache[cacheKey] = icon;
  return icon;
};

// Numbered recommended spot icon - HIGHLY DISTINCTIVE design
// These are the "best places to start business" markers - must stand out!
const createSpotIcon = (rank, color) => {
  // Much larger than other markers
  const size = 52;
  const fontSize = 18;

  // Bright, high-contrast colors for each rank
  const spotColors = {
    1: { bg: '#FFD700', text: '#000', glow: 'rgba(255, 215, 0, 0.8)', border: '#FFA500' },  // Gold
    2: { bg: '#C0C0C0', text: '#000', glow: 'rgba(192, 192, 192, 0.8)', border: '#A0A0A0' }, // Silver
    3: { bg: '#CD7F32', text: '#fff', glow: 'rgba(205, 127, 50, 0.8)', border: '#8B4513' },  // Bronze
    4: { bg: '#9333EA', text: '#fff', glow: 'rgba(147, 51, 234, 0.8)', border: '#7C3AED' },  // Purple
    5: { bg: '#EC4899', text: '#fff', glow: 'rgba(236, 72, 153, 0.8)', border: '#DB2777' },  // Pink
  };

  const colors = spotColors[rank] || spotColors[5];

  return L.divIcon({
    className: 'recommended-spot-marker',
    html: `
      <div class="spot-container" style="
        position: relative;
        width: ${size}px;
        height: ${size + 15}px;
      ">
        <!-- Pin pointer at bottom -->
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 15px solid ${colors.border};
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        "></div>
        
        <!-- Main circle with star icon -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(145deg, ${colors.bg}, ${colors.border});
          border: 4px solid white;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 
            0 4px 15px ${colors.glow},
            0 0 30px ${colors.glow},
            inset 0 2px 4px rgba(255,255,255,0.4);
          animation: spot-pulse 1.5s ease-in-out infinite;
        ">
          <!-- Star icon -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${colors.text}" style="margin-bottom: 1px;">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <!-- Rank number -->
          <span style="
            font-size: ${fontSize}px;
            font-weight: 900;
            color: ${colors.text};
            text-shadow: ${colors.text === '#000' ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'};
            line-height: 1;
          ">${rank}</span>
        </div>
        
        <!-- Outer ring animation -->
        <div style="
          position: absolute;
          top: -6px;
          left: -6px;
          width: ${size + 12}px;
          height: ${size + 12}px;
          border: 2px solid ${colors.bg};
          border-radius: 50%;
          opacity: 0.6;
          animation: ring-pulse 1.5s ease-in-out infinite;
        "></div>
      </div>
      
      <style>
        @keyframes spot-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 4px 15px ${colors.glow}, 0 0 30px ${colors.glow}, inset 0 2px 4px rgba(255,255,255,0.4);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 6px 25px ${colors.glow}, 0 0 50px ${colors.glow}, inset 0 2px 4px rgba(255,255,255,0.4);
          }
        }
        @keyframes ring-pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.15);
            opacity: 0.2;
          }
        }
      </style>
    `,
    iconSize: [size, size + 15],
    iconAnchor: [size / 2, size + 15],
    popupAnchor: [0, -size - 10],
  });
};

// Create competitor icon (CSS handles zoom scaling)
const createCompetitorIcon = () => {
  return createCustomIcon('#f43f5e', '/icons/store.svg', 32, 1, 500);
};

// landmarkIcon is now dynamically created per category using getLandmarkIcon()

// Component to handle map view changes - only flies to location ONCE when center changes
function MapController({ center, zoom, hasFlown, setHasFlown }) {
  const map = useMap();

  useEffect(() => {
    // Only fly to location once when a NEW location is selected
    if (center && !hasFlown) {
      map.flyTo(center, zoom || 15, {
        duration: 1.5,
      });
      setHasFlown(true);
    }
  }, [center, zoom, map, hasFlown, setHasFlown]);

  return null;
}

// Component to track zoom level and update markers via CSS class
function ZoomTracker({ onZoomChange }) {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      const zoom = Math.round(map.getZoom());
      onZoomChange(zoom);

      // Update CSS class on map container for zoom-based styling
      const container = map.getContainer();
      // Remove old zoom classes
      container.className = container.className.replace(/map-zoom-\d+/g, '').trim();
      // Add new zoom class
      container.classList.add(`map-zoom-${zoom}`);
    };

    // Set initial zoom
    handleZoom();

    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map, onZoomChange]);

  return null;
}

// Component to handle click events
function MapClickHandler({ onClick }) {
  const map = useMap();

  useEffect(() => {
    if (!onClick) return;

    const handleClick = (e) => {
      onClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    };

    map.on('click', handleClick);
    return () => map.off('click', handleClick);
  }, [map, onClick]);

  return null;
}

export default function MapView({
  selectedLocation,
  competitors = [],
  landmarks = [],
  recommendedSpots = [],
  isochrone = null,
  onMapClick,
  onSpotClick,
  center = [12.9716, 77.5946], // Default: Bangalore
  zoom = 13,
  showHeatmap = true,
  showLandmarks = true,
  showCompetitors = true,
  setShowLandmarks,
  setShowCompetitors,
  businessType = null, // For contextual visibility
  radius = null, // Radius in meters
  analysis = null, // For stats panel
  onOpenPanel, // Callback to open analysis panel
  isLoading = false, // Loading state
  isDarkMode = true, // Dark/Light mode toggle
}) {
  const mapRef = useRef(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [showSpots, setShowSpots] = useState(true);
  const [contextualVisibility, setContextualVisibility] = useState(true); // Toggle for contextual visibility
  const [currentZoom, setCurrentZoom] = useState(zoom); // Track current zoom level for dynamic marker sizing
  const [hasFlown, setHasFlown] = useState(false); // Track if we've flown to location (prevent repeated flying)
  const [lastLocationKey, setLastLocationKey] = useState(null); // Track which location we flew to

  // Reset hasFlown when location changes to a NEW location
  useEffect(() => {
    const locationKey = selectedLocation ? `${selectedLocation.lat}-${selectedLocation.lng}` : null;
    if (locationKey !== lastLocationKey) {
      setHasFlown(false);
      setLastLocationKey(locationKey);
    }
  }, [selectedLocation, lastLocationKey]);

  // Clear landmark icon cache when business type changes (for contextual visibility)
  // Note: Zoom scaling is now handled via CSS, so no need to clear on zoom change
  useEffect(() => {
    // Clear cache to force re-creation of icons with new business type styling
    Object.keys(landmarkIconCache).forEach(key => delete landmarkIconCache[key]);
  }, [businessType, contextualVisibility]);

  // Safely convert to arrays
  const competitorList = Array.isArray(competitors) ? competitors : [];
  const landmarkList = Array.isArray(landmarks) ? landmarks : [];
  const spotList = Array.isArray(recommendedSpots) ? recommendedSpots : [];

  // Spot colors by rank
  const getSpotColor = (rank) => {
    const colors = {
      1: '#10b981', // Emerald
      2: '#06b6d4', // Cyan
      3: '#3b82f6', // Blue
      4: '#8b5cf6', // Purple
      5: '#6b7280', // Gray
    };
    return colors[rank] || colors[5];
  };

  // Circle area style
  const circleStyle = {
    color: '#10b981',
    weight: 2,
    opacity: 0.8,
    fillColor: '#10b981',
    fillOpacity: 0.1,
  };

  // Calculate radius for the circular area (meters)
  // Use provided radius prop if available, otherwise fallback to defaults
  const areaRadius = radius || (selectedLocation?.is_major ? 2500 : 1500);

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={true}
        attributionControl={false}
      >
        {/* Tile layer - switches between dark and light mode */}
        <TileLayer
          key={isDarkMode ? 'dark' : 'light'}
          url={isDarkMode
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Map controllers */}
        <MapController
          center={selectedLocation && selectedLocation.lat != null && selectedLocation.lng != null
            ? [selectedLocation.lat, selectedLocation.lng]
            : null}
          zoom={15}
          hasFlown={hasFlown}
          setHasFlown={setHasFlown}
        />
        <MapClickHandler onClick={onMapClick} />
        <ZoomTracker onZoomChange={setCurrentZoom} />

        {/* Circular area selection - covers the entire selected area */}
        {selectedLocation && selectedLocation.lat != null && selectedLocation.lng != null && (
          <Circle
            center={[selectedLocation.lat, selectedLocation.lng]}
            radius={areaRadius}
            pathOptions={circleStyle}
          />
        )}

        {/* Competition Heatmap Overlay */}
        {selectedLocation && selectedLocation.lat != null && heatmapEnabled && showHeatmap && (
          <HeatmapOverlay
            center={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            competitors={competitorList}
            landmarks={landmarkList}
            radius={areaRadius}
            enabled={heatmapEnabled}
          />
        )}

        {/* Recommended Spot markers - rendered LAST to be on top */}
        {showSpots && spotList
          .filter(s => s.lat != null && s.lng != null)
          .map((spot) => (
            <Marker
              key={`spot-${spot.rank}`}
              position={[spot.lat, spot.lng]}
              icon={createSpotIcon(spot.rank, getSpotColor(spot.rank))}
              zIndexOffset={1000 + (6 - spot.rank) * 100}
              eventHandlers={{
                click: () => onSpotClick && onSpotClick(spot)
              }}
            >
              <Popup>
                <div className="text-slate-900 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ background: spot.rank === 1 ? '#FFD700' : spot.rank === 2 ? '#C0C0C0' : spot.rank === 3 ? '#CD7F32' : spot.rank === 4 ? '#9333EA' : '#EC4899' }}>
                      {spot.rank}
                    </div>
                    <div>
                      <span className="font-bold text-base">Best Location #{spot.rank}</span>
                      <p className="text-xs text-slate-500">Recommended for your business</p>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mb-2">
                    {spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${spot.rating === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
                      spot.rating === 'Good' ? 'bg-cyan-100 text-cyan-700' :
                        spot.rating === 'Moderate' ? 'bg-amber-100 text-amber-700' :
                          'bg-orange-100 text-orange-700'
                      }`}>
                      {spot.rating}
                    </span>
                    <span className="text-xs text-slate-600">Score: {Math.round(spot.score)}</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {spot.reasons?.slice(0, 2).map((reason, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <svg className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Competitor markers - only show those with coordinates */}
        {showCompetitors && competitorList
          .filter(c => c.lat != null && c.lng != null)
          .map((competitor, index) => (
            <Marker
              key={`competitor-${index}`}
              position={[competitor.lat, competitor.lng]}
              icon={createCompetitorIcon()}
            >
              <Popup>
                <div className="text-slate-900">
                  <p className="font-semibold">{competitor.name}</p>
                  <p className="text-xs text-slate-500">{competitor.category}</p>
                  {competitor.distance && (
                    <p className="text-xs text-rose-600 mt-1">
                      {competitor.distance}m away
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Landmark markers - only show those with coordinates */}
        {/* Uses contextual visibility to adjust opacity/size based on business relevance */}
        {showLandmarks && landmarkList
          .filter(l => l.lat != null && l.lng != null)
          .map((landmark, index) => {
            const relevance = getRelevanceScore(businessType, landmark.category);
            return (
              <Marker
                key={`landmark-${index}`}
                position={[landmark.lat, landmark.lng]}
                icon={getLandmarkIcon(landmark.category, contextualVisibility ? businessType : null)}
                zIndexOffset={contextualVisibility ? Math.round(relevance * 800) : 0}
              >
                <Popup>
                  <div className="text-slate-900">
                    <p className="font-semibold">{landmark.name}</p>
                    <p className="text-xs text-slate-500">{landmark.category}</p>
                    {contextualVisibility && businessType && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Relevance:</span>
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${relevance >= 0.8 ? 'bg-emerald-500' :
                                relevance >= 0.6 ? 'bg-cyan-500' :
                                  relevance >= 0.4 ? 'bg-amber-500' :
                                    'bg-slate-400'
                                }`}
                              style={{ width: `${relevance * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${relevance >= 0.8 ? 'text-emerald-600' :
                            relevance >= 0.6 ? 'text-cyan-600' :
                              relevance >= 0.4 ? 'text-amber-600' :
                                'text-slate-500'
                            }`}>
                            {Math.round(relevance * 100)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {relevance >= 0.8 ? 'High impact for your business' :
                            relevance >= 0.6 ? 'Moderate impact' :
                              relevance >= 0.4 ? 'Some relevance' :
                                'Low relevance for this business type'}
                        </p>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Unified Bottom-Right Controls - Single Column Stack */}
      {selectedLocation && !isLoading && (
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2 max-w-[220px]">
          {/* Row 1: Quick Stats Panel */}
          {analysis && onOpenPanel && (
            <button
              onClick={onOpenPanel}
              className="w-full backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl p-4 hover:bg-slate-800/90 transition-all cursor-pointer group shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-400">
                    {analysis.recommended_spots?.length || 0}
                  </p>
                  <p className="text-xs text-slate-500">Spots</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-left text-sm">
                  <p className="text-slate-300">
                    <span className="text-rose-400 font-semibold">{analysis.competitors?.count || 0}</span> competitors
                  </p>
                  <p className="text-slate-300">
                    <span className="text-cyan-400 font-semibold">{analysis.landmarks?.total || 0}</span> landmarks
                  </p>
                </div>
                <div className="text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all ml-auto">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          )}

          {/* Row 2: Landmarks & Competitors Toggle */}
          {setShowLandmarks && setShowCompetitors && (
            <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl p-2 flex gap-2 shadow-xl">
              <button
                onClick={() => setShowLandmarks(!showLandmarks)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${showLandmarks
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`}
              >
                <img src="/icons/building.svg" alt="" className="w-4 h-4"
                  style={{ filter: showLandmarks ? 'brightness(0) invert(1)' : 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }}
                />
                <span>Landmarks</span>
              </button>
              <button
                onClick={() => setShowCompetitors(!showCompetitors)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${showCompetitors
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`}
              >
                <img src="/icons/store.svg" alt="" className="w-4 h-4"
                  style={{ filter: showCompetitors ? 'brightness(0) invert(1)' : 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }}
                />
                <span>Competitors</span>
              </button>
            </div>
          )}

          {/* Row 3: Heatmap, Spots, Smart View Toggle */}
          {competitorList.length > 0 && (
            <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl p-2 flex flex-wrap gap-2 shadow-xl">
              <button
                onClick={() => setHeatmapEnabled(!heatmapEnabled)}
                className={`flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all flex items-center justify-center gap-1 ${heatmapEnabled
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Heatmap</span>
              </button>
              {spotList.length > 0 && (
                <button
                  onClick={() => setShowSpots(!showSpots)}
                  className={`flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all flex items-center justify-center gap-1 ${showSpots
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                    }`}
                >
                  <img src="/icons/star.svg" alt="" className="w-4 h-4" style={{ filter: showSpots ? 'brightness(0) invert(1)' : 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }} />
                  <span>{spotList.length} Spots</span>
                </button>
              )}
              {businessType && landmarkList.length > 0 && (
                <button
                  onClick={() => setContextualVisibility(!contextualVisibility)}
                  className={`flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-[9px] font-medium transition-all flex items-center justify-center gap-1 ${contextualVisibility
                    ? 'bg-violet-500 text-white shadow-md shadow-violet-500/25'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                    }`}
                  title="Adjusts landmark visibility based on relevance to your business type"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Smart</span>
                </button>
              )}
            </div>
          )}

          {/* Row 4: Heatmap Legend */}
          {heatmapEnabled && competitorList.length > 0 && (
            <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-xl">
              <p className="text-sm font-medium text-slate-300 mb-2">Competition Density</p>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-md" style={{ background: 'rgb(34, 197, 94)' }} />
                <div className="w-5 h-5 rounded-md" style={{ background: 'rgb(134, 197, 94)' }} />
                <div className="w-5 h-5 rounded-md" style={{ background: 'rgb(255, 200, 0)' }} />
                <div className="w-5 h-5 rounded-md" style={{ background: 'rgb(255, 150, 0)' }} />
                <div className="w-5 h-5 rounded-md" style={{ background: 'rgb(255, 80, 50)' }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Low</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>High</span>
              </div>
            </div>
          )}

          {/* Row 5: Smart View Legend */}
          {contextualVisibility && businessType && landmarkList.length > 0 && (
            <div className="backdrop-blur-xl bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-xl">
              <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Smart: {businessType}
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full bg-cyan-500 opacity-100 flex items-center justify-center">
                    <span className="text-white text-xs">★</span>
                  </div>
                  <span className="text-slate-400">High relevance</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-4 h-4 rounded-full bg-cyan-500 opacity-50 flex items-center justify-center">
                    <span className="text-white text-[8px]">•</span>
                  </div>
                  <span className="text-slate-400">Low relevance</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
