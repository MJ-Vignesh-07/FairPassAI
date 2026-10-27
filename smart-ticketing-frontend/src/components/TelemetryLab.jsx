import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Activity, Bot, UserCheck, AlertTriangle, ShieldCheck, Zap, 
  Sliders, Play, RefreshCw, Cpu, Database, CheckCircle2, 
  Clock, AlertCircle, BarChart3, HelpCircle, Layers
} from 'lucide-react';
import { evalRiskApi, getTelemetryDataApi, getEventsApi } from '../api';

export default function TelemetryLab({ events: propEvents = [], currentUser }) {
  const isAdmin = currentUser?.role === 'ADMIN';

  // Active View Tab: 'metrics' (Live Platform Dashboard) vs 'sandbox' (Interactive ML Simulator)
  const [activeTab, setActiveTab] = useState('metrics');

  // Internal events state with fallback if prop is empty
  const [localEvents, setLocalEvents] = useState(Array.isArray(propEvents) ? propEvents : []);

  // Live Telemetry Data State
  const [telemetryData, setTelemetryData] = useState(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);
  const [telemetryError, setTelemetryError] = useState('');

  // ------------------ ML Simulator State ------------------
  const [ticketsRequested, setTicketsRequested] = useState(2);
  const [requestIntervalMs, setRequestIntervalMs] = useState(3800);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(25);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const [selectedEventId, setSelectedEventId] = useState(localEvents[0]?.id || 1);
  const [inferenceResult, setInferenceResult] = useState(null);
  const [loadingInference, setLoadingInference] = useState(false);
  const [inferenceError, setInferenceError] = useState('');

  // Update localEvents if propEvents changes
  useEffect(() => {
    if (Array.isArray(propEvents) && propEvents.length > 0) {
      setLocalEvents(propEvents);
      if (!selectedEventId) {
        setSelectedEventId(propEvents[0]?.id || 1);
      }
    }
  }, [propEvents, selectedEventId]);

  // Load events directly if prop was empty on mount
  useEffect(() => {
    if (!localEvents || localEvents.length === 0) {
      getEventsApi()
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setLocalEvents(data);
            setSelectedEventId(data[0]?.id || 1);
          }
        })
        .catch(() => {
          // Non-blocking: events can be optional for telemetry dashboard
        });
    }
  }, [localEvents]);

  // Fetch Live Telemetry Data from PostgreSQL
  const fetchTelemetry = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingTelemetry(true);
    setTelemetryError('');
    try {
      const data = await getTelemetryDataApi();
      setTelemetryData(data);
    } catch (err) {
      setTelemetryError(err.message || 'Failed to load platform telemetry metrics');
    } finally {
      setLoadingTelemetry(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchTelemetry();
    }
  }, [isAdmin, fetchTelemetry]);

  // Resolve selected event and tier safely
  const selectedEvent = useMemo(() => {
    if (!localEvents || localEvents.length === 0) return null;
    return localEvents.find(e => e.id === Number(selectedEventId)) || localEvents[0];
  }, [localEvents, selectedEventId]);

  const selectedTier = selectedEvent?.tiers?.[0];

  // Simulator Presets
  const applyPreset = (type) => {
    setInferenceError('');
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

  // Run ML Inference in Sandbox
  const handleRunInference = async () => {
    if (!currentUser) {
      setInferenceError('Please sign in before executing ML risk inference.');
      return;
    }

    setLoadingInference(true);
    setInferenceError('');

    const targetEventId = selectedEvent?.id || 1;
    const targetTierId = selectedTier?.id || 1;

    try {
      const data = await evalRiskApi({
        event_id: targetEventId,
        tier_id: targetTierId,
        quantity: Number(ticketsRequested),
        session_id: `lab_sim_${Date.now()}`,
        telemetry: {
          request_interval_ms: Number(requestIntervalMs),
          time_spent_seconds: Number(timeSpentSeconds),
          failed_attempts: Number(failedAttempts)
        }
      });

      setInferenceResult(data);
      // Refresh live telemetry in background so new session is reflected
      fetchTelemetry();
    } catch (err) {
      setInferenceError(err.message || 'Failed to execute ML risk inference');
    } finally {
      setLoadingInference(false);
    }
  };

  // Redirect non-admins to event catalog if component is reached directly
  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          accessDeniedMessage: 'Access Denied: Administrator privileges are required to access Telemetry Lab.'
        }}
      />
    );
  }

  // Compute percentages for risk breakdown
  const riskTotal = telemetryData?.risk_distribution?.total || 0;
  const lowCount = telemetryData?.risk_distribution?.LOW || 0;
  const medCount = telemetryData?.risk_distribution?.MEDIUM || 0;
  const highCount = telemetryData?.risk_distribution?.HIGH || 0;

  const lowPct = riskTotal ? ((lowCount / riskTotal) * 100).toFixed(1) : 0;
  const medPct = riskTotal ? ((medCount / riskTotal) * 100).toFixed(1) : 0;
  const highPct = riskTotal ? ((highCount / riskTotal) * 100).toFixed(1) : 0;

  return (
    <div className="telemetry-lab-wrapper">
      {/* Top Header */}
      <div className="lab-header glass-panel">
        <div className="lab-header-content">
          <div className="lab-badge">
            <Activity size={16} />
            <span>Real-Time Anti-Scalping Telemetry</span>
          </div>
          <h1 className="lab-title">Behavioral Telemetry Lab & Scalper Detection</h1>
          <p className="lab-description">
            Inspect real PostgreSQL behavioral logs, scalper risk distributions, and transactional concurrency locking.
            Simulate human vs bot interaction vectors against our Random Forest classifier.
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="lab-header-controls">
          <div className="lab-view-tabs">
            <button
              type="button"
              className={`lab-tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
              onClick={() => setActiveTab('metrics')}
            >
              <BarChart3 size={15} />
              <span>Live Platform Telemetry</span>
            </button>
            <button
              type="button"
              className={`lab-tab-btn ${activeTab === 'sandbox' ? 'active' : ''}`}
              onClick={() => setActiveTab('sandbox')}
            >
              <Cpu size={15} />
              <span>ML Risk Simulator</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchTelemetry}
            disabled={loadingTelemetry}
          >
            <RefreshCw className={loadingTelemetry ? 'spin' : ''} size={14} />
            <span>Refresh Stats</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: LIVE PLATFORM TELEMETRY & AUDIT STREAM
          ======================================================== */}
      {activeTab === 'metrics' && (
        <div className="telemetry-metrics-section">
          {telemetryError && (
            <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <span>{telemetryError}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={fetchTelemetry}
              >
                Retry
              </button>
            </div>
          )}

          {loadingTelemetry && !telemetryData ? (
            <div className="history-loading-grid">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="booking-card skeleton-card" style={{ height: '140px' }}>
                  <div className="skeleton-line title" />
                  <div className="skeleton-line subtitle" />
                </div>
              ))}
            </div>
          ) : !telemetryData ? (
            <div className="history-empty-state glass-panel">
              <Database size={44} className="empty-icon text-muted" />
              <h3 className="empty-title">Telemetry Engine Offline</h3>
              <p className="empty-desc">
                Unable to retrieve PostgreSQL interaction logs. Ensure the Flask API is connected.
              </p>
              <button type="button" className="btn btn-primary" onClick={fetchTelemetry} style={{ marginTop: '16px' }}>
                <RefreshCw size={15} />
                <span>Reconnect Telemetry</span>
              </button>
            </div>
          ) : (
            <>
              {/* 4 Stat Overview Cards */}
              <div className="telemetry-overview-grid">
                <div className="stat-card glass-panel">
                  <div className="stat-card-header">
                    <span className="stat-title">Total Booking Requests</span>
                    <Activity size={18} className="text-primary" />
                  </div>
                  <div className="stat-value font-mono">
                    {telemetryData.overview.total_booking_requests}
                  </div>
                  <div className="stat-desc">Client sessions monitored in database</div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-card-header">
                    <span className="stat-title">Successful Reservations</span>
                    <CheckCircle2 size={18} className="text-emerald" />
                  </div>
                  <div className="stat-value font-mono text-emerald">
                    {telemetryData.overview.successful_bookings}
                  </div>
                  <div className="stat-desc">Locked transactions committed safely</div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-card-header">
                    <span className="stat-title">Failed / Throttled Attempts</span>
                    <AlertTriangle size={18} className="text-danger" />
                  </div>
                  <div className="stat-value font-mono text-danger">
                    {telemetryData.overview.failed_or_throttled_attempts}
                  </div>
                  <div className="stat-desc">Client rejects, retries, and rate limits</div>
                </div>

                <div className="stat-card glass-panel">
                  <div className="stat-card-header">
                    <span className="stat-title">Suspicious Interventions</span>
                    <ShieldCheck size={18} className="text-cyan" />
                  </div>
                  <div className="stat-value font-mono text-cyan">
                    {telemetryData.overview.suspicious_activity_count}
                  </div>
                  <div className="stat-desc">Medium & High risk bot mitigations</div>
                </div>
              </div>

              {/* 2-Column Split: Risk Distribution & Latency Telemetry */}
              <div className="telemetry-split-grid">
                {/* Risk Distribution Breakdown */}
                <div className="lab-panel glass-panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <BarChart3 size={18} />
                      <span>ML Anti-Scalping Risk Tier Breakdown</span>
                    </div>
                    <span className="panel-tag font-mono">{riskTotal} Assessed Sessions</span>
                  </div>

                  <div className="risk-progress-stack">
                    {/* LOW */}
                    <div className="risk-tier-item">
                      <div className="risk-tier-labels">
                        <span className="tier-badge-label badge-low">
                          <CheckCircle2 size={13} /> LOW RISK (Genuine Fan)
                        </span>
                        <span className="tier-stats font-mono">{lowCount} sessions ({lowPct}%)</span>
                      </div>
                      <div className="score-bar-track">
                        <div className="score-bar-fill fill-low" style={{ width: `${lowPct}%` }} />
                      </div>
                      <span className="tier-enforcement-rule">Rule: Full 4-seat allocation limit • Instant checkout</span>
                    </div>

                    {/* MEDIUM */}
                    <div className="risk-tier-item">
                      <div className="risk-tier-labels">
                        <span className="tier-badge-label badge-medium">
                          <AlertTriangle size={13} /> MEDIUM RISK (Borderline)
                        </span>
                        <span className="tier-stats font-mono">{medCount} sessions ({medPct}%)</span>
                      </div>
                      <div className="score-bar-track">
                        <div className="score-bar-fill fill-medium" style={{ width: `${medPct}%` }} />
                      </div>
                      <span className="tier-enforcement-rule">Rule: 2-seat cap • Secondary CAPTCHA / OTP challenge</span>
                    </div>

                    {/* HIGH */}
                    <div className="risk-tier-item">
                      <div className="risk-tier-labels">
                        <span className="tier-badge-label badge-high">
                          <Bot size={13} /> HIGH RISK (Automated Bot / Script)
                        </span>
                        <span className="tier-stats font-mono">{highCount} sessions ({highPct}%)</span>
                      </div>
                      <div className="score-bar-track">
                        <div className="score-bar-fill fill-high" style={{ width: `${highPct}%` }} />
                      </div>
                      <span className="tier-enforcement-rule">Rule: 1-seat maximum • 30-second queue throttling penalty</span>
                    </div>
                  </div>
                </div>

                {/* Timing & Latency Metrics */}
                <div className="lab-panel glass-panel">
                  <div className="panel-header">
                    <div className="panel-title">
                      <Clock size={18} />
                      <span>Latency & Concurrency Telemetry</span>
                    </div>
                    <span className="panel-tag font-mono">Live Benchmarks</span>
                  </div>

                  <div className="telemetry-timing-list">
                    <div className="timing-item">
                      <div className="timing-info">
                        <span className="timing-name">Average Client Click Interval</span>
                        <span className="timing-desc">Time from page view to reservation click</span>
                      </div>
                      <span className="timing-val font-mono">
                        {telemetryData.timing_metrics.avg_request_interval_ms} ms
                      </span>
                    </div>

                    <div className="timing-item">
                      <div className="timing-info">
                        <span className="timing-name">Average Session Dwell Time</span>
                        <span className="timing-desc">Active dwell time navigating ticket tiers</span>
                      </div>
                      <span className="timing-val font-mono">
                        {telemetryData.timing_metrics.avg_dwell_time_seconds} s
                      </span>
                    </div>

                    <div className="timing-item">
                      <div className="timing-info">
                        <span className="timing-name">Pessimistic Locking Concurrency</span>
                        <span className="timing-desc">Row lock latency via SELECT ... FOR UPDATE</span>
                      </div>
                      <span className="timing-val font-mono text-emerald">
                        {telemetryData.timing_metrics.locking_overhead_ms}
                      </span>
                    </div>

                    <div className="timing-item uninstrumented">
                      <div className="timing-info">
                        <span className="timing-name">Server Hardware Temp / Fan Speed</span>
                        <span className="timing-desc">Physical hardware telemetry</span>
                      </div>
                      <span className="unavail-pill font-mono">Not Instrumented</span>
                    </div>

                    <div className="timing-item uninstrumented">
                      <div className="timing-info">
                        <span className="timing-name">Distributed Jaeger Tracing</span>
                        <span className="timing-desc">Multi-cluster span trace graph</span>
                      </div>
                      <span className="unavail-pill font-mono">Not Instrumented</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Behavioral Interaction Stream */}
              <div className="lab-panel glass-panel" style={{ marginTop: '20px' }}>
                <div className="panel-header">
                  <div className="panel-title">
                    <Layers size={18} />
                    <span>Recent Behavior Telemetry Events (Live PostgreSQL Audit Trail)</span>
                  </div>
                  <span className="panel-tag font-mono">Last {telemetryData.recent_events.length} Interactions</span>
                </div>

                {telemetryData.recent_events.length === 0 ? (
                  <div className="history-empty-state" style={{ padding: '24px' }}>
                    <p className="empty-desc">No interaction events logged yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="telemetry-table">
                      <thead>
                        <tr>
                          <th>Session ID</th>
                          <th>Event Context</th>
                          <th>Seats</th>
                          <th>Click Interval</th>
                          <th>Dwell Time</th>
                          <th>Retries</th>
                          <th>Risk Verdict</th>
                          <th>Policy Enforced</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {telemetryData.recent_events.map((ev) => {
                          const timeStr = ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : 'Just now';
                          return (
                            <tr key={ev.id}>
                              <td className="font-mono text-muted">{ev.session_id}</td>
                              <td className="font-bold">{ev.event_title}</td>
                              <td className="font-mono">{ev.tickets_requested}</td>
                              <td className="font-mono">{ev.request_interval_ms} ms</td>
                              <td className="font-mono">{ev.time_spent_seconds} s</td>
                              <td className="font-mono">{ev.failed_attempts}</td>
                              <td>
                                <span className={`badge-risk badge-risk-${(ev.risk_tier || 'LOW').toLowerCase()}`}>
                                  {ev.risk_tier} ({(ev.risk_score * 100).toFixed(0)}%)
                                </span>
                              </td>
                              <td className="text-muted" style={{ fontSize: '0.82rem' }}>{ev.action_taken}</td>
                              <td className="font-mono text-dim" style={{ fontSize: '0.8rem' }}>{timeStr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: INTERACTIVE ML SIMULATOR (REPAIRED)
          ======================================================== */}
      {activeTab === 'sandbox' && (
        <div className="telemetry-sandbox-section">
          {inferenceError && (
            <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
              <AlertTriangle size={18} />
              <span>{inferenceError}</span>
            </div>
          )}

          {/* Main Grid: Inputs vs Output */}
          <div className="lab-grid">
            {/* Left Column: Feature Vector Tweaker */}
            <div className="lab-panel glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Sliders size={18} />
                  <span>Feature Vector Parameters (Vector x)</span>
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

                {/* Target Event Selector (safe fallback) */}
                {localEvents && localEvents.length > 0 && (
                  <div className="input-group" style={{ marginTop: '16px' }}>
                    <label className="input-label">Target Event Context</label>
                    <select
                      className="input-field"
                      value={selectedEventId}
                      onChange={(e) => setSelectedEventId(e.target.value)}
                    >
                      {localEvents.map(ev => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title} ({ev.tiers?.[0]?.tier_name || 'Standard'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '16px' }}
                  onClick={handleRunInference}
                  disabled={loadingInference}
                >
                  {loadingInference ? (
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
      )}
    </div>
  );
}
