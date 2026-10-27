import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Ticket, Calendar, MapPin, Clock, Download, Eye, 
  CheckCircle2, AlertCircle, XCircle, RefreshCw, 
  Search, Sparkles, Shield, X, ArrowUpDown
} from 'lucide-react';
import { getMyBookingsApi, downloadTicketPdfApi } from '../api';

export default function BookingHistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Filtering & Sorting State
  const [activeTab, setActiveTab] = useState('upcoming'); // 'all', 'upcoming', 'past'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('eventDateAsc'); // 'eventDateAsc', 'eventDateDesc', 'bookingDateDesc', 'bookingDateAsc'
  
  // Selected Booking for Details Modal
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState(null);

  // Per-booking download loading state tracker: { [bookingId]: boolean }
  const [downloadingMap, setDownloadingMap] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null); // { type: 'success'|'error', text: string }

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getMyBookingsApi();
      setBookings(data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleDownloadPdf = async (bookingId, e) => {
    if (e) e.stopPropagation();
    setDownloadingMap(prev => ({ ...prev, [bookingId]: true }));
    setActionFeedback(null);
    try {
      await downloadTicketPdfApi(bookingId);
      setActionFeedback({
        type: 'success',
        text: `Ticket #FP-${String(bookingId).padStart(6, '0')} downloaded successfully!`
      });
      setTimeout(() => setActionFeedback(null), 5000);
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.message || 'Failed to download ticket PDF'
      });
      setTimeout(() => setActionFeedback(null), 6000);
    } finally {
      setDownloadingMap(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  // Compute Categories Counts
  const counts = useMemo(() => {
    const total = bookings.length;
    let upcoming = 0;
    let past = 0;
    let cancelled = 0;

    bookings.forEach(b => {
      const isCancelled = (b.status || '').toUpperCase() === 'CANCELLED';
      if (isCancelled) {
        cancelled++;
      } else if (b.event?.is_past) {
        past++;
      } else {
        upcoming++;
      }
    });

    return { total, upcoming, past, cancelled };
  }, [bookings]);

  // Filtered and Sorted Bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter(b => {
        const isCancelled = (b.status || '').toUpperCase() === 'CANCELLED';
        
        // Tab filtering
        if (activeTab === 'upcoming') {
          if (isCancelled || b.event?.is_past) return false;
        } else if (activeTab === 'past') {
          if (isCancelled || !b.event?.is_past) return false;
        } else if (activeTab === 'cancelled') {
          if (!isCancelled) return false;
        }

        // Search query filtering
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const titleMatch = b.event?.title?.toLowerCase().includes(q);
          const venueMatch = b.event?.venue?.toLowerCase().includes(q);
          const tierMatch = b.tier?.tier_name?.toLowerCase().includes(q);
          const idMatch = String(b.id).includes(q) || b.ticket_id?.toLowerCase().includes(q);
          return titleMatch || venueMatch || tierMatch || idMatch;
        }

        return true;
      })
      .sort((a, b) => {
        const aEventDate = a.event?.event_date ? new Date(a.event.event_date).getTime() : 0;
        const bEventDate = b.event?.event_date ? new Date(b.event.event_date).getTime() : 0;
        const aBookingDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bBookingDate = b.created_at ? new Date(b.created_at).getTime() : 0;

        switch (sortBy) {
          case 'eventDateAsc':
            return aEventDate - bEventDate;
          case 'eventDateDesc':
            return bEventDate - aEventDate;
          case 'bookingDateDesc':
            return bBookingDate - aBookingDate;
          case 'bookingDateAsc':
            return aBookingDate - bBookingDate;
          default:
            return bBookingDate - aBookingDate;
        }
      });
  }, [bookings, activeTab, searchQuery, sortBy]);

  return (
    <div className="booking-history-container">
      {/* Page Header */}
      <div className="history-header glass-panel">
        <div className="history-header-left">
          <div className="history-badge">
            <Ticket size={16} />
            <span>Digital Ticket Wallet</span>
          </div>
          <h1 className="history-title">My Booking History</h1>
          <p className="history-subtitle">
            View all confirmed event reservations, inspect anti-scalping allocations, and download official PDF admission passes.
          </p>
        </div>

        <div className="history-header-actions">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={loadBookings}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'spin' : ''} size={15} />
            <span>Refresh</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/')}
          >
            <Sparkles size={15} />
            <span>Browse Events</span>
          </button>
        </div>
      </div>

      {/* Global Toast / Feedback Banner */}
      {actionFeedback && (
        <div className={`alert-banner ${actionFeedback.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ margin: '16px 0' }}>
          {actionFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{actionFeedback.text}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert-banner alert-error" style={{ margin: '16px 0' }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            style={{ marginLeft: 'auto' }}
            onClick={loadBookings}
          >
            Retry
          </button>
        </div>
      )}

      {/* Control Bar: Categories & Search */}
      <div className="history-controls-bar">
        {/* Category Tabs */}
        <div className="history-tabs">
          <button
            type="button"
            className={`history-tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <Calendar size={15} />
            <span>Upcoming Events</span>
            <span className="tab-pill">{counts.upcoming}</span>
          </button>

          <button
            type="button"
            className={`history-tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            <Clock size={15} />
            <span>Past Events</span>
            <span className="tab-pill">{counts.past}</span>
          </button>

          <button
            type="button"
            className={`history-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Ticket size={15} />
            <span>All Bookings</span>
            <span className="tab-pill">{counts.total}</span>
          </button>

          {counts.cancelled > 0 && (
            <button
              type="button"
              className={`history-tab-btn tab-cancelled ${activeTab === 'cancelled' ? 'active' : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              <XCircle size={15} />
              <span>Cancelled</span>
              <span className="tab-pill pill-red">{counts.cancelled}</span>
            </button>
          )}
        </div>

        {/* Search & Sort */}
        <div className="history-filter-group">
          <div className="history-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search by event, venue, or ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="history-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="history-sort-box">
            <ArrowUpDown size={14} className="sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="history-sort-select"
            >
              <option value="eventDateAsc">Event Date: Earliest First</option>
              <option value="eventDateDesc">Event Date: Latest First</option>
              <option value="bookingDateDesc">Booking Date: Newest First</option>
              <option value="bookingDateAsc">Booking Date: Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List / Grid Content */}
      {loading ? (
        <div className="history-loading-grid">
          {[1, 2, 3].map(n => (
            <div key={n} className="booking-card skeleton-card">
              <div className="skeleton-line title" />
              <div className="skeleton-line subtitle" />
              <div className="skeleton-grid" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="history-empty-state glass-panel">
          <div className="empty-icon-box">
            <Ticket size={48} className="empty-icon" />
          </div>
          {bookings.length === 0 ? (
            <>
              <h3 className="empty-title">No Bookings Found</h3>
              <p className="empty-desc">
                You haven't booked any event tickets yet. Explore our high-demand events protected by FairPass AI and secure your seats today.
              </p>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => navigate('/')}
                style={{ marginTop: '16px' }}
              >
                <Sparkles size={16} />
                <span>Browse Available Events</span>
              </button>
            </>
          ) : (
            <>
              <h3 className="empty-title">No Events in this Category</h3>
              <p className="empty-desc">
                {searchQuery 
                  ? `No bookings match your search query "${searchQuery}". Try a different keyword.` 
                  : activeTab === 'upcoming' 
                    ? 'You have no upcoming events booked at this moment.' 
                    : activeTab === 'past' 
                      ? 'You have no past event records in your history.' 
                      : 'No records found for the selected filter.'}
              </p>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
                style={{ marginTop: '14px' }}
              >
                Reset Filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="history-cards-grid">
          {filteredBookings.map((b) => {
            const isConfirmed = (b.status || '').toUpperCase() === 'CONFIRMED';
            const isCancelled = (b.status || '').toUpperCase() === 'CANCELLED';
            const isDownloading = downloadingMap[b.id] || false;

            const eventDateFormatted = b.event?.event_date 
              ? new Date(b.event.event_date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'TBA';

            const eventTimeFormatted = b.event?.event_date
              ? new Date(b.event.event_date).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '';

            const bookingDateFormatted = b.created_at
              ? new Date(b.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Confirmed';

            return (
              <div 
                key={b.id} 
                className={`booking-card glass-panel ${isCancelled ? 'card-cancelled' : ''}`}
                onClick={() => setSelectedBookingForDetails(b)}
              >
                {/* Card Top / Header */}
                <div className="booking-card-top">
                  <div className="b-id-pill font-mono">
                    #{b.ticket_id || `FP-${String(b.id).padStart(6, '0')}`}
                  </div>

                  <div className="b-status-badges">
                    {isCancelled ? (
                      <span className="badge badge-cancelled">
                        <XCircle size={12} /> Cancelled
                      </span>
                    ) : b.event?.is_past ? (
                      <span className="badge badge-past">
                        <Clock size={12} /> Past Event
                      </span>
                    ) : (
                      <span className="badge badge-confirmed">
                        <CheckCircle2 size={12} /> Confirmed
                      </span>
                    )}

                    <span className={`badge-risk badge-risk-${(b.risk_tier || 'LOW').toLowerCase()}`} title="FairPass Anti-Scalping Risk Tier">
                      {b.risk_tier} RISK
                    </span>
                  </div>
                </div>

                {/* Event Title & Venue */}
                <div className="booking-card-main">
                  <h3 className="b-event-title">{b.event?.title || 'Event Title Unavailable'}</h3>
                  
                  <div className="b-meta-line">
                    <Calendar size={14} className="text-primary" />
                    <span>{eventDateFormatted} {eventTimeFormatted ? `• ${eventTimeFormatted}` : ''}</span>
                  </div>

                  <div className="b-meta-line">
                    <MapPin size={14} className="text-cyan" />
                    <span className="truncate">{b.event?.venue || 'Venue Location'}</span>
                  </div>
                </div>

                {/* Reservation Summary Strip */}
                <div className="booking-details-strip">
                  <div className="strip-item">
                    <span className="strip-label">Tier</span>
                    <span className="strip-value">{b.tier?.tier_name || 'Standard'}</span>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">Tickets</span>
                    <span className="strip-value font-mono">{b.quantity} {b.quantity === 1 ? 'Seat' : 'Seats'}</span>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">Total Paid</span>
                    <span className="strip-value font-mono">${Number(b.total_price).toFixed(2)}</span>
                  </div>
                  <div className="strip-item">
                    <span className="strip-label">Booked On</span>
                    <span className="strip-value font-mono text-muted">{bookingDateFormatted}</span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="booking-card-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBookingForDetails(b);
                    }}
                  >
                    <Eye size={14} />
                    <span>View Details</span>
                  </button>

                  {isConfirmed && (
                    <button
                      type="button"
                      className="btn btn-download-pdf btn-sm"
                      onClick={(e) => handleDownloadPdf(b.id, e)}
                      disabled={isDownloading}
                      title="Download printable high-resolution PDF ticket"
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="spin" size={14} />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          <span>Download Ticket PDF</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBookingForDetails && (
        <BookingDetailModal
          booking={selectedBookingForDetails}
          onClose={() => setSelectedBookingForDetails(null)}
          onDownloadPdf={(id) => handleDownloadPdf(id)}
          isDownloading={downloadingMap[selectedBookingForDetails.id] || false}
        />
      )}
    </div>
  );
}

/**
 * Reusable modal showcasing full ticket pass, security audit, and ticket download
 */
function BookingDetailModal({ booking, onClose, onDownloadPdf, isDownloading }) {
  const isConfirmed = (booking.status || '').toUpperCase() === 'CONFIRMED';
  const isCancelled = (booking.status || '').toUpperCase() === 'CANCELLED';

  const eventDateFormatted = booking.event?.event_date 
    ? new Date(booking.event.event_date).toLocaleString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Date TBA';

  const bookingDateFormatted = booking.created_at
    ? new Date(booking.created_at).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Confirmed';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel modal-booking-detail" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">Booking Details & Pass</h2>
            <div className="modal-subtitle">
              Reference: <span className="highlight-text font-mono">#{booking.ticket_id || `FP-${String(booking.id).padStart(6, '0')}`}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scrollable">
          {/* Digital Pass Presentation */}
          <div className="digital-ticket-card" style={{ margin: '0 auto 20px' }}>
            <div className="ticket-header">
              <div className="ticket-pass-type">FAIRPASS OFFICIAL ADMISSION</div>
              <div className="ticket-id font-mono">#{booking.ticket_id || `FP-${String(booking.id).padStart(6, '0')}`}</div>
            </div>

            <div className="ticket-body">
              <div className="ticket-field">
                <span className="tf-label">Event</span>
                <span className="tf-value">{booking.event?.title}</span>
              </div>

              {booking.event?.description && (
                <div className="ticket-field">
                  <span className="tf-label">About Event</span>
                  <p className="tf-desc">{booking.event.description}</p>
                </div>
              )}

              <div className="ticket-field-row">
                <div className="ticket-field">
                  <span className="tf-label">Date & Time</span>
                  <span className="tf-value" style={{ fontSize: '0.88rem' }}>{eventDateFormatted}</span>
                </div>
              </div>

              <div className="ticket-field">
                <span className="tf-label">Venue</span>
                <span className="tf-value" style={{ fontSize: '0.92rem' }}>{booking.event?.venue}</span>
              </div>

              <div className="ticket-field-row">
                <div className="ticket-field">
                  <span className="tf-label">Ticket Tier</span>
                  <span className="tf-value">{booking.tier?.tier_name}</span>
                </div>
                <div className="ticket-field">
                  <span className="tf-label">Seats</span>
                  <span className="tf-value font-mono">{booking.quantity}</span>
                </div>
                <div className="ticket-field">
                  <span className="tf-label">Amount</span>
                  <span className="tf-value font-mono">${Number(booking.total_price).toFixed(2)}</span>
                </div>
              </div>

              <div className="ticket-field-row">
                <div className="ticket-field">
                  <span className="tf-label">Attendee Name</span>
                  <span className="tf-value" style={{ fontSize: '0.9rem' }}>{booking.user?.username || 'Attendee'}</span>
                </div>
                <div className="ticket-field">
                  <span className="tf-label">Status</span>
                  <span className="tf-value" style={{ fontSize: '0.9rem', color: isCancelled ? '#f43f5e' : '#10b981' }}>
                    {booking.status}
                  </span>
                </div>
              </div>

              <div className="ticket-field">
                <span className="tf-label">Security Audit Stamp</span>
                <span className="tf-stamp">
                  <Shield size={13} /> ANTI-SCALPING CHECK: PASSED • RISK TIER: {booking.risk_tier}
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="ticket-qr-section">
              <div className="qr-box">
                <div className="qr-simulated-matrix" />
              </div>
              <span className="qr-code-text font-mono">
                FAIRPASS-SECURE-TOKEN-{booking.id}-{booking.event?.id || 1}-2026
              </span>
            </div>
          </div>

          {/* Additional Metadata Info Grid */}
          <div className="detail-info-grid">
            <div className="detail-info-item">
              <span className="d-label">Booking Timestamp</span>
              <span className="d-value font-mono">{bookingDateFormatted}</span>
            </div>
            <div className="detail-info-item">
              <span className="d-label">Account Email</span>
              <span className="d-value">{booking.user?.email || 'N/A'}</span>
            </div>
            <div className="detail-info-item">
              <span className="d-label">Concurrency Protection</span>
              <span className="d-value text-emerald">Pessimistic Lock (SELECT FOR UPDATE)</span>
            </div>
            <div className="detail-info-item">
              <span className="d-label">Admission Protocol</span>
              <span className="d-value">Single Entry • Gate QR Scanner</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>

          {isConfirmed && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onDownloadPdf(booking.id)}
              disabled={isDownloading}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="spin" size={16} />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Ticket PDF</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
