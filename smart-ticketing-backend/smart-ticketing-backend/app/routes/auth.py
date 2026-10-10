from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app.extensions import db
from app.models import User

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()
    role = data.get('role', 'USER').upper()

    if not username or not email or not password:
        return jsonify({"error": "Missing username, email, or password"}), 400

    if role not in ['ADMIN', 'USER']:
        return jsonify({"error": "Role must be 'ADMIN' or 'USER'"}), 400

    # Check for existing user
    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "User with this username or email already exists"}), 409

    new_user = User(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        role=role
    )
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '').strip()

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    # Validate target role if provided in the login request
    target_role = data.get('role')
    if target_role:
        target_role = target_role.strip().upper()
        if user.role != target_role:
            role_label = "Administrator" if target_role == "ADMIN" else "Standard User"
            account_label = "Administrator" if user.role == "ADMIN" else "Standard User"
            return jsonify({
                "error": f"Role mismatch: This account has '{account_label}' credentials, but '{role_label}' was selected. Please select the matching role or enter valid credentials."
            }), 403

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "username": user.username}
    )

    return jsonify({
        "access_token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }), 200