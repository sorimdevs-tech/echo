import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('echoai_token') || localStorage.getItem('echoai_token');
    // Render serves frontend and API on separate sites, so retain the bearer token.
    if (token && token !== 'cookie-session') config.headers.Authorization = 'Bearer ' + token;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Expired sessions cannot retain clinical access.
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && window.location.pathname !== '/') {
    for (const store of [localStorage, sessionStorage]) { store.removeItem('echoai_user'); store.removeItem('echoai_token'); }
    window.location.assign('/');
  }
  return Promise.reject(error);
});
// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
