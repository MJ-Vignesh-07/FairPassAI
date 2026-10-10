import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAuthToken } from '../api';

/**
 * Route guard component that blocks unauthenticated users and redirects them to /login
 */
export default function ProtectedRoute({ currentUser, children }) {
  const location = useLocation();
  const token = getAuthToken();

  // If no active token or currentUser session exists, redirect immediately to /login
  if (!token || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
