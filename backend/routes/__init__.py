"""
Hotspot IQ - Routes Package
"""

from .location_routes import location_bp
from .analysis_routes import analysis_bp
from .chat_routes import chat_bp

__all__ = ['location_bp', 'analysis_bp', 'chat_bp']
