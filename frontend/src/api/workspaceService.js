import api from './axios'

export const workspaceService = {
  getSettings: async () => (await api.get('/settings')).data,
  getNextPatientId: async () => (await api.get('/settings/next-patient-id')).data,
  saveSettings: async (data) => (await api.put('/settings', data)).data,

  getReports: async (params = {}) => (await api.get('/clinical-reports', { params })).data,
  getReport: async (id) => (await api.get(`/clinical-reports/${id}`)).data,
  createReport: async (data) => (await api.post('/clinical-reports', data)).data,
  updateReport: async (id, data) => (await api.put(`/clinical-reports/${id}`, data)).data,
  deleteReport: async (id) => (await api.delete(`/clinical-reports/${id}`)).data,

  getTemplates: async () => (await api.get('/report-templates')).data,
  createTemplate: async (data) => (await api.post('/report-templates', data)).data,
  updateTemplate: async (id, data) => (await api.put(`/report-templates/${id}`, data)).data,
  deleteTemplate: async (id) => (await api.delete(`/report-templates/${id}`)).data,

  list: async (resource) => (await api.get(`/resources/${resource}`)).data,
  create: async (resource, data) => (await api.post(`/resources/${resource}`, data)).data,
  update: async (resource, id, data) => (await api.put(`/resources/${resource}/${id}`, data)).data,
  remove: async (resource, id) => (await api.delete(`/resources/${resource}/${id}`)).data,
  uploadMedia: async (formData) => (await api.post('/media-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data,
}
