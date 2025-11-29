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
const createCustomIcon = (color, iconPath, size = 32, opacity = 1, zIndex = 500) => {
  const iconSize = size;
  const innerIconSize = Math.round(size * 0.56); // Icon image size proportional to marker

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
        transition: opacity 0.3s ease, transform 0.3s ease;
        z-index: ${zIndex};
      ">
        <img src="${iconPath}" alt="" style="width: ${innerIconSize}px; height: ${innerIconSize}px; filter: brightness(0) invert(1);" />
      </div>
    `,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2],
  });
};

// Cache for landmark icons - keyed by category + style params
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

  // Create icon with contextual styling
  const icon = createCustomIcon('#06b6d4', iconPath, style.size, style.opacity, style.zIndex);
  landmarkIconCache[cacheKey] = icon;
  return icon;
};

// Numbered recommended spot icon
const createSpotIcon = (rank, color) => {
  return L.divIcon({
    className: 'custom-marker recommended-spot',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, ${color}, ${color}dd);
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        color: white;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5), 0 0 20px ${color}40;
        animation: pulse-glow 2s ease-in-out infinite;
      ">
        ${rank}
      </div>
      <style>
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5), 0 0 20px ${color}40; }
          50% { box-shadow: 0 4px 20px rgba(16, 185, 129, 0.8), 0 0 30px ${color}60; }
        }
      </style>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const selectedIcon = createCustomIcon('#10b981', '/icons/location-pin.svg');
const competitorIcon = createCustomIcon('#f43f5e', '/icons/store.svg');
// landmarkIcon is now dynamically created per category using getLandmarkIcon()

// Component to handle map view changes
function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, {
        duration: 1.5,
      });
    }
  }, [center, zoom, map]);

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
  businessType = null, // For contextual visibility
  radius = null, // Radius in meters
}) {
  const mapRef = useRef(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [showSpots, setShowSpots] = useState(true);
  const [contextualVisibility, setContextualVisibility] = useState(true); // Toggle for contextual visibility

  // Clear landmark icon cache when business type changes (for contextual visibility)
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
        {/* Dark tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Map controllers */}
        <MapController
          center={selectedLocation && selectedLocation.lat != null && selectedLocation.lng != null
            ? [selectedLocation.lat, selectedLocation.lng]
            : null}
          zoom={15}
        />
        <MapClickHandler onClick={onMapClick} />

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

        {/* Recommended Spot markers */}
        {showSpots && spotList
          .filter(s => s.lat != null && s.lng != null)
          .map((spot) => (
            <Marker
              key={`spot-${spot.rank}`}
              position={[spot.lat, spot.lng]}
              icon={createSpotIcon(spot.rank, getSpotColor(spot.rank))}
              eventHandlers={{
                click: () => onSpotClick && onSpotClick(spot)
              }}
            >
              <Popup>
                <div className="text-slate-900 min-w-[180px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg" style={{ color: getSpotColor(spot.rank) }}>#{spot.rank}</span>
                    <span className="font-semibold">Recommended Spot</span>
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
              icon={competitorIcon}
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

      {/* Heatmap Toggle & Legend */}
      {selectedLocation && competitorList.length > 0 && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          {/* Toggle Buttons */}
          <div className="flex flex-wrap gap-2 mb-2 justify-end">
            <button
              onClick={() => setHeatmapEnabled(!heatmapEnabled)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${heatmapEnabled
                  ? 'bg-primary-glow text-canvas-deep'
                  : 'bg-surface-secondary text-slate-400 hover:bg-surface-elevated'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {heatmapEnabled ? 'Heatmap ON' : 'Heatmap OFF'}
            </button>
            {spotList.length > 0 && (
              <button
                onClick={() => setShowSpots(!showSpots)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${showSpots
                    ? 'bg-emerald-500 text-white'
                    : 'bg-surface-secondary text-slate-400 hover:bg-surface-elevated'
                  }`}
              >
                <img src="/icons/star.svg" alt="" className="w-4 h-4" style={{ filter: showSpots ? 'brightness(0) invert(1)' : 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)' }} />
                {showSpots ? `${spotList.length} Spots` : 'Show Spots'}
              </button>
            )}
            {/* Contextual Visibility Toggle */}
            {businessType && landmarkList.length > 0 && (
              <button
                onClick={() => setContextualVisibility(!contextualVisibility)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${contextualVisibility
                    ? 'bg-violet-500 text-white'
                    : 'bg-surface-secondary text-slate-400 hover:bg-surface-elevated'
                  }`}
                title="Adjusts landmark visibility based on relevance to your business type"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {contextualVisibility ? 'Smart View' : 'Equal View'}
              </button>
            )}
          </div>

          {/* Legend */}
          {heatmapEnabled && (
            <div className="bg-canvas-base/90 backdrop-blur-sm border border-surface-border rounded-lg p-3 shadow-lg">
              <p className="text-xs font-medium text-slate-300 mb-2">Competition Density</p>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded" style={{ background: 'rgb(34, 197, 94)' }} />
                <div className="w-4 h-4 rounded" style={{ background: 'rgb(134, 197, 94)' }} />
                <div className="w-4 h-4 rounded" style={{ background: 'rgb(255, 200, 0)' }} />
                <div className="w-4 h-4 rounded" style={{ background: 'rgb(255, 150, 0)' }} />
                <div className="w-4 h-4 rounded" style={{ background: 'rgb(255, 80, 50)' }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Opportunity</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>High Competition</span>
              </div>
            </div>
          )}

          {/* Contextual Visibility Legend */}
          {contextualVisibility && businessType && landmarkList.length > 0 && (
            <div className="bg-canvas-base/90 backdrop-blur-sm border border-surface-border rounded-lg p-3 shadow-lg mt-2">
              <p className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Smart View for {businessType}
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-5 h-5 rounded-full bg-cyan-500 opacity-100 flex items-center justify-center">
                    <span className="text-white text-[8px]">★</span>
                  </div>
                  <span className="text-slate-400">High relevance - larger, prominent</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <div className="w-4 h-4 rounded-full bg-cyan-500 opacity-50 flex items-center justify-center">
                    <span className="text-white text-[7px]">•</span>
                  </div>
                  <span className="text-slate-400">Low relevance - smaller, faded</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
