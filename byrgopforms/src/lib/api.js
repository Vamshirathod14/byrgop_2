const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const STAFF_TOKEN_KEY = 'byrgop_visitor_staff_token';

export const staffAuth = {
  getToken: () => localStorage.getItem(STAFF_TOKEN_KEY),
  setToken: (t) => localStorage.setItem(STAFF_TOKEN_KEY, t),
  clearToken: () => localStorage.removeItem(STAFF_TOKEN_KEY),
};

export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = staffAuth.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const visitorApi = {
  register: (payload) => apiRequest('/visitors/register', { method: 'POST', body: payload }),
  staffLogin: (email, password) =>
    apiRequest('/admin/auth/login', { method: 'POST', body: { email, password } }),
  staffMe: () => apiRequest('/admin/auth/me', { auth: true }),
  qrInfo: (token) => apiRequest(`/visitors/qr/${encodeURIComponent(token)}`, { auth: true }),
  markAttendance: (token) =>
    apiRequest(`/visitors/qr/${encodeURIComponent(token)}/attendance`, { method: 'POST', auth: true }),
};

export default visitorApi;