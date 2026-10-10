import React, { useState } from 'react';
import { Search, Calendar, MapPin, Ticket, ShieldCheck, Plus, RefreshCw, AlertCircle } from 'lucide-react';

export default function EventCatalog({ events, loading, onRefresh, onSelectEvent, onOpenCreateEvent, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);

  // Filter events
  const filteredEvents = events.filter((ev) => {
    const matchesSearch = 
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterAvailableOnly) {
      const hasAvailable = ev.tiers.some(t => t.available_quantity > 0);
      return hasAvailable;
    }
    return true;
  });

  const formatDate = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="catalog-wrapper">
      {/* Hero Banner with Anti-Scalping Value Prop */}
      <div className="hero-banner glass-panel">
        <div className="hero-content">
          <div className="hero-badge">
            <ShieldCheck size={16} />
            <span>AI-Powered Behavioral Anti-Scalping Engine Active</span>
          </div>
          <h1 className="hero-title">
            Fair Ticket Distribution for Genuine Fans
          </h1>
          <p className="hero-description">
            Say goodbye to scalper bots draining inventory in milliseconds. Our real-time machine learning telemetry 
            engine monitors purchase velocity and applies dynamic tier limits so real fans get real seats.
          </p>

          <div className="hero-metrics-pills">
            <div className="hero-pill">
              <span className="pill-dot green" />
              <span>94.8% Bot Interception</span>
            </div>
            <div className="hero-pill">
              <span className="pill-dot blue" />
              <span>Pessimistic Locking (SELECT FOR UPDATE)</span>
            </div>
            <div className="hero-pill">
              <span className="pill-dot purple" />
              <span>Continuous ML Risk Scoring (0.0 to 1.0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Admin Actions */}
      <div className="catalog-controls-bar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search events, artists, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="control-actions">
          <label className="checkbox-toggle">
            <input
              type="checkbox"
              checked={filterAvailableOnly}
              onChange={(e) => setFilterAvailableOnly(e.target.checked)}
            />
            <span>Available Seats Only</span>
          </label>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            title="Refresh inventory"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {currentUser?.role === 'ADMIN' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onOpenCreateEvent}
            >
              <Plus size={15} />
              <span>Publish Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="events-loading-state">
          <RefreshCw className="spin" size={32} />
          <p>Loading live event inventory from PostgreSQL...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="events-empty-state glass-panel">
          <AlertCircle size={40} className="text-muted" />
          <h3>No events found</h3>
          <p>Try clearing your search query or publish a new event as administrator.</p>
          {currentUser?.role === 'ADMIN' && (
            <button className="btn btn-primary" onClick={onOpenCreateEvent}>
              <Plus size={16} /> Publish First Event
            </button>
          )}
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((ev) => {
            const totalRemaining = ev.tiers.reduce((acc, t) => acc + t.available_quantity, 0);
            const minPrice = ev.tiers.length ? Math.min(...ev.tiers.map(t => Number(t.price))) : 0;

            return (
              <div key={ev.id} className="event-card glass-card">
                <div className="event-card-header">
                  <div className="event-date-badge">
                    <Calendar size={13} />
                    <span>{formatDate(ev.event_date)}</span>
                  </div>
                  <div className={`event-availability-badge ${totalRemaining > 0 ? 'in-stock' : 'sold-out'}`}>
                    {totalRemaining > 0 ? `${totalRemaining} Seats Left` : 'Sold Out'}
                  </div>
                </div>

                <div className="event-card-body">
                  <h3 className="event-title">{ev.title}</h3>
                  <div className="event-venue">
                    <MapPin size={14} />
                    <span>{ev.venue}</span>
                  </div>
                  <p className="event-desc">{ev.description || 'Exclusive live entertainment experience.'}</p>

                  {/* Ticket Tiers Preview */}
                  <div className="event-tiers-preview">
                    <div className="tiers-preview-title">Available Tiers:</div>
                    <div className="tiers-tags-list">
                      {ev.tiers.map(t => (
                        <div key={t.id} className="tier-pill">
                          <span className="tier-pill-name">{t.tier_name}</span>
                          <span className="tier-pill-price font-mono">${Number(t.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="event-card-footer">
                  <div className="event-price-from">
                    <span className="price-label">Starts at</span>
                    <span className="price-amount font-mono">${minPrice.toFixed(2)}</span>
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => onSelectEvent(ev)}
                    disabled={totalRemaining === 0}
                  >
                    <Ticket size={16} />
                    <span>{totalRemaining > 0 ? 'Reserve Seats' : 'Sold Out'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
