"""
Hotspot IQ - Competitor Service
Uses OpenStreetMap Overpass API via overpy to count competitors near a location.
"""

import overpy
from typing import Dict, List, Optional


# Map business categories to OpenStreetMap tags
CATEGORY_TAG_MAPPING: Dict[str, List[Dict[str, str]]] = {
    # Food & Beverage - expanded for better coverage
    'cafe': [
        {'amenity': 'cafe'},
        {'shop': 'coffee'},
        {'cuisine': 'coffee_shop'},
        {'amenity': 'fast_food'},  # Many cafes are tagged as fast_food
    ],
    'coffee': [{'amenity': 'cafe'}, {'shop': 'coffee'}],
    'restaurant': [
        {'amenity': 'restaurant'},
        {'amenity': 'fast_food'},
        {'amenity': 'food_court'},
    ],
    'fast_food': [{'amenity': 'fast_food'}],
    'bar': [{'amenity': 'bar'}, {'amenity': 'pub'}],
    'pub': [{'amenity': 'pub'}, {'amenity': 'bar'}],
    'bakery': [{'shop': 'bakery'}, {'shop': 'pastry'}],
    'ice_cream': [{'amenity': 'ice_cream'}, {'shop': 'ice_cream'}, {'shop': 'frozen_yogurt'}],
    
    # Health & Fitness
    'gym': [{'leisure': 'fitness_centre'}, {'amenity': 'gym'}],
    'pharmacy': [{'amenity': 'pharmacy'}],
    'hospital': [{'amenity': 'hospital'}],
    'clinic': [{'amenity': 'clinic'}],
    'dentist': [{'amenity': 'dentist'}],
    
    # Retail
    'supermarket': [{'shop': 'supermarket'}],
    'grocery': [{'shop': 'grocery'}, {'shop': 'convenience'}],
    'convenience': [{'shop': 'convenience'}],
    'clothing': [{'shop': 'clothes'}],
    'electronics': [{'shop': 'electronics'}],
    'mall': [{'shop': 'mall'}],
    'retail': [{'shop': 'retail'}],
    
    # Services
    'salon': [{'shop': 'hairdresser'}, {'shop': 'beauty'}],
    'spa': [{'leisure': 'spa'}, {'shop': 'massage'}],
    'laundry': [{'shop': 'laundry'}],
    'bank': [{'amenity': 'bank'}],
    'atm': [{'amenity': 'atm'}],
    
    # Education
    'school': [{'amenity': 'school'}],
    'college': [{'amenity': 'college'}],
    'university': [{'amenity': 'university'}],
    'tuition': [{'amenity': 'tutoring'}],
    
    # Entertainment
    'cinema': [{'amenity': 'cinema'}],
    'theatre': [{'amenity': 'theatre'}],
    'nightclub': [{'amenity': 'nightclub'}],
    
    # Accommodation
    'hotel': [{'tourism': 'hotel'}],
    'hostel': [{'tourism': 'hostel'}],
    'guest_house': [{'tourism': 'guest_house'}],
}


def _build_overpass_query(lat: float, lng: float, radius: int, tags: List[Dict[str, str]]) -> str:
    """
    Build an Overpass QL query to find nodes, ways, and relations
    matching the given tags within the specified radius.
    
    Args:
        lat: Latitude of center point
        lng: Longitude of center point
        radius: Search radius in meters
        tags: List of OSM tag dictionaries to search for
        
    Returns:
        Overpass QL query string
    """
    query_parts = []
    
    for tag_dict in tags:
        for key, value in tag_dict.items():
            # Query for nodes, ways, and relations with this tag
            tag_filter = f'["{key}"="{value}"]'
            around_filter = f'(around:{radius},{lat},{lng})'
            
            query_parts.append(f'node{tag_filter}{around_filter};')
            query_parts.append(f'way{tag_filter}{around_filter};')
            query_parts.append(f'relation{tag_filter}{around_filter};')
    
    # Combine all queries with union
    query = f"""
    [out:json][timeout:25];
    (
        {chr(10).join(query_parts)}
    );
    out count;
    """
    
    return query


