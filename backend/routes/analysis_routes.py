"""
Hotspot IQ - Analysis Routes
Handles location analysis, isochrone, and scoring endpoints.
"""

import re
import math
from flask import Blueprint, request, jsonify
from services.latlong_service import latlong_service
from services.places_service import fetch_competitors, fetch_landmarks
from utils.score_calculator import analyze_location, find_recommended_spots
from services.relevance_service import get_relevance_score, get_marker_style, RELEVANCE_MATRIX
from services.validation_service import validate_and_fetch_data, ValidationError

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
    
    print(f"🔍 Analysis Request: lat={lat}, lng={lng}, business_type={business_type}, is_major={is_major_area}, radius={radius}m")
    
    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng are required'}), 400
    
    if not business_type:
        return jsonify({'error': 'business_type is required'}), 400
    
    # === LOCATION VALIDATION ===
    # Validate location before proceeding with analysis
    print(f"\n🛡️ Running location validation...")
    is_valid, validation_result = validate_and_fetch_data(lat, lng, business_type)
    
    if not is_valid:
        error_message = validation_result.get('message', 'Location validation failed')
        error_type = validation_result.get('error_type', 'validation_error')
        print(f"❌ Location validation failed: {error_message}")
        return jsonify({
            'error': error_message,
            'error_type': error_type,
            'validation_failed': True
        }), 400
    
    # Use snapped coordinates if available (location is now on a valid road)
    snapped_location = validation_result.get('snapped_location', {})
    if snapped_location.get('lat') and snapped_location.get('lng'):
        # Only use snapped if significantly different (> 5m)
        original_lat, original_lng = lat, lng
        snap_lat, snap_lng = snapped_location['lat'], snapped_location['lng']
        
        # Calculate distance between original and snapped
        R = 6371000  # Earth radius in meters
        dlat = math.radians(snap_lat - original_lat)
        dlng = math.radians(snap_lng - original_lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(original_lat)) * math.cos(math.radians(snap_lat)) * math.sin(dlng/2)**2
        snap_distance = R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        if snap_distance > 5:
            lat, lng = snap_lat, snap_lng
            print(f"📍 Using snapped location: ({lat}, {lng}) - {snap_distance:.1f}m from original")
    
    print(f"✅ Location validation passed!")
    # === END VALIDATION ===
    
    # Get reverse geocode for address info (includes landmark text)
    address_info = latlong_service.reverse_geocode(lat, lng)
    
    # Parse landmarks from reverse geocode landmark field
    parsed_landmarks, _ = parse_landmarks_from_text(
        address_info.get('landmark', ''), 
        business_type
    )
    
    # Get landmarks from multiple sample points to cover the full radius
    # Sample points: center + 4 cardinal directions + 4 diagonal directions
    sample_offsets = [
        (0, 0),  # Center
        (0.7, 0), (-0.7, 0), (0, 0.7), (0, -0.7),  # Cardinal directions at 70% radius
        (0.5, 0.5), (-0.5, 0.5), (0.5, -0.5), (-0.5, -0.5),  # Diagonals at 50% radius
    ]
    
    # Convert radius to lat/lng offsets
    lat_offset_per_m = 1 / 111000  # ~1 degree per 111km
    lng_offset_per_m = 1 / (111000 * math.cos(math.radians(lat)))
    
    nearby_landmarks = []
    landmark_names_seen = set()
    
    for lat_mult, lng_mult in sample_offsets:
        sample_lat = lat + (lat_mult * radius * lat_offset_per_m)
        sample_lng = lng + (lng_mult * radius * lng_offset_per_m)
        
        # Get landmarks at this sample point
        sample_landmarks = latlong_service.get_landmarks(sample_lat, sample_lng)
        
        for lm in sample_landmarks:
            lm_name = lm.get('name', '').lower()
            if lm_name and lm_name not in landmark_names_seen:
                landmark_names_seen.add(lm_name)
                nearby_landmarks.append(lm)
    
    # Fetch competitors using the new places_service (covers entire radius)
    print(f"🔎 Fetching competitors: category={business_type}, radius={radius}m")
    osm_competitors = fetch_competitors(lat, lng, radius, business_type)
    
    # Fetch landmarks using places_service for better area coverage
    osm_landmarks = fetch_landmarks(lat, lng, radius)
    
    # Also fetch landmarks from LatLong POI API for additional data
    latlong_poi_categories = ['hospital', 'school', 'hotel', 'bank', 'atm', 'mall', 'restaurant']
    latlong_pois = []
    for poi_cat in latlong_poi_categories:
        try:
            poi_result = latlong_service.get_poi(lat, lng, poi_cat, radius)
            for poi in poi_result.get('pois', []):
                latlong_pois.append({
                    'name': poi.get('name', ''),
                    'category': poi_cat,
                    'lat': poi.get('lat', lat),
                    'lng': poi.get('lng', lng)
                })
        except Exception as e:
            print(f"⚠️ Error fetching POI {poi_cat}: {e}")
    
    print(f"📍 Found {len(latlong_pois)} POIs from LatLong API")
    
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
    
    # Add landmarks from OpenStreetMap (for better area coverage)
    for lm in osm_landmarks:
        lm_name = lm.get('name', '')
        if lm_name.lower() not in existing_names:
            # Convert places_service format to expected format
            all_landmarks.append({
                'name': lm_name,
                'lat': lm.get('lat'),
                'lng': lm.get('lng'),
                'category': lm.get('type', 'landmark')
            })
            existing_names.add(lm_name.lower())
    
    # Add landmarks from LatLong POI API
    for poi in latlong_pois:
        poi_name = poi.get('name', '')
        if poi_name.lower() not in existing_names:
            all_landmarks.append(poi)
            existing_names.add(poi_name.lower())
    
    print(f"🏛️ Total landmarks combined: {len(all_landmarks)}")
    
    # Format competitors with distance calculation
    all_competitors = []
    for comp in osm_competitors:
        # Calculate approximate distance in meters
        R = 6371000  # Earth's radius in meters
        lat1, lon1 = math.radians(lat), math.radians(lng)
        lat2, lon2 = math.radians(comp.get('lat', lat)), math.radians(comp.get('lng', lng))
        dlat, dlon = lat2 - lat1, lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        distance = int(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))
        
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
    
    # Find recommended spots for business setup
    print(f"🎯 Finding recommended spots in the area...")
    recommended_spots = find_recommended_spots(
        center_lat=lat,
        center_lng=lng,
        radius=radius,
        competitors=all_competitors,
        landmarks=all_landmarks,
        max_spots=5
    )
    print(f"✅ Found {len(recommended_spots)} recommended spots")
    
    # Compile response - return ALL competitors for heatmap accuracy
    response = {
        'location': {
            'lat': lat,
            'lng': lng,
            'address': address_info,
            'digipin': digipin_info.get('digipin', '')
        },
        'business_type': business_type,
        'filters_applied': filters,
        'recommended_spots': recommended_spots,  # NEW: Recommended business locations
        'competitors': {
            'count': len(all_competitors),
            'nearby': all_competitors  # Return ALL competitors for heatmap
        },
        'landmarks': {
            'total': len(all_landmarks),
            'by_category': {'nearby': len(all_landmarks)},
            'list': all_landmarks  # Return all landmarks
        },
        'footfall_proxy': 'high' if analysis_result['breakdown']['footfall_proxy'] > 60 else 'medium' if analysis_result['breakdown']['footfall_proxy'] > 30 else 'low'
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


@analysis_bp.route('/relevance', methods=['GET'])
def get_relevance_data():
    """
    Get relevance scores for marker styling based on business type.
    Query params:
        - business_type: The selected business type (optional)
        - landmark_type: Specific landmark type to get score for (optional)
    Returns relevance matrix or specific score with marker style.
    """
    business_type = request.args.get('business_type', 'other').lower()
    landmark_type = request.args.get('landmark_type')
    
    if landmark_type:
        # Return specific score and style
        score = get_relevance_score(business_type, landmark_type)
        style = get_marker_style(business_type, landmark_type)
        return jsonify({
            'business_type': business_type,
            'landmark_type': landmark_type,
            'relevance_score': score,
            'marker_style': style
        })
    else:
        # Return all scores for the business type
        if business_type in RELEVANCE_MATRIX:
            scores = RELEVANCE_MATRIX[business_type]
        else:
            scores = RELEVANCE_MATRIX['other']
        
        # Calculate styles for each landmark type
        styles = {}
        for ltype, score in scores.items():
            styles[ltype] = get_marker_style(business_type, ltype)
        
        return jsonify({
            'business_type': business_type,
            'relevance_scores': scores,
            'marker_styles': styles
        })


@analysis_bp.route('/validate-location', methods=['POST'])
def validate_location_endpoint():
    """
    POST /api/validate-location
    
    Validates if a location is suitable for business analysis.
    Performs roadway access, area viability, and road quality checks.
    
    Request body:
    {
        "lat": 12.9716,
        "lng": 77.5946,
        "business_type": "cafe"
    }
    
    Response (success):
    {
        "valid": true,
        "snapped_location": {"lat": 12.9716, "lng": 77.5946},
        "checks": {...},
        "message": "Location validated successfully"
    }
    
    Response (failure):
    {
        "valid": false,
        "error": "No such possible business places present in the area.",
        "error_type": "ghost_town",
        "validation_failed": true
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    lat = data.get('lat')
    lng = data.get('lng')
    business_type = data.get('business_type', 'other')
    
    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng are required'}), 400
    
    # Run validation
    is_valid, result = validate_and_fetch_data(lat, lng, business_type)
    
    if not is_valid:
        return jsonify({
            'valid': False,
            'error': result.get('message', 'Location validation failed'),
            'error_type': result.get('error_type', 'validation_error'),
            'validation_failed': True
        }), 400
    
    return jsonify(result)

