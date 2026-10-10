import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ticketing_super_secret_key_2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt_secret_token_key_2026')
    
    # Normalize Render PostgreSQL URL (postgres:// -> postgresql://) for SQLAlchemy compatibility
    _db_url = os.environ.get(
        'DATABASE_URL', 
        'postgresql+psycopg2://postgres:vignesh@localhost:5432/ticketing_db'
    )
    if _db_url and _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql://', 1)

    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False