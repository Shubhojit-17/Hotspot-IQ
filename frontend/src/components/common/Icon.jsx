/**
 * Icon Component
 * Renders SVG icons from the public/icons folder
 */

// Icon mapping for business types
export const BUSINESS_ICONS = {
  cafe: '/icons/cafe.svg',
  restaurant: '/icons/restaurant.svg',
  retail: '/icons/store.svg',
  gym: '/icons/gym.svg',
  pharmacy: '/icons/pharmacy.svg',
  salon: '/icons/salon.svg',
  electronics: '/icons/electronics.svg',
  clothing: '/icons/clothing.svg',
  bookstore: '/icons/book.svg',
  other: '/icons/building.svg',
};

// Icon mapping for proximity filters
export const PROXIMITY_ICONS = {
  near_metro: '/icons/metro.svg',
  near_bus: '/icons/bus.svg',
  near_school: '/icons/school.svg',
  near_college: '/icons/college.svg',
  near_hospital: '/icons/hospital.svg',
  near_mall: '/icons/mall.svg',
  near_office: '/icons/office.svg',
  near_residential: '/icons/house.svg',
  near_temple: '/icons/temple.svg',
  near_park: '/icons/park.svg',
  near_atm: '/icons/bank.svg',
  near_bar: '/icons/bar.svg',
};

// General icons
export const GENERAL_ICONS = {
  search: '/icons/search.svg',
  marker: '/icons/marker.svg',
  locationPin: '/icons/location-pin.svg',
  star: '/icons/star.svg',
};

/**
 * Icon component - renders SVG icons with customizable size and color
 */
export default function Icon({ 
  name, 
  src, 
  size = 24, 
  className = '',
  color = 'currentColor',
  style = {}
}) {
  // Determine the icon source
  const iconSrc = src || BUSINESS_ICONS[name] || PROXIMITY_ICONS[name] || GENERAL_ICONS[name];
  
  if (!iconSrc) {
    console.warn(`Icon not found: ${name}`);
    return null;
  }

  return (
    <img 
      src={iconSrc} 
      alt={name || 'icon'}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ 
        filter: color !== 'currentColor' ? 'brightness(0) saturate(100%)' : undefined,
        ...style 
      }}
    />
  );
}

/**
 * Colored Icon component - applies color filter to SVG
 */
export function ColoredIcon({ 
  name, 
  src, 
  size = 24, 
  color = '#F5A623',
  className = '' 
}) {
  const iconSrc = src || BUSINESS_ICONS[name] || PROXIMITY_ICONS[name] || GENERAL_ICONS[name];
  
  if (!iconSrc) {
    return null;
  }

  // Convert hex color to CSS filter
  const getColorFilter = (hexColor) => {
    // Common color mappings
    const colorFilters = {
      '#F5A623': 'invert(68%) sepia(51%) saturate(1016%) hue-rotate(359deg) brightness(101%) contrast(96%)', // orange
      '#10b981': 'invert(64%) sepia(44%) saturate(533%) hue-rotate(109deg) brightness(93%) contrast(88%)', // green
      '#f43f5e': 'invert(42%) sepia(93%) saturate(1352%) hue-rotate(326deg) brightness(99%) contrast(97%)', // red
      '#3b82f6': 'invert(47%) sepia(98%) saturate(1953%) hue-rotate(207deg) brightness(98%) contrast(94%)', // blue
      '#8b5cf6': 'invert(44%) sepia(94%) saturate(2670%) hue-rotate(243deg) brightness(95%) contrast(94%)', // purple
      '#ffffff': 'brightness(0) invert(1)', // white
      '#1E3A5F': 'invert(19%) sepia(29%) saturate(1039%) hue-rotate(178deg) brightness(92%) contrast(87%)', // dark blue
    };
    return colorFilters[hexColor] || '';
  };

  return (
    <img 
      src={iconSrc} 
      alt={name || 'icon'}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ 
        filter: getColorFilter(color)
      }}
    />
  );
}
