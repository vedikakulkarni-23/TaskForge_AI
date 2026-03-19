import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
      console.log('🔑 Sending request with token:', config.url);
    } else {
      console.warn('⚠️ No token found in localStorage');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Token invalid or expired');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    if (error.response?.status === 403) {
      console.error('❌ 403 Forbidden - Insufficient permissions');
      console.error('Response:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;