def _build_detailed_query(lat: float, lng: float, radius: int, tags: List[Dict[str, str]]) -> str:
    """
    Build an Overpass QL query that returns actual elements (not just count).
    Used when we need names and locations of competitors.
    
    Args:
        lat: Latitude of center point
        lng: Longitude of center point
        radius: Search radius in meters
        tags: List of OSM tag dictionaries to search for
        
    Returns:
        Overpass QL query string
    """
    query_parts = []
    
    for tag_dict in tags:
        for key, value in tag_dict.items():
            tag_filter = f'["{key}"="{value}"]'
            around_filter = f'(around:{radius},{lat},{lng})'
            
            query_parts.append(f'node{tag_filter}{around_filter};')
            query_parts.append(f'way{tag_filter}{around_filter};')
            query_parts.append(f'relation{tag_filter}{around_filter};')
    
    query = f"""
    [out:json][timeout:25];
    (
        {chr(10).join(query_parts)}
    );
    out body center;
    """
    
    return query


def get_competitor_count(lat: float, lng: float, radius: int, category: str) -> int:
    """
    Count the number of competitors of a given category within a radius.
    
    Uses OpenStreetMap Overpass API to query for POIs matching the category.
    
    Args:
        lat: Latitude of the center point
        lng: Longitude of the center point
        radius: Search radius in meters (e.g., 500 for 500m)
        category: Business category (e.g., "cafe", "restaurant", "gym")
        
    Returns:
        Number of competitors found, or -1 if the query failed
        
    Example:
        count = get_competitor_count(12.9716, 77.5946, 500, "cafe")
    """
    # Get OSM tags for the category
    tags = CATEGORY_TAG_MAPPING.get(category.lower())
    
    if not tags:
        print(f"Warning: Unknown category '{category}', using generic amenity search")
        tags = [{'amenity': category.lower()}]
    
    # Build the query
    query = _build_detailed_query(lat, lng, radius, tags)
    
    try:
        # Create Overpass API instance
        api = overpy.Overpass()
        
        # Execute query with timeout
        result = api.query(query)
        
        # Count all results (nodes + ways + relations)
        count = len(result.nodes) + len(result.ways) + len(result.relations)
        
        return count
        
    except overpy.exception.OverpassTooManyRequests:
        print(f"Overpass API rate limited, returning -1")
        return -1
        
    except overpy.exception.OverpassGatewayTimeout:
        print(f"Overpass API timeout, returning -1")
        return -1
        
    except overpy.exception.OverpassBadRequest as e:
        print(f"Overpass API bad request: {e}")
        return -1
        
    except Exception as e:
        print(f"Overpass API error: {e}")
        return -1


def get_competitors_detailed(lat: float, lng: float, radius: int, category: str) -> List[Dict]:
    """
    Get detailed information about competitors within a radius.
    
    Returns names, locations, and other metadata about each competitor.
    
    Args:
        lat: Latitude of the center point
        lng: Longitude of the center point
        radius: Search radius in meters
        category: Business category (e.g., "cafe", "restaurant")
        
    Returns:
        List of competitor dictionaries with name, lat, lng, and tags
        Returns empty list if query fails
        
    Example:
        competitors = get_competitors_detailed(12.9716, 77.5946, 500, "cafe")
    """
    tags = CATEGORY_TAG_MAPPING.get(category.lower())
    
    if not tags:
        tags = [{'amenity': category.lower()}]
    
    query = _build_detailed_query(lat, lng, radius, tags)
    
    try:
        api = overpy.Overpass()
        result = api.query(query)
        
        competitors = []
        
        # Process nodes
        for node in result.nodes:
            competitor = {
                'id': f'node_{node.id}',
                'name': node.tags.get('name', 'Unknown'),
                'lat': float(node.lat),
                'lng': float(node.lon),
                'type': 'node',
                'tags': dict(node.tags),
                'category': category
            }
            competitors.append(competitor)
        
        # Process ways (use center point)
        for way in result.ways:
            # Ways have center_lat and center_lon when queried with 'out center'
            competitor = {
                'id': f'way_{way.id}',
                'name': way.tags.get('name', 'Unknown'),
                'lat': float(way.center_lat) if way.center_lat else lat,
                'lng': float(way.center_lon) if way.center_lon else lng,
                'type': 'way',
                'tags': dict(way.tags),
                'category': category
            }
            competitors.append(competitor)
        
        # Process relations (use center point)
        for relation in result.relations:
            competitor = {
                'id': f'relation_{relation.id}',
                'name': relation.tags.get('name', 'Unknown'),
                'lat': float(relation.center_lat) if hasattr(relation, 'center_lat') and relation.center_lat else lat,
                'lng': float(relation.center_lon) if hasattr(relation, 'center_lon') and relation.center_lon else lng,
                'type': 'relation',
                'tags': dict(relation.tags),
                'category': category
            }
            competitors.append(competitor)
        
        return competitors
        
    except Exception as e:
        print(f"Overpass API error getting detailed competitors: {e}")
        return []


