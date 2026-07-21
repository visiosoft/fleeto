import api from '../config/api';

export const vehicleService = {
  getAll: () => api.get('/vehicles'),
  getById: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
  getDocuments: (id: string) => api.get(`/vehicles/${id}/get-documents`),
  uploadDocument: (id: string, formData: FormData) =>
    api.post(`/vehicles/${id}/upload-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteDocument: (vehicleId: string, docId: string) =>
    api.delete(`/vehicles/${vehicleId}/delete-document/${docId}`),
  getMaintenance: (id: string) => api.get(`/vehicles/${id}/maintenance`),
  addMaintenance: (id: string, data: any) => api.post(`/vehicles/${id}/maintenance`, data),
};
