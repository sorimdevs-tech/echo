import api from './axios'

export const customOptionService = {
  getOptions: async (field) => {
    const response = await api.get('/custom-options', { params: { field } })
    return response.data
  },

  createOption: async (field, value) => {
    const response = await api.post('/custom-options', { field, value })
    return response.data
  },
}
