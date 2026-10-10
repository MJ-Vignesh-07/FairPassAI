from datetime import datetime
from app.extensions import db

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='USER', nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    venue = db.Column(db.String(150), nullable=False)
    event_date = db.Column(db.DateTime(timezone=True), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    
    tiers = db.relationship('TicketTier', backref='event', cascade='all, delete-orphan')

class TicketTier(db.Model):
    __tablename__ = 'ticket_tiers'
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    tier_name = db.Column(db.String(50), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    total_quantity = db.Column(db.Integer, nullable=False)
    available_quantity = db.Column(db.Integer, nullable=False)
    max_limit_per_user = db.Column(db.Integer, default=4)

class BehaviorLog(db.Model):
    __tablename__ = 'behavior_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    session_id = db.Column(db.String(100), nullable=False)
    tickets_requested = db.Column(db.Integer, nullable=False)
    request_interval_ms = db.Column(db.Integer, nullable=False)
    time_spent_seconds = db.Column(db.Integer, nullable=False)
    failed_attempts = db.Column(db.Integer, default=0)
    ip_address = db.Column(db.String(45), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

class RiskAssessment(db.Model):
    __tablename__ = 'risk_assessments'
    id = db.Column(db.Integer, primary_key=True)
    log_id = db.Column(db.Integer, db.ForeignKey('behavior_logs.id', ondelete='CASCADE'), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    risk_score = db.Column(db.Numeric(4, 3), nullable=False)
    risk_tier = db.Column(db.String(10), nullable=False)
    action_taken = db.Column(db.String(100), nullable=False)
    assessed_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id', ondelete='CASCADE'), nullable=False)
    ticket_tier_id = db.Column(db.Integer, db.ForeignKey('ticket_tiers.id', ondelete='CASCADE'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    total_price = db.Column(db.Numeric(10, 2), nullable=False)
    risk_tier = db.Column(db.String(10), nullable=False)
    status = db.Column(db.String(20), default='CONFIRMED')
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)