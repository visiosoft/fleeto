import api from '../config/api';

export const driverService = {
  getAll: () => api.get('/drivers'),
  search: (params: any) => api.get('/drivers/search', { params }),
  getById: (id: string) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.put(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
  getDocuments: (id: string) => api.get(`/drivers/${id}/get-documents`),
  uploadDocument: (id: string, formData: FormData) =>
    api.post(`/drivers/${id}/upload-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteDocument: (driverId: string, docId: string) =>
    api.delete(`/drivers/${driverId}/delete-document/${docId}`),
};