# Landmark categories for OSM query
LANDMARK_TAG_MAPPING: Dict[str, List[Dict[str, str]]] = {
    'metro': [{'railway': 'station'}, {'station': 'subway'}],
    'bus_stop': [{'highway': 'bus_stop'}, {'amenity': 'bus_station'}],
    'school': [{'amenity': 'school'}],
    'college': [{'amenity': 'college'}, {'amenity': 'university'}],
    'hospital': [{'amenity': 'hospital'}],
    'mall': [{'shop': 'mall'}],
    'park': [{'leisure': 'park'}],
    'bank': [{'amenity': 'bank'}],
    'atm': [{'amenity': 'atm'}],
    'temple': [{'amenity': 'place_of_worship'}],
}


def get_landmarks_from_osm(lat: float, lng: float, radius: int) -> List[Dict]:
    """
    Get landmarks from OpenStreetMap within a radius.
    Fetches multiple landmark types for better area coverage.
    
    Args:
        lat: Latitude of center
        lng: Longitude of center
        radius: Search radius in meters
        
    Returns:
        List of landmarks with name, lat, lng, category
    """
    landmarks = []
    
    # Fetch each landmark type
    for category, tags in LANDMARK_TAG_MAPPING.items():
        query = _build_detailed_query(lat, lng, radius, tags)
        
        try:
            api = overpy.Overpass()
            result = api.query(query)
            
            # Process nodes
            for node in result.nodes:
                name = node.tags.get('name', '')
                if name:
                    landmarks.append({
                        'name': name,
                        'lat': float(node.lat),
                        'lng': float(node.lon),
                        'category': category
                    })
            
            # Process ways with centers
            for way in result.ways:
                name = way.tags.get('name', '')
                if name and way.center_lat:
                    landmarks.append({
                        'name': name,
                        'lat': float(way.center_lat),
                        'lng': float(way.center_lon),
                        'category': category
                    })
                    
        except Exception as e:
            print(f"Error fetching {category} landmarks: {e}")
            continue
    
    return landmarks


def get_available_categories() -> List[str]:
    """
    Get list of available business categories for competitor search.
    
    Returns:
        List of category names that can be used with get_competitor_count
    """
    return list(CATEGORY_TAG_MAPPING.keys())


# Convenience functions for common categories
def get_cafe_count(lat: float, lng: float, radius: int = 500) -> int:
    """Count cafes within radius."""
    return get_competitor_count(lat, lng, radius, 'cafe')


def get_restaurant_count(lat: float, lng: float, radius: int = 500) -> int:
    """Count restaurants within radius."""
    return get_competitor_count(lat, lng, radius, 'restaurant')


def get_gym_count(lat: float, lng: float, radius: int = 500) -> int:
    """Count gyms/fitness centers within radius."""
    return get_competitor_count(lat, lng, radius, 'gym')


def get_pharmacy_count(lat: float, lng: float, radius: int = 500) -> int:
    """Count pharmacies within radius."""
    return get_competitor_count(lat, lng, radius, 'pharmacy')
