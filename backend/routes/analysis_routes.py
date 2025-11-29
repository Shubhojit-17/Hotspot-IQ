"""
Hotspot IQ - Analysis Routes
Handles location analysis, isochrone, and scoring endpoints.
"""

import re
from flask import Blueprint, request, jsonify
from services.latlong_service import latlong_service
from services.competitor_service import get_competitors_detailed, get_competitor_count
from utils.score_calculator import analyze_location

analysis_bp = Blueprint('analysis', __name__)


# Category detection keywords for landmarks
LANDMARK_CATEGORY_KEYWORDS = {
    'metro_station': ['metro', 'subway'],
    'bus_stop': ['bus stop', 'bus stand', 'bus station'],
    'railway_station': ['railway', 'train station', 'rail'],
    'school': ['school', 'vidyalaya', 'vidya'],
    'college': ['college', 'university', 'institute', 'iit', 'nit'],
    'hospital': ['hospital', 'medical', 'clinic', 'healthcare'],
    'mall': ['mall', 'plaza', 'shopping'],
    'office': ['office', 'corporate', 'tech park', 'business'],
    'residential': ['apartment', 'residency', 'housing', 'colony'],
    'temple': ['temple', 'mandir', 'church', 'mosque', 'gurudwara', 'masjid'],
    'park': ['park', 'garden', 'ground'],
    'atm': ['atm', 'bank'],
    'bar': ['bar', 'pub', 'brewery'],
    'restaurant': ['restaurant', 'dhaba', 'food', 'kitchen', 'cafe', 'diner'],
    'hotel': ['hotel', 'lodge', 'guest house', 'inn', 'oyo', 'capital o'],
}


def detect_landmark_category(name: str) -> str:
    """Detect category from landmark name."""
    name_lower = name.lower()
    for category, keywords in LANDMARK_CATEGORY_KEYWORDS.items():
        if any(kw in name_lower for kw in keywords):
            return category
    return 'default'


def parse_landmarks_from_text(landmark_text, business_type=''):
    """
    Parse landmark info from reverse geocode response.
    Example inputs: 
        "< 0.5km from Cafe Noir, < 0.5km from Farzi Cafe"
        "~ 0.5km from SDH Danapur, ~ 0.5km from Pizza Corner"
    
    Returns:
        tuple: (all_landmarks, competitors_only)
    """
    if not landmark_text:
        return [], []
    
    all_landmarks = []
    competitors = []
    
    # Business type keywords to identify competitors
    competitor_keywords = {
        'cafe': ['cafe', 'coffee', 'tea', 'bakery', 'starbucks', 'barista', 'roasters', 'brew', 'chai'],
        'restaurant': ['restaurant', 'food', 'kitchen', 'dhaba', 'biryani', 'pizza', 'burger', 'diner', 'sweets', 'corner', 'hotel', 'eatery', 'cuisine', 'tandoor', 'grill', 'chinese', 'mughlai'],
        'gym': ['gym', 'fitness', 'yoga', 'sports', 'crossfit', 'health club', 'workout'],
        'pharmacy': ['pharmacy', 'medical', 'chemist', 'medicine', 'drugstore', 'pharma', 'medico'],
        'salon': ['salon', 'spa', 'beauty', 'hair', 'parlour', 'parlor', 'unisex', 'barber'],
        'retail': ['store', 'mart', 'shop', 'retail', 'boutique', 'emporium', 'showroom'],
        'grocery': ['grocery', 'kirana', 'supermarket', 'mart', 'provision', 'general store'],
    }
    
    # Parse each landmark mention
    parts = landmark_text.split(',')
    for part in parts:
        part = part.strip()
        # Extract distance and name - handle variations like:
        # "< 0.5km from X", "~ 0.5km from X", "> 0.5km from X", "0.5km from X"
        match = re.match(r'[<>~]?\s*([\d.]+)\s*km\s+from\s+(.+)', part, re.IGNORECASE)
        if match:
            distance_km = float(match.group(1))
            name = match.group(2).strip()
            
            # Determine category based on name
            category = 'landmark'
            keywords = competitor_keywords.get(business_type, [])
            is_competitor = any(kw in name.lower() for kw in keywords)
            
            if is_competitor:
                category = business_type
            
            landmark = {
                'name': name,
                'distance': int(distance_km * 1000),  # Convert to meters
                'category': category,
                'is_competitor': is_competitor
            }
            
            # Add to all landmarks list
            all_landmarks.append(landmark)
            
            # Also track competitors separately
            if is_competitor:
                competitors.append(landmark)
    
    return all_landmarks, competitors


