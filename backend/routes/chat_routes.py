"""
Hotspot IQ - Chat Routes
Handles AI-powered chat endpoints.
"""

from flask import Blueprint, request, jsonify
from services.latlong_service import latlong_service
from utils.score_calculator import analyze_location
from config import Config
from services.chat_agent import answer_question

chat_bp = Blueprint('chat', __name__)



def _retriever(lat_r, lng_r, business_type_r=None):
    """Retriever to fetch live analysis if the agent needs it."""
    bt = business_type_r or 'other'
    competitors = latlong_service.get_competitors(lat_r, lng_r, bt)
    filters = ['near_metro', 'near_bus', 'near_school', 'near_college', 
               'near_hospital', 'near_mall', 'near_office']
    landmarks = latlong_service.get_landmarks_by_filters(lat_r, lng_r, filters)
    address_info = latlong_service.reverse_geocode(lat_r, lng_r)
    analysis_result = analyze_location(landmarks, competitors, bt)
    return {
        'lat': lat_r,
        'lng': lng_r,
        'address': address_info,
        'business_type': bt,
        'opportunity_score': analysis_result.get('opportunity_score'),
        'interpretation': analysis_result.get('interpretation', {}),
        'footfall_proxy': 'high' if analysis_result.get('breakdown', {}).get('footfall_proxy', 0) > 60 else 'medium' if analysis_result.get('breakdown', {}).get('footfall_proxy', 0) > 30 else 'low',
        'competitors': analysis_result.get('competitors', {}),
        'landmarks': {'by_category': analysis_result.get('landmarks_summary', {})}
    }


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
            return f"Based on the data, this location shows strong potential for a {business_type}. Opportunity Score: {score}/100. There are {competitors} competitors nearby and footfall appears to be {footfall}."
        elif score >= 40:
            return f"This location has moderate potential for a {business_type} (score {score}/100). Competition: {competitors}. Footfall: {footfall}."
        else:
            return f"This location shows challenges for a {business_type} (score {score}/100). Competition: {competitors}. Footfall: {footfall}. Consider other locations."

    if 'competition' in message_lower or 'competitor' in message_lower:
        return f"There are {competitors} competitors (similar {business_type}s) nearby. {'This is a competitive area - differentiation will be key.' if competitors > 5 else 'Competition is manageable.'}"

    if 'landmark' in message_lower or 'nearby' in message_lower:
        landmarks = analysis_data.get('landmarks', {}).get('by_category', {})
        if landmarks:
            landmark_text = ', '.join([f"{count} {cat.replace('_', ' ')}s" for cat, count in landmarks.items() if count > 0])
            return f"Nearby landmarks include: {landmark_text}. These contribute to footfall and accessibility."
        return "I don't have detailed landmark data for this location yet."

    return f"This location has an Opportunity Score of {score}/100 ({category}). There are {competitors} competitors nearby and {footfall} footfall. What would you like me to analyze further?"


@chat_bp.route('/chat', methods=['POST'])
def chat():
    """POST /api/chat - AI-powered location advice chat."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    message = data.get('message', '')
    context = data.get('context', {}) or {}
    if not message:
        return jsonify({'error': 'message is required'}), 400

    lat = context.get('lat')
    lng = context.get('lng')
    business_type = context.get('business_type', 'other')
    analysis_data = context.get('analysis_data')



    # If OpenAI not configured, return template response (fill analysis if missing)
    if not Config.OPENAI_API_KEY or Config.OPENAI_API_KEY == 'your_openai_api_key_here':
        if lat and lng and not analysis_data:
            analysis_data = _retriever(lat, lng, business_type)
        response_text = _generate_template_response(message, analysis_data)
        return jsonify({'response': response_text, 'data_sources': ['poi', 'landmarks', 'competitors'], 'ai_powered': False})

    # Otherwise delegate to the chat agent (RAG + OpenAI)
    try:
        agent_ctx = {'lat': lat, 'lng': lng, 'business_type': business_type, 'analysis_data': analysis_data, 'retriever': _retriever}
        result = answer_question(message, agent_ctx)
        return jsonify(result)
    except Exception as e:
        print(f"Chat agent error: {e}")
        if lat and lng and not analysis_data:
            analysis_data = _retriever(lat, lng, business_type)
        response_text = _generate_template_response(message, analysis_data)
        return jsonify({'response': response_text, 'data_sources': ['poi', 'landmarks', 'competitors'], 'ai_powered': False, 'error': str(e)})
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

RECOMMENDED SPOTS (Top 5):
{_format_recommended_spots(location_data.get('recommended_spots', []))}

LANDMARKS NEARBY:
{_format_landmarks(location_data.get('landmarks', {}).get('by_category', {}))}

USER QUESTION: {user_question}

Please provide a helpful, actionable response based on this data. Be specific and use the numbers provided.
If the user asks about specific spots, refer to the "RECOMMENDED SPOTS" section.
Keep your response concise (2-3 paragraphs max) and practical for a business owner."""
    
    return context


def _format_recommended_spots(spots: list) -> str:
    """Format recommended spots list into readable string."""
    if not spots:
        return "No specific recommended spots identified."
    
    lines = []
    for i, spot in enumerate(spots[:5], 1):
        lines.append(f"Spot #{i}: Score {spot.get('total_score', 'N/A')}/100 - {spot.get('rating_label', 'N/A')} (Lat: {spot.get('lat')}, Lng: {spot.get('lng')})")
    
    return '\n'.join(lines)


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
        landmarks = latlong_service.get_landmarks_by_filters(lat, lng, filters)
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
    
    # Check if Hugging Face is configured
    if not Config.HUGGINGFACE_API_KEY:
        # Return a template response without AI
        response_text = _generate_template_response(message, analysis_data)
        return jsonify({
            'response': response_text,
            'data_sources': ['poi', 'landmarks', 'competitors'],
            'ai_powered': False
        })
    
    # Generate AI response using Hugging Face
    try:
        from huggingface_hub import InferenceClient
        client = InferenceClient(
            model=Config.HUGGINGFACE_MODEL,
            token=Config.HUGGINGFACE_API_KEY
        )
        
        prompt = generate_context_prompt(analysis_data or {}, message)
        
        # Format prompt for instruction-tuned models (e.g., Mistral)
        formatted_prompt = f"<s>[INST] {prompt} [/INST]"
        
        response_text = ""
        for token in client.text_generation(formatted_prompt, max_new_tokens=500, stream=True):
            response_text += token
        
        return jsonify({
            'response': response_text,
            'data_sources': ['poi', 'landmarks', 'competitors'],
            'ai_powered': True
        })
        
    except Exception as e:
        # OpenAI call failed; attempt to use the local chat agent (RAG) fallback.
        if lat and lng and not analysis_data:
            analysis_data = _retriever(lat, lng, business_type)

        try:
            agent_ctx = {'lat': lat, 'lng': lng, 'business_type': business_type, 'analysis_data': analysis_data, 'retriever': _retriever}
            result = answer_question(message, agent_ctx)
            return jsonify(result)
        except Exception as inner_e:
            print(f"Chat agent error: {inner_e}")
            response_text = _generate_template_response(message, analysis_data)
            return jsonify({
                'response': response_text,
                'data_sources': ['poi', 'landmarks', 'competitors'],
                'ai_powered': False,
                'error': str(inner_e)
            })
