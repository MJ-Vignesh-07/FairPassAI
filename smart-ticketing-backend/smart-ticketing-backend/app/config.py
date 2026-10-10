import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ticketing_super_secret_key_2026')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt_secret_token_key_2026')
    
    # Replace 'postgres:your_postgres_password' with your PostgreSQL username and password
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        'postgresql+psycopg2://postgres:vignesh@localhost:5432/ticketing_db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False