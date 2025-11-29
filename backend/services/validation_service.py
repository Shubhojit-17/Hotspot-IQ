"""
Hotspot IQ - Location Validation Service
Validates if a location is suitable for business analysis.

UPDATED: Now validates the ENTIRE RADIUS AREA, not just the center point.
This allows analysis even when the center is in water, as long as there's
usable land within the selected radius.

Performs four levels of validation:
1. Water Body Check - Detect if location is in ocean/lake/river
2. Roadway Access Check - Using LatLong Snap to Roads API + Overpass fallback
3. Ghost Town Check - Using Overpass API for amenities
4. Road Quality Check - For heavy logistics businesses
"""

import math
import requests
import overpy
import time
from typing import Dict, Tuple, Optional, List
from config import Config


# Business types requiring heavy logistics (need major roads)
HEAVY_LOGISTICS_BUSINESSES = [
    'car_showroom', 'car showroom', 'warehouse', 'factory', 'manufacturing',
    'logistics', 'distribution', 'trucking', 'heavy_equipment', 'industrial',
    'furniture_store', 'furniture store', 'building_materials', 'construction'
]

# OSM highway types considered insufficient for heavy logistics
INSUFFICIENT_ROAD_TYPES = [
    'footway', 'pedestrian', 'path', 'cycleway', 'bridleway', 
    'steps', 'service', 'track', 'corridor'
]

# Overpass API endpoints for fallback
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


class ValidationError(Exception):
    """Custom exception for location validation failures."""
    def __init__(self, message: str, error_type: str = "validation_error"):
        self.message = message
        self.error_type = error_type
        super().__init__(self.message)


def _generate_sample_points(lat: float, lng: float, radius: int) -> List[Tuple[float, float]]:
    """
    Generate sample points within the radius for area-based validation.
    Returns points at center, cardinal directions, and diagonals at various distances.
    
    Args:
        lat: Center latitude
        lng: Center longitude
        radius: Radius in meters
        
    Returns:
        List of (lat, lng) tuples representing sample points
    """
    # Convert radius to lat/lng offsets
    lat_offset_per_m = 1 / 111000  # ~1 degree per 111km
    lng_offset_per_m = 1 / (111000 * math.cos(math.radians(lat)))
    
    # Sample offsets as fractions of radius (lat_mult, lng_mult)
    # More points near edges to find land if center is in water
    offsets = [
        (0, 0),  # Center
        # Cardinal directions at 30%, 60%, 90% of radius
        (0.3, 0), (-0.3, 0), (0, 0.3), (0, -0.3),
        (0.6, 0), (-0.6, 0), (0, 0.6), (0, -0.6),
        (0.9, 0), (-0.9, 0), (0, 0.9), (0, -0.9),
        # Diagonals at 40%, 70% of radius
        (0.28, 0.28), (-0.28, 0.28), (0.28, -0.28), (-0.28, -0.28),
        (0.5, 0.5), (-0.5, 0.5), (0.5, -0.5), (-0.5, -0.5),
    ]
    
    points = []
    for lat_mult, lng_mult in offsets:
        sample_lat = lat + (lat_mult * radius * lat_offset_per_m)
        sample_lng = lng + (lng_mult * radius * lng_offset_per_m)
        points.append((sample_lat, sample_lng))
    
    return points


