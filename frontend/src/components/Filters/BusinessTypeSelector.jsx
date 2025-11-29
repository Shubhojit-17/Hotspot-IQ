/**
 * Business Type Selector Component - Icon Grid Design
 * Glass-morphic 2-column grid of Icon Cards
 */

import { useState, useRef, useEffect } from 'react';
import { BUSINESS_ICONS } from '../common/Icon';

// Business type options with SVG icons
const BUSINESS_TYPES = [
  { id: 'cafe', label: 'Cafe', icon: BUSINESS_ICONS.cafe },
  { id: 'restaurant', label: 'Restaurant', icon: BUSINESS_ICONS.restaurant },
  { id: 'retail', label: 'Retail', icon: BUSINESS_ICONS.retail },
  { id: 'gym', label: 'Gym', icon: BUSINESS_ICONS.gym },
  { id: 'pharmacy', label: 'Pharmacy', icon: BUSINESS_ICONS.pharmacy },
  { id: 'salon', label: 'Salon', icon: BUSINESS_ICONS.salon },
  { id: 'electronics', label: 'Electronics', icon: BUSINESS_ICONS.electronics },
  { id: 'clothing', label: 'Clothing', icon: BUSINESS_ICONS.clothing },
  { id: 'bookstore', label: 'Bookstore', icon: BUSINESS_ICONS.bookstore },
  { id: 'other', label: 'Other', icon: BUSINESS_ICONS.other },
];

export default function BusinessTypeSelector({ value, onChange, disabled }) {
  const [customType, setCustomType] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelect = (type) => {
    if (disabled) return;
    
    if (type.id === 'other') {
      setShowCustomInput(true);
      onChange(type.id);
    } else {
      setShowCustomInput(false);
      onChange(type.id);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customType.trim()) {
      onChange(customType.trim().toLowerCase());
      setShowCustomInput(false);
    }
  };

  const selectedType = BUSINESS_TYPES.find((t) => t.id === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">
          What are you opening?
        </label>
        {value && value !== 'other' && (
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
            {selectedType?.label || value}
          </span>
        )}
      </div>

      {/* 2-Column Icon Grid */}
      <div className={`grid grid-cols-2 gap-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {BUSINESS_TYPES.map((type) => {
          const isActive = value === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleSelect(type)}
              className={`
                relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl
                transition-all duration-200 border
                ${isActive 
                  ? 'bg-emerald-500/20 border-emerald-500/50 ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10' 
                  : 'bg-slate-800/30 border-white/5 hover:bg-white/5 hover:border-white/10'
                }
              `}
            >
              <img 
                src={type.icon} 
                alt="" 
                className="w-7 h-7 transition-all duration-200"
                style={{ 
                  filter: isActive 
                    ? 'invert(80%) sepia(60%) saturate(1000%) hue-rotate(100deg) brightness(100%) contrast(90%)' 
                    : 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)'
                }}
              />
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                {type.label}
              </span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Input (shown when 'Other' is selected) */}
      {showCustomInput && value === 'other' && (
        <form onSubmit={handleCustomSubmit} className="mt-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="Enter custom type..."
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-400 transition-colors"
            >
              Set
            </button>
          </div>
        </form>
      )}

      {/* Validation hint */}
      {!value && (
        <p className="text-xs text-amber-400/80 flex items-center gap-1.5 mt-2">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Required to identify competitors
        </p>
      )}
    </div>
  );
}
