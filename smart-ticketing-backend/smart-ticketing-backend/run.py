from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        try:
            # Test direct query to ensure DB credentials are valid
            db.session.execute(text('SELECT 1'))
            print("\n Database connection verified successfully!")
        except Exception as e:
            print("\n Database connection failed. Please check your credentials in app/config.py.")
            print(f"Error details: {e}")
            exit(1)

    print(" Starting Flask server on http://127.0.0.1:5000\n")
    app.run(host='0.0.0.0', port=5000, debug=True)