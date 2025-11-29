/**
 * Landmarks Card Component
 * Displays nearby landmarks grouped by category with footfall indicators
 */

import { useState } from 'react';

// Landmark category icons and weights - using SVG icons
const CATEGORY_CONFIG = {
  metro_station: { icon: '/icons/metro.svg', label: 'Metro Station', weight: 5 },
  metro: { icon: '/icons/metro.svg', label: 'Metro Station', weight: 5 },
  bus_stop: { icon: '/icons/bus.svg', label: 'Bus Stop', weight: 3 },
  bus: { icon: '/icons/bus.svg', label: 'Bus Stop', weight: 3 },
  railway_station: { icon: '/icons/metro.svg', label: 'Railway', weight: 5 },
  railway: { icon: '/icons/metro.svg', label: 'Railway', weight: 5 },
  school: { icon: '/icons/school.svg', label: 'School', weight: 4 },
  college: { icon: '/icons/college.svg', label: 'College', weight: 4 },
  university: { icon: '/icons/college.svg', label: 'University', weight: 4 },
  hospital: { icon: '/icons/hospital.svg', label: 'Hospital', weight: 4 },
  clinic: { icon: '/icons/hospital.svg', label: 'Clinic', weight: 3 },
  mall: { icon: '/icons/mall.svg', label: 'Mall', weight: 5 },
  office: { icon: '/icons/office.svg', label: 'Office', weight: 4 },
  residential: { icon: '/icons/house.svg', label: 'Residential', weight: 3 },
  temple: { icon: '/icons/temple.svg', label: 'Temple/Church', weight: 3 },
  church: { icon: '/icons/temple.svg', label: 'Church', weight: 3 },
  mosque: { icon: '/icons/temple.svg', label: 'Mosque', weight: 3 },
  park: { icon: '/icons/park.svg', label: 'Park', weight: 2 },
  atm: { icon: '/icons/bank.svg', label: 'ATM', weight: 2 },
  bank: { icon: '/icons/bank.svg', label: 'Bank', weight: 3 },
  bar: { icon: '/icons/bar.svg', label: 'Bar/Pub', weight: 3 },
  pub: { icon: '/icons/bar.svg', label: 'Bar/Pub', weight: 3 },
  restaurant: { icon: '/icons/restaurant.svg', label: 'Restaurant', weight: 3 },
  cafe: { icon: '/icons/cafe.svg', label: 'Cafe', weight: 3 },
  hotel: { icon: '/icons/building.svg', label: 'Hotel', weight: 4 },
  pharmacy: { icon: '/icons/pharmacy.svg', label: 'Pharmacy', weight: 3 },
  gym: { icon: '/icons/gym.svg', label: 'Gym', weight: 3 },
  supermarket: { icon: '/icons/mall.svg', label: 'Supermarket', weight: 3 },
  nearby: { icon: '/icons/marker.svg', label: 'Nearby Places', weight: 2 },
  // Default fallback
  default: { icon: '/icons/marker.svg', label: 'Other', weight: 1 },
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
          <img src="/icons/building.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(70%) sepia(98%) saturate(500%) hue-rotate(152deg) brightness(97%) contrast(90%)' }} />
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
          <img src="/icons/marker.svg" alt="" className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ filter: 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }} />
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
                  <div className="w-8 h-8 bg-surface-secondary rounded-lg flex items-center justify-center">
                    <img 
                      src={config.icon} 
                      alt="" 
                      className="w-5 h-5"
                      style={{ filter: 'invert(70%) sepia(98%) saturate(500%) hue-rotate(152deg) brightness(97%) contrast(90%)' }}
                    />
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
                      <img 
                        src={config.icon} 
                        alt="" 
                        className="w-4 h-4 flex-shrink-0"
                        style={{ filter: 'invert(70%) sepia(98%) saturate(500%) hue-rotate(152deg) brightness(97%) contrast(90%)' }}
                      />
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
