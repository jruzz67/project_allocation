import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 120000,
});

export const apiForm = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 120000,
});

// Add interceptor to inject Authorization header
const authInterceptor = (config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(authInterceptor);
apiForm.interceptors.request.use(authInterceptor);

// Add interceptor to handle 401 Unauthorized (auto logout)
const errorInterceptor = (error: any) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth';
  }
  return Promise.reject(error);
};

api.interceptors.response.use((res) => res, errorInterceptor);
apiForm.interceptors.response.use((res) => res, errorInterceptor);