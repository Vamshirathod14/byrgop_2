const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const TOKEN_KEY = 'byrgop_admin_token';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t) => localStorage.setItem(TOKEN_KEY, t),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

async function request(path, options = {}) {
  const headers = {};
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const token = auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status);
  }
  return body;
}

const json = (method) => (path, payload) =>
  request(path, { method, body: JSON.stringify(payload) });

const del = (path) => request(path, { method: 'DELETE' });

export const api = {
  __token: () => auth.getToken(),

  // Auth
  login: (email, password) => request('/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/admin/auth/logout', { method: 'POST' }),
  me: () => request('/admin/auth/me'),

  // Dashboard
  dashboard: () => request('/admin/dashboard'),
  analytics: (params = '') => request(`/admin/analytics${params}`),

  // Admins
  admins: () => request('/admin/admins'),
  createAdmin: json('POST'),
  updateAdmin: json('PUT'),
  setAdminStatus: json('PATCH'),
  setAdminPermissions: json('PATCH'),
  deleteAdmin: del,

  // Activity
  activity: (params = '') => request(`/admin/activity${params}`),

  // Onboarding / stats
  stats: () => request('/admin/stats'),
  sessions: (status) => request(`/admin/sessions${status ? `?status=${status}` : ''}`),
  getSession: (id) => request(`/admin/sessions/${id}`),

  // Categories
  categories: () => request('/admin/categories?includeInactive=true'),
  createCategory: json('POST'),
  updateCategory: json('PUT'),
  deleteCategory: del,

  // Domains (Know Yourself business domains)
  domains: (includeInactive = true) =>
    request(`/admin/domains${includeInactive ? '?includeInactive=true' : ''}`),
  createDomain: json('POST'),
  updateDomain: json('PUT'),
  deleteDomain: del,

  // Business types (hierarchy root: BusinessType → Domain → Question)
  businessTypes: () => request('/admin/business-types?includeInactive=true'),
  createBusinessType: json('POST'),
  updateBusinessType: json('PUT'),
  deleteBusinessType: del,

  // Stages
  stages: () => request('/admin/stages?includeInactive=true'),
  createStage: json('POST'),
  updateStage: json('PUT'),
  deleteStage: del,

  // Intro onboarding questions (strictly businessType-scoped, dedicated endpoints)
  onboardingQuestions: (businessType) =>
    request(
      `/admin/onboarding-questions?includeInactive=true&businessType=${encodeURIComponent(businessType)}`
    ),
  createOnboardingQuestion: json('POST'),
  updateOnboardingQuestion: json('PUT'),
  setOnboardingQuestionStatus: json('PATCH'),
  deleteOnboardingQuestion: del,

  // Results
  results: () => request('/admin/results?includeInactive=true'),
  createResult: json('POST'),
  updateResult: json('PUT'),
  deleteResult: del,

  // Know Yourself
  kyQuestions: (params = '') =>
    request(`/admin/know-yourself?includeInactive=true${params}`),
  kySessions: (params = '') => request(`/admin/know-yourself/sessions${params}`),
  // KY result categories (six-dimension scoring config)
  kyCategories: () => request('/admin/know-yourself/categories?includeInactive=true'),
  createKYCategory: json('POST'),
  updateKYCategory: json('PUT'),
  deleteKYCategory: del,
  kyTemplate: async () => {
    const res = await fetch(`${API_BASE}/admin/know-yourself/template`, {
      headers: { Authorization: `Bearer ${auth.getToken()}` },
    });
    if (!res.ok) throw new ApiError(`Template download failed (${res.status})`, res.status);
    return res.blob();
  },
  bulkUploadKYQuestions: (file, { preview = false } = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(
      `/admin/know-yourself/bulk-upload${preview ? '?preview=true' : ''}`,
      { method: 'POST', body: formData }
    );
  },
  createKYQuestion: json('POST'),
  updateKYQuestion: json('PUT'),
  deleteKYQuestion: del,
  reorderKYCategories: (items) => request('/admin/know-yourself/categories/reorder', { method: 'PUT', body: JSON.stringify({ items }) }),

  // Website (general) contacts
  websiteContacts: () => request('/admin/contacts'),
};

export default api;