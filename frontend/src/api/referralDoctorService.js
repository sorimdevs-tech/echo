import api from './axios';

const fromApi = (doctor = {}) => {
  const nameParts = String(doctor.name || '').trim().split(/\s+/).filter(Boolean)
  return {
    ...doctor,
    doctor_type: doctor.doctor_type || (doctor.hospital && !doctor.name ? 'hospital' : 'doctor'),
    first_name: doctor.first_name || nameParts[0] || '',
    last_name: doctor.last_name || nameParts.slice(1).join(' '),
    speciality: doctor.speciality || doctor.specialty || '',
    institution_name: doctor.institution_name || doctor.hospital || '',
    parent_institution: doctor.parent_institution || doctor.hospital || '',
    street: doctor.street || doctor.clinic_address || '',
    phone1: doctor.phone1 || doctor.phone || '',
    mobile: doctor.mobile || doctor.phone || '',
    reg_no: doctor.reg_no || doctor.registration_number || '',
  }
}

const toApi = (doctor = {}) => ({
  ...doctor,
  name: doctor.doctor_type === 'hospital'
    ? doctor.institution_name
    : [doctor.salutation, doctor.first_name, doctor.middle_name, doctor.last_name].filter(Boolean).join(' '),
  qualification: doctor.qualification || '',
  specialty: doctor.speciality || doctor.specialty || '',
  hospital: doctor.doctor_type === 'hospital' ? doctor.institution_name : (doctor.parent_institution || doctor.institution_name || ''),
  clinic_address: [doctor.street, doctor.area, doctor.area_po, doctor.district_city, doctor.state, doctor.country].filter(Boolean).join(', '),
  phone: doctor.mobile || doctor.phone1 || doctor.phone || '',
  email: doctor.email || '',
  registration_number: doctor.reg_no || doctor.registration_number || '',
})

const normalizeResult = (result) => ({
  ...result,
  data: Array.isArray(result.data) ? result.data.map(fromApi) : fromApi(result.data),
})

export const referralDoctorService = {
  getReferralDoctors: async () => {
    const response = await api.get('/referral-doctors');
    return normalizeResult(response.data);
  },

  getReferralDoctor: async (id) => {
    const response = await api.get(`/referral-doctors/${id}`);
    return normalizeResult(response.data);
  },

  createReferralDoctor: async (doctorData) => {
    const response = await api.post('/referral-doctors', toApi(doctorData));
    return normalizeResult(response.data);
  },

  updateReferralDoctor: async (id, doctorData) => {
    const response = await api.put(`/referral-doctors/${id}`, toApi(doctorData));
    return normalizeResult(response.data);
  },

  deleteReferralDoctor: async (id) => {
    const response = await api.delete(`/referral-doctors/${id}`);
    return response.data;
  },
};
