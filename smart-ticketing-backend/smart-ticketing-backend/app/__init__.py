from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, jwt, cors
from app.routes.auth import auth_bp
from app.routes.events import events_bp
from app.routes.tickets import tickets_bp
from app.routes.admin import admin_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(admin_bp)

    # Simple root healthcheck route
    @app.route('/health')
    def health():
        return jsonify({"status": "healthy", "database": "connected"}), 200

    return app