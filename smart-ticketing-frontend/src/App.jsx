import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import EventCatalog from './components/EventCatalog';
import TelemetryLab from './components/TelemetryLab';
import AdminDashboard from './components/AdminDashboard';
import BookingModal from './components/BookingModal';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import { 
  getEventsApi, checkHealthApi, 
  getStoredUser, clearAuthSession 
} from './api';
import './App.css';

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const [backendStatus, setBackendStatus] = useState('checking');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Modals & Booking State
  const [selectedEventForBooking, setSelectedEventForBooking] = useState(null);

  // Initial Data & Health Check
  useEffect(() => {
    async function init() {
      // 1. Health check
      try {
        const health = await checkHealthApi();
        if (health.status === 'healthy') {
          setBackendStatus('healthy');
        } else {
          setBackendStatus('offline');
        }
      } catch {
        setBackendStatus('offline');
      }

      // 2. Fetch Events if authenticated
      if (getStoredUser()) {
        loadEvents();
      }
    }

    init();
  }, []);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const data = await getEventsApi();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    loadEvents();
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  const handleLogoutAndAuthAdmin = () => {
    clearAuthSession();
    setCurrentUser(null);
    navigate('/login', { replace: true, state: { targetRole: 'ADMIN' } });
  };

  return (
    <Routes>
      {/* Public Authentication Route: Sign In / Register Page */}
      <Route
        path="/login"
        element={
          <AuthPage
            currentUser={currentUser}
            onAuthSuccess={handleAuthSuccess}
            backendStatus={backendStatus}
            initialIsRegister={false}
          />
        }
      />
      <Route
        path="/register"
        element={
          <AuthPage
            currentUser={currentUser}
            onAuthSuccess={handleAuthSuccess}
            backendStatus={backendStatus}
            initialIsRegister={true}
          />
        }
      />

      {/* Protected Routes: Accessing root or internal pages redirects unauthenticated users to /login */}
      <Route
        path="/"
        element={
          <ProtectedRoute currentUser={currentUser}>
            <div className="app-container">
              <Navbar
                currentUser={currentUser}
                onLogout={handleLogout}
                backendStatus={backendStatus}
              />
              <main className="main-content">
                <EventCatalog
                  events={events}
                  loading={loadingEvents}
                  onRefresh={loadEvents}
                  onSelectEvent={(ev) => setSelectedEventForBooking(ev)}
                  onOpenCreateEvent={() => navigate('/admin')}
                  currentUser={currentUser}
                />
              </main>

              {/* Booking Drawer / Modal */}
              {selectedEventForBooking && (
                <BookingModal
                  event={selectedEventForBooking}
                  onClose={() => setSelectedEventForBooking(null)}
                  currentUser={currentUser}
                  onBookingComplete={() => {
                    loadEvents();
                  }}
                />
              )}
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/events"
        element={<Navigate to="/" replace />}
      />

      <Route
        path="/telemetry"
        element={
          <ProtectedRoute currentUser={currentUser}>
            <div className="app-container">
              <Navbar
                currentUser={currentUser}
                onLogout={handleLogout}
                backendStatus={backendStatus}
              />
              <main className="main-content">
                <TelemetryLab
                  events={events}
                  currentUser={currentUser}
                />
              </main>
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute currentUser={currentUser}>
            <div className="app-container">
              <Navbar
                currentUser={currentUser}
                onLogout={handleLogout}
                backendStatus={backendStatus}
              />
              <main className="main-content">
                <AdminDashboard
                  currentUser={currentUser}
                  onLogoutAndAuthAdmin={handleLogoutAndAuthAdmin}
                  onOpenAuth={() => navigate('/login', { state: { targetRole: 'ADMIN' } })}
                  onEventPublished={loadEvents}
                />
              </main>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Catch-all route: Redirects to root, which will enforce ProtectedRoute */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
