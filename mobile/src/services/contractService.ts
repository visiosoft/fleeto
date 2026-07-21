import api from '../config/api';

export const contractService = {
  getAll: () => api.get('/contracts'),
  getById: (id: string) => api.get(`/contracts/${id}`),
  create: (data: any) => api.post('/contracts', data),
  update: (id: string, data: any) => api.put(`/contracts/${id}`, data),
  delete: (id: string) => api.delete(`/contracts/${id}`),
  getTemplates: () => api.get('/contract-templates'),
  createTemplate: (data: any) => api.post('/contract-templates', data),
};
