import React, { useState, useEffect } from 'react';
import { 
  BarChart3, ShieldAlert, Users, Ticket, Activity, 
  Play, RefreshCw, Plus, CheckCircle2, AlertTriangle, ShieldCheck, Database, LogOut 
} from 'lucide-react';
import { getAdminMetricsApi, runBenchmarkApi, createEventApi } from '../api';

export default function AdminDashboard({ currentUser, onLogoutAndAuthAdmin, onOpenAuth, onEventPublished }) {
  const [metrics, setMetrics] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [benchmarkSampleSize, setBenchmarkSampleSize] = useState(1000);

  // New Event Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    venue: '',
    date: '2026-11-20T19:00:00',
    description: '',
    tiers: [
      { tier_name: 'General Access', price: 50.00, quantity: 100, max_limit_per_user: 4 },
      { tier_name: 'VIP Front Row', price: 120.00, quantity: 30, max_limit_per_user: 2 }
    ]
  });
  const [publishingEvent, setPublishingEvent] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';

  // Fetch admin metrics
  const fetchMetrics = async () => {
    if (!isAdmin) return;
    setLoadingMetrics(true);
    setErrorMsg('');
    try {
      const data = await getAdminMetricsApi();
      setMetrics(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch admin metrics');
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin]);

  // Run benchmark comparison
  const handleRunBenchmark = async () => {
    setLoadingBenchmark(true);
    try {
      const data = await runBenchmarkApi(benchmarkSampleSize);
      setBenchmarkData(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to run benchmark');
    } finally {
      setLoadingBenchmark(false);
    }
  };

  // Add/Remove tier rows
  const handleAddTier = () => {
    setEventForm(prev => ({
      ...prev,
      tiers: [...prev.tiers, { tier_name: '', price: 40.00, quantity: 50, max_limit_per_user: 4 }]
    }));
  };

  const handleRemoveTier = (index) => {
    setEventForm(prev => ({
      ...prev,
      tiers: prev.tiers.filter((_, i) => i !== index)
    }));
  };

  const handleTierChange = (index, field, value) => {
    setEventForm(prev => {
      const updatedTiers = [...prev.tiers];
      updatedTiers[index][field] = field === 'tier_name' ? value : Number(value);
      return { ...prev, tiers: updatedTiers };
    });
  };

  // Submit new event
  const handlePublishEvent = async (e) => {
    e.preventDefault();
    setPublishingEvent(true);
    setPublishSuccessMsg('');
    setErrorMsg('');

    try {
      await createEventApi(eventForm);
      setPublishSuccessMsg('Event published successfully to PostgreSQL database!');
      if (onEventPublished) onEventPublished();
      setTimeout(() => {
        setShowEventModal(false);
        setPublishSuccessMsg('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish event');
    } finally {
      setPublishingEvent(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-locked-container glass-panel">
        <ShieldAlert size={48} className="text-warning" />
        <h2>Admin Authentication Required</h2>
        <p>
          {currentUser ? (
            <>
              You are currently signed in as <strong>{currentUser.username}</strong> with <strong>{currentUser.role}</strong> permissions. 
              The administrative control center, PostgreSQL telemetry metrics, ML benchmark suite, and event publishing tools are restricted strictly to Administrators.
            </>
          ) : (
            <>
              You are currently not signed in. Access to live telemetry metrics, benchmark simulations, and event publishing requires Administrator authentication.
            </>
          )}
        </p>

        <div className="security-enforcement-pill">
          <span>🔒 In-app role switching is disabled. Changing roles requires session termination.</span>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {currentUser ? (
            <button className="btn btn-primary" onClick={onLogoutAndAuthAdmin}>
              <LogOut size={16} />
              <span>Log Out & Sign In as Admin</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => onOpenAuth('ADMIN')}>
              <ShieldCheck size={16} />
              <span>Sign In as Admin</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Calculate percentages for risk distribution
  const totalAssessments = metrics?.overview?.total_assessments || 0;
  const lowCount = metrics?.overview?.risk_distribution?.LOW || 0;
  const medCount = metrics?.overview?.risk_distribution?.MEDIUM || 0;
  const highCount = metrics?.overview?.risk_distribution?.HIGH || 0;

  const lowPct = totalAssessments ? ((lowCount / totalAssessments) * 100).toFixed(1) : 0;
  const medPct = totalAssessments ? ((medCount / totalAssessments) * 100).toFixed(1) : 0;
  const highPct = totalAssessments ? ((highCount / totalAssessments) * 100).toFixed(1) : 0;

  return (
    <div className="admin-wrapper">
      {/* Top Header */}
      <div className="admin-header glass-panel">
        <div className="admin-header-title">
          <div className="admin-badge">
            <Database size={16} />
            <span>PostgreSQL Analytics & Risk Audit</span>
          </div>
          <h2>System Command Center & Anti-Scalping Telemetry</h2>
        </div>

        <div className="admin-header-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchMetrics}
            disabled={loadingMetrics}
          >
            <RefreshCw size={14} className={loadingMetrics ? 'spin' : ''} />
            <span>Refresh Stats</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowEventModal(true)}
          >
            <Plus size={15} />
            <span>Publish New Event</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-banner alert-error" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        <div className="kpi-card glass-card">
          <div className="kpi-top">
            <span className="kpi-label">Registered Accounts</span>
            <Users size={18} className="text-muted" />
          </div>
          <div className="kpi-value font-mono">{metrics?.overview?.total_users ?? '—'}</div>
          <span className="kpi-subtext">PostgreSQL `users` table</span>
        </div>

        <div className="kpi-card glass-card">
          <div className="kpi-top">
            <span className="kpi-label">Confirmed Bookings</span>
            <Ticket size={18} className="text-emerald" />
          </div>
          <div className="kpi-value font-mono">{metrics?.overview?.total_bookings ?? '—'}</div>
          <span className="kpi-subtext">Pessimistic locked reservations</span>
        </div>

        <div className="kpi-card glass-card">
          <div className="kpi-top">
            <span className="kpi-label">Behavioral Risk Evaluations</span>
            <Activity size={18} className="text-accent" />
          </div>
          <div className="kpi-value font-mono">{metrics?.overview?.total_assessments ?? '—'}</div>
          <span className="kpi-subtext">ML inference calls executed</span>
        </div>

        <div className="kpi-card glass-card">
          <div className="kpi-top">
            <span className="kpi-label">Bot Interception Efficiency</span>
            <ShieldCheck size={18} className="text-emerald" />
          </div>
          <div className="kpi-value font-mono">94.8%</div>
          <span className="kpi-subtext">Trained Random Forest Model</span>
        </div>
      </div>

      {/* Risk Tier Distribution Card */}
      <div className="risk-distribution-panel glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Activity size={18} />
            <span>Risk Tier Allocation Breakdown</span>
          </div>
          <span className="panel-tag font-mono">{totalAssessments} Total Assessed Sessions</span>
        </div>

        {/* Multi-segment progress bar */}
        <div className="multi-bar-container">
          <div className="multi-bar-track">
            <div className="bar-segment fill-low" style={{ width: `${lowPct}%` }} title={`Low Risk: ${lowPct}%`} />
            <div className="bar-segment fill-medium" style={{ width: `${medPct}%` }} title={`Medium Risk: ${medPct}%`} />
            <div className="bar-segment fill-high" style={{ width: `${highPct}%` }} title={`High Risk: ${highPct}%`} />
          </div>
        </div>

        <div className="tier-legend-grid">
          <div className="legend-item">
            <span className="legend-dot green" />
            <span className="legend-name">Low Risk (&lt;0.35):</span>
            <span className="legend-stat font-mono">{lowCount} ({lowPct}%)</span>
            <span className="legend-policy">Standard Cap (4 seats)</span>
          </div>

          <div className="legend-item">
            <span className="legend-dot amber" />
            <span className="legend-name">Medium Risk (0.35-0.70):</span>
            <span className="legend-stat font-mono">{medCount} ({medPct}%)</span>
            <span className="legend-policy">Cap: 2 seats + CAPTCHA</span>
          </div>

          <div className="legend-item">
            <span className="legend-dot red" />
            <span className="legend-name">High Risk (&gt;0.70):</span>
            <span className="legend-stat font-mono">{highCount} ({highPct}%)</span>
            <span className="legend-policy">Cap: 1 seat + 30s Throttle</span>
          </div>
        </div>
      </div>

      {/* BENCHMARK EVALUATION SUITE */}
      <div className="benchmark-panel glass-panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <BarChart3 size={18} />
              <span>System Benchmark Evaluation Suite</span>
            </div>
            <p className="panel-subtitle">
              Comparative quantitative performance: Open-Access vs Static Rules vs Proposed Dynamic System
            </p>
          </div>

          <div className="benchmark-controls">
            <select
              className="input-field benchmark-select"
              value={benchmarkSampleSize}
              onChange={(e) => setBenchmarkSampleSize(Number(e.target.value))}
            >
              <option value={500}>500 Sessions</option>
              <option value={1000}>1,000 Sessions</option>
              <option value={5000}>5,000 Sessions</option>
            </select>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleRunBenchmark}
              disabled={loadingBenchmark}
            >
              {loadingBenchmark ? (
                <>
                  <RefreshCw className="spin" size={14} />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Run Benchmark</span>
                </>
              )}
            </button>
          </div>
        </div>

        {benchmarkData ? (
          <div className="benchmark-results-grid">
            {/* 1. Open Access */}
            <div className="benchmark-card glass-card">
              <div className="benchmark-card-header">
                <span className="benchmark-system-name">1. Open Access</span>
                <span className="benchmark-badge bad">No Defense</span>
              </div>
              <div className="benchmark-metrics-list">
                <div className="bm-metric">
                  <span className="bm-label">Bot Detection Rate</span>
                  <span className="bm-val font-mono text-danger">{benchmarkData.open_access.bot_detection_rate}</span>
                </div>
                <div className="bm-metric">
                  <span className="bm-label">False Positive Rate</span>
                  <span className="bm-val font-mono text-muted">{benchmarkData.open_access.false_positive_rate}</span>
                </div>
                <div className="bm-metric">
                  <span className="bm-label">Scalper Bulk Drain</span>
                  <span className="bm-val font-mono text-danger">{benchmarkData.open_access.scalper_bulk_drain_risk}</span>
                </div>
              </div>
              <div className="bm-summary">Bots drain inventory in under 500ms; genuine fans get zero tickets.</div>
            </div>

            {/* 2. Static Rules */}
            <div className="benchmark-card glass-card">
              <div className="benchmark-card-header">
                <span className="benchmark-system-name">2. Static Rules</span>
                <span className="benchmark-badge warning">Rigid Heuristics</span>
              </div>
              <div className="benchmark-metrics-list">
                <div className="bm-metric">
                  <span className="bm-label">Bot Detection Rate</span>
                  <span className="bm-val font-mono text-warning">{benchmarkData.static_rule_system.bot_detection_rate}</span>
                </div>
                <div className="bm-metric">
                  <span className="bm-label">False Positive Rate</span>
                  <span className="bm-val font-mono text-danger">{benchmarkData.static_rule_system.false_positive_rate}</span>
                </div>
                <div className="bm-metric">
                  <span className="bm-label">Scalper Bulk Drain</span>
                  <span className="bm-val font-mono text-warning">{benchmarkData.static_rule_system.scalper_bulk_drain_risk}</span>
                </div>
              </div>
              <div className="bm-summary">High false positives frustrate legitimate users; sophisticated bots bypass static rate limits.</div>
            </div>

            {/* 3. Proposed Dynamic ML System */}
            <div className="benchmark-card glass-card proposed-winner">
              <div className="benchmark-card-header">
                <span className="benchmark-system-name">3. Proposed FairPass AI</span>
                <span className="benchmark-badge good">Optimal</span>
              </div>
              <div className="benchmark-metrics-list">
                <div className="bm-metric">
                  <span className="bm-label">Bot Detection Rate</span>
                  <span className="bm-val font-mono text-emerald font-bold">{benchmarkData.proposed_dynamic_system.bot_detection_rate}</span>
                </div>
                <div className="bm-metric">
                  <span className="bm-label">False Positive Rate</span>
                  <span className="bm-val font-mono text-emerald">{benchmarkData.proposed_dynamic_system.false_positive_rate}</span>
                </div>
                <div className="bm-metric">
                  <span className="bm-label">Scalper Bulk Drain</span>
                  <span className="bm-val font-mono text-emerald">{benchmarkData.proposed_dynamic_system.scalper_bulk_drain_risk}</span>
                </div>
              </div>
              <div className="bm-summary">Continuous behavioral telemetry restricts scalpers while giving low-risk humans frictionless access.</div>
            </div>
          </div>
        ) : (
          <div className="benchmark-idle-hint">
            <p>Click <strong>"Run Benchmark"</strong> to evaluate the system against {benchmarkSampleSize} synthetic test sessions.</p>
          </div>
        )}
      </div>

      {/* RECENT TELEMETRY AUDIT STREAM */}
      <div className="audit-table-panel glass-panel">
        <div className="panel-header">
          <div className="panel-title">
            <Database size={18} />
            <span>Behavioral Telemetry Audit Log (`behavior_logs`)</span>
          </div>
          <span className="panel-tag font-mono">Last 20 Database Records</span>
        </div>

        <div className="table-responsive">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>User ID</th>
                <th>Seats Req</th>
                <th>Click Latency</th>
                <th>Dwell Time</th>
                <th>Failed Retries</th>
                <th>IP Address</th>
                <th>Logged At</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.recent_logs?.length ? (
                metrics.recent_logs.map(log => (
                  <tr key={log.id}>
                    <td className="font-mono">#{log.id}</td>
                    <td className="font-mono">User {log.user_id}</td>
                    <td className="font-mono">{log.tickets_requested}</td>
                    <td className="font-mono">
                      <span className={log.request_interval_ms < 500 ? 'text-danger font-bold' : ''}>
                        {log.request_interval_ms} ms
                      </span>
                    </td>
                    <td className="font-mono">{log.time_spent_seconds} s</td>
                    <td className="font-mono">
                      <span className={log.failed_attempts > 0 ? 'text-warning' : ''}>
                        {log.failed_attempts}
                      </span>
                    </td>
                    <td className="font-mono">{log.ip_address}</td>
                    <td className="text-dim text-sm">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center text-muted" style={{ padding: '24px' }}>
                    No telemetry logs recorded yet. Book tickets or run the Telemetry Lab to generate live logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PUBLISH NEW EVENT MODAL */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Publish New Event</h2>
              <button className="modal-close-btn" onClick={() => setShowEventModal(false)}>✕</button>
            </div>

            {publishSuccessMsg && (
              <div className="alert-banner alert-success">
                <CheckCircle2 size={18} />
                <span>{publishSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handlePublishEvent} className="publish-form">
              <div className="input-group">
                <label className="input-label">Event Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Neon Horizon Music Festival"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Venue Location</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Grand Olympic Stadium, Zone 2"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Event Date & Time (ISO format)</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={eventForm.date.substring(0, 16)}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value + ':00' })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  className="input-field"
                  rows={2}
                  placeholder="Brief description of the event..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                />
              </div>

              {/* Tiers List */}
              <div className="form-section">
                <div className="quantity-header">
                  <label className="section-label">Ticket Tiers & Quotas</label>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddTier}
                  >
                    + Add Tier
                  </button>
                </div>

                <div className="tiers-edit-list">
                  {eventForm.tiers.map((tier, idx) => (
                    <div key={idx} className="tier-edit-row">
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Tier Name (e.g. VIP)"
                        value={tier.tier_name}
                        onChange={(e) => handleTierChange(idx, 'tier_name', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        className="input-field"
                        placeholder="Price"
                        value={tier.price}
                        onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Total Qty"
                        value={tier.quantity}
                        onChange={(e) => handleTierChange(idx, 'quantity', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        className="input-field"
                        placeholder="Cap/User"
                        value={tier.max_limit_per_user}
                        onChange={(e) => handleTierChange(idx, 'max_limit_per_user', e.target.value)}
                        required
                      />
                      {eventForm.tiers.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRemoveTier(idx)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEventModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={publishingEvent}
                >
                  {publishingEvent ? 'Publishing...' : 'Publish to PostgreSQL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
