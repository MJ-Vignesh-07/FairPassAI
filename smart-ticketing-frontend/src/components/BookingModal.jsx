import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Shield, AlertTriangle, CheckCircle, Clock, Zap, 
  Bot, Lock, ArrowRight, RefreshCw, Sparkles, UserCheck, AlertCircle 
} from 'lucide-react';
import { evalRiskApi, bookTicketApi } from '../api';
import VerificationChallenge from './VerificationChallenge';

export default function BookingModal({ event, onClose, currentUser, onBookingComplete }) {
  // Available tiers
  const tiers = event?.tiers || [];
  const [selectedTierId, setSelectedTierId] = useState(tiers[0]?.id || null);
  const selectedTier = tiers.find(t => t.id === Number(selectedTierId)) || tiers[0];

  // Quantity state
  const [quantity, setQuantity] = useState(1);

  // Bot Simulation Mode Toggle
  const [isBotMode, setIsBotMode] = useState(false);

  // Telemetry Metrics State
  const [mountTime] = useState(Date.now());
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [sessionId] = useState(() => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Booking Flow Steps: 1: 'configure', 2: 'assessment', 3: 'success'
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Risk Assessment Results
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [queueCountdown, setQueueCountdown] = useState(0);

  // Confirmed Booking Details
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  // Track time spent on page
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpentSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Countdown timer for High Risk queue throttling
  useEffect(() => {
    if (queueCountdown > 0) {
      const countdownTimer = setInterval(() => {
        setQueueCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdownTimer);
    }
  }, [queueCountdown]);

  // Handle tier selection
  const handleTierChange = (tierId) => {
    setSelectedTierId(tierId);
    setQuantity(1);
  };

  // Step 1: Submit Telemetry & Evaluate ML Risk
  const handleEvaluateRisk = async () => {
    if (!currentUser) {
      setErrorMsg('Please sign in before reserving tickets.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Compute request interval
    const now = Date.now();
    const actualInterval = now - mountTime;
    
    // In bot mode, simulate ultra-fast latency and high retries
    const requestInterval = isBotMode ? Math.floor(Math.random() * 120) + 50 : actualInterval;
    const timeSpent = isBotMode ? 1 : Math.max(timeSpentSeconds, 2);
    const failures = isBotMode ? 3 : failedAttempts;

    try {
      const assessmentData = await evalRiskApi({
        event_id: event.id,
        tier_id: selectedTier.id,
        quantity: Number(quantity),
        session_id: sessionId,
        telemetry: {
          request_interval_ms: requestInterval,
          time_spent_seconds: timeSpent,
          failed_attempts: failures
        }
      });

      setRiskAssessment(assessmentData);

      // Check max cap enforced by rule engine
      const enforcedCap = assessmentData.rules?.max_cap || 4;
      if (quantity > enforcedCap) {
        setQuantity(enforcedCap);
      }

      // If high risk, start queue throttling delay
      const queueDelay = assessmentData.rules?.queue_delay_seconds || 0;
      if (queueDelay > 0) {
        setQueueCountdown(queueDelay);
      }

      // Advance to assessment step
      setStep(2);
    } catch (err) {
      setFailedAttempts(prev => prev + 1);
      setErrorMsg(err.message || 'Failed to evaluate behavioral risk');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Execute Pessimistic Locked Reservation
  const handleConfirmReservation = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const confirmation = await bookTicketApi({
        tier_id: selectedTier.id,
        quantity: Number(quantity),
        risk_tier: riskAssessment.risk_tier
      });

      setBookingConfirmation(confirmation);
      setStep(3); // Success step
      if (onBookingComplete) {
        onBookingComplete();
      }
    } catch (err) {
      setFailedAttempts(prev => prev + 1);
      setErrorMsg(err.message || 'Booking reservation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">Ticket Allocation Engine</h2>
            <div className="modal-subtitle">
              Event: <span className="highlight-text">{event.title}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="alert-banner alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: CONFIGURE & TELEMETRY COLLECTOR */}
        {step === 1 && (
          <div className="booking-step-content">
            {/* Live Telemetry Sensor HUD */}
            <div className="telemetry-hud-card">
              <div className="hud-header">
                <div className="hud-title">
                  <ActivityIndicator />
                  <span>Real-Time Behavioral Telemetry Collector</span>
                </div>
                <button
                  type="button"
                  className={`btn-toggle-bot ${isBotMode ? 'active' : ''}`}
                  onClick={() => setIsBotMode(!isBotMode)}
                  title="Simulate automated bot script behavior to test high risk detection"
                >
                  <Bot size={15} />
                  <span>{isBotMode ? 'Bot Mode (Active)' : 'Simulate Bot Script'}</span>
                </button>
              </div>

              <div className="hud-grid">
                <div className="hud-item">
                  <span className="hud-label">Dwell Time</span>
                  <span className="hud-value font-mono">
                    {isBotMode ? '1s (Automated)' : `${timeSpentSeconds}s`}
                  </span>
                </div>
                <div className="hud-item">
                  <span className="hud-label">Est. Click Latency</span>
                  <span className="hud-value font-mono">
                    {isBotMode ? '~85ms' : `${Date.now() - mountTime}ms`}
                  </span>
                </div>
                <div className="hud-item">
                  <span className="hud-label">Retry Frequency</span>
                  <span className="hud-value font-mono">
                    {isBotMode ? '3 rejects' : `${failedAttempts} rejects`}
                  </span>
                </div>
                <div className="hud-item">
                  <span className="hud-label">Session ID</span>
                  <span className="hud-value font-mono truncate" title={sessionId}>
                    {sessionId.substring(0, 14)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Tier Selection */}
            <div className="form-section">
              <label className="section-label">Select Ticket Tier</label>
              <div className="tier-selection-grid">
                {tiers.map((t) => {
                  const isAvailable = t.available_quantity > 0;
                  const isSelected = selectedTier?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`tier-option-card ${isSelected ? 'selected' : ''} ${!isAvailable ? 'sold-out' : ''}`}
                      onClick={() => isAvailable && handleTierChange(t.id)}
                    >
                      <div className="tier-option-top">
                        <span className="tier-name">{t.tier_name}</span>
                        <span className="tier-price font-mono">${Number(t.price).toFixed(2)}</span>
                      </div>
                      <div className="tier-option-bottom">
                        <span className="inventory-pill">
                          {isAvailable ? `${t.available_quantity} remaining` : 'Sold Out'}
                        </span>
                        <span className="max-cap-pill">Max limit: {t.max_limit_per_user}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="form-section">
              <div className="quantity-header">
                <label className="section-label">Number of Tickets</label>
                <span className="quantity-subtext">Subject to dynamic behavioral risk verification</span>
              </div>
              <div className="quantity-control-wrapper">
                <button
                  type="button"
                  className="btn-qty"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="qty-value font-mono">{quantity}</span>
                <button
                  type="button"
                  className="btn-qty"
                  onClick={() => setQuantity(Math.min(selectedTier?.max_limit_per_user || 4, quantity + 1))}
                  disabled={quantity >= (selectedTier?.max_limit_per_user || 4)}
                >
                  +
                </button>

                <div className="qty-total-calc">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-accent">
                    ${(Number(selectedTier?.price || 0) * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEvaluateRisk}
                disabled={loading || !selectedTier || selectedTier.available_quantity <= 0}
              >
                {loading ? (
                  <>
                    <RefreshCw className="spin" size={16} />
                    <span>Evaluating ML Risk...</span>
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    <span>Evaluate Risk & Proceed</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ML RISK ASSESSMENT & TIERED PROTOCOL */}
        {step === 2 && riskAssessment && (
          <div className="booking-step-content">
            {/* Risk Assessment Score Card */}
            <div className={`risk-result-card border-${riskAssessment.risk_tier.toLowerCase()}`}>
              <div className="risk-badge-row">
                <div className={`badge badge-${riskAssessment.risk_tier.toLowerCase()}`}>
                  {riskAssessment.risk_tier} RISK PROFILE
                </div>
                <div className="score-meter-pill font-mono">
                  Risk Score: <strong>{(riskAssessment.risk_score * 100).toFixed(1)}%</strong> ({riskAssessment.risk_score})
                </div>
              </div>

              {/* Visual Score Meter */}
              <div className="score-bar-track">
                <div 
                  className={`score-bar-fill fill-${riskAssessment.risk_tier.toLowerCase()}`}
                  style={{ width: `${Math.min(100, Math.max(5, riskAssessment.risk_score * 100))}%` }}
                />
              </div>

              {/* Protocol Enforcement Rules */}
              <div className="rules-summary-box">
                <h4 className="rules-title">Dynamic Allocation Rules Enforced:</h4>
                <ul className="rules-list">
                  <li>
                    <strong>Seat Purchase Cap:</strong> Max {riskAssessment.rules.max_cap} ticket(s) allowed for this profile.
                  </li>
                  <li>
                    <strong>Security Challenge:</strong> {riskAssessment.rules.challenge_required ? 'Mandatory Verification Required' : 'Bypassed (Genuine User verified)'}
                  </li>
                  <li>
                    <strong>Queue Throttling:</strong> {riskAssessment.rules.queue_delay_seconds > 0 ? `${riskAssessment.rules.queue_delay_seconds}s artificial queue delay enforced` : 'Instant access (0s delay)'}
                  </li>
                </ul>
              </div>
            </div>

            {/* High-Risk Queue Countdown */}
            {queueCountdown > 0 && (
              <div className="queue-throttle-card">
                <div className="queue-spinner-ring">
                  <div className="queue-timer-number font-mono">{queueCountdown}s</div>
                </div>
                <div className="queue-info">
                  <div className="queue-title">
                    <Clock size={16} /> Anti-Scalper Queue Throttling Active
                  </div>
                  <div className="queue-desc">
                    High burst frequency detected. Artificial rate delay in progress to prevent automated inventory draining. Please wait...
                  </div>
                </div>
              </div>
            )}

            {/* Verification Challenge if required */}
            {riskAssessment.rules.challenge_required && !isVerified && (
              <VerificationChallenge onVerifySuccess={() => setIsVerified(true)} />
            )}

            {/* Actions */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Back to Selection
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmReservation}
                disabled={
                  loading ||
                  queueCountdown > 0 ||
                  (riskAssessment.rules.challenge_required && !isVerified)
                }
              >
                {loading ? (
                  <>
                    <RefreshCw className="spin" size={16} />
                    <span>Acquiring Lock & Reserving...</span>
                  </>
                ) : queueCountdown > 0 ? (
                  `Queue Throttled (${queueCountdown}s)`
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Confirm & Reserve Tickets</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DIGITAL TICKET CONFIRMATION */}
        {step === 3 && bookingConfirmation && (
          <div className="booking-step-content text-center">
            <div className="ticket-success-icon">
              <CheckCircle size={48} className="text-emerald" />
            </div>

            <h3 className="ticket-success-title">Ticket Allocation Confirmed!</h3>
            <p className="ticket-success-desc">
              Your tickets have been secured with pessimistic PostgreSQL transaction locking.
            </p>

            {/* Digital Pass Card */}
            <div className="digital-ticket-card">
              <div className="ticket-header">
                <div className="ticket-pass-type">FAIRPASS DIGITAL ADMISSION</div>
                <div className="ticket-id font-mono">#FP-{bookingConfirmation.booking_id}</div>
              </div>

              <div className="ticket-body">
                <div className="ticket-field">
                  <span className="tf-label">Event</span>
                  <span className="tf-value">{event.title}</span>
                </div>
                <div className="ticket-field-row">
                  <div className="ticket-field">
                    <span className="tf-label">Tier</span>
                    <span className="tf-value">{bookingConfirmation.tier_name}</span>
                  </div>
                  <div className="ticket-field">
                    <span className="tf-label">Seats</span>
                    <span className="tf-value font-mono">{bookingConfirmation.quantity_booked}</span>
                  </div>
                  <div className="ticket-field">
                    <span className="tf-label">Total Paid</span>
                    <span className="tf-value font-mono">${Number(bookingConfirmation.total_price).toFixed(2)}</span>
                  </div>
                </div>
                <div className="ticket-field">
                  <span className="tf-label">Security Audit Stamp</span>
                  <span className="tf-stamp">
                    <Shield size={13} /> VERIFIED FAIR ALLOCATION • NO SCALPING DETECTED
                  </span>
                </div>
              </div>

              {/* Stylized QR Code Visual */}
              <div className="ticket-qr-section">
                <div className="qr-box">
                  <div className="qr-simulated-matrix" />
                </div>
                <span className="qr-code-text font-mono">
                  FAIRPASS-SECURE-TOKEN-{bookingConfirmation.booking_id}-2026
                </span>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '24px' }}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityIndicator() {
  return (
    <span className="activity-indicator">
      <span className="activity-dot" />
      <span className="activity-ping" />
    </span>
  );
}
