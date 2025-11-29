"""
Relevance Matrix Service
========================
This service provides contextual visibility scoring for landmarks based on the selected business type.

Data Science Rationale:
-----------------------
The relevance scores are based on customer behavior patterns and business synergy analysis:

1. FOOT TRAFFIC SYNERGY: Landmarks that generate foot traffic relevant to the business
2. DEMOGRAPHIC ALIGNMENT: Locations whose visitors match the target customer profile  
3. COMPLEMENTARY SERVICES: Businesses that create mutual benefit (e.g., gym + pharmacy)
4. TIME-OF-DAY PATTERNS: Locations with overlapping peak hours
5. ECONOMIC CORRELATION: Areas with spending patterns matching the business model

Scoring Scale:
- 1.0: Critical relevance (primary customer source)
- 0.8: High relevance (significant customer overlap)
- 0.6: Moderate relevance (some customer benefit)
- 0.4: Low relevance (minimal impact)
- 0.2: Very low relevance (negligible impact)
- 0.1: Irrelevant (potentially negative correlation)
"""

# Comprehensive Relevance Matrix
# Maps: business_type -> landmark_category -> relevance_score
RELEVANCE_MATRIX = {
    # =========================================================================
    # CAFE / COFFEE SHOP
    # Target: Young professionals, students, remote workers, casual meetups
    # Peak: Morning rush, lunch breaks, afternoon work sessions
    # =========================================================================
    'cafe': {
        # HIGH RELEVANCE (0.8-1.0) - Primary customer sources
        'office': 1.0,          # Office workers = morning coffee, lunch meetings
        'coworking': 1.0,       # Remote workers, freelancers
        'college': 0.95,        # Students studying, group projects
        'university': 0.95,     # Academic crowd, study sessions
        'library': 0.9,         # Readers, students needing caffeine
        'bookstore': 0.9,       # Literary crowd, reading enthusiasts
        'bank': 0.85,           # Professionals during breaks
        'corporate': 0.85,      # Business meetings, client discussions
        
        # MODERATE-HIGH RELEVANCE (0.6-0.8)
        'mall': 0.75,           # Shoppers taking breaks
        'shopping': 0.75,       # Retail therapy + coffee
        'metro': 0.7,           # Commuters grabbing coffee
        'metro_station': 0.7,
        'bus_stop': 0.65,       # Transit users
        'bus': 0.65,
        'railway': 0.7,         # Travelers, commuters
        'railway_station': 0.7,
        'gym': 0.6,             # Post-workout refreshment
        'park': 0.6,            # Leisure visitors
        'cinema': 0.65,         # Before/after movie crowds
        'theatre': 0.65,
        
        # MODERATE RELEVANCE (0.4-0.6)
        'residential': 0.55,    # Local residents
        'apartment': 0.55,
        'hotel': 0.5,           # Tourists, business travelers
        'hospital': 0.45,       # Visitors, staff breaks
        'clinic': 0.45,
        'salon': 0.5,           # Waiting clients
        'spa': 0.5,
        'museum': 0.55,         # Cultural visitors
        'art_gallery': 0.55,
        
        # LOW RELEVANCE (0.2-0.4)
        'school': 0.35,         # Parents dropping kids (limited)
        'temple': 0.3,          # Religious visitors (brief stops)
        'church': 0.3,
        'mosque': 0.3,
        'pharmacy': 0.35,       # Quick errands
        'supermarket': 0.4,     # Grocery shoppers
        'industrial': 0.25,     # Factory workers (limited breaks)
        'warehouse': 0.2,
        
        # VERY LOW RELEVANCE (0.1-0.2)
        'bar': 0.2,             # Different time/demographic
        'pub': 0.2,
        'nightclub': 0.15,
        'cemetery': 0.1,
        'funeral': 0.1,
    },
    
    # =========================================================================
    # RESTAURANT / FAST FOOD
    # Target: Families, office workers, tourists, social diners
    # Peak: Lunch (12-2pm), Dinner (7-10pm)
    # =========================================================================
    'restaurant': {
        # HIGH RELEVANCE
        'office': 1.0,          # Lunch crowds, team dinners
        'corporate': 1.0,
        'mall': 0.95,           # Shopping + dining combo
        'shopping': 0.95,
        'cinema': 0.9,          # Pre/post movie dining
        'theatre': 0.9,
        'hotel': 0.9,           # Tourists, business travelers
        'residential': 0.85,    # Family dinners, local regulars
        'apartment': 0.85,
        
        # MODERATE-HIGH RELEVANCE
        'metro': 0.75,          # Commuters
        'metro_station': 0.75,
        'railway': 0.75,
        'railway_station': 0.75,
        'bus_stop': 0.7,
        'bus': 0.7,
        'college': 0.7,         # Student groups
        'university': 0.7,
        'park': 0.65,           # Family outings
        'tourist_attraction': 0.8,
        'museum': 0.7,
        'bar': 0.6,             # Pub + food combo
        'pub': 0.6,
        
        # MODERATE RELEVANCE
        'gym': 0.5,             # Health-conscious (depends on type)
        'hospital': 0.55,       # Visitors, staff
        'clinic': 0.5,
        'temple': 0.5,          # After religious events
        'church': 0.5,
        'mosque': 0.5,
        'school': 0.45,         # Parent pickups
        'bank': 0.5,
        
        # LOW RELEVANCE
        'pharmacy': 0.35,
        'salon': 0.4,
        'spa': 0.4,
        'library': 0.35,
        'industrial': 0.3,
        'warehouse': 0.25,
        'cemetery': 0.15,
        'funeral': 0.15,
    },
    
    # =========================================================================
    # RETAIL STORE (General)
    # Target: Broad demographic, impulse buyers, planned shoppers
    # Peak: Weekends, evenings, festivals
    # =========================================================================
    'retail': {
        # HIGH RELEVANCE
        'mall': 1.0,            # Shopping destination
        'shopping': 1.0,
        'residential': 0.95,    # Local shoppers
        'apartment': 0.95,
        'metro': 0.85,          # High foot traffic
        'metro_station': 0.85,
        'bus_stop': 0.8,
        'bus': 0.8,
        'railway': 0.8,
        'railway_station': 0.8,
        'market': 0.9,
        
        # MODERATE-HIGH RELEVANCE
        'office': 0.75,         # After-work shopping
        'corporate': 0.75,
        'bank': 0.7,            # Financial district foot traffic
        'atm': 0.65,
        'college': 0.65,
        'university': 0.65,
        'park': 0.6,
        'cinema': 0.65,
        'hotel': 0.6,
        
        # MODERATE RELEVANCE
        'hospital': 0.5,
        'clinic': 0.45,
        'school': 0.5,
        'temple': 0.45,
        'church': 0.45,
        'mosque': 0.45,
        'gym': 0.5,
        'salon': 0.55,
        'restaurant': 0.55,
        'cafe': 0.55,
        
        # LOW RELEVANCE
        'bar': 0.35,
        'pub': 0.35,
        'nightclub': 0.3,
        'industrial': 0.3,
        'warehouse': 0.35,
        'cemetery': 0.15,
        'library': 0.4,
    },
    
    # =========================================================================
    # GYM / FITNESS CENTER
    # Target: Health-conscious, 25-45 age group, office workers
    # Peak: Early morning (6-8am), Evening (5-8pm)
    # =========================================================================
    'gym': {
        # HIGH RELEVANCE
        'office': 1.0,          # Before/after work fitness
        'corporate': 1.0,
        'residential': 0.95,    # Local fitness enthusiasts
        'apartment': 0.95,
        'park': 0.85,           # Outdoor fitness, runners
        'sports_complex': 0.9,
        'stadium': 0.8,
        
        # MODERATE-HIGH RELEVANCE
        'pharmacy': 0.7,        # Supplements, health products
        'clinic': 0.65,         # Physiotherapy referrals
        'hospital': 0.6,        # Rehab, health-focused
        'salon': 0.65,          # Self-care demographic overlap
        'spa': 0.7,             # Wellness seekers
        'college': 0.7,         # Young fitness crowd
        'university': 0.7,
        'mall': 0.6,            # Gym in mall complexes
        'hotel': 0.55,          # Business travelers
        
        # MODERATE RELEVANCE
        'metro': 0.5,           # Commuter convenience
        'metro_station': 0.5,
        'bus_stop': 0.45,
        'bus': 0.45,
        'supermarket': 0.5,     # Health food shoppers
        'cafe': 0.45,           # Post-workout (protein shakes)
        'restaurant': 0.4,
        
        # LOW RELEVANCE
        'bar': 0.2,             # Opposite lifestyle
        'pub': 0.2,
        'nightclub': 0.15,
        'fast_food': 0.2,
        'school': 0.35,
        'temple': 0.3,
        'church': 0.3,
        'mosque': 0.3,
        'cinema': 0.35,
        'library': 0.3,
        'cemetery': 0.1,
        'industrial': 0.25,
    },
    
    # =========================================================================
    # PHARMACY / MEDICAL
    # Target: All demographics, health-focused, elderly, families
    # Peak: Throughout day, post-doctor visits
    # =========================================================================
    'pharmacy': {
        # HIGH RELEVANCE
        'hospital': 1.0,        # Post-treatment prescriptions
        'clinic': 1.0,          # Doctor referrals
        'medical_center': 1.0,
        'doctor': 0.95,
        'dental': 0.85,
        'residential': 0.9,     # Local health needs
        'apartment': 0.9,
        'elderly_home': 0.95,   # Regular medication needs
        'nursing_home': 0.95,
        
        # MODERATE-HIGH RELEVANCE
        'gym': 0.7,             # Supplements, sports medicine
        'supermarket': 0.7,     # One-stop health shopping
        'mall': 0.65,
        'office': 0.6,          # Work-related health needs
        'corporate': 0.6,
        'school': 0.6,          # Children's health
        'college': 0.55,
        
        # MODERATE RELEVANCE
        'temple': 0.5,          # Elderly visitors
        'church': 0.5,
        'mosque': 0.5,
        'metro': 0.5,
        'metro_station': 0.5,
        'bus_stop': 0.5,
        'bus': 0.5,
        'park': 0.45,
        'salon': 0.4,
        
        # LOW RELEVANCE
        'bar': 0.2,
        'pub': 0.2,
        'nightclub': 0.15,
        'cinema': 0.3,
        'library': 0.35,
        'industrial': 0.3,
        'warehouse': 0.25,
        'cemetery': 0.2,
    },
    
    # =========================================================================
    # SALON / SPA
    # Target: Women 25-55, self-care enthusiasts, wedding parties
    # Peak: Weekends, pre-events, lunch breaks
    # =========================================================================
    'salon': {
        # HIGH RELEVANCE
        'residential': 1.0,     # Local regular clients
        'apartment': 1.0,
        'mall': 0.95,           # Shopping + grooming
        'shopping': 0.95,
        'spa': 0.9,             # Wellness seekers
        'gym': 0.85,            # Self-care demographic
        'hotel': 0.85,          # Tourists, events, weddings
        'banquet': 0.9,         # Wedding/event prep
        'wedding_hall': 0.95,
        
        # MODERATE-HIGH RELEVANCE
        'office': 0.75,         # Professional grooming
        'corporate': 0.75,
        'cinema': 0.65,         # Pre-event grooming
        'theatre': 0.65,
        'restaurant': 0.6,      # Date prep, events
        'cafe': 0.55,
        'boutique': 0.8,        # Fashion-conscious
        'clothing': 0.75,
        
        # MODERATE RELEVANCE
        'college': 0.55,        # Young adults
        'university': 0.55,
        'pharmacy': 0.5,        # Beauty products
        'metro': 0.5,
        'metro_station': 0.5,
        'temple': 0.5,          # Pre-religious events
        'church': 0.5,
        'mosque': 0.5,
        
        # LOW RELEVANCE
        'hospital': 0.35,
        'clinic': 0.4,
        'school': 0.35,
        'bar': 0.4,
        'pub': 0.4,
        'industrial': 0.2,
        'warehouse': 0.15,
        'cemetery': 0.1,
        'library': 0.3,
    },
    
    # =========================================================================
    # ELECTRONICS STORE
    # Target: Tech enthusiasts, students, professionals, gamers
    # Peak: Weekends, product launches, back-to-school
    # =========================================================================
    'electronics': {
        # HIGH RELEVANCE
        'office': 1.0,          # Business tech needs
        'corporate': 1.0,
        'college': 0.95,        # Students buying laptops, gadgets
        'university': 0.95,
        'coworking': 0.9,       # Freelancer tech needs
        'mall': 0.9,            # Tech sections in malls
        'shopping': 0.85,
        
        # MODERATE-HIGH RELEVANCE
        'residential': 0.75,    # Home electronics
        'apartment': 0.75,
        'gaming_center': 0.85,  # Gaming peripherals
        'internet_cafe': 0.8,
        'library': 0.65,        # Academic tech needs
        'metro': 0.6,           # Commuter convenience
        'metro_station': 0.6,
        'bank': 0.6,            # Financial district
        
        # MODERATE RELEVANCE
        'school': 0.55,         # Educational tech
        'cinema': 0.5,
        'cafe': 0.5,            # Tech meetups
        'restaurant': 0.45,
        'hotel': 0.5,
        'gym': 0.4,             # Fitness trackers
        
        # LOW RELEVANCE
        'hospital': 0.35,
        'clinic': 0.3,
        'temple': 0.25,
        'church': 0.25,
        'mosque': 0.25,
        'bar': 0.3,
        'pub': 0.3,
        'salon': 0.3,
        'park': 0.35,
        'cemetery': 0.1,
        'industrial': 0.4,
    },
    
    # =========================================================================
    # CLOTHING / FASHION
    # Target: Fashion-conscious, all ages, families, young adults
    # Peak: Weekends, festivals, season changes
    # =========================================================================
    'clothing': {
        # HIGH RELEVANCE
        'mall': 1.0,            # Fashion destination
        'shopping': 1.0,
        'residential': 0.9,     # Local shoppers
        'apartment': 0.9,
        'boutique': 0.95,       # Fashion district
        'salon': 0.85,          # Style-conscious overlap
        'spa': 0.8,
        
        # MODERATE-HIGH RELEVANCE
        'office': 0.75,         # Professional attire
        'corporate': 0.75,
        'college': 0.8,         # Fashion-forward youth
        'university': 0.8,
        'metro': 0.7,           # High foot traffic
        'metro_station': 0.7,
        'bus_stop': 0.65,
        'bus': 0.65,
        'cinema': 0.65,         # Social outings
        'restaurant': 0.6,
        'cafe': 0.55,
        'hotel': 0.65,          # Tourist shopping
        
        # MODERATE RELEVANCE
        'gym': 0.5,             # Athleisure wear
        'park': 0.5,
        'temple': 0.5,          # Festival/occasion wear
        'church': 0.5,
        'mosque': 0.5,
        'school': 0.5,          # School uniforms, kids wear
        'bank': 0.5,
        
        # LOW RELEVANCE
        'hospital': 0.3,
        'clinic': 0.3,
        'pharmacy': 0.25,
        'bar': 0.4,
        'pub': 0.4,
        'library': 0.35,
        'industrial': 0.2,
        'warehouse': 0.25,
        'cemetery': 0.1,
    },
    
    # =========================================================================
    # BOOKSTORE / STATIONERY
    # Target: Students, academics, parents, book lovers
    # Peak: Back-to-school, exam seasons, weekends
    # =========================================================================
    'bookstore': {
        # HIGH RELEVANCE
        'school': 1.0,          # Students, parents
        'college': 1.0,         # Academic books, stationery
        'university': 1.0,
        'library': 0.95,        # Book lovers, researchers
        'coworking': 0.85,      # Professional development
        'coaching': 0.9,        # Exam prep materials
        'tuition': 0.9,
        
        # MODERATE-HIGH RELEVANCE
        'office': 0.7,          # Office supplies, professional books
        'corporate': 0.7,
        'residential': 0.75,    # Family reading, kids books
        'apartment': 0.75,
        'cafe': 0.7,            # Reading + coffee culture
        'museum': 0.65,         # Cultural/intellectual crowd
        'art_gallery': 0.6,
        
        # MODERATE RELEVANCE
        'mall': 0.55,           # Bookstore chains in malls
        'shopping': 0.55,
        'metro': 0.5,           # Commuter reading
        'metro_station': 0.5,
        'bus_stop': 0.45,
        'bus': 0.45,
        'railway': 0.5,
        'railway_station': 0.5,
        'temple': 0.45,         # Religious texts
        'church': 0.45,
        'mosque': 0.45,
        'park': 0.5,
        
        # LOW RELEVANCE
        'bar': 0.15,            # Different demographic
        'pub': 0.15,
        'nightclub': 0.1,
        'gym': 0.25,
        'salon': 0.3,
        'hospital': 0.35,
        'cinema': 0.4,
        'industrial': 0.2,
        'cemetery': 0.1,
    },
    
    # =========================================================================
    # OTHER (Custom/Generic Business)
    # Target: Broad demographic, balanced scoring
    # =========================================================================
    'other': {
        # Balanced moderate-high for commercial areas
        'mall': 0.8,
        'shopping': 0.8,
        'residential': 0.8,
        'apartment': 0.8,
        'office': 0.75,
        'corporate': 0.75,
        'metro': 0.7,
        'metro_station': 0.7,
        'bus_stop': 0.65,
        'bus': 0.65,
        'railway': 0.65,
        'railway_station': 0.65,
        
        # Moderate for mixed-use
        'college': 0.6,
        'university': 0.6,
        'school': 0.5,
        'hospital': 0.5,
        'clinic': 0.5,
        'bank': 0.6,
        'park': 0.5,
        'temple': 0.45,
        'church': 0.45,
        'mosque': 0.45,
        'hotel': 0.6,
        'restaurant': 0.55,
        'cafe': 0.55,
        'gym': 0.5,
        'salon': 0.5,
        'pharmacy': 0.5,
        'cinema': 0.55,
        'library': 0.5,
        
        # Lower for specialized
        'bar': 0.4,
        'pub': 0.4,
        'nightclub': 0.35,
        'industrial': 0.35,
        'warehouse': 0.3,
        'cemetery': 0.2,
    },
}

