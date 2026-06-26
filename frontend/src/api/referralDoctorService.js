import api from './axios';

export const referralDoctorService = {
  getReferralDoctors: async () => {
    const response = await api.get('/referral-doctors');
    return response.data;
  },

  getReferralDoctor: async (id) => {
    const response = await api.get(`/referral-doctors/${id}`);
    return response.data;
  },

  createReferralDoctor: async (doctorData) => {
    const response = await api.post('/referral-doctors', doctorData);
    return response.data;
  },

  updateReferralDoctor: async (id, doctorData) => {
    const response = await api.put(`/referral-doctors/${id}`, doctorData);
    return response.data;
  },

  deleteReferralDoctor: async (id) => {
    const response = await api.delete(`/referral-doctors/${id}`);
    return response.data;
  },
};