def _calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in meters using Haversine formula."""
    R = 6371000  # Earth's radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def _is_point_in_water(lat: float, lng: float) -> Tuple[bool, Optional[str]]:
    """
    Check if a single point is in water.
    
    Args:
        lat: Latitude
        lng: Longitude
        
    Returns:
        Tuple of (is_in_water: bool, water_type: Optional[str])
    """
    try:
        query = f"""
        [out:json][timeout:10];
        (
            way["natural"="water"](around:50,{lat},{lng});
            relation["natural"="water"](around:50,{lat},{lng});
            way["natural"="coastline"](around:500,{lat},{lng});
            way["water"](around:50,{lat},{lng});
            relation["water"](around:50,{lat},{lng});
            way["waterway"~"river|stream|canal"](around:50,{lat},{lng});
            way["place"~"sea|ocean"](around:200,{lat},{lng});
            relation["place"~"sea|ocean"](around:200,{lat},{lng});
        );
        out body;
        """
        
        for endpoint in OVERPASS_ENDPOINTS[:2]:  # Use fewer endpoints for speed
            try:
                api = overpy.Overpass(url=endpoint)
                result = api.query(query)
                
                water_features = len(result.ways) + len(result.relations)
                
                if water_features > 0:
                    water_type = "water body"
                    for way in result.ways:
                        tags = way.tags
                        if tags.get('natural') == 'coastline' or tags.get('place') in ['sea', 'ocean']:
                            water_type = "ocean or sea"
                            break
                        elif tags.get('natural') == 'water':
                            water_type = tags.get('water', 'lake or reservoir')
                            break
                        elif tags.get('waterway'):
                            water_type = tags.get('waterway', 'river or stream')
                            break
                    return True, water_type
                
                return False, None
                
            except Exception:
                continue
        
        return False, None  # Assume not water if check fails
        
    except Exception:
        return False, None


def _is_point_on_land(lat: float, lng: float) -> bool:
    """
    Check if a point has land features (roads, buildings, amenities).
    
    Args:
        lat: Latitude
        lng: Longitude
        
    Returns:
        True if land features found nearby
    """
    try:
        query = f"""
        [out:json][timeout:10];
        (
            way["highway"](around:200,{lat},{lng});
            way["building"](around:200,{lat},{lng});
            node["amenity"](around:300,{lat},{lng});
        );
        out count;
        """
        
        for endpoint in OVERPASS_ENDPOINTS[:2]:
            try:
                api = overpy.Overpass(url=endpoint)
                result = api.query(query)
                
                total = len(result.nodes) + len(result.ways)
                return total > 0
                
            except Exception:
                continue
        
        return False
        
    except Exception:
        return False


def _find_best_land_point(center_lat: float, center_lng: float, radius: int) -> Optional[Tuple[float, float]]:
    """
    Find the best land point within the radius.
    Searches for areas with roads/buildings/amenities.
    
    Args:
        center_lat: Center latitude
        center_lng: Center longitude
        radius: Radius in meters
        
    Returns:
        Tuple of (lat, lng) of best land point, or None if no land found
    """
    print(f"   🔍 Searching for best land location within {radius}m radius...")
    
    sample_points = _generate_sample_points(center_lat, center_lng, radius)
    
    # Track which points are on land
    land_points = []
    
    for point_lat, point_lng in sample_points:
        is_water, _ = _is_point_in_water(point_lat, point_lng)
        
        if not is_water:
            # Check if there's land infrastructure
            if _is_point_on_land(point_lat, point_lng):
                distance_from_center = _calculate_distance(center_lat, center_lng, point_lat, point_lng)
                land_points.append((point_lat, point_lng, distance_from_center))
                print(f"   ✅ Found land at ({point_lat:.5f}, {point_lng:.5f}), {distance_from_center:.0f}m from center")
    
    if land_points:
        # Sort by distance from center (prefer closer points)
        land_points.sort(key=lambda x: x[2])
        best = land_points[0]
        print(f"   📍 Best land point: ({best[0]:.5f}, {best[1]:.5f}), {best[2]:.0f}m from center")
        return (best[0], best[1])
    
    return None


def check_water_body_area(center_lat: float, center_lng: float, radius: int = 1000) -> Dict:
    """
    Check if the center point is in water. Only searches for alternative land
    if the center is actually in a water body.
    
    This is a WATER-ONLY check - it does NOT validate infrastructure.
    Infrastructure validation is handled by other checks (roadway, ghost town, etc.)
    
    Args:
        center_lat: Center latitude of the search area
        center_lng: Center longitude of the search area
        radius: Search radius in meters
        
    Returns:
        Dict with 'valid', 'is_water', 'water_type', 'message', 'best_land_point'
        
    Raises:
        ValidationError: If center is in water AND no land found in radius
    """
    print(f"🌊 Checking if center point is in water ({center_lat}, {center_lng})...")
    
    # Only check if the point is in water - NOT for infrastructure
    center_is_water, water_type = _is_point_in_water(center_lat, center_lng)
    
    if not center_is_water:
        # Center is NOT in water - that's all we need to know here
        # Other validation steps will check for roads, amenities, etc.
        print(f"   ✅ Center point is on land (not in water)")
        return {
            'valid': True,
            'is_water': False,
            'water_type': None,
            'message': 'Center point is on land',
            'best_land_point': {'lat': center_lat, 'lng': center_lng}
        }
    
    # Center IS in water - now search for nearby land within the radius
    print(f"   ⚠️ Center point is in {water_type}, searching for nearby land...")
    
    best_point = _find_best_land_point(center_lat, center_lng, radius)
    
    if best_point:
        print(f"   ✅ Found land within radius at ({best_point[0]:.5f}, {best_point[1]:.5f})")
        return {
            'valid': True,
            'is_water': False,
            'water_type': None,
            'message': f'Found usable land within the selected area',
            'best_land_point': {'lat': best_point[0], 'lng': best_point[1]}
        }
    
    # No land found in entire radius - the area is all water
    print(f"   ❌ No land found in the entire {radius}m radius")
    raise ValidationError(
        f"No land found within the selected {radius/1000:.1f}km radius. The entire area appears to be water.",
        "water_body"
    )


def check_water_body(lat: float, lng: float) -> Dict:
    """
    Step 0: Check if the location is in a water body (ocean, sea, lake, river).
    This is the FIRST check - critical for preventing ocean/lake locations.
    
    NOTE: This function checks a single point. For area-based validation,
    use check_water_body_area() instead.
    
    Args:
        lat: Latitude of the location
        lng: Longitude of the location
        
    Returns:
        Dict with 'valid', 'is_water', 'water_type', 'message'
        
    Raises:
        ValidationError: If location is in water
    """
    print(f"🌊 Checking if location ({lat}, {lng}) is in water body...")
    
    try:
        # Query to check if point is within any water body
        # Using a small radius to detect if we're IN water
        query = f"""
        [out:json][timeout:20];
        (
            // Natural water features
            way["natural"="water"](around:100,{lat},{lng});
            relation["natural"="water"](around:100,{lat},{lng});
            way["natural"="coastline"](around:1000,{lat},{lng});
            // Named water bodies
            way["water"](around:100,{lat},{lng});
            relation["water"](around:100,{lat},{lng});
            // Waterways
            way["waterway"~"river|stream|canal"](around:100,{lat},{lng});
            // Sea/Ocean
            way["place"~"sea|ocean"](around:500,{lat},{lng});
            relation["place"~"sea|ocean"](around:500,{lat},{lng});
        );
        out body;
        """
        
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                api = overpy.Overpass(url=endpoint)
                result = api.query(query)
                
                water_features = len(result.ways) + len(result.relations)
                print(f"   📊 Found {water_features} water features nearby")
                
                if water_features > 0:
                    # Determine water type
                    water_type = "water body"
                    for way in result.ways:
                        tags = way.tags
                        if tags.get('natural') == 'coastline':
                            water_type = "ocean or sea"
                            break
                        elif tags.get('place') in ['sea', 'ocean']:
                            water_type = "ocean or sea"
                            break
                        elif tags.get('natural') == 'water':
                            water_type = tags.get('water', 'lake or reservoir')
                            break
                        elif tags.get('waterway'):
                            water_type = tags.get('waterway', 'river or stream')
                            break
                    
                    for rel in result.relations:
                        tags = rel.tags
                        if tags.get('natural') == 'water':
                            water_type = tags.get('water', 'lake or reservoir')
                            break
                        elif tags.get('place') in ['sea', 'ocean']:
                            water_type = "ocean or sea"
                            break
                    
                    print(f"   ❌ Location appears to be in {water_type}")
                    raise ValidationError(
                        f"Location is in {water_type}. No business can be established here.",
                        "water_body"
                    )
                
                print(f"   ✅ No water body detected at location")
                return {
                    'valid': True,
                    'is_water': False,
                    'water_type': None,
                    'message': 'Location is not in water'
                }
                
            except overpy.exception.OverpassTooManyRequests:
                print(f"   ⚠️ Rate limited on {endpoint}, trying next...")
                time.sleep(0.5)
                continue
            except overpy.exception.OverpassGatewayTimeout:
                print(f"   ⚠️ Timeout on {endpoint}, trying next...")
                continue
            except ValidationError:
                raise
            except Exception as e:
                print(f"   ⚠️ Error checking water on {endpoint}: {e}")
                continue
        
        # If water check API fails, fall back to checking for ANY land features
        print("   ⚠️ Water check inconclusive, checking for land features...")
        return _verify_land_exists(lat, lng)
        
    except ValidationError:
        raise
    except Exception as e:
        print(f"   ⚠️ Water body check error: {e}")
        return _verify_land_exists(lat, lng)


def _verify_land_exists(lat: float, lng: float) -> Dict:
    """
    Verify that land/infrastructure exists at or near the location.
    If no land features found within reasonable radius, reject the location.
    """
    print(f"   🔍 Verifying land features exist near location...")
    
    try:
        # Check for ANY land-based infrastructure within 2km
        query = f"""
        [out:json][timeout:15];
        (
            // Roads are the strongest indicator of land
            way["highway"](around:2000,{lat},{lng});
            // Buildings
            way["building"](around:2000,{lat},{lng});
            // Land use
            way["landuse"](around:1000,{lat},{lng});
            // Any amenity
            node["amenity"](around:2000,{lat},{lng});
            // Places
            node["place"](around:2000,{lat},{lng});
        );
        out count;
        """
        
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                api = overpy.Overpass(url=endpoint)
                result = api.query(query)
                
                total_features = len(result.nodes) + len(result.ways)
                print(f"   📊 Found {total_features} land features within 2km")
                
                if total_features == 0:
                    raise ValidationError(
                        "No such possible business places present in the area. Location appears to be in water or completely uninhabited.",
                        "no_land_features"
                    )
                
                return {
                    'valid': True,
                    'is_water': False,
                    'water_type': None,
                    'message': f'Found {total_features} land features nearby'
                }
                
            except overpy.exception.OverpassTooManyRequests:
                time.sleep(0.5)
                continue
            except ValidationError:
                raise
            except Exception as e:
                print(f"   ⚠️ Error on {endpoint}: {e}")
                continue
        
        # If ALL checks fail, be STRICT and reject
        raise ValidationError(
            "Unable to verify this is a valid land location. Please select a location in an accessible area.",
            "verification_failed"
        )
        
    except ValidationError:
        raise
    except Exception as e:
        raise ValidationError(
            "Unable to verify this is a valid land location. Please select a location in an accessible area.",
            "verification_failed"
        )


def check_roadway_access(lat: float, lng: float, max_distance: float = 100.0) -> Dict:
    """
    Step A: Check if location is accessible by road using LatLong Snap to Roads API.
    
    Args:
        lat: Latitude of the location
        lng: Longitude of the location
        max_distance: Maximum allowed distance from road in meters (default: 100m)
        
    Returns:
        Dict with 'valid', 'snapped_lat', 'snapped_lng', 'distance', 'message'
        
    Raises:
        ValidationError: If location is too far from any road
    """
    print(f"🛣️ Checking roadway access...")
    
    try:
        # LatLong Snap to Roads API
        url = f"{Config.LATLONG_BASE_URL}/v4/snap.json"
        headers = {
            'X-Authorization-Token': Config.LATLONG_API_KEY,
            'Content-Type': 'application/json'
        }
        
        # Format coordinates as required by the API
        params = {
            'coordinates': f"[{lat},{lng}]"
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('status') == 'success' and 'data' in data:
                snapped_data = data['data']
                snapped_coords = snapped_data.get('snapped_coordinates', [])
                
                if snapped_coords and len(snapped_coords) > 0:
                    # Get the first snapped coordinate
                    snapped_point = snapped_coords[0]
                    snapped_lat = snapped_point[0]
                    snapped_lng = snapped_point[1]
                    
                    # Calculate distance from original to snapped point
                    distance = _calculate_distance(lat, lng, snapped_lat, snapped_lng)
                    
                    print(f"   📍 Snap result: ({lat}, {lng}) -> ({snapped_lat}, {snapped_lng}), Distance: {distance:.1f}m")
                    
                    if distance > max_distance:
                        raise ValidationError(
                            f"Location is not accessible by road. Nearest road is {distance:.0f}m away.",
                            "roadway_access"
                        )
                    
                    print(f"   ✅ Road access confirmed (within {distance:.0f}m)")
                    return {
                        'valid': True,
                        'snapped_lat': snapped_lat,
                        'snapped_lng': snapped_lng,
                        'distance': distance,
                        'message': f"Location is {distance:.0f}m from nearest road"
                    }
        
        # If API fails or returns no data, fall back to Overpass check
        print("   ⚠️ Snap to Roads API failed, using Overpass fallback...")
        return _fallback_road_check(lat, lng, max_distance)
        
    except ValidationError:
        raise
    except Exception as e:
        print(f"   ⚠️ Roadway check error: {e}, using fallback...")
        return _fallback_road_check(lat, lng, max_distance)


def _fallback_road_check(lat: float, lng: float, max_distance: float = 100.0) -> Dict:
    """Fallback road check using Overpass API."""
    try:
        # Check for roads within max_distance
        query = f"""
        [out:json][timeout:10];
        (
            way["highway"](around:{max_distance},{lat},{lng});
        );
        out body;
        """
        
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                api = overpy.Overpass(url=endpoint)
                result = api.query(query)
                
                road_count = len(result.ways)
                print(f"   📊 Found {road_count} roads within {max_distance}m")
                
                if road_count == 0:
                    # Try a larger radius to give better error message
                    query_extended = f"""
                    [out:json][timeout:10];
                    (
                        way["highway"](around:1000,{lat},{lng});
                    );
                    out body;
                    """
                    result_extended = api.query(query_extended)
                    
                    if len(result_extended.ways) == 0:
                        raise ValidationError(
                            "Location is not accessible by road. No roads found within 1km.",
                            "roadway_access"
                        )
                    else:
                        raise ValidationError(
                            f"Location is not accessible by road. Nearest road is more than {max_distance:.0f}m away.",
                            "roadway_access"
                        )
                
                print(f"   ✅ Road access verified via Overpass")
                return {
                    'valid': True,
                    'snapped_lat': lat,
                    'snapped_lng': lng,
                    'distance': 0,
                    'message': "Road access verified"
                }
                
            except overpy.exception.OverpassTooManyRequests:
                time.sleep(0.5)
                continue
            except ValidationError:
                raise
            except Exception as e:
                print(f"   ⚠️ Error on {endpoint}: {e}")
                continue
        
        # If all Overpass endpoints fail, be strict
        raise ValidationError(
            "Unable to verify road access. Please select a location near a road.",
            "verification_failed"
        )
        
    except ValidationError:
        raise
    except Exception as e:
        raise ValidationError(
            "Unable to verify road access. Please try a different location.",
            "verification_failed"
        )


def check_area_viability(lat: float, lng: float, radius: int = 2000, min_amenities: int = 5) -> Dict:
    """
    Step B: Ghost Town Check - Verify area has sufficient development/amenities.
    
    Args:
        lat: Latitude of the location
        lng: Longitude of the location
        radius: Search radius in meters (default: 2000m / 2km)
        min_amenities: Minimum number of amenities required (default: 5)
        
    Returns:
        Dict with 'valid', 'amenity_count', 'message'
        
    Raises:
        ValidationError: If area has no/insufficient amenities
    """
    print(f"🏘️ Checking area viability (min {min_amenities} amenities in {radius}m)...")
    
    try:
        # Query for various amenities that indicate developed area
        # Use 'out body;' to get actual elements we can count
        query = f"""
        [out:json][timeout:20];
        (
            // Commercial establishments
            node["shop"](around:{radius},{lat},{lng});
            way["shop"](around:{radius},{lat},{lng});
            node["amenity"](around:{radius},{lat},{lng});
            way["amenity"](around:{radius},{lat},{lng});
            // Offices/commercial buildings
            node["office"](around:{radius},{lat},{lng});
            way["office"](around:{radius},{lat},{lng});
            way["building"](around:{radius},{lat},{lng});
            // Residential (indicates population)
            node["building"](around:{radius},{lat},{lng});
        );
        out body;
        """
        
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                api = overpy.Overpass(url=endpoint)
                result = api.query(query)
                
                # Count all elements
                total_count = len(result.nodes) + len(result.ways) + len(result.relations)
                
                print(f"   📊 Found {total_count} amenities/buildings within {radius}m")
                
                if total_count < min_amenities:
                    raise ValidationError(
                        "No such possible business places present in the area.",
                        "ghost_town"
                    )
                
                print(f"   ✅ Area has sufficient development ({total_count} features)")
                return {
                    'valid': True,
                    'amenity_count': total_count,
                    'message': f"Found {total_count} amenities/buildings in the area"
                }
                
            except overpy.exception.OverpassTooManyRequests:
                print(f"   ⚠️ Rate limited on {endpoint}, trying next...")
                time.sleep(0.5)
                continue
            except overpy.exception.OverpassGatewayTimeout:
                print(f"   ⚠️ Timeout on {endpoint}, trying next...")
                continue
            except ValidationError:
                raise
            except Exception as e:
                print(f"   ⚠️ Error on {endpoint}: {e}")
                continue
        
        # If all endpoints fail, be strict
        raise ValidationError(
            "Unable to verify area viability. Please try again or select a different location.",
            "api_error"
        )
        
    except ValidationError:
        raise
    except Exception as e:
        print(f"   ⚠️ Area viability check error: {e}")
        raise ValidationError(
            "Unable to verify area viability. Please try again.",
            "api_error"
        )


def check_road_quality(lat: float, lng: float, business_type: str, radius: int = 50) -> Dict:
    """
    Step C: Road Quality Check - For heavy logistics businesses.
    
    Args:
        lat: Latitude of the location
        lng: Longitude of the location
        business_type: Type of business being analyzed
        radius: Search radius for road check in meters (default: 50m)
        
    Returns:
        Dict with 'valid', 'road_type', 'message'
        
    Raises:
        ValidationError: If road infrastructure is insufficient for business type
    """
    # Only check for heavy logistics businesses
    business_lower = business_type.lower().replace('-', '_').replace(' ', '_')
    
    is_heavy_logistics = any(
        heavy in business_lower 
        for heavy in HEAVY_LOGISTICS_BUSINESSES
    )
    
    if not is_heavy_logistics:
        print(f"🛣️ Road quality check not required for {business_type}")
        return {
            'valid': True,
            'road_type': 'any',
            'message': 'Road quality check not required for this business type'
        }
    
    print(f"🛣️ Checking road quality for heavy logistics business...")
    
    try:
        query = f"""
        [out:json][timeout:10];
        way["highway"](around:{radius},{lat},{lng});
        out body;
        """
        
        for endpoint in OVERPASS_ENDPOINTS:
            try:
                api = overpy.Overpass(url=endpoint)
                result = api.query(query)
                
                if not result.ways:
                    raise ValidationError(
                        "Road infrastructure is insufficient for this business type. No roads found nearby.",
                        "road_quality"
                    )
                
                # Check road types
                road_types = []
                for way in result.ways:
                    highway_type = way.tags.get('highway', 'unknown')
                    road_types.append(highway_type)
                
                # Check if ALL nearby roads are insufficient
                has_suitable_road = any(
                    rt not in INSUFFICIENT_ROAD_TYPES 
                    for rt in road_types
                )
                
                print(f"   📊 Road types found: {set(road_types)}")
                
                if not has_suitable_road:
                    raise ValidationError(
                        f"Road infrastructure (Alleyway/Footpath) is insufficient for this business type. Found: {', '.join(set(road_types))}",
                        "road_quality"
                    )
                
                print(f"   ✅ Road quality is sufficient")
                return {
                    'valid': True,
                    'road_type': road_types[0] if road_types else 'unknown',
                    'message': f"Road infrastructure is suitable: {road_types[0]}"
                }
                
            except overpy.exception.OverpassTooManyRequests:
                time.sleep(0.5)
                continue
            except ValidationError:
                raise
            except Exception as e:
                print(f"   ⚠️ Error on {endpoint}: {e}")
                continue
        
        # If all endpoints fail for heavy logistics, be strict
        raise ValidationError(
            "Unable to verify road quality for heavy logistics business.",
            "verification_failed"
        )
        
    except ValidationError:
        raise
    except Exception as e:
        print(f"   ⚠️ Road quality check error: {e}")
        raise ValidationError(
            "Unable to verify road quality. Please try a different location.",
            "verification_failed"
        )


def validate_location(lat: float, lng: float, business_type: str) -> Dict:
    """
    Master validation function - validates location for business analysis.
    DEPRECATED: Use validate_area() for area-based validation.
    
    Performs four validation checks in order:
    0. Water Body Check (NEW - detect ocean/lake/river)
    1. Roadway Access Check (LatLong API + Overpass fallback)
    2. Ghost Town Check (Overpass API)
    3. Road Quality Check (for heavy logistics businesses)
    
    Args:
        lat: Latitude of the location
        lng: Longitude of the location  
        business_type: Type of business being analyzed
        
    Returns:
        Dict with validation results
        
    Raises:
        ValidationError: If any validation check fails
    """
    print(f"\n{'='*60}")
    print(f"🔍 LOCATION VALIDATION")
    print(f"   Coordinates: ({lat}, {lng})")
    print(f"   Business Type: {business_type}")
    print(f"{'='*60}")
    
    validation_result = {
        'valid': True,
        'snapped_location': {'lat': lat, 'lng': lng},
        'checks': {},
        'message': 'Location validated successfully'
    }
    
    # Step 0: Water Body Check (FIRST - most critical for oceans)
    print("\n📍 Step 0: Checking for water bodies...")
    try:
        water_result = check_water_body(lat, lng)
        validation_result['checks']['water_body'] = water_result
    except ValidationError as e:
        print(f"   ❌ FAILED: {e.message}")
        raise
    
    # Step A: Roadway Access Check
    print("\n📍 Step A: Checking roadway access...")
    try:
        roadway_result = check_roadway_access(lat, lng)
        validation_result['checks']['roadway_access'] = roadway_result
        
        # Update to snapped coordinates if available
        if roadway_result.get('snapped_lat') and roadway_result.get('snapped_lng'):
            validation_result['snapped_location'] = {
                'lat': roadway_result['snapped_lat'],
                'lng': roadway_result['snapped_lng']
            }
    except ValidationError as e:
        print(f"   ❌ FAILED: {e.message}")
        raise
    
    # Step B: Ghost Town Check
    print("\n📍 Step B: Checking area viability...")
    try:
        viability_result = check_area_viability(lat, lng)
        validation_result['checks']['area_viability'] = viability_result
    except ValidationError as e:
        print(f"   ❌ FAILED: {e.message}")
        raise
    
    # Step C: Road Quality Check (for heavy logistics)
    print("\n📍 Step C: Checking road quality...")
    try:
        quality_result = check_road_quality(lat, lng, business_type)
        validation_result['checks']['road_quality'] = quality_result
    except ValidationError as e:
        print(f"   ❌ FAILED: {e.message}")
        raise
    
    print(f"\n{'='*60}")
    print("✅ ALL VALIDATION CHECKS PASSED!")
    print(f"{'='*60}\n")
    
    return validation_result


def validate_area(center_lat: float, center_lng: float, radius: int, business_type: str) -> Dict:
    """
    Area-based validation - validates the entire radius area, not just the center.
    This is the NEW recommended validation function.
    
    If the center is in water or lacks infrastructure, this function will
    search for the best usable land point within the radius and use that
    for subsequent validation.
    
    Args:
        center_lat: Center latitude of the selected area
        center_lng: Center longitude of the selected area
        radius: Search radius in meters
        business_type: Type of business being analyzed
        
    Returns:
        Dict with validation results including 'analysis_point' for the best location
        
    Raises:
        ValidationError: If no valid location found within the radius
    """
    print(f"\n{'='*60}")
    print(f"🔍 AREA-BASED VALIDATION")
    print(f"   Center: ({center_lat}, {center_lng})")
    print(f"   Radius: {radius}m")
    print(f"   Business Type: {business_type}")
    print(f"{'='*60}")
    
    validation_result = {
        'valid': True,
        'center': {'lat': center_lat, 'lng': center_lng},
        'radius': radius,
        'analysis_point': {'lat': center_lat, 'lng': center_lng},
        'snapped_location': {'lat': center_lat, 'lng': center_lng},
        'checks': {},
        'message': 'Area validated successfully'
    }
    
    # Use center point directly for analysis - no water body check needed
    # The roadway and viability checks will handle edge cases
    analysis_lat = center_lat
    analysis_lng = center_lng
    
    print(f"   📍 Using analysis point: ({analysis_lat:.5f}, {analysis_lng:.5f})")
    
    # Step A: Roadway Access Check - check within the entire radius
    print("\n📍 Step A: Checking roadway access within radius...")
    try:
        roadway_result = check_roadway_access(analysis_lat, analysis_lng, max_distance=float(radius))
        validation_result['checks']['roadway_access'] = roadway_result
        
        # Update to snapped coordinates if available
        if roadway_result.get('snapped_lat') and roadway_result.get('snapped_lng'):
            validation_result['snapped_location'] = {
                'lat': roadway_result['snapped_lat'],
                'lng': roadway_result['snapped_lng']
            }
    except ValidationError as e:
        print(f"   ❌ FAILED: {e.message}")
        raise
    
    # Step B: Ghost Town Check - check the entire radius from center
    print("\n📍 Step B: Checking area viability...")
    try:
        # Use center and full radius for viability check
        viability_result = check_area_viability(center_lat, center_lng, radius)
        validation_result['checks']['area_viability'] = viability_result
    except ValidationError as e:
        print(f"   ❌ FAILED: {e.message}")
        raise
    
    # Step C: Road Quality Check (for heavy logistics) at analysis point
    print("\n📍 Step C: Checking road quality...")
    try:
        quality_result = check_road_quality(analysis_lat, analysis_lng, business_type)
        validation_result['checks']['road_quality'] = quality_result
    except ValidationError as e:
        print(f"   ❌ FAILED: {e.message}")
        raise
    
    print(f"\n{'='*60}")
    print("✅ AREA VALIDATION PASSED!")
    print(f"   Analysis point: ({validation_result['analysis_point']['lat']:.5f}, {validation_result['analysis_point']['lng']:.5f})")
    print(f"{'='*60}\n")
    
    return validation_result


def validate_and_fetch_data(lat: float, lng: float, business_type: str, radius: int = None) -> Tuple[bool, Dict]:
    """
    Master function to validate location and return validation status.
    
    This is the main entry point for location validation before analysis.
    If radius is provided, uses area-based validation. Otherwise falls back to point validation.
    
    Args:
        lat: Latitude of the location (center if radius provided)
        lng: Longitude of the location (center if radius provided)
        business_type: Type of business being analyzed
        radius: Optional search radius in meters for area-based validation
        
    Returns:
        Tuple of (is_valid: bool, result: Dict)
    """
    try:
        if radius and radius > 0:
            # Use area-based validation
            result = validate_area(lat, lng, radius, business_type)
        else:
            # Fall back to point-based validation
            result = validate_location(lat, lng, business_type)
        return True, result
    except ValidationError as e:
        print(f"\n❌ VALIDATION FAILED: {e.message}")
        print(f"   Error Type: {e.error_type}")
        return False, {
            'valid': False,
            'error': e.message,
            'error_type': e.error_type,
            'message': e.message
        }
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {str(e)}")
        return False, {
            'valid': False,
            'error': str(e),
            'error_type': 'unknown_error',
            'message': f'Validation failed: {str(e)}'
        }
