import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ai_interviewer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

// Interview APIs
export const interviewAPI = {
  start: (formData) =>
    API.post('/interview/start', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  submitAnswer: (id, data) => API.post(`/interview/${id}/answer`, data),
  endInterview: (id) => API.post(`/interview/${id}/end`),
  getHistory: () => API.get('/interview/history'),
  getReport: (id) => API.get(`/interview/${id}`),
};

// Payment APIs
export const paymentAPI = {
  getPackages: () => API.get('/payment/packages'),
  createOrder: (packageId) => API.post('/payment/create-order', { packageId }),
  verifyPayment: (data) => API.post('/payment/verify', data),
};

export default API;
