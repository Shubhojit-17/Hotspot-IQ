"""
Hotspot IQ - Places Service
Fetches nearby businesses using OpenStreetMap Overpass API.
Provides clean, reliable competitor data for heatmap generation.
"""

import overpy
import time
from typing import List, Dict, Optional


# Category mapping: user keywords -> OpenStreetMap tags
CATEGORY_MAPPING: Dict[str, Dict[str, str]] = {
    "cafe": {"amenity": "cafe"},
    "restaurant": {"amenity": "restaurant"},
    "hotel": {"tourism": "hotel"},
    "pharmacy": {"amenity": "pharmacy"},
    "hospital": {"amenity": "hospital"},
    "gym": {"leisure": "fitness_centre"},
    # Extended categories for better coverage
    "fast_food": {"amenity": "fast_food"},
    "bar": {"amenity": "bar"},
    "bakery": {"shop": "bakery"},
    "supermarket": {"shop": "supermarket"},
    "bank": {"amenity": "bank"},
    "atm": {"amenity": "atm"},
    "school": {"amenity": "school"},
    "college": {"amenity": "college"},
    "clinic": {"amenity": "clinic"},
    "salon": {"shop": "hairdresser"},
    "beauty": {"shop": "beauty"},
}

# Alternative Overpass API endpoints (in case main one is rate limited)
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter", 
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


def _build_query(lat: float, lng: float, radius: int, tag_key: str, tag_value: str) -> str:
    """
    Build an Overpass QL query for nodes, ways, and relations.
    
    Args:
        lat: Latitude of center point
        lng: Longitude of center point
        radius: Search radius in meters
        tag_key: OSM tag key (e.g., "amenity")
        tag_value: OSM tag value (e.g., "cafe")
        
    Returns:
        Overpass QL query string
    """
    query = f"""
    [out:json][timeout:10];
    (
        node["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
        way["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
        relation["{tag_key}"="{tag_value}"](around:{radius},{lat},{lng});
    );
    out center;
    """
    return query


def fetch_nearby_places(
    lat: float, 
    lng: float, 
    radius: int = 1000, 
    category: str = "cafe",
    max_retries: int = 3
) -> List[Dict]:
    """
    Fetch nearby places of a specific category using OpenStreetMap Overpass API.
    Includes retry logic with multiple API endpoints to handle rate limiting.
    
    Args:
        lat: Latitude of the center point
        lng: Longitude of the center point
        radius: Search radius in meters (default: 1000m)
        category: Business category keyword (default: "cafe")
        max_retries: Maximum retry attempts (default: 3)
        
    Returns:
        List of places with name, lat, lng, and type.
        Only returns places that have a name.
        
    Example:
        places = fetch_nearby_places(12.9716, 77.5946, 2500, "cafe")
        # Returns: [{"name": "Starbucks", "lat": 12.97, "lng": 77.59, "type": "cafe"}, ...]
    """
    # Get OSM tag for the category
    tag_info = CATEGORY_MAPPING.get(category.lower())
    
    if not tag_info:
        print(f"⚠️ Unknown category '{category}', defaulting to amenity search")
        tag_key = "amenity"
        tag_value = category.lower()
    else:
        tag_key = list(tag_info.keys())[0]
        tag_value = list(tag_info.values())[0]
    
    # Build the query
    query = _build_query(lat, lng, radius, tag_key, tag_value)
    
    # Try each endpoint with retries
    last_error = None
    for endpoint_idx, endpoint in enumerate(OVERPASS_ENDPOINTS):
        for attempt in range(max_retries):
            try:
                # Create Overpass API instance with specific endpoint
                api = overpy.Overpass(url=endpoint)
                
                # Add delay between retries to avoid rate limiting
                if attempt > 0:
                    delay = 2 ** attempt  # Exponential backoff: 2, 4, 8 seconds
                    print(f"⏳ Waiting {delay}s before retry {attempt + 1}...")
                    time.sleep(delay)
                
                result = api.query(query)
                
                places = []
                
                # Process nodes (points)
                for node in result.nodes:
                    name = node.tags.get("name")
                    if name:  # Only include places with names
                        places.append({
                            "name": name,
                            "lat": float(node.lat),
                            "lng": float(node.lon),
                            "type": category
                        })
                
                # Process ways (buildings/areas) - use center coordinates
                for way in result.ways:
                    name = way.tags.get("name")
                    if name and way.center_lat and way.center_lon:
                        places.append({
                            "name": name,
                            "lat": float(way.center_lat),
                            "lng": float(way.center_lon),
                            "type": category
                        })
                
                # Process relations - use center if available
                for relation in result.relations:
                    name = relation.tags.get("name")
                    if name:
                        rel_lat = getattr(relation, 'center_lat', None)
                        rel_lng = getattr(relation, 'center_lon', None)
                        if rel_lat and rel_lng:
                            places.append({
                                "name": name,
                                "lat": float(rel_lat),
                                "lng": float(rel_lng),
                                "type": category
                            })
                
                print(f"✅ Found {len(places)} {category}(s) within {radius}m radius")
                return places
                
            except overpy.exception.OverpassTooManyRequests:
                last_error = "Rate limited"
                print(f"⚠️ Rate limited on endpoint {endpoint_idx + 1}, attempt {attempt + 1}")
                continue
                
            except overpy.exception.OverpassGatewayTimeout:
                last_error = "Timeout"
                print(f"⚠️ Timeout on endpoint {endpoint_idx + 1}, attempt {attempt + 1}")
                continue
                
            except Exception as e:
                last_error = str(e)
                print(f"⚠️ Error on endpoint {endpoint_idx + 1}: {e}")
                break  # Move to next endpoint on other errors
    
    print(f"❌ All Overpass API attempts failed: {last_error}")
    return []


