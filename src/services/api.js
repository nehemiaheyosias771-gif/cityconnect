// src/services/api.js — Axios instance with Firebase token injection
import axios from 'axios';
import { getIdToken } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4004/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor — attach Firebase ID token ─────────
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (err) => Promise.reject(err));

// ── Response interceptor — handle errors globally ──────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.error || err.message || 'Network error';
    console.error(`[API Error] ${err.response?.status}: ${message}`);
    return Promise.reject(new Error(message));
  }
);

// ── Issues API ─────────────────────────────────────────────
export const issuesAPI = {
  list: (params = {}) => api.get('/issues', { params }),
  get: (id) => api.get(`/issues/${id}`),
  create: (data) => api.post('/issues', data),
  updateStatus: (id, status) => api.patch(`/issues/${id}/status`, { status }),
  vote: (id) => api.post(`/issues/${id}/vote`),
  getComments: (id) => api.get(`/issues/${id}/comments`),
  addComment: (id, text) => api.post(`/issues/${id}/comments`, { text }),
};

// ── Community API ──────────────────────────────────────────
export const communityAPI = {
  list: (params = {}) => api.get('/community', { params }),
  create: (data) => api.post('/community', data),
  connect: (id) => api.post(`/community/${id}/connect`),
};

// ── Auth API ───────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyToken: () => api.post('/auth/verify-token'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data),
};

// ── Chat API ───────────────────────────────────────────────
export const chatAPI = {
  getMessages: (room, limit = 50) => api.get(`/chat/${room}/messages`, { params: { limit } }),
};

// ── Admin API ──────────────────────────────────────────────
export const adminAPI = {
  getSecurityEvents: () => api.get('/admin/security/events'),
  getSecurityStats: () => api.get('/admin/security/stats'),
  resolveEvent: (id) => api.patch(`/admin/security/events/${id}/resolve`),
  getAnalytics: () => api.get('/admin/analytics'),
  broadcastSMS: (message) => api.post('/admin/broadcast/sms', { message }),
  sendDigest: () => api.post('/admin/broadcast/email/digest'),
};

export default api;
