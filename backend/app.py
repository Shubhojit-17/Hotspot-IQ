"""
Hotspot IQ - Flask Application
Main entry point for the backend API server.
"""

from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes import location_bp, analysis_bp, chat_bp


def create_app():
    """Create and configure the Flask application."""
    
    app = Flask(__name__)
    
    # Configure CORS - allow multiple Vite dev server ports
    CORS(app, origins=[
        Config.FRONTEND_URL, 
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176"
    ])
    
    # Register blueprints
    app.register_blueprint(location_bp, url_prefix='/api')
    app.register_blueprint(analysis_bp, url_prefix='/api')
    app.register_blueprint(chat_bp, url_prefix='/api')
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'Hotspot IQ API',
            'version': '1.0.0'
        })
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'name': 'Hotspot IQ API',
            'description': 'Hyper-Local Location Intelligence for Smarter Business Expansion',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'autocomplete': '/api/autocomplete?query={search_term}',
                'analyze': 'POST /api/analyze',
                'isochrone': 'POST /api/isochrone',
                'digipin': '/api/digipin?lat={lat}&lng={lng}',
                'chat': 'POST /api/chat',
                'supply_chain': 'POST /api/supply-chain'
            }
        })
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint not found'}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app


# Create app instance
app = create_app()


if __name__ == '__main__':
    print("\n🎯 Hotspot IQ Backend Server")
    print("=" * 40)
    
    # Validate configuration
    Config.validate()
    
    print(f"🚀 Starting server on http://localhost:{Config.FLASK_PORT}")
    print(f"📡 CORS enabled for: {Config.FRONTEND_URL}")
    print("=" * 40 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=Config.FLASK_PORT,
        debug=Config.FLASK_DEBUG
    )
