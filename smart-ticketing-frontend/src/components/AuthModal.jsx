import React, { useState } from 'react';
import { X, LogIn, UserPlus, Shield, User, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { loginApi, registerApi } from '../api';

export default function AuthModal({ onClose, onAuthSuccess, initialRole = 'USER' }) {
  const [isRegister, setIsRegister] = useState(false);
  const [selectedRole, setSelectedRole] = useState(initialRole || 'USER');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('USER');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      } else {
        const loginData = await loginApi(email, password, selectedRole);
        
        // Strict client-side verification of active session role
        if (loginData.user.role !== selectedRole) {
          throw new Error(
            `Role mismatch: This account has '${loginData.user.role}' permissions, but '${selectedRole}' was requested.`
          );
        }
        
        onAuthSuccess(loginData.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">{isRegister ? 'Create Account' : 'Account Sign In'}</h2>
            <div className="modal-subtitle">FairPass AI Security Gateway</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={20} />
          </button>
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
          <div className="alert-banner alert-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-banner alert-success">
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form
          key={isRegister ? 'modal-register-form' : `modal-signin-${selectedRole}-form`}
          onSubmit={handleSubmit}
          className="auth-form"
          autoComplete="off"
        >
          {/* Dummy hidden inputs to absorb browser autofill */}
          <input type="text" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="false" />
          <input type="password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="false" />

          {/* Target Role Selection for Sign In */}
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
                    <Shield size={16} />
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
                name="modal_user_username"
                id="modal_user_username"
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
              name={`modal_email_${isRegister ? 'reg' : selectedRole}`}
              id={`modal_email_${isRegister ? 'reg' : selectedRole}`}
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
              name={`modal_pwd_${isRegister ? 'reg' : selectedRole}`}
              id={`modal_pwd_${isRegister ? 'reg' : selectedRole}`}
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
    </div>
  );
}
