import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ticketing_super_secret_key_2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt_secret_token_key_2026')
    
    # Normalize Render PostgreSQL URL (postgres:// -> postgresql://) for SQLAlchemy compatibility
    _db_url = os.environ.get(
        'DATABASE_URL', 
        'postgresql+psycopg2://postgres:vignesh@localhost:5432/ticketing_db'
    )
    # Normalize Render PostgreSQL URL to explicitly use the installed psycopg2 driver
    if _db_url:
        if _db_url.startswith('postgres://'):
            _db_url = _db_url.replace('postgres://', 'postgresql+psycopg2://', 1)
        elif _db_url.startswith('postgresql://') and not _db_url.startswith('postgresql+'):
            _db_url = _db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)

    SQLALCHEMY_DATABASE_URI = _db_url

    SQLALCHEMY_TRACK_MODIFICATIONS = False