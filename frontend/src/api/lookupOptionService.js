import api from './axios';

export const lookupOptionService = {
  getLookupOptions: async (category) => {
    const response = await api.get('/lookup-options', {
      params: category ? { category } : undefined,
    });
    return response.data;
  },

  createLookupOption: async (category, value) => {
    const response = await api.post('/lookup-options', { category, value });
    return response.data;
  },
};
