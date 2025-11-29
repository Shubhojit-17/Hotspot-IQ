/**
 * Map Container Component
 * The main map canvas using React-Leaflet
 */

import { useEffect, useRef, useState } from 'react';
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

// Custom marker icons
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${emoji}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
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

const selectedIcon = createCustomIcon('#10b981', '📍');
const competitorIcon = createCustomIcon('#f43f5e', '🏪');
const landmarkIcon = createCustomIcon('#06b6d4', '🏛️');

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
}) {
  const mapRef = useRef(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [showSpots, setShowSpots] = useState(true);

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
  const areaRadius = selectedLocation?.is_major ? 2500 : 1500;

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
            radius={selectedLocation.is_major ? 2500 : 1500}
            enabled={heatmapEnabled}
          />
        )}

        {/* Selected location marker */}
        {selectedLocation && selectedLocation.lat != null && selectedLocation.lng != null && (
          <Marker 
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={selectedIcon}
          >
            <Popup>
              <div className="text-slate-900 min-w-[150px]">
                <p className="font-semibold">{selectedLocation.name || 'Selected Location'}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {Number(selectedLocation.lat).toFixed(6)}, {Number(selectedLocation.lng).toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
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
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    spot.rating === 'Excellent' ? 'bg-emerald-100 text-emerald-700' :
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
                      <span className="text-emerald-500">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Competitor markers - only show those with coordinates */}
        {competitorList
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
        {landmarkList
          .filter(l => l.lat != null && l.lng != null)
          .map((landmark, index) => (
          <Marker
            key={`landmark-${index}`}
            position={[landmark.lat, landmark.lng]}
            icon={landmarkIcon}
          >
            <Popup>
              <div className="text-slate-900">
                <p className="font-semibold">{landmark.name}</p>
                <p className="text-xs text-slate-500">{landmark.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Heatmap Toggle & Legend */}
      {selectedLocation && competitorList.length > 0 && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setHeatmapEnabled(!heatmapEnabled)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                heatmapEnabled 
                  ? 'bg-primary-glow text-canvas-deep' 
                  : 'bg-surface-secondary text-slate-400 hover:bg-surface-elevated'
              }`}
            >
              {heatmapEnabled ? '🗺️ Heatmap ON' : '🗺️ Heatmap OFF'}
            </button>
            {spotList.length > 0 && (
              <button
                onClick={() => setShowSpots(!showSpots)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  showSpots 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-surface-secondary text-slate-400 hover:bg-surface-elevated'
                }`}
              >
                {showSpots ? `🎯 ${spotList.length} Spots` : '🎯 Show Spots'}
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
                <span>🟢 Opportunity</span>
                <span>🔴 High Competition</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
