import axios from 'axios';

// Pick the API base URL depending on environment (localhost => dev, else prod)
const API_URL = window.location.hostname === 'localhost'
  ? import.meta.env.VITE_API_URL_DEV || 'http://localhost:5000'
  : import.meta.env.VITE_API_URL_PROD || 'https://aistudybuddy.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  // withCredentials: true,  // Uncomment if you need cookies/auth
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - add token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('Response Error:', error.response.data);
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('Request Error:', error.request);
      return Promise.reject({ message: 'No response from server' });
    } else {
      console.error('Error:', error.message);
      return Promise.reject({ message: error.message });
    }
  }
);

export default api;