def fetch_competitors(
    lat: float, 
    lng: float, 
    radius: int, 
    business_type: str
) -> List[Dict]:
    """
    Fetch competitors for a specific business type.
    This is an alias for fetch_nearby_places with business-focused naming.
    
    For cafes, also searches for coffee shops and fast food places.
    For restaurants, also searches for fast food.
    
    Args:
        lat: Latitude
        lng: Longitude
        radius: Search radius in meters
        business_type: Type of business (cafe, restaurant, gym, etc.)
        
    Returns:
        List of competitor places with name, lat, lng, type
    """
    competitors = []
    seen_names = set()  # Avoid duplicates
    
    # Primary category
    primary_places = fetch_nearby_places(lat, lng, radius, business_type)
    for place in primary_places:
        name_key = place["name"].lower()
        if name_key not in seen_names:
            seen_names.add(name_key)
            competitors.append(place)
    
    # Extended search for related categories
    related_categories = {
        "cafe": ["fast_food", "bakery"],
        "restaurant": ["fast_food"],
        "gym": [],
        "pharmacy": ["clinic"],
        "hotel": [],
        "hospital": ["clinic"],
        "salon": ["beauty"],
    }
    
    extra_categories = related_categories.get(business_type.lower(), [])
    for extra_cat in extra_categories:
        extra_places = fetch_nearby_places(lat, lng, radius, extra_cat)
        for place in extra_places:
            name_key = place["name"].lower()
            if name_key not in seen_names:
                seen_names.add(name_key)
                # Mark with original business type for consistency
                place["type"] = business_type
                competitors.append(place)
    
    print(f"📊 Total competitors found: {len(competitors)}")
    return competitors


def fetch_landmarks(lat: float, lng: float, radius: int) -> List[Dict]:
    """
    Fetch various landmark types for area analysis.
    
    Args:
        lat: Latitude
        lng: Longitude
        radius: Search radius in meters
        
    Returns:
        List of landmarks with name, lat, lng, type
    """
    landmark_categories = ["school", "college", "hospital", "bank", "atm"]
    
    landmarks = []
    seen_names = set()
    
    for category in landmark_categories:
        places = fetch_nearby_places(lat, lng, radius, category)
        for place in places:
            name_key = place["name"].lower()
            if name_key not in seen_names:
                seen_names.add(name_key)
                landmarks.append(place)
    
    print(f"🏛️ Total landmarks found: {len(landmarks)}")
    return landmarks


# Convenience functions for common use cases
def get_cafes(lat: float, lng: float, radius: int = 2500) -> List[Dict]:
    """Get all cafes within radius."""
    return fetch_competitors(lat, lng, radius, "cafe")


def get_restaurants(lat: float, lng: float, radius: int = 2500) -> List[Dict]:
    """Get all restaurants within radius."""
    return fetch_competitors(lat, lng, radius, "restaurant")


def get_gyms(lat: float, lng: float, radius: int = 2500) -> List[Dict]:
    """Get all gyms within radius."""
    return fetch_competitors(lat, lng, radius, "gym")


def get_pharmacies(lat: float, lng: float, radius: int = 2500) -> List[Dict]:
    """Get all pharmacies within radius."""
    return fetch_competitors(lat, lng, radius, "pharmacy")
