from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import TicketTier, Booking, BehaviorLog, RiskAssessment
from app.services.risk_engine import evaluate_session_risk

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')

@tickets_bp.route('/eval-risk', methods=['POST'])
@jwt_required()
def eval_risk():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    event_id = data.get('event_id')
    tier_id = data.get('tier_id')
    quantity = int(data.get('quantity', 1))
    session_id = data.get('session_id', 'anon-session')
    telemetry = data.get('telemetry', {})

    if not event_id or not tier_id:
        return jsonify({"error": "event_id and tier_id are required"}), 400

    # Extract client IP via access_route (supports Render & proxy forwarding)
    if request.access_route:
        ip_address = request.access_route[0]
    else:
        ip_address = request.remote_addr or "127.0.0.1"

    if ',' in ip_address:
        ip_address = ip_address.split(',')[0].strip()

    one_minute_ago = datetime.now(timezone.utc) - timedelta(seconds=60)
    try:
        ip_freq = BehaviorLog.query.filter(
            BehaviorLog.ip_address == ip_address,
            BehaviorLog.created_at >= one_minute_ago
        ).count() + 1
    except Exception:
        # Fallback for databases with naive UTC storage
        ip_freq = BehaviorLog.query.filter(
            BehaviorLog.ip_address == ip_address,
            BehaviorLog.created_at >= (datetime.utcnow() - timedelta(seconds=60))
        ).count() + 1


    feature_dict = {
        'tickets_requested': quantity,
        'request_interval_ms': int(telemetry.get('request_interval_ms', 3000)),
        'time_spent_seconds': int(telemetry.get('time_spent_seconds', 30)),
        'failed_attempts': int(telemetry.get('failed_attempts', 0)),
        'ip_request_frequency': ip_freq
    }

    # Evaluate dynamic risk score
    risk_score, risk_tier, rules = evaluate_session_risk(feature_dict)

    # Persist interaction telemetry
    log_entry = BehaviorLog(
        user_id=user_id,
        event_id=event_id,
        session_id=session_id,
        tickets_requested=feature_dict['tickets_requested'],
        request_interval_ms=feature_dict['request_interval_ms'],
        time_spent_seconds=feature_dict['time_spent_seconds'],
        failed_attempts=feature_dict['failed_attempts'],
        ip_address=ip_address
    )
    db.session.add(log_entry)
    db.session.flush()

    assessment = RiskAssessment(
        log_id=log_entry.id,
        user_id=user_id,
        risk_score=risk_score,
        risk_tier=risk_tier,
        action_taken=f"Assigned {risk_tier} tier. Cap: {rules['max_cap']}, Queue delay: {rules['queue_delay_seconds']}s"
    )
    db.session.add(assessment)
    db.session.commit()

    return jsonify({
        "risk_score": risk_score,
        "risk_tier": risk_tier,
        "rules": rules,
        "log_id": log_entry.id
    }), 200

@tickets_bp.route('/book', methods=['POST'])
@jwt_required()
def book():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    tier_id = data.get('tier_id')
    requested_qty = int(data.get('quantity', 1))
    risk_tier = data.get('risk_tier', 'LOW')

    if not tier_id or requested_qty <= 0:
        return jsonify({"error": "Valid tier_id and quantity > 0 required"}), 400

    # Rule Engine Cap Enforcement
    tier_caps = {'LOW': 4, 'MEDIUM': 2, 'HIGH': 1}
    max_cap = tier_caps.get(risk_tier, 1)

    if requested_qty > max_cap:
        return jsonify({
            "error": f"Allocation policy restriction: {risk_tier} risk users can only book up to {max_cap} tickets"
        }), 403

    try:
        # PESSIMISTIC LOCK: Lock ticket_tier row exclusively for this transaction
        tier = db.session.query(TicketTier).with_for_update().filter_by(id=tier_id).first()

        if not tier:
            db.session.rollback()
            return jsonify({"error": "Ticket tier does not exist"}), 404

        if tier.available_quantity < requested_qty:
            db.session.rollback()
            return jsonify({
                "error": "Insufficient inventory available",
                "remaining_available": tier.available_quantity
            }), 409

        # Deduct inventory atomically
        tier.available_quantity -= requested_qty

        booking = Booking(
            user_id=user_id,
            event_id=tier.event_id,
            ticket_tier_id=tier.id,
            quantity=requested_qty,
            total_price=float(tier.price) * requested_qty,
            risk_tier=risk_tier,
            status='CONFIRMED'
        )
        db.session.add(booking)
        db.session.commit()

        return jsonify({
            "message": "Ticket reservation confirmed successfully",
            "booking_id": booking.id,
            "event_id": tier.event_id,
            "tier_name": tier.tier_name,
            "quantity_booked": requested_qty,
            "total_price": float(booking.total_price),
            "remaining_inventory": tier.available_quantity
        }), 201

    except Exception as exc:
        db.session.rollback()
        return jsonify({"error": "Transaction rolled back", "details": str(exc)}), 500