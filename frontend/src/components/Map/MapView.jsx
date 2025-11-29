/**
 * Map Container Component
 * The main map canvas using React-Leaflet
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';

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
  isochrone = null,
  onMapClick,
  center = [12.9716, 77.5946], // Default: Bangalore
  zoom = 13,
}) {
  const mapRef = useRef(null);

  // Safely convert to arrays
  const competitorList = Array.isArray(competitors) ? competitors : [];
  const landmarkList = Array.isArray(landmarks) ? landmarks : [];

  // Isochrone style
  const isochroneStyle = {
    color: '#10b981',
    weight: 2,
    opacity: 0.8,
    fillColor: '#10b981',
    fillOpacity: 0.15,
  };

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

        {/* Isochrone polygon */}
        {isochrone && isochrone.geometry && (
          <GeoJSON 
            key={JSON.stringify(isochrone)}
            data={isochrone} 
            style={isochroneStyle}
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
    </div>
  );
}
