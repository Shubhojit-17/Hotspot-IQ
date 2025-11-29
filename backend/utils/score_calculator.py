"""
Hotspot IQ - Opportunity Score Calculator
Implements the proprietary scoring algorithm for location analysis.
"""

from typing import Dict, List
from config import LANDMARK_WEIGHTS


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