# Default relevance score for unknown landmark types
DEFAULT_RELEVANCE = 0.5

# Category normalization map (handles variations in category names)
CATEGORY_NORMALIZATION = {
    # Transport
    'metro station': 'metro_station',
    'metro': 'metro',
    'subway': 'metro',
    'underground': 'metro',
    'bus stop': 'bus_stop',
    'bus station': 'bus_stop',
    'bus': 'bus',
    'railway station': 'railway_station',
    'train station': 'railway_station',
    'railway': 'railway',
    'train': 'railway',
    
    # Education
    'school': 'school',
    'primary school': 'school',
    'high school': 'school',
    'college': 'college',
    'university': 'university',
    'institute': 'college',
    'coaching': 'coaching',
    'tuition': 'tuition',
    'library': 'library',
    
    # Healthcare
    'hospital': 'hospital',
    'clinic': 'clinic',
    'medical': 'clinic',
    'doctor': 'doctor',
    'dental': 'dental',
    'pharmacy': 'pharmacy',
    'chemist': 'pharmacy',
    
    # Commercial
    'office': 'office',
    'corporate': 'corporate',
    'coworking': 'coworking',
    'bank': 'bank',
    'atm': 'atm',
    'mall': 'mall',
    'shopping': 'shopping',
    'market': 'market',
    'supermarket': 'supermarket',
    
    # Residential
    'residential': 'residential',
    'apartment': 'apartment',
    'housing': 'residential',
    
    # Religious
    'temple': 'temple',
    'church': 'church',
    'mosque': 'mosque',
    'gurudwara': 'temple',
    'synagogue': 'temple',
    
    # Entertainment
    'cinema': 'cinema',
    'movie': 'cinema',
    'theatre': 'theatre',
    'theater': 'theatre',
    'park': 'park',
    'garden': 'park',
    'playground': 'park',
    'museum': 'museum',
    'art gallery': 'art_gallery',
    
    # Food & Beverage
    'restaurant': 'restaurant',
    'cafe': 'cafe',
    'coffee': 'cafe',
    'bar': 'bar',
    'pub': 'pub',
    'nightclub': 'nightclub',
    
    # Services
    'salon': 'salon',
    'spa': 'spa',
    'gym': 'gym',
    'fitness': 'gym',
    'hotel': 'hotel',
    
    # Industrial
    'industrial': 'industrial',
    'factory': 'industrial',
    'warehouse': 'warehouse',
    
    # Default
    'nearby': 'default',
    'other': 'default',
}


