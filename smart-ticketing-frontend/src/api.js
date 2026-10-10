// Resolve backend base URL with priority:
// 1. User runtime override in localStorage (fairpass_custom_api_url)
// 2. Build-time environment variable (VITE_API_URL)
// 3. Render bare service name fallback (fairpass-backend -> fairpass-backend.onrender.com)
// 4. Default to relative proxy ('')
export const getBackendBase = () => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('fairpass_custom_api_url') : null;
  let raw = (custom || import.meta.env.VITE_API_URL || '').trim();

  // If a bare hostname was provided like 'fairpass-backend' without dot, append .onrender.com
  if (raw && !raw.includes('.') && !raw.includes('localhost') && !raw.includes('127.0.0.1')) {
    raw = `${raw}.onrender.com`;
  }

  if (raw && !raw.startsWith('http://') && !raw.startsWith('https://') && !raw.startsWith('/')) {
    raw = `https://${raw}`;
  }

  return raw.replace(/\/+$/, '');
};

export const getApiBase = () => `${getBackendBase()}/api`;

export const setCustomApiUrl = (url) => {
  if (url && url.trim()) {
    localStorage.setItem('fairpass_custom_api_url', url.trim());
  } else {
    localStorage.removeItem('fairpass_custom_api_url');
  }
};

export const getCustomApiUrl = () => {
  return (typeof window !== 'undefined' ? localStorage.getItem('fairpass_custom_api_url') : '') || '';
};




/**
 * Helper to retrieve stored auth token
 */
export const getAuthToken = () => {
  return localStorage.getItem('fairpass_token');
};

/**
 * Helper to retrieve stored user object
 */
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem('fairpass_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

/**
 * Set token and user in storage
 */
export const setAuthSession = (token, user) => {
  if (token) {
    localStorage.setItem('fairpass_token', token);
  } else {
    localStorage.removeItem('fairpass_token');
  }
  if (user) {
    localStorage.setItem('fairpass_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('fairpass_user');
  }
};

/**
 * Clear session
 */
export const clearAuthSession = () => {
  localStorage.removeItem('fairpass_token');
  localStorage.removeItem('fairpass_user');
};

/**
 * Generic fetch wrapper with Authorization header and error handling
 */
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${getApiBase()}${endpoint}`;


  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthSession();
      }
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If network error occurred, return a friendly message
    if (!err.status && err.name === 'TypeError') {
      throw new Error('Backend server is currently offline or unreachable. (Note: On Render free tier, the backend spins down after inactivity and takes ~30-50s to wake up).');
    }
    throw err;

  }
}

// ----------------- Auth Endpoints -----------------

export async function loginApi(email, password, role) {
  const payload = { email, password };
  if (role) {
    payload.role = role;
  }
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (data.access_token) {
    setAuthSession(data.access_token, data.user);
  }
  return data;
}

export async function registerApi(username, email, password, role = 'USER') {
  return await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, role })
  });
}

// ----------------- Event Endpoints -----------------

export async function getEventsApi() {
  return await apiRequest('/events', { method: 'GET' });
}

export async function createEventApi(eventData) {
  return await apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
}

// ----------------- Tickets & Anti-Scalping Engine -----------------

export async function evalRiskApi({ event_id, tier_id, quantity, session_id, telemetry }) {
  return await apiRequest('/tickets/eval-risk', {
    method: 'POST',
    body: JSON.stringify({
      event_id,
      tier_id,
      quantity,
      session_id,
      telemetry
    })
  });
}

export async function bookTicketApi({ tier_id, quantity, risk_tier }) {
  return await apiRequest('/tickets/book', {
    method: 'POST',
    body: JSON.stringify({
      tier_id,
      quantity,
      risk_tier
    })
  });
}

// ----------------- Admin Analytics & Benchmarking -----------------

export async function getAdminMetricsApi() {
  return await apiRequest('/admin/metrics', { method: 'GET' });
}

export async function runBenchmarkApi(test_size = 1000) {
  return await apiRequest('/admin/benchmark', {
    method: 'POST',
    body: JSON.stringify({ test_size })
  });
}

// ----------------- Health Check -----------------

export async function checkHealthApi() {
  try {
    const res = await fetch(`${getBackendBase()}/health`);
    return await res.json();
  } catch {
    return { status: 'offline' };
  }
}


