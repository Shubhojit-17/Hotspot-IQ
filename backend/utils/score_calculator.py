"""
Hotspot IQ - Location Analysis & Recommended Spots Calculator
Finds optimal business locations based on competitor density and landmark proximity.
"""

import math
import requests
from typing import Dict, List, Tuple, Optional
from config import LANDMARK_WEIGHTS

# Overpass API endpoints
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
]


def _is_near_road(lat: float, lng: float, max_distance: float = 300) -> Tuple[bool, Optional[float]]:
    """
    Check if a point is near a road using Overpass API.
    
    Args:
        lat: Latitude
        lng: Longitude
        max_distance: Maximum distance to road in meters
        
    Returns:
        Tuple of (is_near_road, approximate_distance)
    """
    try:
        # Query for roads - use 'out body' to get actual results
        query = f"""
        [out:json][timeout:5];
        (
            way["highway"~"primary|secondary|tertiary|residential|unclassified|service"](around:{max_distance},{lat},{lng});
        );
        out body;
        """
        
        for endpoint in OVERPASS_ENDPOINTS[:1]:  # Just use first endpoint for speed
            try:
                response = requests.post(endpoint, data={'data': query}, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    elements = data.get('elements', [])
                    road_count = len(elements)
                    if road_count > 0:
                        return True, max_distance / 2  # Approximate distance
                    return False, None
            except Exception as e:
                continue
        # If API fails, assume NOT near road (conservative)
        return False, None
    except:
        return False, None


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in meters."""
    R = 6371000  # Earth's radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def calculate_grid_scores(
    center_lat: float,
    center_lng: float,
    radius: float,
    competitors: List[Dict],
    landmarks: List[Dict],
    grid_size: int = 10
) -> List[Dict]:
    """
    Analyze the area using a grid and calculate opportunity score for each cell.
    
    Returns a list of grid cells with their scores, sorted by opportunity.
    """
    # Convert radius to lat/lng offsets
    lat_offset_per_m = 1 / 111000
    lng_offset_per_m = 1 / (111000 * math.cos(math.radians(center_lat)))
    
    grid_cells = []
    cell_size = (2 * radius) / grid_size  # Size of each cell in meters
    
    for row in range(grid_size):
        for col in range(grid_size):
            # Calculate cell center coordinates
            cell_lat = center_lat + ((row - grid_size/2 + 0.5) * cell_size * lat_offset_per_m)
            cell_lng = center_lng + ((col - grid_size/2 + 0.5) * cell_size * lng_offset_per_m)
            
            # Check if cell is within the circular radius
            dist_from_center = haversine_distance(center_lat, center_lng, cell_lat, cell_lng)
            if dist_from_center > radius:
                continue
            
            # Count competitors within proximity of this cell (300m radius)
            nearby_competitors = 0
            min_competitor_dist = float('inf')
            for comp in competitors:
                comp_dist = haversine_distance(cell_lat, cell_lng, comp.get('lat', 0), comp.get('lng', 0))
                if comp_dist < 300:
                    nearby_competitors += 1
                if comp_dist < min_competitor_dist:
                    min_competitor_dist = comp_dist
            
            # Count landmarks within proximity (500m radius) and calculate footfall score
            nearby_landmarks = []
            footfall_score = 0
            for lm in landmarks:
                lm_dist = haversine_distance(cell_lat, cell_lng, lm.get('lat', 0), lm.get('lng', 0))
                if lm_dist < 500:
                    nearby_landmarks.append(lm)
                    # Higher value for closer landmarks
                    proximity_bonus = max(0, (500 - lm_dist) / 500)
                    
                    # Weight by landmark type
                    name = lm.get('name', '').lower()
                    category = lm.get('category', '').lower()
                    
                    if any(kw in name or kw in category for kw in ['metro', 'station', 'railway']):
                        footfall_score += 25 * proximity_bonus
                    elif any(kw in name or kw in category for kw in ['mall', 'plaza', 'market']):
                        footfall_score += 20 * proximity_bonus
                    elif any(kw in name or kw in category for kw in ['hospital', 'medical', 'clinic']):
                        footfall_score += 15 * proximity_bonus
                    elif any(kw in name or kw in category for kw in ['school', 'college', 'university']):
                        footfall_score += 15 * proximity_bonus
                    elif any(kw in name or kw in category for kw in ['office', 'corporate', 'tech']):
                        footfall_score += 12 * proximity_bonus
                    elif any(kw in name or kw in category for kw in ['bank', 'atm']):
                        footfall_score += 10 * proximity_bonus
                    else:
                        footfall_score += 5 * proximity_bonus
            
            # Calculate opportunity score: high footfall + low competition = better
            # Competition penalty: more competitors nearby = lower score
            competition_penalty = nearby_competitors * 15
            
            # Distance bonus: if no competitors very close, that's good
            distance_bonus = 0
            if min_competitor_dist > 200:
                distance_bonus = min(30, (min_competitor_dist - 200) / 10)
            
            # Final opportunity score
            opportunity = max(0, footfall_score + distance_bonus - competition_penalty)
            
            grid_cells.append({
                'lat': cell_lat,
                'lng': cell_lng,
                'opportunity_score': round(opportunity, 1),
                'nearby_competitors': nearby_competitors,
                'min_competitor_distance': round(min_competitor_dist) if min_competitor_dist != float('inf') else None,
                'nearby_landmarks': len(nearby_landmarks),
                'footfall_score': round(footfall_score, 1),
                'landmark_names': [lm.get('name', '') for lm in nearby_landmarks[:5]]
            })
    
    # Sort by opportunity score (highest first)
    grid_cells.sort(key=lambda x: x['opportunity_score'], reverse=True)
    
    return grid_cells


def find_recommended_spots(
    center_lat: float,
    center_lng: float,
    radius: float,
    competitors: List[Dict],
    landmarks: List[Dict],
    max_spots: int = 5,
    road_proximity: float = 300  # Maximum distance from road in meters
) -> List[Dict]:
    """
    Find the best spots for setting up a business.
    Only recommends spots that are near roadways (within road_proximity meters).
    
    Returns top spots with explanations.
    """
    # Calculate grid scores
    grid_scores = calculate_grid_scores(
        center_lat, center_lng, radius, 
        competitors, landmarks, 
        grid_size=12  # Higher resolution grid
    )
    
    if not grid_scores:
        return []
    
    # Select top spots that are not too close to each other AND near roads
    recommended = []
    min_spacing = 300  # Minimum distance between recommended spots
    checked_for_roads = 0
    skipped_no_road = 0
    max_road_checks = 50  # Limit API calls (increased to find more valid spots)
    
    print(f"   🔍 Filtering spots near roadways (within {road_proximity}m)...")
    
    for cell in grid_scores:
        if len(recommended) >= max_spots:
            break
        
        if checked_for_roads >= max_road_checks:
            print(f"   ⚠️ Reached max road checks ({max_road_checks}), checked {checked_for_roads}, skipped {skipped_no_road} (no road)")
            break  # Stop completely if we hit max checks
            
        # Check if this spot is far enough from already recommended spots
        too_close = False
        for existing in recommended:
            dist = haversine_distance(
                cell['lat'], cell['lng'],
                existing['lat'], existing['lng']
            )
            if dist < min_spacing:
                too_close = True
                break
        
        if too_close:
            continue
        
        # Check if spot is near a road - ALWAYS check, no fallback
        near_road, _ = _is_near_road(cell['lat'], cell['lng'], road_proximity)
        checked_for_roads += 1
        
        if not near_road:
            # Skip spots not near roads
            skipped_no_road += 1
            print(f"      ❌ Skipped ({cell['lat']:.5f}, {cell['lng']:.5f}) - no road within {road_proximity}m")
            continue
        
        print(f"      ✅ Found spot near road: ({cell['lat']:.5f}, {cell['lng']:.5f})")
        
        # Generate reason for recommendation
        reasons = []
        
        if cell['min_competitor_distance'] and cell['min_competitor_distance'] > 300:
            reasons.append(f"Low competition - nearest competitor {cell['min_competitor_distance']}m away")
        elif cell['nearby_competitors'] == 0:
            reasons.append("No direct competitors in this zone")
        elif cell['nearby_competitors'] <= 2:
            reasons.append(f"Low competition density ({cell['nearby_competitors']} nearby)")
        
        if cell['footfall_score'] >= 30:
            reasons.append("High footfall area")
        elif cell['footfall_score'] >= 15:
            reasons.append("Good footfall potential")
        
        if cell['nearby_landmarks'] >= 3:
            reasons.append(f"Near key landmarks ({cell['nearby_landmarks']} within 500m)")
        
        if cell['landmark_names']:
            top_landmarks = cell['landmark_names'][:3]
            reasons.append(f"Near: {', '.join(top_landmarks)}")
        
        # Add road accessibility note
        reasons.append("Good road accessibility")
        
        # Determine rating based on score
        if cell['opportunity_score'] >= 50:
            rating = 'Excellent'
            rating_color = 'green'
        elif cell['opportunity_score'] >= 30:
            rating = 'Good'
            rating_color = 'cyan'
        elif cell['opportunity_score'] >= 15:
            rating = 'Moderate'
            rating_color = 'yellow'
        else:
            rating = 'Fair'
            rating_color = 'orange'
        
        recommended.append({
            'lat': round(cell['lat'], 6),
            'lng': round(cell['lng'], 6),
            'score': cell['opportunity_score'],
            'rating': rating,
            'rating_color': rating_color,
            'reasons': reasons if reasons else ['Balanced location with growth potential'],
            'nearby_competitors': cell['nearby_competitors'],
            'nearby_landmarks': cell['nearby_landmarks'],
            'min_competitor_distance': cell['min_competitor_distance']
        })
    
    # Number the spots
    for i, spot in enumerate(recommended, 1):
        spot['rank'] = i
    
    return recommended


def calculate_footfall_proxy(landmarks: Dict, competitors: Dict) -> float:
    """
    Calculate footfall proxy score based on nearby landmarks.
    
    Higher footfall areas have more transit points, offices, and commercial zones.
    
    Args:
        landmarks: Dict with landmark data by category
        competitors: Dict with competitor data
        
    Returns:
        Footfall proxy score (0-100)
    """
    score = 0
    max_score = 100
    
    by_category = landmarks.get('by_category', {})
    all_pois = landmarks.get('all_pois', [])
    total_count = landmarks.get('total_count', 0)
    
    # If we have specific categories, use them for detailed scoring
    # Transit points are strong footfall indicators
    transit_score = 0
    if 'metro_station' in by_category:
        transit_score += min(by_category['metro_station'].get('count', 0) * 20, 40)
    if 'bus_stop' in by_category:
        transit_score += min(by_category['bus_stop'].get('count', 0) * 5, 15)
    
    score += transit_score
    
    # Commercial zones indicate high activity
    commercial_score = 0
    if 'mall' in by_category:
        commercial_score += min(by_category['mall'].get('count', 0) * 15, 25)
    if 'office' in by_category:
        commercial_score += min(by_category['office'].get('count', 0) * 10, 20)
    
    score += commercial_score
    
    # Educational institutions bring regular footfall
    education_score = 0
    if 'school' in by_category:
        education_score += min(by_category['school'].get('count', 0) * 5, 10)
    if 'college' in by_category:
        education_score += min(by_category['college'].get('count', 0) * 8, 15)
    
    score += education_score
    
    # Residential areas mean local customers
    if 'residential' in by_category:
        score += min(by_category['residential'].get('count', 0) * 5, 15)
    
    # If no specific categories matched, use total nearby landmarks as proxy
    # More landmarks nearby = more activity = higher footfall
    if score == 0 and total_count > 0:
        # Use POI names to detect categories
        for poi in all_pois:
            name = poi.get('name', '').lower()
            # Check for high-value landmarks in names
            if any(kw in name for kw in ['metro', 'station', 'railway', 'train']):
                score += 20
            elif any(kw in name for kw in ['mall', 'plaza', 'center', 'centre']):
                score += 15
            elif any(kw in name for kw in ['hospital', 'clinic', 'medical']):
                score += 12
            elif any(kw in name for kw in ['school', 'college', 'university', 'institute']):
                score += 10
            elif any(kw in name for kw in ['office', 'corporate', 'tech', 'park']):
                score += 10
            elif any(kw in name for kw in ['hotel', 'restaurant', 'cafe', 'food']):
                score += 8
            elif any(kw in name for kw in ['temple', 'church', 'mosque', 'gurudwara']):
                score += 5
            else:
                score += 3  # Any landmark is a sign of activity
        
        # Cap the name-based score
        score = min(score, max_score)
    
    return min(score, max_score)


def calculate_landmark_value(landmarks: Dict) -> float:
    """
    Calculate weighted landmark value score.
    
    Different landmarks have different value for businesses.
    
    Args:
        landmarks: Dict with landmark data by category
        
    Returns:
        Landmark value score (0-50)
    """
    score = 0
    max_score = 50
    
    by_category = landmarks.get('by_category', {})
    all_pois = landmarks.get('all_pois', [])
    total_count = landmarks.get('total_count', 0)
    
    for category, data in by_category.items():
        count = data.get('count', 0)
        weight = LANDMARK_WEIGHTS.get(category, 5)
        
        # Diminishing returns for multiple landmarks of same type
        category_score = 0
        for i in range(min(count, 5)):  # Cap at 5 of each type
            category_score += weight * (0.8 ** i)  # Each additional is worth less
        
        score += category_score
    
    # If score is still 0 but we have landmarks, calculate based on POI names
    if score == 0 and total_count > 0:
        for poi in all_pois[:10]:  # Cap at 10 POIs
            name = poi.get('name', '').lower()
            # Assign weights based on landmark name
            if any(kw in name for kw in ['metro', 'station', 'railway']):
                weight = 12
            elif any(kw in name for kw in ['mall', 'plaza', 'market']):
                weight = 10
            elif any(kw in name for kw in ['hospital', 'medical']):
                weight = 8
            elif any(kw in name for kw in ['school', 'college', 'university']):
                weight = 8
            elif any(kw in name for kw in ['hotel', 'restaurant']):
                weight = 6
            elif any(kw in name for kw in ['bank', 'atm']):
                weight = 5
            else:
                weight = 3
            
            score += weight * (0.8 ** all_pois.index(poi))
    
    return min(score, max_score)


def calculate_competitor_density(competitors: Dict, radius: float = 1000) -> float:
    """
    Calculate competitor density factor.
    
    More competitors = higher density = lower score contribution.
    
    Args:
        competitors: Dict with competitor data
        radius: Search radius in meters
        
    Returns:
        Competitor density factor (0+, higher is worse)
    """
    count = competitors.get('count', 0)
    
    # Normalize by area (competitors per square km)
    area_sq_km = 3.14159 * (radius / 1000) ** 2
    density = count / max(area_sq_km, 0.1)
    
    return density


def calculate_opportunity_score(
    footfall: float,
    landmark_value: float,
    competitor_density: float
) -> int:
    """
    Calculate the final Opportunity Score.
    
    Formula: (Footfall × Landmark Value) / (Competitor Density + 1)
    Normalized to 0-100 scale.
    
    Args:
        footfall: Footfall proxy score (0-100)
        landmark_value: Landmark value score (0-50)
        competitor_density: Competitor density factor
        
    Returns:
        Opportunity Score (0-100)
    """
    # Calculate raw score
    numerator = footfall * (landmark_value / 50)  # Normalize landmark to 0-1
    denominator = competitor_density + 1  # Add 1 to avoid division by zero
    
    raw_score = numerator / denominator
    
    # Normalize to 0-100
    # Assuming max raw score is around 100 (high footfall, no competition)
    normalized_score = min(raw_score, 100)
    
    return round(normalized_score)


def get_score_interpretation(score: int) -> Dict:
    """
    Get human-readable interpretation of the opportunity score.
    
    Args:
        score: Opportunity score (0-100)
        
    Returns:
        Dict with category, color, recommendation
    """
    if score >= 70:
        return {
            'category': 'Prime Location',
            'color': 'green',
            'emoji': '🟢',
            'recommendation': 'Excellent opportunity! This location shows strong potential with good footfall and manageable competition. Move fast before others discover it.',
            'action': 'Move fast!'
        }
    elif score >= 40:
        return {
            'category': 'Moderate Potential',
            'color': 'yellow',
            'emoji': '🟡',
            'recommendation': 'This location has potential but may require differentiation. Consider your unique value proposition and marketing strategy.',
            'action': 'Needs differentiation'
        }
    else:
        return {
            'category': 'High Risk',
            'color': 'red',
            'emoji': '🔴',
            'recommendation': 'This location shows challenging conditions with high competition or low footfall. Consider alternative locations or a very niche strategy.',
            'action': 'Reconsider or pivot'
        }


def analyze_location(
    landmarks: Dict,
    competitors: Dict,
    business_type: str
) -> Dict:
    """
    Perform complete location analysis.
    
    Args:
        landmarks: Landmark data from LatLong service
        competitors: Competitor data from LatLong service
        business_type: Type of business being analyzed
        
    Returns:
        Complete analysis results
    """
    # Calculate component scores
    footfall = calculate_footfall_proxy(landmarks, competitors)
    landmark_value = calculate_landmark_value(landmarks)
    competitor_density = calculate_competitor_density(competitors)
    
    # Calculate final score
    opportunity_score = calculate_opportunity_score(
        footfall,
        landmark_value,
        competitor_density
    )
    
    # Get interpretation
    interpretation = get_score_interpretation(opportunity_score)
    
    return {
        'opportunity_score': opportunity_score,
        'interpretation': interpretation,
        'breakdown': {
            'footfall_proxy': round(footfall, 1),
            'landmark_value': round(landmark_value, 1),
            'competitor_density': round(competitor_density, 2),
            'competitor_count': competitors.get('count', 0)
        },
        'landmarks_summary': {
            category: data.get('count', 0)
            for category, data in landmarks.get('by_category', {}).items()
        },
        'competitors': competitors
    }