def normalize_category(category: str) -> str:
    """
    Normalize a landmark category to match the relevance matrix keys.
    
    Args:
        category: Raw category string from landmark data
        
    Returns:
        Normalized category key
    """
    if not category:
        return 'default'
    
    # Convert to lowercase and strip whitespace
    normalized = category.lower().strip().replace('_', ' ')
    
    # Check exact match first
    if normalized in CATEGORY_NORMALIZATION:
        return CATEGORY_NORMALIZATION[normalized]
    
    # Check if any key is contained in the category
    for key, value in CATEGORY_NORMALIZATION.items():
        if key in normalized or normalized in key:
            return value
    
    # Return as-is (with underscores) if no match found
    return normalized.replace(' ', '_')


def get_relevance_score(business_type: str, landmark_category: str) -> float:
    """
    Get the relevance score for a landmark category given a business type.
    
    Args:
        business_type: The selected business type (cafe, restaurant, etc.)
        landmark_category: The category of the landmark
        
    Returns:
        Relevance score between 0.1 and 1.0
    """
    # Normalize inputs
    business_type = business_type.lower().strip() if business_type else 'other'
    normalized_category = normalize_category(landmark_category)
    
    # Get the relevance matrix for this business type
    business_matrix = RELEVANCE_MATRIX.get(business_type, RELEVANCE_MATRIX['other'])
    
    # Get the relevance score
    score = business_matrix.get(normalized_category, DEFAULT_RELEVANCE)
    
    return score


