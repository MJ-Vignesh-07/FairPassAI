from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.extensions import db
from app.models import Event, TicketTier

events_bp = Blueprint('events', __name__, url_prefix='/api/events')

@events_bp.route('', methods=['GET'])
def list_events():
    events = Event.query.order_by(Event.event_date.asc()).all()
    results = []
    for ev in events:
        results.append({
            "id": ev.id,
            "title": ev.title,
            "description": ev.description,
            "venue": ev.venue,
            "event_date": ev.event_date.isoformat(),
            "tiers": [{
                "id": t.id,
                "tier_name": t.tier_name,
                "price": float(t.price),
                "total_quantity": t.total_quantity,
                "available_quantity": t.available_quantity,
                "max_limit_per_user": t.max_limit_per_user
            } for t in ev.tiers]
        })
    return jsonify(results), 200

@events_bp.route('', methods=['POST'])
@jwt_required()
def create_event():
    claims = get_jwt()
    if claims.get('role') != 'ADMIN':
        return jsonify({"error": "Admin privilege required"}), 403

    data = request.get_json() or {}
    title = data.get('title')
    venue = data.get('venue')
    raw_date = data.get('date')
    tiers = data.get('tiers', [])

    if not title or not venue or not raw_date or not tiers:
        return jsonify({"error": "Fields 'title', 'venue', 'date', and 'tiers' are required"}), 400

    try:
        parsed_date = datetime.fromisoformat(raw_date)
    except ValueError:
        return jsonify({"error": "Invalid date format. Use ISO format (e.g., '2026-11-15T18:00:00')"}), 400

    new_event = Event(
        title=title,
        description=data.get('description', ''),
        venue=venue,
        event_date=parsed_date
    )
    db.session.add(new_event)
    db.session.flush()

    for tier_data in tiers:
        name = tier_data.get('tier_name', '')
        is_vip = any(kw in name.upper() for kw in ["VIP", "EXECUTIVE", "FRONT ROW", "BACKSTAGE", "LOUNGE"])
        tier_default_cap = 5 if is_vip else 10
        tier = TicketTier(
            event_id=new_event.id,
            tier_name=name,
            price=tier_data['price'],
            total_quantity=tier_data['quantity'],
            available_quantity=tier_data['quantity'],
            max_limit_per_user=int(tier_data.get('max_limit_per_user') or tier_default_cap)
        )
        db.session.add(tier)

    db.session.commit()
    return jsonify({"message": "Event published successfully", "event_id": new_event.id}), 201