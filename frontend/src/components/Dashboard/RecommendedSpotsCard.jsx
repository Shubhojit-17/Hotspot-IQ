/**
 * Recommended Spots Card Component
 * Displays optimal locations for setting up a business based on analysis
 */

import { useState } from 'react';

// Rating badge component
const RatingBadge = ({ rating, color }) => {
  const colorClasses = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colorClasses[color] || colorClasses.cyan}`}>
      {rating}
    </span>
  );
};

// Individual spot card
const SpotItem = ({ spot, index, isExpanded, onToggle, onViewOnMap }) => {
  const rankColors = {
    1: 'from-emerald-500 to-emerald-600',
    2: 'from-cyan-500 to-cyan-600',
    3: 'from-blue-500 to-blue-600',
    4: 'from-purple-500 to-purple-600',
    5: 'from-slate-500 to-slate-600',
  };

  return (
    <div 
      className={`rounded-lg border transition-all duration-200 ${
        isExpanded 
          ? 'bg-surface-elevated border-primary-glow/30' 
          : 'bg-surface-secondary border-surface-border hover:border-slate-600'
      }`}
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        {/* Rank badge */}
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${rankColors[spot.rank] || rankColors[5]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
          {spot.rank}
        </div>
        
        {/* Location info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-200 font-medium">Spot #{spot.rank}</span>
            <RatingBadge rating={spot.rating} color={spot.rating_color} />
          </div>
          <p className="text-xs text-slate-500 font-mono truncate">
            {spot.lat}, {spot.lng}
          </p>
        </div>
        
        {/* Score */}
        <div className="text-right">
          <div className="text-lg font-bold text-primary-glow">{Math.round(spot.score)}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">Score</div>
        </div>
        
        {/* Expand indicator */}
        <svg 
          className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-surface-border pt-3">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface-secondary rounded-lg p-2 text-center">
              <div className="text-rose-400 font-semibold">{spot.nearby_competitors}</div>
              <div className="text-[10px] text-slate-500">Competitors Nearby</div>
            </div>
            <div className="bg-surface-secondary rounded-lg p-2 text-center">
              <div className="text-cyan-400 font-semibold">{spot.nearby_landmarks}</div>
              <div className="text-[10px] text-slate-500">Landmarks</div>
            </div>
          </div>
          
          {/* Distance to nearest competitor */}
          {spot.min_competitor_distance && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Nearest competitor:</span>
              <span className={`font-medium ${spot.min_competitor_distance > 300 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {spot.min_competitor_distance}m away
              </span>
            </div>
          )}
          
          {/* Reasons */}
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400 font-medium">Why this spot:</p>
            <ul className="space-y-1">
              {spot.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <svg className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Action button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewOnMap(spot);
            }}
            className="w-full py-2 bg-primary-glow/10 hover:bg-primary-glow/20 text-primary-glow text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            View on Map
          </button>
        </div>
      )}
    </div>
  );
};

export default function RecommendedSpotsCard({ spots = [], isLoading, onViewSpot }) {
  const [expandedIndex, setExpandedIndex] = useState(0); // First spot expanded by default

  if (isLoading) {
    return (
      <div className="glass-panel p-5">
        <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
          <img src="/icons/star.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)' }} />
          Recommended Locations
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-secondary rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-700" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-24 mb-2" />
                  <div className="h-3 bg-slate-700/50 rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!spots || spots.length === 0) {
    return (
      <div className="glass-panel p-5">
        <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
          <img src="/icons/star.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)' }} />
          Recommended Locations
        </h3>
        <div className="text-center py-8">
          <img src="/icons/search.svg" alt="" className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ filter: 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }} />
          <p className="text-slate-400 text-sm">
            No optimal spots found in this area.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Try expanding the search radius or selecting a different area.
          </p>
        </div>
      </div>
    );
  }

  const topSpot = spots[0];

  return (
    <div className="glass-panel p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400 flex items-center gap-2">
          <img src="/icons/star.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)' }} />
          Recommended Locations
        </h3>
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
          {spots.length} spots found
        </span>
      </div>
      
      {/* Best spot highlight */}
      {topSpot && (
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <img src="/icons/star.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(74%) sepia(52%) saturate(579%) hue-rotate(93deg) brightness(95%) contrast(88%)' }} />
            <span className="text-emerald-400 font-semibold text-sm">Best Location Found</span>
          </div>
          <p className="text-xs text-slate-300">
            {topSpot.reasons[0] || 'Optimal balance of low competition and good footfall'}
          </p>
        </div>
      )}
      
      {/* Spots list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        {spots.map((spot, index) => (
          <SpotItem
            key={`spot-${spot.rank}`}
            spot={spot}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
            onViewOnMap={onViewSpot}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-surface-border">
        <p className="text-[10px] text-slate-500 text-center">
          Spots are ranked by opportunity score: low competition + high footfall = better
        </p>
      </div>
    </div>
  );
}
