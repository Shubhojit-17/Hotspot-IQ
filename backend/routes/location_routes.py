"""
Hotspot IQ - Location Routes
Handles autocomplete, reverse geocoding, and digipin endpoints.
"""

from flask import Blueprint, request, jsonify
from services.latlong_service import latlong_service

location_bp = Blueprint('location', __name__)


@location_bp.route('/autocomplete', methods=['GET'])
def autocomplete():
    """
    GET /api/autocomplete?query={search_term}&lat={lat}&lng={lng}&limit={limit}
    
    Returns location suggestions for autocomplete dropdown.
    
    LatLong API returns:
    {
        "data": [
            { "name": "Delhi, South West Delhi, Delhi", "geoid": 188443 }
        ]
    }
    
    Note: Autocomplete results don't include coordinates.
    For coordinates, use the geocode endpoint with the location name.
    """
    query = request.args.get('query', '')
    limit = request.args.get('limit', 10, type=int)
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    
    if len(query) < 2:
        return jsonify({'suggestions': []})
    
    suggestions = latlong_service.autocomplete(query, lat, lng, limit)
    
    return jsonify({'suggestions': suggestions})


@location_bp.route('/geocode', methods=['GET'])
def geocode():
    """
    GET /api/geocode?address={address}
    
    Returns coordinates from an address.
    Use this after autocomplete to get lat/lng for a location.
    """
    address = request.args.get('address', '')
    
    if not address:
        return jsonify({'error': 'address parameter is required'}), 400
    
    result = latlong_service.geocode(address)
    
    if 'error' in result:
        return jsonify({'error': 'Could not geocode address'}), 404
    
    return jsonify(result)


@location_bp.route('/reverse-geocode', methods=['GET'])
def reverse_geocode():
    """
    GET /api/reverse-geocode?lat={lat}&lng={lng}
    
    Returns address details from coordinates.
    """
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    
    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng parameters are required'}), 400
    
    result = latlong_service.reverse_geocode(lat, lng)
    
    return jsonify(result)


@location_bp.route('/digipin', methods=['GET'])
def get_digipin():
    """
    GET /api/digipin?lat={lat}&lng={lng}
    
    Returns Digipin (Digital Address Code) for a location.
    """
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    
    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng parameters are required'}), 400
    
    result = latlong_service.get_digipin(lat, lng)
    
    return jsonify(result)
