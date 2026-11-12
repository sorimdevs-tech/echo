import api from './axios';

// A clinical save must fail visibly instead of hanging the editor forever.
const SAVE_TIMEOUT_MS = 30000;

let dashboardStatsCache = null;
let dashboardStatsRequest = null;

const invalidateDashboardStats = () => {
  dashboardStatsCache = null;
  dashboardStatsRequest = null;
};

export const scanService = {
  getScans: async () => {
    const response = await api.get('/scans');
    return response.data;
  },

  getScan: async (id) => {
    const response = await api.get(`/scans/${id}`);
    return response.data;
  },

  getScansByPatient: async (patientId) => {
    const response = await api.get(`/scans/patient/${patientId}`);
    return response.data;
  },

  createScan: async (scanData) => {
    const response = await api.post('/scans', scanData, { timeout: SAVE_TIMEOUT_MS });
    invalidateDashboardStats();
    return response.data;
  },

  updateScan: async (id, scanData) => {
    const response = await api.put(`/scans/${id}`, scanData, { timeout: SAVE_TIMEOUT_MS });
    invalidateDashboardStats();
    return response.data;
  },

  deleteScan: async (id) => {
    const response = await api.delete(`/scans/${id}`);
    invalidateDashboardStats();
    return response.data;
  },

  getDashboardStats: async () => {
    if (!dashboardStatsRequest) {
      dashboardStatsRequest = api.get('/dashboard/stats').then(response=>response.data).finally(()=>{dashboardStatsRequest=null})
    }
    return dashboardStatsRequest
  },
};
