"""
Hotspot IQ - Configuration Module
Loads environment variables and validates API keys on startup.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Application configuration class."""
    
    # Flask Settings
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    FLASK_PORT = 5001 # Hardcoded to enforce 5001 as requested
    
    # API Keys
    LATLONG_API_KEY = os.getenv('LATLONG_API_KEY', '')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    HUGGINGFACE_API_KEY = os.getenv('HUGGINGFACE_API_KEY', '')
    HUGGINGFACE_MODEL = os.getenv('HUGGINGFACE_MODEL', 'meta-llama/Meta-Llama-3-8B-Instruct')
    
    # LatLong API Configurationgs
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    
    # LatLong.ai API Base URL (API Hub)
    LATLONG_BASE_URL = 'https://apihub.latlong.ai'
    
    # Default location (Bangalore)
    DEFAULT_LAT = 12.9716
    DEFAULT_LNG = 77.5946
    DEFAULT_RADIUS = 1000  # meters
    
    @classmethod
    def validate(cls):
        """Validate that required API keys are present."""
        errors = []
        
        if not cls.LATLONG_API_KEY or cls.LATLONG_API_KEY == 'your_latlong_api_key_here':
            errors.append('LATLONG_API_KEY is not configured')
        
        if not cls.OPENAI_API_KEY or cls.OPENAI_API_KEY == 'your_openai_api_key_here':
            errors.append('OPENAI_API_KEY is not configured (optional for Phase 1)')
        
        if errors:
            print("⚠️  Configuration Warnings:")
            for error in errors:
                print(f"   - {error}")
            print("   Some features may not work without valid API keys.\n")
        else:
            print("✅ All API keys configured successfully!\n")
        
        return len(errors) == 0


# Business Type to Competitor POI Category Mapping
COMPETITOR_MAPPING = {
    'cafe': ['cafe', 'coffee_shop', 'bakery', 'tea_house'],
    'restaurant': ['restaurant', 'fast_food', 'food_court', 'dhaba'],
    'retail': ['supermarket', 'convenience_store', 'grocery', 'retail'],
    'gym': ['gym', 'fitness_center', 'yoga_studio', 'sports_club'],
    'pharmacy': ['pharmacy', 'medical_store', 'clinic'],
    'salon': ['salon', 'spa', 'beauty_parlor', 'barbershop'],
    'electronics': ['electronics_store', 'mobile_shop', 'computer_store'],
    'clothing': ['clothing_store', 'boutique', 'fashion_store'],
    'bookstore': ['bookstore', 'stationery_shop', 'library'],
    'other': []
}

# Proximity Filter to POI Category Mapping
FILTER_POI_MAPPING = {
    'near_metro': 'metro_station',
    'near_bus': 'bus_stop',
    'near_school': 'school',
    'near_college': 'college',
    'near_hospital': 'hospital',
    'near_mall': 'mall',
    'near_office': 'office',
    'near_residential': 'residential',
    'near_temple': 'temple',
    'near_park': 'park',
    'near_atm': 'atm',
    'near_bar': 'bar'
}

# Landmark weights for score calculation
LANDMARK_WEIGHTS = {
    'metro_station': 15,
    'bus_stop': 5,
    'school': 10,
    'college': 12,
    'hospital': 8,
    'mall': 15,
    'office': 12,
    'residential': 8,
    'temple': 6,
    'park': 5,
    'atm': 4,
    'bar': 7
}
