/**
 * Business Type Selector Component
 * Step 1 in the user flow - Select what type of business you're opening
 */

import { useState, useRef, useEffect } from 'react';

// Business type options with icons and competitor mappings
const BUSINESS_TYPES = [
  { id: 'cafe', label: 'Cafe / Coffee Shop', icon: '☕' },
  { id: 'restaurant', label: 'Restaurant / Fast Food', icon: '🍽️' },
  { id: 'retail', label: 'Retail Store', icon: '🛍️' },
  { id: 'gym', label: 'Gym / Fitness Center', icon: '💪' },
  { id: 'pharmacy', label: 'Pharmacy / Medical', icon: '💊' },
  { id: 'salon', label: 'Salon / Spa', icon: '💇' },
  { id: 'electronics', label: 'Electronics Store', icon: '📱' },
  { id: 'clothing', label: 'Clothing / Fashion', icon: '👕' },
  { id: 'bookstore', label: 'Bookstore / Stationery', icon: '📚' },
  { id: 'other', label: 'Other (Custom)', icon: '🏢' },
];

export default function BusinessTypeSelector({ value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customType, setCustomType] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedType = BUSINESS_TYPES.find((t) => t.id === value);

  const handleSelect = (type) => {
    if (type.id === 'other') {
      onChange(type.id);
      // Keep dropdown open for custom input
    } else {
      onChange(type.id);
      setIsOpen(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customType.trim()) {
      onChange(customType.trim().toLowerCase());
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-400">
        Step 1: What are you opening?
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full flex items-center justify-between gap-3
            bg-canvas-base border rounded-lg px-4 py-3
            text-left transition-all duration-200
            ${isOpen 
              ? 'border-primary-glow shadow-glow-primary' 
              : 'border-surface-border hover:border-slate-600'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {selectedType?.icon || '🏪'}
            </span>
            <span className={selectedType ? 'text-slate-50' : 'text-slate-500'}>
              {selectedType?.label || 'Select business type...'}
            </span>
          </div>
          <svg 
            className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu - Fixed position to escape stacking context */}
        {isOpen && (
          <div 
            className="absolute left-0 right-0 mt-2 bg-canvas-base border border-surface-border rounded-lg shadow-glass overflow-hidden animate-slide-in-up"
            style={{ zIndex: 9999 }}
          >
            <div className="max-h-64 overflow-y-auto">
              {BUSINESS_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleSelect(type)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3
                    hover:bg-surface-elevated transition-colors duration-150
                    ${value === type.id ? 'bg-surface-secondary' : ''}
                  `}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span className="flex-1 text-left text-slate-200">{type.label}</span>
                  {value === type.id && (
                    <svg className="w-5 h-5 text-primary-glow" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Input (shown when 'Other' is selected) */}
            {value === 'other' && (
              <form onSubmit={handleCustomSubmit} className="p-3 border-t border-surface-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Enter custom type..."
                    className="glass-input flex-1 py-2 text-sm"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-glow text-canvas-deep text-sm font-medium rounded-lg hover:bg-primary-bright transition-colors"
                  >
                    Set
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Validation hint */}
      {!value && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span className="text-warning-glow">⚠️</span>
          Required to identify competitors
        </p>
      )}
    </div>
  );
}
