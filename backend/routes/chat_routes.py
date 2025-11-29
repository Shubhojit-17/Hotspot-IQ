"""
Hotspot IQ - Chat Routes
Handles AI-powered chat endpoints.
"""

from flask import Blueprint, request, jsonify
from services.latlong_service import latlong_service
from utils.score_calculator import analyze_location
from config import Config

chat_bp = Blueprint('chat', __name__)


def generate_context_prompt(location_data: dict, user_question: str) -> str:
    """Generate a context-rich prompt for the AI."""
    
    context = f"""You are Hotspot IQ, an expert location intelligence advisor for businesses in India.
    
LOCATION DATA:
- Coordinates: {location_data.get('lat')}, {location_data.get('lng')}
- Address: {location_data.get('address', {}).get('formatted_address', 'N/A')}
- Business Type: {location_data.get('business_type', 'Not specified')}

ANALYSIS RESULTS:
- Opportunity Score: {location_data.get('opportunity_score', 'N/A')}/100
- Score Category: {location_data.get('interpretation', {}).get('category', 'N/A')}
- Footfall Level: {location_data.get('footfall_proxy', 'N/A')}
- Competitor Count: {location_data.get('competitors', {}).get('count', 0)} nearby

LANDMARKS NEARBY:
{_format_landmarks(location_data.get('landmarks', {}).get('by_category', {}))}

USER QUESTION: {user_question}

Please provide a helpful, actionable response based on this data. Be specific and use the numbers provided.
Keep your response concise (2-3 paragraphs max) and practical for a business owner."""
    
    return context


def _format_landmarks(landmarks: dict) -> str:
    """Format landmarks dict into readable string."""
    if not landmarks:
        return "No landmark data available"
    
    lines = []
    for category, count in landmarks.items():
        readable_name = category.replace('_', ' ').title()
        lines.append(f"- {readable_name}: {count}")
    
    return '\n'.join(lines) if lines else "No landmarks detected"


@chat_bp.route('/chat', methods=['POST'])
def chat():
    """
    POST /api/chat
    
    AI-powered location advice chat.
    
    Request body:
    {
        "message": "Is this location good for a gym?",
        "context": {
            "lat": 12.9716,
            "lng": 77.5946,
            "business_type": "gym",
            "analysis_data": {...}  // Optional, pre-fetched analysis
        }
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Request body is required'}), 400
    
    message = data.get('message', '')
    context = data.get('context', {})
    
    if not message:
        return jsonify({'error': 'message is required'}), 400
    
    lat = context.get('lat')
    lng = context.get('lng')
    business_type = context.get('business_type', 'other')
    
    # If we have coordinates but no analysis data, fetch it
    analysis_data = context.get('analysis_data')
    
    if lat and lng and not analysis_data:
        # Fetch fresh analysis data
        competitors = latlong_service.get_competitors(lat, lng, business_type)
        filters = ['near_metro', 'near_bus', 'near_school', 'near_college', 
                   'near_hospital', 'near_mall', 'near_office']
        landmarks = latlong_service.get_landmarks(lat, lng, filters)
        address_info = latlong_service.reverse_geocode(lat, lng)
        
        analysis_result = analyze_location(landmarks, competitors, business_type)
        
        analysis_data = {
            'lat': lat,
            'lng': lng,
            'address': address_info,
            'business_type': business_type,
            'opportunity_score': analysis_result['opportunity_score'],
            'interpretation': analysis_result['interpretation'],
            'footfall_proxy': 'high' if analysis_result['breakdown']['footfall_proxy'] > 60 else 'medium' if analysis_result['breakdown']['footfall_proxy'] > 30 else 'low',
            'competitors': analysis_result['competitors'],
            'landmarks': {
                'by_category': analysis_result['landmarks_summary']
            }
        }
    
    # Check if OpenAI is configured
    if not Config.OPENAI_API_KEY or Config.OPENAI_API_KEY == 'your_openai_api_key_here':
        # Return a template response without AI
        response_text = _generate_template_response(message, analysis_data)
        return jsonify({
            'response': response_text,
            'data_sources': ['poi', 'landmarks', 'competitors'],
            'ai_powered': False
        })
    
    # Generate AI response using OpenAI
    try:
        import openai
        client = openai.OpenAI(api_key=Config.OPENAI_API_KEY)
        
        prompt = generate_context_prompt(analysis_data or {}, message)
        
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are Hotspot IQ, a helpful location intelligence advisor."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        response_text = completion.choices[0].message.content
        
        return jsonify({
            'response': response_text,
            'data_sources': ['poi', 'landmarks', 'competitors'],
            'ai_powered': True
        })
        
    except Exception as e:
        print(f"OpenAI API Error: {str(e)}")
        # Fallback to template response
        response_text = _generate_template_response(message, analysis_data)
        return jsonify({
            'response': response_text,
            'data_sources': ['poi', 'landmarks', 'competitors'],
            'ai_powered': False,
            'error': 'AI service temporarily unavailable'
        })


def _generate_template_response(message: str, analysis_data: dict) -> str:
    """Generate a template response when AI is not available."""
    
    if not analysis_data:
        return "Please select a location on the map first so I can analyze it for you."
    
    score = analysis_data.get('opportunity_score', 0)
    category = analysis_data.get('interpretation', {}).get('category', 'Unknown')
    competitors = analysis_data.get('competitors', {}).get('count', 0)
    footfall = analysis_data.get('footfall_proxy', 'unknown')
    business_type = analysis_data.get('business_type', 'business')
    
    message_lower = message.lower()
    
    if 'good' in message_lower or 'suitable' in message_lower:
        if score >= 70:
            return f"Based on the data, this location shows **strong potential** for a {business_type}. With an Opportunity Score of {score}/100, you're looking at a prime location. There are {competitors} competitors nearby, and footfall appears to be {footfall}. I'd recommend moving quickly on this opportunity!"
        elif score >= 40:
            return f"This location has **moderate potential** for a {business_type}, scoring {score}/100. With {competitors} competitors in the area and {footfall} footfall, you'll need a strong differentiation strategy. Consider what unique value you can offer."
        else:
            return f"This location shows some **challenges** for a {business_type}, with a score of {score}/100. High competition ({competitors} nearby) or low footfall ({footfall}) could make success difficult. I'd recommend exploring alternative locations."
    
    elif 'competition' in message_lower or 'competitor' in message_lower:
        return f"There are **{competitors} competitors** (similar {business_type}s) within 1km of this location. {'This is a competitive area - differentiation will be key.' if competitors > 5 else 'Competition is manageable - focus on great service and location visibility.'}"
    
    elif 'landmark' in message_lower or 'nearby' in message_lower:
        landmarks = analysis_data.get('landmarks', {}).get('by_category', {})
        if landmarks:
            landmark_text = ', '.join([f"{count} {cat.replace('_', ' ')}s" for cat, count in landmarks.items() if count > 0])
            return f"Nearby landmarks include: **{landmark_text}**. These contribute to the footfall and accessibility of your location."
        return "I don't have detailed landmark data for this location yet."
    
    else:
        return f"This location has an Opportunity Score of **{score}/100** ({category}). There are {competitors} competitors nearby and {footfall} footfall. What specific aspect would you like me to analyze further?"