def get_marker_style(business_type: str, landmark_category: str) -> dict:
    """
    Calculate marker style based on relevance score.
    
    Args:
        business_type: The selected business type
        landmark_category: The category of the landmark
        
    Returns:
        Dict with opacity, scale, and zIndex values
    """
    relevance = get_relevance_score(business_type, landmark_category)
    
    # Calculate style parameters
    # Opacity: Linear mapping from relevance (0.1 -> 0.3, 1.0 -> 1.0)
    opacity = 0.3 + (relevance * 0.7)
    
    # Scale: Higher relevance = larger markers (0.6 to 1.2)
    scale = 0.6 + (relevance * 0.6)
    
    # Z-Index: Higher relevance = higher z-index (100 to 1000)
    z_index = int(100 + (relevance * 900))
    
    return {
        'relevance': relevance,
        'opacity': round(opacity, 2),
        'scale': round(scale, 2),
        'zIndex': z_index,
        'isHighRelevance': relevance >= 0.7,
        'isMediumRelevance': 0.4 <= relevance < 0.7,
        'isLowRelevance': relevance < 0.4,
    }


def enrich_landmarks_with_relevance(landmarks: list, business_type: str) -> list:
    """
    Add relevance data to a list of landmarks.
    
    Args:
        landmarks: List of landmark dictionaries
        business_type: The selected business type
        
    Returns:
        Enriched landmarks with relevance styling data
    """
    enriched = []
    for landmark in landmarks:
        category = landmark.get('category', landmark.get('type', 'default'))
        style = get_marker_style(business_type, category)
        
        enriched_landmark = {
            **landmark,
            'relevance_style': style
        }
        enriched.append(enriched_landmark)
    
    # Sort by relevance (high relevance first for proper rendering order)
    enriched.sort(key=lambda x: x['relevance_style']['relevance'], reverse=True)
    
    return enriched
