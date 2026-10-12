import axios from 'axios';

// The one shared Axios instance. Every request in the app goes through it,
// so the server address is written in exactly one place (client/.env).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // AI requests can take a few seconds
});

// Request interceptor: runs before every request.
// If the user is logged in, attach their token so the server knows who they are.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('votelligence_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: runs when a request fails.
// Replaces Axios's generic "Request failed with status code 400" with the
// server's own message, so components can simply show err.message.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    if (!error.response) {
      error.message = 'Cannot reach the server. Make sure the API is running.';
    } else {
      error.message = error.response.data?.error ?? `Request failed (${error.response.status})`;
      error.fieldErrors = error.response.data?.errors ?? {};
    }
    return Promise.reject(error);
  }
);

export default api;
