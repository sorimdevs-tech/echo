import api from './axios';

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
    const response = await api.post('/scans', scanData);
    return response.data;
  },

  updateScan: async (id, scanData) => {
    const response = await api.put(`/scans/${id}`, scanData);
    return response.data;
  },

  deleteScan: async (id) => {
    const response = await api.delete(`/scans/${id}`);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};