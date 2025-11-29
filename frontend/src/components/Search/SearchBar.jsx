/**
 * Search Bar Component
 * Step 3 in the user flow - Search for a location with autocomplete
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchLocations } from '../../services/api';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchBar({ onLocationSelect, disabled }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchLocations(debouncedQuery);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      // If we have a selected suggestion, use it
      if (isOpen && selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      } 
      // If we have suggestions but none selected, use the first one
      else if (isOpen && suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
      // If no suggestions but we have a query, create a manual location
      else if (query.trim().length >= 2) {
        // Trigger a fresh search or use the query as-is
        onLocationSelect({
          name: query.trim(),
          lat: null,
          lng: null,
          needsGeocode: true,
        });
      }
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      default:
        break;
    }
  };

  const handleSelect = (location) => {
    setQuery(location.name);
    setIsOpen(false);
    setSuggestions([]);
    onLocationSelect(location);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2 relative z-10">
      <label className="block text-sm font-medium text-slate-400">
        Step 3: Where do you want to open?
      </label>

      <div className="relative">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            disabled={disabled}
            placeholder="Search location, area, or pincode..."
            className={`
              w-full glass-input pl-10 pr-10
              ${isOpen ? 'border-primary-glow shadow-glow-primary' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          
          {/* Loading / Clear Button */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <svg className="w-5 h-5 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : query ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-2 bg-canvas-base border border-surface-border rounded-lg shadow-glass overflow-hidden animate-slide-in-up"
          >
            <ul className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.place_id || index}>
                  <button
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className={`
                      w-full flex items-start gap-3 px-4 py-3 text-left
                      hover:bg-surface-elevated transition-colors duration-150
                      ${selectedIndex === index ? 'bg-surface-secondary' : ''}
                    `}
                  >
                    <span className="text-slate-400 mt-0.5">📍</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 truncate">{suggestion.name}</p>
                      {suggestion.lat && suggestion.lng && (
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {suggestion.lat.toFixed(4)}, {suggestion.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No results message */}
        {isOpen && query.length >= 2 && suggestions.length === 0 && !isLoading && (
          <div className="absolute z-50 w-full mt-2 bg-canvas-base border border-surface-border rounded-lg shadow-glass p-4 text-center text-slate-400 animate-fade-in">
            No locations found for "{query}"
          </div>
        )}
      </div>

      {/* Hint */}
      {disabled && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span className="text-warning-glow">⚠️</span>
          Select a business type first
        </p>
      )}
    </div>
  );
}
