// Normalize away accidental duplicate or trailing slashes (e.g. "com//api/v1/").
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1')
  .trim()
  .replace(/([^:])\/{2,}/g, '$1/')
  .replace(/\/+$/, '');

let adminTokenGetter = null;

export function setAdminTokenGetter(getter) {
  adminTokenGetter = getter;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const isAdminRoute = path.startsWith('/admin/');
  if (isAdminRoute && adminTokenGetter) {
    const token = adminTokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    if (res.status === 401 && isAdminRoute) {
      err.isAdminAuthError = true;
    }
    throw err;
  }
  return body;
}

export const api = {
  startAssessment: (payload) =>
    request('/assessments', { method: 'POST', body: JSON.stringify(payload || {}) }),
  // Intro onboarding configuration: the four business types; with a
  // businessType the same payload also carries that type's three questions.
  onboardingMeta: (businessType) =>
    request(`/assessments/onboarding${businessType ? `?businessType=${encodeURIComponent(businessType)}` : ''}`),
  nextQuestion: (sessionId, category) => request(`/assessments/${sessionId}/next/${category}`),
  submitAnswer: (sessionId, payload) =>
    request(`/assessments/${sessionId}/answer`, { method: 'POST', body: JSON.stringify(payload) }),
  reportTimeout: (sessionId, payload) =>
    request(`/assessments/${sessionId}/timeout`, { method: 'POST', body: JSON.stringify(payload) }),
  getResult: (sessionId) => request(`/assessments/${sessionId}/result`),

  // Filtered server-side by the BusinessType → Domain relationship.
  domains: (businessTypeKey) =>
    request(`/domains${businessTypeKey ? `?businessType=${encodeURIComponent(businessTypeKey)}` : ''}`),
  kyMeta: () => request('/know-yourself/meta'),
  startKY: () => request('/know-yourself', { method: 'POST' }),
  startKYAssignment: (payload) =>
    request('/know-yourself/assignment', { method: 'POST', body: JSON.stringify(payload) }),
  resumeKY: (payload) => {
    const params = new URLSearchParams();
    if (payload?.email) params.set('email', payload.email);
    if (payload?.browserId) params.set('browserId', payload.browserId);
    const query = params.toString();
    return request(`/know-yourself/resume${query ? `?${query}` : ''}`);
  },
  kyQuestion: (sessionId, index) => request(`/know-yourself/${sessionId}/question/${index}`),
  submitKYAnswer: (sessionId, payload) =>
    request(`/know-yourself/${sessionId}/answer`, { method: 'POST', body: JSON.stringify(payload) }),
  kyResult: (sessionId) => request(`/know-yourself/${sessionId}/result`),
  submitKYContact: (sessionId, payload) =>
    request(`/know-yourself/${sessionId}/contact`, { method: 'POST', body: JSON.stringify(payload) }),
  submitKYEmail: (sessionId, payload) =>
    request(`/know-yourself/${sessionId}/email`, { method: 'POST', body: JSON.stringify(payload) }),
  submitKYProBono: (sessionId, payload) =>
    request(`/know-yourself/${sessionId}/pro-bono`, { method: 'POST', body: JSON.stringify(payload) }),
  submitKYReportRequest: (sessionId, payload) =>
    request(`/know-yourself/${sessionId}/report-request`, { method: 'POST', body: JSON.stringify(payload) }),
  submitContact: (payload) =>
    request('/contact', { method: 'POST', body: JSON.stringify(payload) }),
  bulkUploadKYQuestions: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/admin/know-yourself/bulk-upload', { method: 'POST', body: formData });
  },
};

export default api;
