import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Ticket, Activity, BarChart3, User, LogIn, LogOut, CalendarCheck } from 'lucide-react';

export default function Navbar({ currentUser, onLogout, backendStatus }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = currentUser?.role === 'ADMIN';

  const isEventsActive = location.pathname === '/' || location.pathname === '/events';
  const isBookingsActive = location.pathname.startsWith('/my-bookings');
  const isTelemetryActive = location.pathname.startsWith('/telemetry');
  const isAdminActive = location.pathname.startsWith('/admin');

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">
            <Shield className="brand-svg" size={24} />
            <div className="brand-dot" />
          </div>
          <div>
            <div className="brand-title">
              FairPass <span className="brand-highlight">AI</span>
            </div>
            <div className="brand-subtitle">Anti-Scalping & Smart Ticketing</div>
          </div>
        </div>

        {/* Backend Status Pill */}
        <div className="status-pill">
          {backendStatus === 'healthy' ? (
            <>
              <span className="status-dot green pulse" />
              <span className="status-text">Backend Connected • ML Online</span>
            </>
          ) : (
            <>
              <span className="status-dot red" />
              <span className="status-text">Connecting to Flask API...</span>
            </>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button
            className={`nav-btn ${isEventsActive ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <Ticket size={18} />
            <span>Event Catalog</span>
          </button>

          <button
            className={`nav-btn ${isBookingsActive ? 'active' : ''}`}
            onClick={() => navigate('/my-bookings')}
          >
            <CalendarCheck size={18} />
            <span>My Bookings</span>
          </button>

          {isAdmin && (
            <button
              className={`nav-btn ${isTelemetryActive ? 'active' : ''}`}
              onClick={() => navigate('/telemetry')}
            >
              <Activity size={18} />
              <span>Telemetry Lab</span>
            </button>
          )}

          {isAdmin && (
            <button
              className={`nav-btn ${isAdminActive ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
            >
              <BarChart3 size={18} />
              <span>Admin & Metrics</span>
            </button>
          )}
        </nav>

        {/* User Account Section (In-App Switch Removed) */}
        <div className="nav-user-actions">
          {currentUser ? (
            <div className="user-profile-menu">
              <div className="user-badge-container">
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <div className="user-details">
                  <span className="user-name">{currentUser.username}</span>
                  <span className={`user-role ${currentUser.role === 'ADMIN' ? 'role-admin' : 'role-user'}`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>

              {/* Sign Out Button (Role changes require full session termination) */}
              <button
                className="btn btn-secondary btn-sm"
                title="Sign out of current account"
                onClick={onLogout}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/login')}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
