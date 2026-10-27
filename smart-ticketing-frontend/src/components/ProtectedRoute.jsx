import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthToken } from '../api';

/**
 * Route guard component that blocks unauthenticated users and enforces role-based authorization.
 * Redirects unauthenticated visitors to /login.
 * Redirects authenticated users lacking the required role to fallback path (default '/').
 */
export default function ProtectedRoute({ currentUser, requiredRole, redirectTo = '/', children }) {
  const location = useLocation();
  const token = getAuthToken();

  // If no active token or currentUser session exists, redirect immediately to /login
  if (!token || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If a specific role is required (e.g. 'ADMIN') and the user lacks it, deny access and redirect
  if (requiredRole && currentUser?.role !== requiredRole) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          accessDeniedMessage: `Access Denied: ${requiredRole} privileges are required to access this resource.`
        }}
      />
    );
  }

  return children;
}
