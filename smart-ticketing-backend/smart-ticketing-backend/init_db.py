"""
Database initialization and seed script for FairPass AI.
Can be executed as Render Pre-Deploy Command or run manually to bootstrap tables and demo data.
"""
from datetime import datetime
from werkzeug.security import generate_password_hash
from app import create_app
from app.extensions import db
from app.models import User, Event, TicketTier

def bootstrap_database():
    app = create_app()
    with app.app_context():
        print("[INIT] Initializing database schema...")
        db.create_all()
        print("[INIT] Tables created or verified successfully.")

        # 1. Seed demo users if missing
        seed_users = [
            {
                "username": "admin",
                "email": "admin@fairpass.io",
                "password": "admin123",
                "role": "ADMIN"
            },
            {
                "username": "vignesh",
                "email": "vignesh@example.com",
                "password": "password123",
                "role": "USER"
            }
        ]

        users_created = 0
        for u in seed_users:
            existing = User.query.filter((User.username == u["username"]) | (User.email == u["email"])).first()
            if not existing:
                new_user = User(
                    username=u["username"],
                    email=u["email"],
                    password_hash=generate_password_hash(u["password"]),
                    role=u["role"]
                )
                db.session.add(new_user)
                users_created += 1

        if users_created > 0:
            db.session.commit()
            print(f"[AUTH] Seeded {users_created} default user account(s).")
        else:
            print("[AUTH] User accounts already present.")

        # 2. Seed sample events if no events exist
        if Event.query.count() == 0:
            print("[EVENTS] Seeding initial sample events with ticket tiers...")
            events_data = [
                {
                    "title": "Coldplay — Music of the Spheres World Tour 2026",
                    "description": "Global stadium tour featuring immersive audiovisuals, kinetic dancefloors, and high-demand ticketing protected by FairPass AI.",
                    "venue": "DY Patil Stadium, Mumbai",
                    "event_date": datetime(2026, 11, 20, 19, 30),
                    "tiers": [
                        {"name": "VIP Lounge", "price": 350.00, "qty": 100, "limit": 5},
                        {"name": "Floor Standing", "price": 120.00, "qty": 500, "limit": 10},
                        {"name": "General Bleachers", "price": 60.00, "qty": 1200, "limit": 10}
                    ]
                },
                {
                    "title": "Global AI & CyberSec Summit 2026",
                    "description": "Premier keynote conference showcasing frontier artificial intelligence, agentic architectures, and anti-fraud engineering.",
                    "venue": "Convention Center, Hall A",
                    "event_date": datetime(2026, 12, 5, 9, 0),
                    "tiers": [
                        {"name": "Executive Pass", "price": 299.00, "qty": 150, "limit": 5},
                        {"name": "Standard Admission", "price": 99.00, "qty": 450, "limit": 10}
                    ]
                },
                {
                    "title": "Tomorrowland Electro Neon Night",
                    "description": "New Year's Eve electronic music festival with top-tier EDM artists, kinetic stages, and laser production.",
                    "venue": "Solar Arena Open Air",
                    "event_date": datetime(2026, 12, 31, 21, 0),
                    "tiers": [
                        {"name": "Early Bird", "price": 85.00, "qty": 300, "limit": 10},
                        {"name": "VIP Deck", "price": 250.00, "qty": 75, "limit": 5}
                    ]
                }
            ]

            for ed in events_data:
                ev = Event(
                    title=ed["title"],
                    description=ed["description"],
                    venue=ed["venue"],
                    event_date=ed["event_date"]
                )
                db.session.add(ev)
                db.session.flush()

                for td in ed["tiers"]:
                    tier = TicketTier(
                        event_id=ev.id,
                        tier_name=td["name"],
                        price=td["price"],
                        total_quantity=td["qty"],
                        available_quantity=td["qty"],
                        max_limit_per_user=td["limit"]
                    )
                    db.session.add(tier)

            db.session.commit()
            print(f"[SUCCESS] Seeded {len(events_data)} initial events with tiers.")
        else:
            print("[EVENTS] Events already present in database.")

        print("[SUCCESS] Database bootstrapping completed successfully!\n")

if __name__ == '__main__':
    bootstrap_database()
