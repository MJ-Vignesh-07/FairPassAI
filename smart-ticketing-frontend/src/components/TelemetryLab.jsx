import React, { useState } from 'react';
import { Activity, Bot, UserCheck, AlertTriangle, ShieldCheck, Zap, Sliders, Play, RefreshCw, Cpu } from 'lucide-react';
import { evalRiskApi } from '../api';

export default function TelemetryLab({ events, currentUser }) {
  // Telemetry Vector inputs
  const [ticketsRequested, setTicketsRequested] = useState(2);
  const [requestIntervalMs, setRequestIntervalMs] = useState(3800);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(25);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Selected event and tier for testing
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || 1);
  const selectedEvent = events.find(e => e.id === Number(selectedEventId)) || events[0];
  const selectedTier = selectedEvent?.tiers?.[0];

  // Inference Results
  const [inferenceResult, setInferenceResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Presets
  const applyPreset = (type) => {
    setErrorMsg('');
    if (type === 'GENUINE') {
      setTicketsRequested(2);
      setRequestIntervalMs(4200);
      setTimeSpentSeconds(32);
      setFailedAttempts(0);
    } else if (type === 'IMPATIENT') {
      setTicketsRequested(3);
      setRequestIntervalMs(850);
      setTimeSpentSeconds(6);
      setFailedAttempts(1);
    } else if (type === 'SCALPER_BOT') {
      setTicketsRequested(4);
      setRequestIntervalMs(90);
      setTimeSpentSeconds(1);
      setFailedAttempts(3);
    }
  };

  const handleRunInference = async () => {
    if (!currentUser) {
      setErrorMsg('Please sign in before executing ML risk inference.');
      return;
    }

    if (!selectedTier) {
      setErrorMsg('No active ticket tiers found to test against.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await evalRiskApi({
        event_id: selectedEvent.id,
        tier_id: selectedTier.id,
        quantity: Number(ticketsRequested),
        session_id: `lab_sim_${Date.now()}`,
        telemetry: {
          request_interval_ms: Number(requestIntervalMs),
          time_spent_seconds: Number(timeSpentSeconds),
          failed_attempts: Number(failedAttempts)
        }
      });

      setInferenceResult(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to execute ML risk inference');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="telemetry-lab-wrapper">
      {/* Header */}
      <div className="lab-header glass-panel">
        <div className="lab-header-content">
          <div className="lab-badge">
            <Cpu size={16} />
            <span>Interactive Anti-Scalping ML Sandbox</span>
          </div>
          <h2 className="lab-title">Behavioral Risk Scoring & Rule Engine Simulator</h2>
          <p className="lab-description">
            Experiment with client-side telemetry vectors in real-time. See how the pre-trained Random Forest model
            and dynamic allocation protocol respond to varied human vs bot behavioral signatures.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid: Inputs vs Output */}
      <div className="lab-grid">
        {/* Left Column: Feature Vector Tweaker */}
        <div className="lab-panel glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Sliders size={18} />
              <span>Feature Vector Parameters ($\vec{x}$)</span>
            </div>
            <span className="panel-tag font-mono">5 Telemetry Dimensions</span>
          </div>

          {/* Quick Presets */}
          <div className="presets-row">
            <span className="presets-label">Quick Presets:</span>
            <button
              type="button"
              className="preset-btn btn-genuine"
              onClick={() => applyPreset('GENUINE')}
            >
              <UserCheck size={14} /> Genuine Fan
            </button>
            <button
              type="button"
              className="preset-btn btn-borderline"
              onClick={() => applyPreset('IMPATIENT')}
            >
              <Zap size={14} /> Impatient User
            </button>
            <button
              type="button"
              className="preset-btn btn-bot"
              onClick={() => applyPreset('SCALPER_BOT')}
            >
              <Bot size={14} /> Scalper Script
            </button>
          </div>

          <div className="lab-form">
            {/* 1. Tickets Requested */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span className="slider-name">tickets_requested</span>
                <span className="slider-value font-mono">{ticketsRequested} seats</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={ticketsRequested}
                onChange={(e) => setTicketsRequested(Number(e.target.value))}
                className="range-input"
              />
              <div className="slider-subtext">Number of tickets requested in single checkout burst</div>
            </div>

            {/* 2. Request Interval */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span className="slider-name">request_interval_ms</span>
                <span className="slider-value font-mono">{requestIntervalMs} ms</span>
              </div>
              <input
                type="range"
                min="30"
                max="8000"
                step="50"
                value={requestIntervalMs}
                onChange={(e) => setRequestIntervalMs(Number(e.target.value))}
                className="range-input"
              />
              <div className="slider-subtext">Latency between page render and booking click (Bots: &lt;200ms)</div>
            </div>

            {/* 3. Time Spent */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span className="slider-name">time_spent_seconds</span>
                <span className="slider-value font-mono">{timeSpentSeconds} seconds</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={timeSpentSeconds}
                onChange={(e) => setTimeSpentSeconds(Number(e.target.value))}
                className="range-input"
              />
              <div className="slider-subtext">Active dwell time on the event and tier selection screen</div>
            </div>

            {/* 4. Failed Attempts */}
            <div className="slider-group">
              <div className="slider-label-row">
                <span className="slider-name">failed_attempts</span>
                <span className="slider-value font-mono">{failedAttempts} rejects</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="1"
                value={failedAttempts}
                onChange={(e) => setFailedAttempts(Number(e.target.value))}
                className="range-input"
              />
              <div className="slider-subtext">Repeated rapid failure or canceled booking count in session</div>
            </div>

            {/* Target Event Selector */}
            {events.length > 0 && (
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label className="input-label">Target Event Context</label>
                <select
                  className="input-field"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.tiers?.[0]?.tier_name || 'General'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '12px' }}
              onClick={handleRunInference}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="spin" size={18} />
                  <span>Computing Random Forest Inference...</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span>Execute ML Risk Evaluation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Model Output & Tier Protocol */}
        <div className="lab-panel glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Activity size={18} />
              <span>Model Inference & Policy Enforcement Verdict</span>
            </div>
            <span className="panel-tag font-mono">Joblib Pipeline</span>
          </div>

          {inferenceResult ? (
            <div className="inference-results-view">
              {/* Verdict Header Card */}
              <div className={`verdict-hero-card border-${inferenceResult.risk_tier.toLowerCase()}`}>
                <div className="verdict-tier-row">
                  <span className="verdict-label">Assigned Risk Tier</span>
                  <span className={`badge badge-${inferenceResult.risk_tier.toLowerCase()}`}>
                    {inferenceResult.risk_tier} RISK
                  </span>
                </div>

                <div className="verdict-score-display">
                  <div className="score-num font-mono">
                    {(inferenceResult.risk_score * 100).toFixed(1)}%
                  </div>
                  <div className="score-label">Scalper Probability Score [0.0 - 1.0]</div>
                </div>

                {/* Animated Score Track */}
                <div className="score-bar-track">
                  <div
                    className={`score-bar-fill fill-${inferenceResult.risk_tier.toLowerCase()}`}
                    style={{ width: `${Math.min(100, Math.max(5, inferenceResult.risk_score * 100))}%` }}
                  />
                </div>
              </div>

              {/* Protocol Enforcement Table */}
              <div className="protocol-breakdown-card">
                <h4 className="breakdown-title">Tiered Fair Allocation Protocol Output:</h4>
                <div className="protocol-items-grid">
                  <div className="protocol-item">
                    <span className="pi-label">Seat Cap Allocated</span>
                    <span className="pi-val font-mono">
                      Max {inferenceResult.rules.max_cap} Ticket(s)
                    </span>
                  </div>

                  <div className="protocol-item">
                    <span className="pi-label">Challenge Gate</span>
                    <span className="pi-val">
                      {inferenceResult.rules.challenge_required ? (
                        <span className="text-warning">Enforced (CAPTCHA/OTP)</span>
                      ) : (
                        <span className="text-success">Bypassed (Fast Checkout)</span>
                      )}
                    </span>
                  </div>

                  <div className="protocol-item">
                    <span className="pi-label">Queue Throttle Delay</span>
                    <span className="pi-val font-mono">
                      {inferenceResult.rules.queue_delay_seconds > 0 ? (
                        <span className="text-danger">{inferenceResult.rules.queue_delay_seconds} Seconds</span>
                      ) : (
                        <span className="text-success">0 Seconds (Instant)</span>
                      )}
                    </span>
                  </div>

                  <div className="protocol-item">
                    <span className="pi-label">Telemetry Log Entry</span>
                    <span className="pi-val font-mono">
                      #LogID {inferenceResult.log_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Theoretical Analysis Note */}
              <div className="heuristic-note">
                <strong>Why this decision?</strong>
                {inferenceResult.risk_tier === 'LOW' && (
                  <p>
                    The session shows realistic human dwell time ({timeSpentSeconds}s) and standard click latency ({requestIntervalMs}ms).
                    High confidence of genuine fan intent grants full standard ticket cap ({inferenceResult.rules.max_cap} seats) with direct checkout.
                  </p>
                )}
                {inferenceResult.risk_tier === 'MEDIUM' && (
                  <p>
                    Metrics fall into intermediate thresholds (e.g. quick click or prior retry). The protocol limits exposure by reducing 
                    purchase cap to {inferenceResult.rules.max_cap} seats and requiring a secondary verification challenge.
                  </p>
                )}
                {inferenceResult.risk_tier === 'HIGH' && (
                  <p>
                    Aggressive automated patterns detected: Sub-second submission ({requestIntervalMs}ms) and rapid request frequency.
                    The engine throttles requests with a 30s delay and restricts bulk checkout to 1 seat max.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="inference-placeholder">
              <Activity size={48} className="placeholder-icon text-muted" />
              <h3>Ready to Evaluate Telemetry</h3>
              <p>
                Select a preset on the left or customize the parameters, then click 
                <strong> "Execute ML Risk Evaluation"</strong> to run synchronous inference through Flask.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
