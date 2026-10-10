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
    cors.init_app(
        app,
        resources={r"/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization", "X-Forwarded-For", "Accept"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(tickets_bp)
    app.register_blueprint(admin_bp)

    # Root status endpoint
    @app.route('/')
    def index():
        return jsonify({
            "service": "FairPass AI Backend",
            "status": "online",
            "version": "1.0.0",
            "health": "/health"
        }), 200

    # Simple root healthcheck route
    @app.route('/health')
    def health():
        db_status = "connected"
        try:
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
        except Exception:
            db_status = "connecting_or_unavailable"
        return jsonify({"status": "healthy", "database": db_status}), 200

    # Safe initial table creation
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            app.logger.warning(f"Initial db.create_all skipped or deferred: {e}")

    return app