@analysis_bp.route('/analyze', methods=['POST'])
def analyze():
    """
    POST /api/analyze
    
    Performs comprehensive location analysis including opportunity score.
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    lat = data.get('lat')
    lng = data.get('lng')
    business_type = data.get('business_type', 'other')
    filters = data.get('filters', [])
    is_major_area = data.get('is_major', False)
    
    # Use larger radius for major areas (2500m) vs regular locations (1000m)
    default_radius = 2500 if is_major_area else 1000
    radius = data.get('radius', default_radius)
    
    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng are required'}), 400
    
    if not business_type:
        return jsonify({'error': 'business_type is required'}), 400
    
    # Get reverse geocode for address info (includes landmark text)
    address_info = latlong_service.reverse_geocode(lat, lng)
    
    # Parse landmarks from reverse geocode landmark field
    parsed_landmarks, _ = parse_landmarks_from_text(
        address_info.get('landmark', ''), 
        business_type
    )
    
    # Get nearby landmarks with coordinates from Landmarks API
    nearby_landmarks = latlong_service.get_landmarks(lat, lng)
    
    # Get competitors from OpenStreetMap via competitor_service
    # Map business_type to OSM category
    osm_category_map = {
        'cafe': 'cafe',
        'restaurant': 'restaurant',
        'gym': 'gym',
        'pharmacy': 'pharmacy',
        'salon': 'salon',
        'retail': 'retail',
        'grocery': 'supermarket',
    }
    osm_category = osm_category_map.get(business_type, business_type)
    
    # Fetch competitors from OpenStreetMap
    osm_competitors = []
    try:
        osm_competitors = get_competitors_detailed(lat, lng, radius, osm_category)
    except Exception as e:
        print(f"Error fetching OSM competitors: {e}")
    
    # Combine all landmarks - start with parsed landmarks
    all_landmarks = []
    existing_names = set()
    
    # Add parsed landmarks with detected categories
    for lm in parsed_landmarks:
        lm_name = lm.get('name', '')
        if lm_name.lower() not in existing_names:
            # Detect category from name
            lm['category'] = detect_landmark_category(lm_name)
            all_landmarks.append(lm)
            existing_names.add(lm_name.lower())
    
    # Add landmarks from Landmarks API with detected categories
    for lm in nearby_landmarks:
        lm_name = lm.get('name', '')
        if lm_name.lower() not in existing_names:
            lm['category'] = detect_landmark_category(lm_name)
            all_landmarks.append(lm)
            existing_names.add(lm_name.lower())
    
    # Format competitors from OSM with distance calculation
    all_competitors = []
    for comp in osm_competitors:
        # Calculate approximate distance in meters
        from math import radians, sin, cos, sqrt, atan2
        R = 6371000  # Earth's radius in meters
        lat1, lon1 = radians(lat), radians(lng)
        lat2, lon2 = radians(comp.get('lat', lat)), radians(comp.get('lng', lng))
        dlat, dlon = lat2 - lat1, lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        distance = int(R * 2 * atan2(sqrt(a), sqrt(1-a)))
        
        all_competitors.append({
            'name': comp.get('name', 'Unknown'),
            'category': business_type,
            'lat': comp.get('lat'),
            'lng': comp.get('lng'),
            'distance': distance,
            'is_competitor': True
        })
    
    # Sort competitors by distance
    all_competitors.sort(key=lambda x: x.get('distance', 9999))
    
    # Get Digipin
    digipin_info = latlong_service.get_digipin(lat, lng)
    
    # Build landmarks structure for analysis
    landmarks_data = {
        'by_category': {'nearby': {'count': len(all_landmarks), 'pois': all_landmarks}},
        'total_count': len(all_landmarks),
        'all_pois': all_landmarks
    }
    
    # Build competitors structure
    competitors_data = {
        'count': len(all_competitors),
        'nearby': all_competitors
    }
    
    # Perform analysis
    analysis_result = analyze_location(landmarks_data, competitors_data, business_type)
    
    # Compile response
    response = {
        'location': {
            'lat': lat,
            'lng': lng,
            'address': address_info,
            'digipin': digipin_info.get('digipin', '')
        },
        'business_type': business_type,
        'filters_applied': filters,
        'opportunity_score': analysis_result['opportunity_score'],
        'interpretation': analysis_result['interpretation'],
        'breakdown': analysis_result['breakdown'],
        'competitors': {
            'count': len(all_competitors),
            'nearby': all_competitors[:20]  # Return up to 20 competitors
        },
        'landmarks': {
            'total': len(all_landmarks),
            'by_category': {'nearby': len(all_landmarks)},
            'list': all_landmarks  # Return all landmarks
        },
        'footfall_proxy': 'high' if analysis_result['breakdown']['footfall_proxy'] > 60 else 'medium' if analysis_result['breakdown']['footfall_proxy'] > 30 else 'low',
        'recommendation': analysis_result['interpretation']['recommendation']
    }
    
    return jsonify(response)


@analysis_bp.route('/isochrone', methods=['POST'])
def get_isochrone():
    """
    POST /api/isochrone
    
    Returns GeoJSON polygon for isochrone visualization.
    
    Request body:
    {
        "lat": 12.9716,
        "lng": 77.5946,
        "distance_km": 1.0
    }
    
    Also accepts legacy format with time_minutes (converts to distance):
    {
        "lat": 12.9716,
        "lng": 77.5946,
        "mode": "bike",
        "time_minutes": 15
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    lat = data.get('lat')
    lng = data.get('lng')
    
    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng are required'}), 400
    
    # Support both new API (distance_km) and legacy (time_minutes + mode)
    distance_km = data.get('distance_km')
    
    if distance_km is None:
        # Convert from legacy time-based format
        mode = data.get('mode', 'bike')
        time_minutes = data.get('time_minutes', 15)
        
        # Validate mode and time
        speeds = {'walk': 5, 'bike': 15, 'car': 30}  # km/h
        speed = speeds.get(mode, 15)
        distance_km = (speed * time_minutes) / 60
    
    # Validate distance
    if distance_km < 0.1 or distance_km > 50:
        return jsonify({'error': 'distance_km must be between 0.1 and 50'}), 400
    
    result = latlong_service.get_isochrone(lat, lng, distance_km)
    
    return jsonify(result)


@analysis_bp.route('/poi', methods=['GET'])
def get_poi():
    """
    GET /api/poi?lat={lat}&lng={lng}&category={category}&radius={radius}
    
    Returns Points of Interest by category.
    """
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    category = request.args.get('category', '')
    radius = request.args.get('radius', 1000, type=int)
    
    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng are required'}), 400
    
    if not category:
        return jsonify({'error': 'category is required'}), 400
    
    result = latlong_service.get_poi(lat, lng, category, radius)
    
    return jsonify(result)


@analysis_bp.route('/supply-chain', methods=['POST'])
def check_supply_chain():
    """
    POST /api/supply-chain
    
    Checks logistics feasibility between store and warehouse.
    
    Request body:
    {
        "store_lat": 12.9716,
        "store_lng": 77.5946,
        "warehouse_lat": 13.0827,
        "warehouse_lng": 77.5877
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    store_lat = data.get('store_lat')
    store_lng = data.get('store_lng')
    warehouse_lat = data.get('warehouse_lat')
    warehouse_lng = data.get('warehouse_lng')
    
    if None in [store_lat, store_lng, warehouse_lat, warehouse_lng]:
        return jsonify({'error': 'All coordinates are required'}), 400
    
    # Calculate distance matrix
    result = latlong_service.distance_matrix(
        origins=[{'lat': warehouse_lat, 'lng': warehouse_lng}],
        destinations=[{'lat': store_lat, 'lng': store_lng}]
    )
    
    # Parse result (simplified - actual implementation depends on API response)
    rows = result.get('rows', [])
    if rows and rows[0].get('elements'):
        element = rows[0]['elements'][0]
        distance_km = element.get('distance', {}).get('value', 0) / 1000
        duration_mins = element.get('duration', {}).get('value', 0) / 60
    else:
        # Fallback: estimate using straight-line distance
        import math
        dlat = store_lat - warehouse_lat
        dlng = store_lng - warehouse_lng
        distance_km = math.sqrt(dlat**2 + dlng**2) * 111  # Rough km conversion
        duration_mins = distance_km * 2  # Assume 30 km/h average
    
    # Determine feasibility
    if duration_mins < 30:
        feasibility = 'excellent'
        message = 'Excellent logistics - Quick delivery possible'
        recommendation = 'This location is well-positioned for efficient supply chain operations.'
    elif duration_mins < 45:
        feasibility = 'acceptable'
        message = 'Acceptable logistics - Standard delivery times'
        recommendation = 'Delivery times are manageable but consider optimizing routes.'
    else:
        feasibility = 'warning'
        message = 'High Logistics Cost - Drive time exceeds 45 minutes'
        recommendation = 'Consider a closer warehouse or factor in higher delivery costs.'
    
    return jsonify({
        'distance_km': round(distance_km, 1),
        'drive_time_minutes': round(duration_mins),
        'feasibility': feasibility,
        'message': message,
        'recommendation': recommendation
    })
