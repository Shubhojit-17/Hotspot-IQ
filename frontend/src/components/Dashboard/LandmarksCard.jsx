/**
 * Landmarks Card Component
 * Displays nearby landmarks grouped by category with footfall indicators
 */

import { useState } from 'react';

// Landmark category icons and weights
const CATEGORY_CONFIG = {
  metro_station: { icon: '🚇', label: 'Metro Station', weight: 5 },
  metro: { icon: '🚇', label: 'Metro Station', weight: 5 },
  bus_stop: { icon: '🚌', label: 'Bus Stop', weight: 3 },
  bus: { icon: '🚌', label: 'Bus Stop', weight: 3 },
  railway_station: { icon: '🚉', label: 'Railway', weight: 5 },
  railway: { icon: '🚉', label: 'Railway', weight: 5 },
  school: { icon: '🏫', label: 'School', weight: 4 },
  college: { icon: '🎓', label: 'College', weight: 4 },
  university: { icon: '🎓', label: 'University', weight: 4 },
  hospital: { icon: '🏥', label: 'Hospital', weight: 4 },
  clinic: { icon: '🏥', label: 'Clinic', weight: 3 },
  mall: { icon: '🛒', label: 'Mall', weight: 5 },
  office: { icon: '🏢', label: 'Office', weight: 4 },
  residential: { icon: '🏘️', label: 'Residential', weight: 3 },
  temple: { icon: '🛕', label: 'Temple/Church', weight: 3 },
  church: { icon: '⛪', label: 'Church', weight: 3 },
  mosque: { icon: '🕌', label: 'Mosque', weight: 3 },
  park: { icon: '🌳', label: 'Park', weight: 2 },
  atm: { icon: '🏧', label: 'ATM', weight: 2 },
  bank: { icon: '🏦', label: 'Bank', weight: 3 },
  bar: { icon: '🍺', label: 'Bar/Pub', weight: 3 },
  pub: { icon: '🍺', label: 'Bar/Pub', weight: 3 },
  restaurant: { icon: '🍽️', label: 'Restaurant', weight: 3 },
  cafe: { icon: '☕', label: 'Cafe', weight: 3 },
  hotel: { icon: '🏨', label: 'Hotel', weight: 4 },
  pharmacy: { icon: '💊', label: 'Pharmacy', weight: 3 },
  gym: { icon: '🏋️', label: 'Gym', weight: 3 },
  supermarket: { icon: '🛒', label: 'Supermarket', weight: 3 },
  nearby: { icon: '📍', label: 'Nearby Places', weight: 2 },
  // Default fallback
  default: { icon: '📍', label: 'Other', weight: 1 },
};

export default function LandmarksCard({ landmarks = [], isLoading }) {
  const [showAllLandmarks, setShowAllLandmarks] = useState(false);
  
  // Ensure landmarks is an array
  const landmarkList = Array.isArray(landmarks) ? landmarks : [];
  
  // Group landmarks by category
  const groupedLandmarks = landmarkList.reduce((acc, landmark) => {
    const category = landmark.category?.toLowerCase().replace(/\s+/g, '_') || 'default';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(landmark);
    return acc;
  }, {});

  // Sort categories by weight (highest first)
  const sortedCategories = Object.entries(groupedLandmarks).sort((a, b) => {
    const configA = CATEGORY_CONFIG[a[0]] || CATEGORY_CONFIG.default;
    const configB = CATEGORY_CONFIG[b[0]] || CATEGORY_CONFIG.default;
    return configB.weight - configA.weight;
  });

  // Calculate total footfall value
  const totalFootfallValue = landmarkList.reduce((total, landmark) => {
    const category = landmark.category?.toLowerCase().replace(/\s+/g, '_') || 'default';
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.default;
    return total + config.weight;
  }, 0);

  const getFootfallLevel = (value) => {
    if (value >= 30) return { label: 'High', color: 'text-primary-glow' };
    if (value >= 15) return { label: 'Medium', color: 'text-accent-glow' };
    return { label: 'Low', color: 'text-warning-glow' };
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <span className="text-lg">🏛️</span>
          Nearby Landmarks
        </h3>
        {!isLoading && (
          <span className="text-xs bg-primary-glow/20 text-primary-glow px-2 py-1 rounded-full">
            {landmarkList.length} found
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-700 rounded-lg animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-20 mb-1" />
                <div className="h-3 bg-slate-700/50 rounded animate-pulse w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : landmarkList.length === 0 ? (
        <div className="text-center py-6">
          <span className="text-2xl mb-2 block">🏜️</span>
          <p className="text-slate-400 text-sm">No landmarks nearby</p>
          <p className="text-slate-500 text-xs mt-1">May indicate low footfall area</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Category Summary */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sortedCategories.map(([category, items]) => {
              const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.default;
              return (
                <div 
                  key={category}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                >
                  {/* Category icon */}
                  <div className="w-8 h-8 bg-surface-secondary rounded-lg flex items-center justify-center text-lg">
                    {config.icon}
                  </div>
                  
                  {/* Category info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-sm">{config.label}</p>
                    <p className="text-slate-500 text-xs">{items.length} nearby</p>
                  </div>
                  
                  {/* Weight indicator */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <div
                        key={dot}
                        className={`w-1.5 h-1.5 rounded-full ${
                          dot <= config.weight ? 'bg-primary-glow' : 'bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Show All Landmarks Button */}
          {showAllLandmarks ? (
            <div className="mt-3 pt-3 border-t border-surface-border">
              <button
                onClick={() => setShowAllLandmarks(false)}
                className="text-xs text-primary-glow hover:text-primary-glow/80 mb-2"
              >
                ▲ Hide individual landmarks
              </button>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {landmarkList.map((landmark, idx) => {
                  const category = landmark.category?.toLowerCase().replace(/\s+/g, '_') || 'default';
                  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.default;
                  return (
                    <div key={idx} className="flex items-center gap-2 p-1.5 text-xs rounded hover:bg-surface-secondary">
                      <span>{config.icon}</span>
                      <span className="text-slate-300 truncate flex-1">{landmark.name}</span>
                      {landmark.distance && (
                        <span className="text-slate-500">{landmark.distance}m</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAllLandmarks(true)}
              className="w-full text-xs text-primary-glow hover:text-primary-glow/80 mt-2 py-1"
            >
              ▼ Show all {landmarkList.length} landmarks
            </button>
          )}
        </div>
      )}
      
      {/* Footfall value indicator */}
      {!isLoading && landmarkList.length > 0 && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Footfall Potential</span>
            <span className={getFootfallLevel(totalFootfallValue).color}>
              {getFootfallLevel(totalFootfallValue).label}
              <span className="text-slate-600 ml-1">({totalFootfallValue} pts)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
