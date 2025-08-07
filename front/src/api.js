import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000'; // Your backend URL

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('carriprefa_user') || '{}');
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('carriprefa_user');
      localStorage.removeItem('carriprefa_interface');
      if (!window.location.pathname.includes('/login')) {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  checkAuth: () => api.get('/auth/check'),
};

// Equipment API
export const equipmentApi = {
  getEquipments: () => api.get('/equipments'),
  getEquipmentsStatus: () => api.get('/equipments/status'),
};

// Intervention API
export const interventionApi = {
  createIntervention: (data) => api.post('/public/intervention', data),
  getIntervention: (id) => api.get(`/public/intervention/${id}`),
  getRecentInterventions: () => api.get('/public/interventions/recent'),
};

// Technicien API
export const technicienApi = {
  // Get interventions status - corrected endpoint
  getInterventionsStatus: () => 
    api.get('/tech/interventions-status'), // Removed /api prefix

  // Get simple interventions status
  getInterventionsStatusSimple: () => 
    api.get('/tech/interventions-status-simple'),

  // Get my interventions
  getMyInterventions: () => 
    api.get('/tech/my-interventions'),

  // Get available interventions
  getAvailableInterventions: () => 
    api.get('/tech/available-interventions'),

  // Get specific intervention
  getIntervention: (interventionId) => 
    api.get(`/tech/interventions/${interventionId}`),

  // Get equipment status
  getEquipmentsStatus: () => 
    api.get('/tech/equipments-status'),

  // Get equipment status summary
  getEquipmentsStatusSummary: () => 
    api.get('/tech/equipments-status-summary'),

  // Create treatment - corrected endpoint
  createTraitement: (data) => 
    api.post('/tech/traitements', data), // Removed /api prefix

  // Get my treatments
  getMyTraitements: () => 
    api.get('/tech/my-traitements'),

  // Update treatment
  updateTraitement: (traitementId, data) => 
    api.put(`/tech/traitements/${traitementId}`, data),

  // Fixed method - use 'api' instead of 'apiClient'
  getTraitementByInterventionId: async (interventionId) => {
    try {
      const response = await api.get('/tech/my-traitements');
      const traitements = response.data;
      const traitement = traitements.find(t => t.intervention_id === interventionId);
      return { data: traitement };
    } catch (error) {
      throw error;
    }
  },

  getDashboard: () => 
    api.get('/tech/dashboard'), // Removed /api prefix

  testConnection: () => 
    api.get('/tech/dashboard'),
};
// At the end of your api.js file
