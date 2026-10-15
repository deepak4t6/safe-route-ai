import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('safe_route_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  addContact: (data) => api.post('/auth/contacts', data),
  deleteContact: (id) => api.delete(`/auth/contacts/${id}`)
};

export const routeAPI = {
  getSafeRoutes: (payload) => api.post('/routes/safe-route', payload),
  getRouteById: (id) => api.get(`/routes/${id}`)
};

export const safetyAPI = {
  getHeatmap: (params) => api.get('/safety/heatmap', { params }),
  getZoneSafety: (lat, lng, time) => api.get('/safety/zone', { params: { lat, lng, time } }),
  getNearbySafePlaces: (params) => api.get('/safety/nearby-safe-places', { params }),
  submitReport: (data) => api.post('/safety/report', data),
  getReports: (params) => api.get('/safety/reports', { params }),
  verifyReport: (id, data) => api.post(`/safety/verify-report/${id}`, data)
};

export const sosAPI = {
  triggerSOS: (payload) => api.post('/sos/trigger', payload),
  getSOSStatus: (tripId) => api.get(`/sos/status/${tripId}`),
  shareTrip: (data) => api.post('/sos/trips/share', data),
  endTrip: (data) => api.post('/sos/trips/end', data)
};

export const aiAPI = {
  explainRoute: (data) => api.post('/ai/explain-route', data),
  askSafetyQuestion: (data) => api.post('/ai/ask-safety-question', data)
};

export const adminAPI = {
  getReports: () => api.get('/admin/reports'),
  updateReport: (id, data) => api.patch(`/admin/reports/${id}`, data),
  getAnalytics: () => api.get('/admin/analytics')
};

export const mapsAPI = {
  autocomplete: (q, lng, lat) => api.get('/maps/autocomplete', { params: { q, lng, lat } }),
  geocode: (params) => api.get('/maps/geocode', { params }),
  getConfig: () => api.get('/maps/config'),
  getDirections: (data) => api.post('/routes/directions', data)
};

export default api;
