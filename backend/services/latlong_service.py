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
    
    # Major areas database for Indian cities
    MAJOR_AREAS = {
        'bengaluru': [
            'Indiranagar', 'Koramangala', 'Whitefield', 'Electronic City', 'Jayanagar',
            'Malleshwaram', 'HSR Layout', 'BTM Layout', 'Marathahalli', 'Banashankari',
            'Rajajinagar', 'Basavanagudi', 'JP Nagar', 'Hebbal', 'Yelahanka',
            'Sadashivanagar', 'Bannerghatta Road', 'Sarjapur Road', 'MG Road', 
            'Brigade Road', 'Commercial Street', 'Cunningham Road', 'Lavelle Road',
            'Residency Road', 'Richmond Road', 'Vittal Mallya Road', 'Kasturba Road',
            'Shivajinagar', 'Majestic', 'KR Market', 'Chickpet', 'Avenue Road',
            'Frazer Town', 'Cox Town', 'Benson Town', 'RT Nagar', 'Sanjaynagar',
            'Vijayanagar', 'Nagarbhavi', 'Basaveshwaranagar', 'Yeshwanthpur',
            'Peenya', 'Tumkur Road', 'Mysore Road', 'Kanakapura Road', 'Hosur Road',
            'Old Airport Road', 'Outer Ring Road', 'Bellary Road', 'Hennur',
            'Kalyan Nagar', 'Kammanahalli', 'HRBR Layout', 'Ramamurthy Nagar',
            'KR Puram', 'Mahadevapura', 'Bellandur', 'Varthur', 'Brookefield',
            'ITPL', 'Domlur', 'HAL', 'Old Madras Road', 'CV Raman Nagar',
            'Ulsoor', 'MG Road', 'Trinity', 'Ashok Nagar', 'Wilson Garden',
        ],
        'bangalore': [  # Alias
            'Indiranagar', 'Koramangala', 'Whitefield', 'Electronic City', 'Jayanagar',
            'Malleshwaram', 'HSR Layout', 'BTM Layout', 'Marathahalli', 'Banashankari',
            'Rajajinagar', 'Basavanagudi', 'JP Nagar', 'Hebbal', 'Yelahanka',
        ],
        'mumbai': [
            'Bandra', 'Andheri', 'Juhu', 'Powai', 'Lower Parel', 'Worli', 'Dadar',
            'Colaba', 'Marine Drive', 'Nariman Point', 'Fort', 'Churchgate',
            'Santacruz', 'Khar', 'Malad', 'Goregaon', 'Kandivali', 'Borivali',
            'Thane', 'Navi Mumbai', 'Vashi', 'Kharghar', 'Panvel', 'Airoli',
            'BKC', 'Kurla', 'Ghatkopar', 'Mulund', 'Vikhroli', 'Chembur',
            'Matunga', 'Sion', 'Wadala', 'Parel', 'Lalbaug', 'Prabhadevi',
            'Mahim', 'Dharavi', 'Versova', 'Lokhandwala', 'Oshiwara', 'DN Nagar',
        ],
        'delhi': [
            'Connaught Place', 'Karol Bagh', 'Chandni Chowk', 'Saket', 'Hauz Khas',
            'Greater Kailash', 'Lajpat Nagar', 'Defence Colony', 'South Extension',
            'Vasant Kunj', 'Vasant Vihar', 'Dwarka', 'Janakpuri', 'Rajouri Garden',
            'Punjabi Bagh', 'Pitampura', 'Rohini', 'Model Town', 'Civil Lines',
            'Nehru Place', 'Okhla', 'Sarita Vihar', 'Jasola', 'Kalkaji',
            'Green Park', 'Safdarjung', 'Jor Bagh', 'Khan Market', 'Lodhi Colony',
            'Mayur Vihar', 'Preet Vihar', 'Laxmi Nagar', 'Vivek Vihar',
            'Paharganj', 'Daryaganj', 'ITO', 'Mandi House', 'Rajiv Chowk',
        ],
        'hyderabad': [
            'Banjara Hills', 'Jubilee Hills', 'Hitech City', 'Gachibowli', 'Madhapur',
            'Kondapur', 'Kukatpally', 'Miyapur', 'Secunderabad', 'Ameerpet',
            'Begumpet', 'Somajiguda', 'Punjagutta', 'Abids', 'Nampally',
            'Charminar', 'Koti', 'Dilsukhnagar', 'LB Nagar', 'Uppal',
            'Manikonda', 'Tolichowki', 'Mehdipatnam', 'Attapur', 'Rajendranagar',
            'Film Nagar', 'Yousufguda', 'SR Nagar', 'Sanath Nagar', 'Erragadda',
        ],
        'chennai': [
            'T Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'OMR', 'ECR',
            'Nungambakkam', 'Kodambakkam', 'Mylapore', 'Alwarpet', 'RA Puram',
            'Besant Nagar', 'Thiruvanmiyur', 'Sholinganallur', 'Porur', 'Vadapalani',
            'Ashok Nagar', 'KK Nagar', 'West Mambalam', 'Saidapet', 'Guindy',
            'Mount Road', 'Egmore', 'Kilpauk', 'Chetpet', 'Royapettah',
            'Teynampet', 'Thousand Lights', 'Triplicane', 'Marina Beach', 'George Town',
        ],
        'pune': [
            'Koregaon Park', 'Kalyani Nagar', 'Viman Nagar', 'Kharadi', 'Magarpatta',
            'Hadapsar', 'Wakad', 'Hinjewadi', 'Baner', 'Aundh', 'Pashan',
            'Shivajinagar', 'FC Road', 'JM Road', 'MG Road', 'Camp', 'Deccan',
            'Kothrud', 'Karve Nagar', 'Warje', 'Sinhagad Road', 'Bibwewadi',
            'Katraj', 'Kondhwa', 'NIBM', 'Undri', 'Mohammadwadi', 'Wanowrie',
        ],
        'kolkata': [
            'Park Street', 'Salt Lake', 'New Town', 'Rajarhat', 'EM Bypass',
            'Ballygunge', 'Alipore', 'Behala', 'Tollygunge', 'Jadavpur',
            'Gariahat', 'Rashbehari', 'Dharmatala', 'Esplanade', 'BBD Bagh',
            'Howrah', 'Sealdah', 'College Street', 'Shyambazar', 'Hatibagan',
            'Dumdum', 'Barasat', 'Barrackpore', 'Garia', 'Narendrapur',
        ],
        'ahmedabad': [
            'CG Road', 'SG Highway', 'Ashram Road', 'Navrangpura', 'Vastrapur',
            'Bodakdev', 'Satellite', 'Prahlad Nagar', 'Thaltej', 'Gurukul',
            'Paldi', 'Ellis Bridge', 'Law Garden', 'Mithakhali', 'Stadium',
            'Maninagar', 'Ghatlodia', 'Chandkheda', 'Motera', 'Sabarmati',
        ],
    }
    
    def autocomplete(self, query: str, lat: float = None, lng: float = None, limit: int = 10) -> List[Dict]:
        """
        Get location suggestions for autocomplete - prioritizes major areas.
        
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
        
        query_lower = query.lower().strip()
        suggestions = []
        seen_areas = set()  # Track seen area names to avoid duplicates
        
        # First, check if query matches any major areas from our curated list
        for city, areas in self.MAJOR_AREAS.items():
            # Skip alias entries (like 'bangalore' which duplicates 'bengaluru')
            if city == 'bangalore':
                continue
                
            for area in areas:
                area_lower = area.lower()
                if area_lower.startswith(query_lower) or query_lower in area_lower:
                    # Determine city name for display
                    city_display = city.title()
                    if city == 'bengaluru':
                        city_display = 'Bengaluru'
                    
                    # Create unique key to avoid duplicates
                    area_key = f"{area_lower}_{city}"
                    if area_key in seen_areas:
                        continue
                    seen_areas.add(area_key)
                    
                    suggestions.append({
                        'place_id': f"major_{city}_{area.replace(' ', '_').lower()}",
                        'geoid': None,
                        'name': f"{area}, {city_display}",
                        'is_area': True,
                        'is_major': True,
                        'lat': None,
                        'lng': None
                    })
        
        # Sort by relevance (exact prefix match first)
        suggestions.sort(key=lambda x: (
            0 if x['name'].lower().startswith(query_lower) else 1,
            len(x['name'])
        ))
        
        # Limit major area suggestions
        suggestions = suggestions[:limit]
        
        # If we have enough major area matches, return them
        if len(suggestions) >= 5:
            return suggestions[:limit]
        
        # Otherwise, also fetch from API to supplement
        params = {
            'query': query,
            'limit': min(limit, 20)
        }
        
        if lat is not None and lng is not None:
            params['lat'] = lat
            params['long'] = lng
        
        result = self._make_request('GET', 'v4/autocomplete', params=params)
        
        if result.get('success'):
            data = result.get('data', [])
            
            # Keywords that indicate POI/store rather than area
            POI_KEYWORDS = [
                'station', 'stop', 'shop', 'store', 'hotel', 'restaurant', 'cafe', 
                'hospital', 'clinic', 'school', 'college', 'temple', 'church', 'mosque',
                'mall', 'market', 'bank', 'atm', 'petrol', 'pump', 'bunk', 'park',
                'playground', 'water tank', 'office', 'building', 'tower', 'complex',
                'apartment', 'residency', 'villa', 'gym', 'fitness', 'salon', 'spa',
                'cinema', 'theater', 'theatre', 'pub', 'bar', 'lounge', 'club',
                'satellite town', 'layout', 'phase', 'block', 'sector',
            ]
            
            # Get existing names to avoid duplicates
            existing_names = {s['name'].lower() for s in suggestions}
            
            if isinstance(data, list):
                for item in data:
                    name = item.get('name', '')
                    name_lower = name.lower()
                    
                    # Skip if duplicate
                    if any(name_lower.startswith(existing.split(',')[0]) for existing in existing_names):
                        continue
                    
                    # Skip POIs
                    if any(kw in name_lower for kw in POI_KEYWORDS):
                        continue
                    
                    # Check if this looks like a major area (first part is clean)
                    parts = name.split(',')
                    first_part = parts[0].strip()
                    
                    # Skip if first part has too many words (likely a specific place)
                    if len(first_part.split()) > 3:
                        continue
                    
                    suggestions.append({
                        'place_id': str(item.get('geoid', '')),
                        'geoid': item.get('geoid'),
                        'name': name,
                        'is_area': True,
                        'is_major': False,
                        'lat': None,
                        'lng': None
                    })
                    
                    if len(suggestions) >= limit:
                        break
        
        return suggestions[:limit]
    
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
            Address details including formatted address, area_name, and components
        """
        params = {
            'latitude': lat,
            'longitude': lng
        }
        
        result = self._make_request('GET', 'v4/reverse_geocode', params=params)
        
        if not result.get('success'):
            return {
                'formatted_address': f'{lat}, {lng}',
                'area_name': f'{lat:.4f}, {lng:.4f}',
                'locality': '',
                'city': '',
                'pincode': '',
                'landmark': ''
            }
        
        data = result.get('data', {})
        full_address = data.get('address', f'{lat}, {lng}')
        
        # Extract area name from the address
        # Typical format: "Door No, Street, Area, City, State, Pincode"
        area_name = self._extract_area_name(full_address)
        
        return {
            'formatted_address': full_address,
            'area_name': area_name,
            'locality': '',  # Not directly provided
            'city': '',  # Parse from address if needed
            'pincode': data.get('pincode', ''),
            'state': '',  # Parse from address if needed
            'landmark': data.get('landmark', '')
        }
    
    def _is_valid_locality_name(self, name: str) -> bool:
        """
        Check if a name looks like a valid locality/area name (not a road, landmark, or POI).
        
        Args:
            name: The name to check
            
        Returns:
            True if it looks like a valid locality name
        """
        if not name or len(name) < 3:
            return False
        
        name_lower = name.lower()
        
        # Skip names that look like roads/streets
        road_keywords = ['road', 'street', 'main', 'cross', 'lane', 'highway', 'hwy', 
                        'marg', 'path', 'avenue', 'ave', 'drive', 'way',
                        '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th']
        if any(kw in name_lower for kw in road_keywords):
            return False
        
        # Skip names that look like POIs/landmarks (start with "Near")
        if name_lower.startswith('near '):
            return False
        
        # Skip names with technical codes (like H207, SV-3B, etc.)
        if any(c.isdigit() for c in name[:3]):  # Starts with digits/codes
            return False
        
        # Skip very short names that are likely codes
        if len(name) < 4 and any(c.isdigit() for c in name):
            return False
        
        # Skip pipeline, industrial terms
        industrial_keywords = ['pipeline', 'gail', 'ongc', 'ntpc', 'industrial', 'factory']
        if any(kw in name_lower for kw in industrial_keywords):
            return False
        
        return True
    
    def _get_nominatim_area(self, lat: float, lng: float, zoom: int = 14) -> Dict:
        """
        Get area/locality name using Nominatim (OpenStreetMap) reverse geocoding.
        
        Nominatim zoom levels for India:
        - zoom=10: city (Bengaluru)
        - zoom=13: suburb/village (Vidyaranyapura)
        - zoom=14: neighbourhood (more specific)
        
        Args:
            lat: Latitude
            lng: Longitude
            zoom: Zoom level (10=city, 13=suburb, 14=neighbourhood)
            
        Returns:
            Dict with structured address components from OSM
        """
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                'lat': lat,
                'lon': lng,
                'format': 'jsonv2',
                'addressdetails': 1,
                'zoom': zoom,
                'accept-language': 'en'
            }
            headers = {
                'User-Agent': 'HotspotIQ/1.0 (contact@hotspotiq.com)'  # Required by Nominatim
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            address = data.get('address', {})
            
            # Priority order for area name in Indian context:
            # suburb > neighbourhood > city_district > county > city > town > village
            area_name = (
                address.get('suburb') or  # e.g., "Vidyaranyapura"
                address.get('neighbourhood') or  # e.g., "Sahakara Nagar"
                address.get('city_district') or  # e.g., "Bengaluru North"
                address.get('village') or
                address.get('town') or
                address.get('hamlet') or
                ''
            )
            
            city = (
                address.get('city') or 
                address.get('state_district') or  # e.g., "Bengaluru Urban"
                address.get('county') or
                ''
            )
            
            state = address.get('state', '')
            
            return {
                'area_name': area_name,
                'city': city,
                'state': state,
                'suburb': address.get('suburb', ''),
                'neighbourhood': address.get('neighbourhood', ''),
                'city_district': address.get('city_district', ''),
                'display_name': data.get('display_name', ''),
                'raw_address': address
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Nominatim API Error: {str(e)}")
            return {}
        except Exception as e:
            print(f"Error in Nominatim lookup: {str(e)}")
            return {}
    
    def reverse_geocode_area(self, center_lat: float, center_lng: float, radius: int) -> Dict:
        """
        Get area name for a location using Nominatim (OpenStreetMap).
        
        Uses OSM's structured address data which provides clean suburb/neighbourhood names.
        Makes a single fast API call to get the area name.
        
        Args:
            center_lat: Center latitude
            center_lng: Center longitude
            radius: Radius in meters (used for context, not for multi-sampling)
            
        Returns:
            Address details with area_name for the location
        """
        try:
            # Single Nominatim call for the center point
            # This is fast and doesn't hit rate limits
            nominatim_result = self._get_nominatim_area(center_lat, center_lng, zoom=14)
            
            if nominatim_result and nominatim_result.get('area_name'):
                suburb = nominatim_result.get('suburb', '')
                neighbourhood = nominatim_result.get('neighbourhood', '')
                city_district = nominatim_result.get('city_district', '')
                city = nominatim_result.get('city', '')
                state = nominatim_result.get('state', '')
                
                # Priority: suburb > neighbourhood > city_district
                primary_area = suburb or neighbourhood or city_district or ''
                
                # Build the display name
                if primary_area and city:
                    # Clean up city name (remove "Urban" suffix)
                    display_city = city.replace(' Urban', '').replace(' Rural', '')
                    area_name = f"{primary_area}, {display_city}"
                elif primary_area:
                    area_name = primary_area
                elif city:
                    area_name = city
                else:
                    area_name = nominatim_result.get('area_name', '')
                
                return {
                    'formatted_address': nominatim_result.get('display_name', ''),
                    'area_name': area_name,
                    'locality': primary_area,
                    'city': city,
                    'state': state,
                    'pincode': '',
                    'landmark': '',
                    'areas_in_radius': [primary_area] if primary_area else []
                }
        
        except Exception as e:
            print(f"Nominatim reverse geocode error: {e}")
        
        # Fallback to LatLong API if Nominatim fails
        print("Nominatim failed, falling back to LatLong API")
        return self.reverse_geocode(center_lat, center_lng)
    
    def _extract_area_name(self, full_address: str) -> str:
        """
        Extract the major area/locality name from a full address.
        
        Strategy:
        1. Split address by comma
        2. Skip door numbers, road/street names, building names
        3. Find the main locality/area name
        4. Optionally include city name
        
        Args:
            full_address: Full address string
            
        Returns:
            Area name suitable for display (e.g., "Vidyaranyapura, Bengaluru")
        """
        if not full_address:
            return ''
        
        parts = [p.strip() for p in full_address.split(',')]
        
        # Keywords that indicate a road/street (not the main area)
        road_keywords = ['road', 'street', 'main', 'cross', 'lane', 'avenue', 'ave', 
                        'marg', 'path', 'way', 'drive', 'highway', 'hwy', 'nagar road',
                        '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
                        '11th', '12th', '13th', '14th', '15th', 'first', 'second', 'third']
        
        # Keywords that indicate state/country (skip these)
        state_keywords = ['karnataka', 'maharashtra', 'tamil nadu', 'delhi', 'telangana', 
                         'andhra pradesh', 'kerala', 'gujarat', 'rajasthan', 'west bengal',
                         'uttar pradesh', 'madhya pradesh', 'bihar', 'punjab', 'haryana',
                         'india', 'odisha', 'orissa', 'assam', 'goa']
        
        # Keywords to skip (buildings, floors, etc.)
        skip_keywords = ['floor', 'block', 'wing', 'tower', 'flat', 'house', 'no.', 'no ', 
                        'building', 'complex', 'apartment', 'apt', 'plot', 'door', 'site']
        
        # Major city names (these come after locality)
        city_keywords = ['bengaluru', 'bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad',
                        'kolkata', 'pune', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur',
                        'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'patna',
                        'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad',
                        'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad', 'dhanbad',
                        'amritsar', 'navi mumbai', 'allahabad', 'ranchi', 'howrah', 'coimbatore',
                        'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'madurai', 'raipur',
                        'kota', 'chandigarh', 'guwahati', 'solapur', 'mysore', 'mysuru']
        
        area_name = None
        city_name = None
        
        for part in parts:
            part_lower = part.lower().strip()
            
            # Skip empty or very short parts
            if not part or len(part) < 3:
                continue
            
            # Skip parts that are just numbers (door numbers, pincodes)
            if part.replace(' ', '').replace('-', '').isdigit():
                continue
            
            # Skip 6-digit pincodes
            clean_part = part.replace(' ', '')
            if len(clean_part) == 6 and clean_part.isdigit():
                continue
            
            # Skip parts starting with numbers (door numbers like "123" or "6th")
            first_word = part.split()[0] if part.split() else ''
            if first_word.replace('-', '').replace('/', '').isdigit():
                continue
            
            # Skip building/floor keywords
            if any(kw in part_lower for kw in skip_keywords):
                continue
            
            # Skip state/country names
            if any(state in part_lower for state in state_keywords):
                continue
            
            # Check if this is a city name
            if any(city in part_lower for city in city_keywords):
                city_name = part
                continue
            
            # Skip road/street names - we want the locality, not the road
            if any(kw in part_lower for kw in road_keywords):
                continue
            
            # This should be the area/locality name
            if area_name is None:
                area_name = part
        
        # Build the result
        if area_name:
            if city_name:
                return f"{area_name}, {city_name}"
            return area_name
        
        # Fallback: if no area found, try to get something meaningful
        for part in parts:
            part_lower = part.lower().strip()
            if part and len(part) > 3:
                if not any(state in part_lower for state in state_keywords):
                    if not part.replace(' ', '').replace('-', '').isdigit():
                        return part
        
        return full_address.split(',')[0] if full_address else ''
    
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
