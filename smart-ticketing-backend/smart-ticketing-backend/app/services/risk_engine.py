import os
import joblib
import numpy as np

# Resolve path to ml_models
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODEL_PATH = os.path.join(BASE_DIR, 'ml_models', 'scalper_model.joblib')
SCALER_PATH = os.path.join(BASE_DIR, 'ml_models', 'scaler.joblib')

model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

def evaluate_session_risk(features_dict):
    """
    Evaluates session telemetry vector:
    [tickets_requested, request_interval_ms, time_spent_seconds, failed_attempts, ip_request_frequency]
    Returns: (risk_score, risk_tier, rule_enforcements)
    """
    vector = np.array([[
        features_dict['tickets_requested'],
        features_dict['request_interval_ms'],
        features_dict['time_spent_seconds'],
        features_dict['failed_attempts'],
        features_dict['ip_request_frequency']
    ]])

    # Normalize vector using pre-trained StandardScaler
    vector_scaled = scaler.transform(vector)

    # Risk score: Probability of being a scalper/bot (class 1)
    risk_score = float(model.predict_proba(vector_scaled)[0][1])

    # Rule-Based Fair Allocation Protocol Mapping
    if risk_score < 0.35:
        tier = "LOW"
        rules = {
            "max_cap": 4,
            "challenge_required": False,
            "queue_delay_seconds": 0
        }
    elif risk_score < 0.70:
        tier = "MEDIUM"
        rules = {
            "max_cap": 2,
            "challenge_required": True,
            "queue_delay_seconds": 0
        }
    else:
        tier = "HIGH"
        rules = {
            "max_cap": 1,
            "challenge_required": True,
            "queue_delay_seconds": 30
        }

    return round(risk_score, 3), tier, rules