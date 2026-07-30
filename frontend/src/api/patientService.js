import api from './axios';

let patientsCache = null;
let patientsRequest = null;

const invalidatePatients = () => {
  patientsCache = null;
  patientsRequest = null;
};

export const patientService = {
  getPatients: async () => {
    if (patientsCache) return patientsCache;
    if (patientsRequest) return patientsRequest;

    patientsRequest = api.get('/patients')
      .then((response) => {
        patientsCache = response.data;
        return patientsCache;
      })
      .finally(() => {
        patientsRequest = null;
      });

    return patientsRequest;
  },

  getPatient: async (id) => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (patientData) => {
    const response = await api.post('/patients', patientData);
    invalidatePatients();
    return response.data;
  },

  updatePatient: async (id, patientData) => {
    const response = await api.put(`/patients/${id}`, patientData);
    invalidatePatients();
    return response.data;
  },

  deletePatient: async (id) => {
    const response = await api.delete(`/patients/${id}`);
    invalidatePatients();
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

  updateVisit: async (patientId, visitId, visitData) => {
    const response = await api.put(`/patients/${patientId}/visits/${visitId}`, visitData);
    return response.data;
  },

  deleteVisit: async (patientId, visitId) => {
    const response = await api.delete(`/patients/${patientId}/visits/${visitId}`);
    return response.data;
  },
};
