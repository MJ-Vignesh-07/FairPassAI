import os
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
            print(f"\n Database connection check note: {e}")

    port = int(os.environ.get('PORT', 5000))
    is_prod = bool(os.environ.get('RENDER'))
    print(f" Starting Flask server on port {port} (production={is_prod})\n")
    app.run(host='0.0.0.0', port=port, debug=not is_prod)