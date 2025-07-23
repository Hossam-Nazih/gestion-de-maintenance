// src/api.js
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000'; // Update with your backend URL

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('carriprefa_user') || '{}');
        if (user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('carriprefa_user');
            localStorage.removeItem('carriprefa_interface');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  logout: () => api.post('/logout'),
  getProfile: () => api.get('/profile'),
};

// Equipment API
export const equipmentApi = {
  getEquipments: () => api.get('/equipments'),
  getEquipmentsStatus: () => api.get('/equipments/status'),
};

// Intervention API
export const interventionApi = {
  createIntervention: (data) => api.post('/intervention', data),
  getIntervention: (id) => api.get(`/intervention/${id}`),
  getRecentInterventions: () => api.get('/interventions/recent'),
};

// Technicien API
export const technicienApi = {
  getAvailableInterventions: () => api.get('/available-interventions'),
  createTraitement: (data) => api.post('/traitements', data),
  getInterventionsStatus: () => api.get('/interventions-status'),
  getDashboard: () => api.get('/dashboard'),
};