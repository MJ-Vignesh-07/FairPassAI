import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Shield, LogIn, UserPlus, User, AlertCircle, CheckCircle, Lock, ShieldCheck } from 'lucide-react';
import { loginApi, registerApi, getAuthToken } from '../api';

export default function AuthPage({ currentUser, onAuthSuccess, backendStatus, initialIsRegister = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultRole = location.state?.targetRole || 'USER';

  const [isRegister, setIsRegister] = useState(initialIsRegister);
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  
  // Clean state initialization with no demo values
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('USER');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If already authenticated with a valid session, redirect immediately to target or root
  if (currentUser && getAuthToken()) {
    const destination = location.state?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }


  const handleTabSwitch = (registerMode) => {
    setIsRegister(registerMode);
    setEmail('');
    setPassword('');
    setUsername('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isRegister) {
        await registerApi(username, email, password, registerRole);
        setSuccessMsg('Account registered successfully! Signing you in...');
        const loginData = await loginApi(email, password, registerRole);
        onAuthSuccess(loginData.user);
        const destination = location.state?.from?.pathname || '/';
        navigate(destination, { replace: true });
      } else {
        const loginData = await loginApi(email, password, selectedRole);

        // Strict verification of active session role
        if (loginData.user.role !== selectedRole) {
          throw new Error(
            `Role mismatch: This account has '${loginData.user.role}' permissions, but '${selectedRole}' was requested.`
          );
        }

        onAuthSuccess(loginData.user);
        const destination = location.state?.from?.pathname || '/';
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-page-header">
        <div className="auth-page-brand">
          <div className="brand-icon">
            <Shield className="brand-svg" size={28} />
            <div className="brand-dot" />
          </div>
          <span className="auth-page-brand-title">
            FairPass <span className="brand-highlight">AI</span>
          </span>
        </div>
        <p className="auth-page-brand-subtitle">Anti-Scalping Security Gateway & Smart Ticketing System</p>

        {/* Backend Connectivity Status */}
        <div className="status-pill" style={{ marginTop: '10px' }}>
          {backendStatus === 'healthy' ? (
            <>
              <span className="status-dot green pulse" />
              <span className="status-text">Backend Connected • ML Security Online</span>
            </>
          ) : (
            <>
              <span className="status-dot red" />
              <span className="status-text">Connecting to Flask API...</span>
            </>
          )}
        </div>
      </div>

      <div className="auth-page-card glass-panel">
        <div className="modal-header" style={{ marginBottom: '16px' }}>
          <div className="modal-title-group">
            <h2 className="modal-title">{isRegister ? 'Create an Account' : 'Account Sign In'}</h2>
            <div className="modal-subtitle">
              {isRegister ? 'Register to start buying tickets or managing events' : 'Sign in to access your dashboard'}
            </div>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="auth-tab-row">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => handleTabSwitch(false)}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => handleTabSwitch(true)}
          >
            <UserPlus size={15} />
            <span>Register</span>
          </button>
        </div>

        {errorMsg && (
          <div className="alert-banner alert-error" style={{ marginBottom: '16px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner alert-success" style={{ marginBottom: '16px' }}>
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form
          key={isRegister ? 'register-mode-form' : `signin-mode-${selectedRole}-form`}
          onSubmit={handleSubmit}
          className="auth-form"
          autoComplete="off"
        >
          {/* Dummy hidden inputs to stop browser autofill */}
          <input type="text" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="false" />
          <input type="password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="false" />

          {/* Target Role Selector for Sign In */}
          {!isRegister && (
            <div className="role-selection-group">
              <label className="role-selection-label">Select Target Role:</label>
              <div className="role-toggle-grid">
                <button
                  type="button"
                  className={`role-toggle-btn ${selectedRole === 'USER' ? 'active role-user' : ''}`}
                  onClick={() => handleRoleSelect('USER')}
                >
                  <div className="role-toggle-header">
                    <User size={16} />
                    <span>Sign in as User</span>
                  </div>
                  <span className="role-toggle-subtitle">Attendee & Ticket Buyer</span>
                </button>

                <button
                  type="button"
                  className={`role-toggle-btn ${selectedRole === 'ADMIN' ? 'active role-admin' : ''}`}
                  onClick={() => handleRoleSelect('ADMIN')}
                >
                  <div className="role-toggle-header">
                    <ShieldCheck size={16} />
                    <span>Sign in as Admin</span>
                  </div>
                  <span className="role-toggle-subtitle">System Auditor & Organizer</span>
                </button>
              </div>

              <div className="role-hint-badge">
                <Lock size={12} />
                <span>
                  {selectedRole === 'ADMIN'
                    ? 'Requires verified Administrator credentials. User accounts cannot access Admin view.'
                    : 'Requires valid User credentials for ticket purchase and telemetry testing.'}
                </span>
              </div>
            </div>
          )}

          {isRegister && (
            <div className="input-group">
              <label className="input-label">Username</label>
              <input
                type="text"
                name="fairpass_reg_username"
                id="fairpass_reg_username"
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                readOnly
                onFocus={(e) => e.target.removeAttribute('readonly')}
                onMouseDown={(e) => e.target.removeAttribute('readonly')}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              name={`fairpass_email_${isRegister ? 'reg' : selectedRole}`}
              id={`fairpass_email_${isRegister ? 'reg' : selectedRole}`}
              className="input-field"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readonly')}
              onMouseDown={(e) => e.target.removeAttribute('readonly')}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              name={`fairpass_pwd_${isRegister ? 'reg' : selectedRole}`}
              id={`fairpass_pwd_${isRegister ? 'reg' : selectedRole}`}
              className="input-field"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readonly')}
              onMouseDown={(e) => e.target.removeAttribute('readonly')}
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <label className="input-label">Account Role</label>
              <select
                className="input-field"
                value={registerRole}
                onChange={(e) => setRegisterRole(e.target.value)}
              >
                <option value="USER">USER (Ticket Buyer)</option>
                <option value="ADMIN">ADMIN (Event Organizer / Security Auditor)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={loading}
          >
            {loading
              ? 'Authenticating...'
              : isRegister
              ? 'Create Account'
              : `Sign In as ${selectedRole === 'ADMIN' ? 'Admin' : 'User'}`}
          </button>
        </form>
      </div>

      <div className="auth-page-footer-note">
        <Lock size={13} />
        <span>Protected by FairPass Anti-Scalping ML & Pessimistic Concurrency Controls</span>
      </div>
    </div>
  );
}
