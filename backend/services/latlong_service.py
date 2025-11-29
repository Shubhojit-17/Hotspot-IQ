"""
Hotspot IQ - LatLong.ai Service Wrapper
Handles all interactions with the LatLong.ai API.

API Documentation: https://apihub.latlong.ai/Documentation

Response Format (all endpoints):
{
  "code": 1001,
  "status": "success",
  "data": [...] or {...}
}
"""

import requests
from typing import List, Dict, Any, Optional
from config import Config, COMPETITOR_MAPPING, FILTER_POI_MAPPING


class LatLongService:
    """Service wrapper for LatLong.ai API."""
    
    def __init__(self):
        self.api_key = Config.LATLONG_API_KEY
        self.base_url = Config.LATLONG_BASE_URL
        # LatLong API uses X-Authorization-Token header
        self.headers = {
            'X-Authorization-Token': self.api_key,
            'Content-Type': 'application/json'
        }
    
    def _make_request(self, method: str, endpoint: str, params: Dict = None, json_data: Dict = None) -> Dict:
        """Make HTTP request to LatLong API."""
        # Endpoints use .json suffix
        url = f"{self.base_url}/{endpoint}.json"
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers, params=params, timeout=30)
            else:
                response = requests.post(url, headers=self.headers, json=json_data, timeout=30)
            
            response.raise_for_status()
            
            # Handle empty responses
            if not response.text or response.text.strip() == '':
                print(f"LatLong API Warning: Empty response from {endpoint}")
                return {'success': False, 'error': 'Empty response'}
            
            try:
                result = response.json()
            except ValueError as json_err:
                print(f"LatLong API JSON Error: {str(json_err)} - Response: {response.text[:200]}")
                return {'success': False, 'error': f'Invalid JSON response: {str(json_err)}'}
            
            # LatLong API wraps response in code/status/data structure
            if result.get('status') == 'success' and 'data' in result:
                return {'success': True, 'data': result['data']}
            else:
                return {'success': False, 'error': result.get('message', 'Unknown error')}
                
        except requests.exceptions.RequestException as e:
            print(f"LatLong API Error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def autocomplete(self, query: str, lat: float = None, lng: float = None, limit: int = 10) -> List[Dict]:
        """
        Get location suggestions for autocomplete.
        
        LatLong API: GET /v4/autocomplete.json
        Response: { data: [{ name: "...", geoid: 123 }] }
        
        Args:
            query: Search text entered by user
            lat: Optional latitude for location biasing
            lng: Optional longitude for location biasing
            limit: Maximum number of suggestions (default: 10, max: 20)
            
        Returns:
            List of location suggestions with geoid, name
        """
        if len(query) < 2:
            return []
        
        params = {
            'query': query,
            'limit': min(limit, 20)
        }
        
        # Add location biasing if provided
        if lat is not None and lng is not None:
            params['lat'] = lat
            params['long'] = lng
        
        result = self._make_request('GET', 'v4/autocomplete', params=params)
        
        if not result.get('success'):
            return []
        
        # Parse and format suggestions from LatLong response
        # Response format: [{ name: "Delhi, South West Delhi, Delhi", geoid: 188443 }]
        suggestions = []
        data = result.get('data', [])
        
        if isinstance(data, list):
            for item in data:
                suggestions.append({
                    'place_id': str(item.get('geoid', '')),
                    'geoid': item.get('geoid'),
                    'name': item.get('name', ''),
                    # Note: Autocomplete doesn't return lat/lng, need geocoding
                    'lat': None,
                    'lng': None
                })
        
        return suggestions
    
    def geocode(self, address: str) -> Dict:
        """
        Get coordinates from an address.
        
        LatLong API: GET /v4/geocode.json
        Response: { data: { address, latitude, longitude, accuracy } }
        
        Args:
            address: Full or partial address
            
        Returns:
            Dict with latitude, longitude, and address details
        """
        params = {
            'address': address,
            'accuracy_level': 'true'
        }
        
        result = self._make_request('GET', 'v4/geocode', params=params)
        
        if not result.get('success'):
            return {'error': 'Geocoding failed'}
        
        data = result.get('data', {})
        return {
            'address': data.get('address', address),
            'lat': float(data.get('latitude', 0)),
            'lng': float(data.get('longitude', 0)),
            'accuracy': data.get('accuracy', '')
        }
    
    def reverse_geocode(self, lat: float, lng: float) -> Dict:
        """
        Get address details from coordinates.
        
        LatLong API: GET /v4/reverse_geocode.json
        Response: { data: { address, pincode, landmark } }
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Address details including formatted address and components
        """
        params = {
            'latitude': lat,
            'longitude': lng
        }
        
        result = self._make_request('GET', 'v4/reverse_geocode', params=params)
        
        if not result.get('success'):
            return {
                'formatted_address': f'{lat}, {lng}',
                'locality': '',
                'city': '',
                'pincode': '',
                'landmark': ''
            }
        
        data = result.get('data', {})
        return {
            'formatted_address': data.get('address', f'{lat}, {lng}'),
            'locality': '',  # Not directly provided
            'city': '',  # Parse from address if needed
            'pincode': data.get('pincode', ''),
            'state': '',  # Parse from address if needed
            'landmark': data.get('landmark', '')
        }
    
    def get_poi(self, lat: float, lng: float, category: str, radius: int = 1000) -> Dict:
        """
        Get Points of Interest by category near a location.
        
        LatLong API: GET /v4/point_of_interest.json
        Response: { data: [{ category, name }] }
        
        Note: POI API returns category/name but not coordinates.
        For coordinates, use the Landmark API.
        
        Args:
            lat: Latitude
            lng: Longitude  
            category: POI category (e.g., hospital, school, hotel, Pin Code, etc.)
            radius: Search radius in meters (not directly supported, for reference)
            
        Returns:
            Dict with count and list of nearby POIs
        """
        params = {
            'latitude': lat,
            'longitude': lng,
            'category': category
        }
        
        result = self._make_request('GET', 'v4/point_of_interest', params=params)
        
        if not result.get('success'):
            return {'count': 0, 'pois': []}
        
        data = result.get('data', [])
        pois = []
        
        if isinstance(data, list):
            for poi in data:
                pois.append({
                    'name': poi.get('name', 'Unknown'),
                    'category': poi.get('category', category),
                    # POI API doesn't return coordinates
                    'lat': lat,  # Use center point as approximation
                    'lng': lng,
                    'distance': 0
                })
        
        return {
            'count': len(pois),
            'pois': pois
        }
    
    def get_landmarks(self, lat: float, lng: float) -> List[Dict]:
        """
        Get nearby landmarks with coordinates.
        
        LatLong API: GET /v4/landmarks.json
        Response: { data: [{ name, geo, latitude, longitude }] }
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            List of landmarks with name, coordinates
        """
        params = {
            'lat': lat,
            'lon': lng
        }
        
        result = self._make_request('GET', 'v4/landmarks', params=params)
        
        if not result.get('success'):
            return []
        
        data = result.get('data', [])
        landmarks = []
        
        if isinstance(data, list):
            for item in data:
                landmarks.append({
                    'name': item.get('name', 'Unknown'),
                    'geo': item.get('geo', ''),
                    'lat': float(item.get('latitude', lat)),
                    'lng': float(item.get('longitude', lng)),
                    'category': 'landmark'  # Default category
                })
        
        return landmarks
    
    def get_competitors(self, lat: float, lng: float, business_type: str, radius: int = 1000) -> Dict:
        """
        Get competitor businesses based on business type.
        Uses both POI and Landmarks API to find nearby competitors.
        
        Args:
            lat: Latitude
            lng: Longitude
            business_type: Type of business (cafe, gym, etc.)
            radius: Search radius in meters
            
        Returns:
            Dict with total count and list of competitors
        """
        categories = COMPETITOR_MAPPING.get(business_type, [])
        
        if not categories:
            return {'count': 0, 'nearby': []}
        
        all_competitors = []
        
        # Get landmarks first (they have coordinates)
        landmarks = self.get_landmarks(lat, lng)
        
        # Add landmarks that might be competitors
        for landmark in landmarks:
            name_lower = landmark.get('name', '').lower()
            # Check if landmark matches any competitor category
            for category in categories:
                if category.lower() in name_lower:
                    all_competitors.append({
                        'name': landmark.get('name'),
                        'lat': landmark.get('lat'),
                        'lng': landmark.get('lng'),
                        'category': category,
                        'distance': self._calculate_distance(lat, lng, landmark.get('lat'), landmark.get('lng'))
                    })
                    break
        
        # Also try POI API for each category
        for category in categories:
            result = self.get_poi(lat, lng, category, radius)
            for poi in result.get('pois', []):
                # Check for duplicates
                if not any(c['name'] == poi['name'] for c in all_competitors):
                    all_competitors.append(poi)
        
        return {
            'count': len(all_competitors),
            'nearby': all_competitors
        }
    
    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> int:
        """Calculate approximate distance in meters between two points."""
        import math
        
        if lat2 is None or lng2 is None:
            return 0
            
        R = 6371000  # Earth's radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lng2 - lng1)
        
        a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return int(R * c)
    
    def get_landmarks_by_filters(self, lat: float, lng: float, filters: List[str], radius: int = 1000) -> Dict:
        """
        Get landmarks based on proximity filters.
        Combines Landmarks API with POI API for comprehensive results.
        
        Args:
            lat: Latitude
            lng: Longitude
            filters: List of filter keys (near_metro, near_school, etc.)
            radius: Search radius in meters
            
        Returns:
            Dict with landmark counts by category
        """
        landmarks_by_category = {}
        all_pois = []
        
        # First, get nearby landmarks with coordinates
        nearby_landmarks = self.get_landmarks(lat, lng)
        
        for filter_key in filters:
            category = FILTER_POI_MAPPING.get(filter_key)
            if category:
                category_pois = []
                
                # Check if any landmarks match this category
                for landmark in nearby_landmarks:
                    name_lower = landmark.get('name', '').lower()
                    if category.lower() in name_lower:
                        landmark_with_cat = {**landmark, 'category': category}
                        category_pois.append(landmark_with_cat)
                
                # Also try POI API
                poi_result = self.get_poi(lat, lng, category, radius)
                for poi in poi_result.get('pois', []):
                    if not any(p['name'] == poi['name'] for p in category_pois):
                        category_pois.append(poi)
                
                landmarks_by_category[category] = {
                    'count': len(category_pois),
                    'pois': category_pois
                }
                all_pois.extend(category_pois)
        
        return {
            'by_category': landmarks_by_category,
            'total_count': len(all_pois),
            'all_pois': all_pois
        }
    
    def get_isochrone(self, lat: float, lng: float, distance_km: float = 1.0) -> Dict:
        """
        Get isochrone polygon for reachability visualization.
        
        LatLong API: GET /v4/isochrone.json
        Response: { data: { geom: { type: "Feature", geometry: { coordinates, type: "Polygon" } } } }
        
        Args:
            lat: Latitude
            lng: Longitude
            distance_km: Distance in kilometers (default: 1.0)
            
        Returns:
            GeoJSON Feature with polygon geometry
        """
        params = {
            'latitude': lat,
            'longitude': lng,
            'distance_limit': distance_km
        }
        
        result = self._make_request('GET', 'v4/isochrone', params=params)
        
        if not result.get('success'):
            # Return a simple circular fallback
            return self._generate_fallback_isochrone(lat, lng, distance_km)
        
        data = result.get('data', {})
        geom = data.get('geom', {})
        
        # LatLong returns { geom: { type: "Feature", geometry: {...} } }
        if geom.get('type') == 'Feature':
            return {
                'type': 'Feature',
                'properties': {
                    'distance_km': distance_km,
                    'center': [lat, lng]
                },
                'geometry': geom.get('geometry', {
                    'type': 'Polygon',
                    'coordinates': []
                })
            }
        
        return self._generate_fallback_isochrone(lat, lng, distance_km)
    
    def _generate_fallback_isochrone(self, lat: float, lng: float, distance_km: float) -> Dict:
        """Generate a simple circular isochrone as fallback."""
        import math
        
        radius_km = distance_km
        
        # Generate circle points
        points = []
        for i in range(36):
            angle = math.radians(i * 10)
            dlat = (radius_km / 111) * math.cos(angle)
            dlng = (radius_km / (111 * math.cos(math.radians(lat)))) * math.sin(angle)
            points.append([lng + dlng, lat + dlat])
        points.append(points[0])  # Close the polygon
        
        return {
            'type': 'Feature',
            'properties': {
                'distance_km': distance_km,
                'is_fallback': True
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': [points]
            }
        }
    
    def get_digipin(self, lat: float, lng: float) -> Dict:
        """
        Get Digipin (Digital Address Code) for a location.
        
        Note: DIGIPIN API may not be available. We generate a placeholder
        based on coordinates that resembles India Post's DIGIPIN format.
        
        Args:
            lat: Latitude
            lng: Longitude
            
        Returns:
            Dict with digipin code and formatted address
        """
        # Generate a pseudo-DIGIPIN based on coordinates
        # Real DIGIPIN would come from India Post service
        # Format: XX-YYYY where XX is state code approximation, YYYY is area code
        
        # Approximate state from coordinates
        state_codes = {
            'KA': (12.0, 15.5, 74.0, 78.5),  # Karnataka
            'MH': (15.5, 22.0, 72.0, 80.5),  # Maharashtra  
            'TN': (8.0, 13.5, 76.0, 80.5),   # Tamil Nadu
            'DL': (28.0, 29.0, 76.5, 77.5),  # Delhi
            'UP': (23.5, 30.5, 77.0, 84.5),  # Uttar Pradesh
            'WB': (21.5, 27.5, 85.5, 89.5),  # West Bengal
            'BR': (24.0, 27.5, 83.0, 88.5),  # Bihar
            'GJ': (20.0, 24.5, 68.0, 74.5),  # Gujarat
            'RJ': (23.0, 30.0, 69.5, 78.0),  # Rajasthan
            'KL': (8.0, 12.8, 74.5, 77.5),   # Kerala
        }
        
        state_code = 'XX'
        for code, (lat_min, lat_max, lng_min, lng_max) in state_codes.items():
            if lat_min <= lat <= lat_max and lng_min <= lng <= lng_max:
                state_code = code
                break
        
        # Generate area code from coordinates
        area_code = abs(hash((round(lat, 4), round(lng, 4)))) % 10000
        
        return {
            'digipin': f'{state_code}-{area_code:04d}',
            'formatted_address': f'{lat:.6f}, {lng:.6f}'
        }
    
    def distance_matrix(self, origins: List[Dict], destinations: List[Dict]) -> Dict:
        """
        Calculate distance and drive time between locations.
        
        Args:
            origins: List of {lat, lng} dicts
            destinations: List of {lat, lng} dicts
            
        Returns:
            Matrix of distances and durations
        """
        json_data = {
            'origins': origins,
            'destinations': destinations,
            'mode': 'car'
        }
        
        result = self._make_request('POST', 'distance-matrix', json_data=json_data)
        
        if 'error' in result:
            return {'rows': []}
        
        return result


# Create singleton instance
latlong_service = LatLongService()
