import api from './axios';

export const patientService = {
  getPatients: async () => {
    const response = await api.get('/patients');
    return response.data;
  },

  getPatient: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (patientData) => {
    const response = await api.post('/patients', patientData);
    return response.data;
  },

  updatePatient: async (id, patientData) => {
    const response = await api.put(`/patients/${id}`, patientData);
    return response.data;
  },

  deletePatient: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },

  getVisits: async (patientId) => {
    const response = await api.get(`/patients/${patientId}/visits`);
    return response.data;
  },

  addVisit: async (patientId, visitData) => {
    const response = await api.post(`/patients/${patientId}/visits`, visitData);
    return response.data;
  },
};