/**
 * Proximity Filters Component
 * Step 2 in the user flow - Select what you want nearby
 */

import { useState } from 'react';

// Proximity filter options with icons and POI mappings
const PROXIMITY_FILTERS = [
  { id: 'near_metro', label: 'Metro', icon: '🚇', popular: true },
  { id: 'near_bus', label: 'Bus Stop', icon: '🚌', popular: false },
  { id: 'near_school', label: 'School', icon: '🏫', popular: false },
  { id: 'near_college', label: 'College', icon: '🎓', popular: true },
  { id: 'near_hospital', label: 'Hospital', icon: '🏥', popular: false },
  { id: 'near_mall', label: 'Mall', icon: '🏬', popular: true },
  { id: 'near_office', label: 'Office/IT', icon: '🏢', popular: true },
  { id: 'near_residential', label: 'Residential', icon: '🏠', popular: false },
  { id: 'near_temple', label: 'Temple', icon: '🛕', popular: false },
  { id: 'near_park', label: 'Park', icon: '🌳', popular: false },
  { id: 'near_atm', label: 'ATM/Bank', icon: '🏦', popular: false },
  { id: 'near_bar', label: 'Bar/Pub', icon: '🍺', popular: false },
];

export default function ProximityFilters({ value = [], onChange, disabled }) {
  const [showAll, setShowAll] = useState(false);

  const toggleFilter = (filterId) => {
    if (disabled) return;
    
    const newFilters = value.includes(filterId)
      ? value.filter((f) => f !== filterId)
      : [...value, filterId];
    
    onChange(newFilters);
  };

  const selectPopular = () => {
    const popularFilters = PROXIMITY_FILTERS.filter((f) => f.popular).map((f) => f.id);
    onChange(popularFilters);
  };

  const clearAll = () => {
    onChange([]);
  };

  // Show only first 6 filters by default, or all if expanded
  const visibleFilters = showAll ? PROXIMITY_FILTERS : PROXIMITY_FILTERS.slice(0, 6);

  return (
    <div className="space-y-3 relative z-20">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-400">
          Step 2: What do you want nearby?
        </label>
        <span className="text-xs text-slate-500">
          {value.length} selected
        </span>
      </div>

      {/* Filter Chips Grid */}
      <div className={`grid grid-cols-3 gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {visibleFilters.map((filter) => {
          const isActive = value.includes(filter.id);
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => toggleFilter(filter.id)}
              className={`
                chip flex flex-col items-center justify-center gap-1 py-2
                ${isActive ? 'chip-active' : 'chip-inactive'}
              `}
            >
              <span className="text-lg">{filter.icon}</span>
              <span className="text-xs truncate w-full text-center">{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Show More / Less Toggle */}
      {PROXIMITY_FILTERS.length > 6 && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showAll ? '← Show less' : `Show ${PROXIMITY_FILTERS.length - 6} more →`}
        </button>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectPopular}
          disabled={disabled}
          className="flex-1 text-xs py-1.5 px-2 rounded border border-surface-border text-slate-400 hover:text-primary-bright hover:border-primary-glow transition-colors disabled:opacity-50"
        >
          ✨ Select Popular
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled || value.length === 0}
          className="flex-1 text-xs py-1.5 px-2 rounded border border-surface-border text-slate-400 hover:text-destructive-bright hover:border-destructive-glow transition-colors disabled:opacity-50"
        >
          ✕ Clear All
        </button>
      </div>

      {/* Optional hint */}
      <p className="text-xs text-slate-500">
        Optional • Filters affect score calculation
      </p>
    </div>
  );
}
