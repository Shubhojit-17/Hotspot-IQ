/**
 * Proximity Filters Component
 * Step 2 in the user flow - Select what you want nearby
 */

import { useState } from 'react';
import { PROXIMITY_ICONS } from '../common/Icon';

// Proximity filter options with SVG icons
const PROXIMITY_FILTERS = [
  { id: 'near_metro', label: 'Metro', icon: PROXIMITY_ICONS.near_metro, popular: true },
  { id: 'near_bus', label: 'Bus Stop', icon: PROXIMITY_ICONS.near_bus, popular: false },
  { id: 'near_school', label: 'School', icon: PROXIMITY_ICONS.near_school, popular: false },
  { id: 'near_college', label: 'College', icon: PROXIMITY_ICONS.near_college, popular: true },
  { id: 'near_hospital', label: 'Hospital', icon: PROXIMITY_ICONS.near_hospital, popular: false },
  { id: 'near_mall', label: 'Mall', icon: PROXIMITY_ICONS.near_mall, popular: true },
  { id: 'near_office', label: 'Office/IT', icon: PROXIMITY_ICONS.near_office, popular: true },
  { id: 'near_residential', label: 'Residential', icon: PROXIMITY_ICONS.near_residential, popular: false },
  { id: 'near_temple', label: 'Temple', icon: PROXIMITY_ICONS.near_temple, popular: false },
  { id: 'near_park', label: 'Park', icon: PROXIMITY_ICONS.near_park, popular: false },
  { id: 'near_atm', label: 'ATM/Bank', icon: PROXIMITY_ICONS.near_atm, popular: false },
  { id: 'near_bar', label: 'Bar/Pub', icon: PROXIMITY_ICONS.near_bar, popular: false },
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
              <img 
                src={filter.icon} 
                alt="" 
                className="w-5 h-5"
                style={{ filter: isActive 
                  ? 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)' 
                  : 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)'
                }}
              />
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
          className="flex-1 text-xs py-1.5 px-2 rounded border border-surface-border text-slate-400 hover:text-primary-bright hover:border-primary-glow transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Select Popular
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={disabled || value.length === 0}
          className="flex-1 text-xs py-1.5 px-2 rounded border border-surface-border text-slate-400 hover:text-destructive-bright hover:border-destructive-glow transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear All
        </button>
      </div>

      {/* Optional hint */}
      <p className="text-xs text-slate-500">
        Optional • Filters affect score calculation
      </p>
    </div>
  );
}
