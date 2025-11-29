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
        Step 3: Which area to analyze?
      </label>
      <p className="text-xs text-slate-500 -mt-1">
        Search for a locality, neighborhood, or city
      </p>

      <div className="relative">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <img src="/icons/search.svg" alt="" className="w-5 h-5" style={{ filter: 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            disabled={disabled}
            placeholder="Search: Koramangala, Indiranagar, Bandra..."
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
                    {/* Show different icon for major areas vs others */}
                    <span className="mt-0.5">
                      {suggestion.is_major ? (
                        <img src="/icons/star.svg" alt="" className="w-4 h-4" style={{ filter: 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)' }} />
                      ) : suggestion.is_area ? (
                        <img src="/icons/house.svg" alt="" className="w-4 h-4" style={{ filter: 'invert(70%) sepia(10%) saturate(200%) hue-rotate(180deg) brightness(90%) contrast(85%)' }} />
                      ) : (
                        <img src="/icons/location-pin.svg" alt="" className="w-4 h-4" style={{ filter: 'invert(47%) sepia(98%) saturate(1953%) hue-rotate(207deg) brightness(98%) contrast(94%)' }} />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-slate-200 truncate">{suggestion.name}</p>
                        {suggestion.is_major && (
                          <span className="text-[10px] bg-primary-glow/20 text-primary-glow px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            Major Area
                          </span>
                        )}
                      </div>
                      {suggestion.is_area && !suggestion.is_major && (
                        <p className="text-xs text-slate-500 mt-0.5">Locality</p>
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
            <p>No locations found for "{query}"</p>
            <p className="text-xs mt-1">Try a different area name or click on the map</p>
          </div>
        )}
      </div>

      {/* Hints */}
      {disabled ? (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <svg className="w-4 h-4 text-warning-glow" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Select a business type first
        </p>
      ) : (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <svg className="w-4 h-4 text-primary-glow" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          You can also click anywhere on the map to select a location
        </p>
      )}
    </div>
  );
}
