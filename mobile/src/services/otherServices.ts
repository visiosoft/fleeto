import api from '../config/api';

export const noteService = {
  getAll: () => api.get('/notes'),
  create: (data: any) => api.post('/notes', data),
  update: (id: string, data: any) => api.put(`/notes/${id}`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
};

export const letterheadService = {
  getAll: () => api.get('/letterheads'),
  create: (data: any) => api.post('/letterheads', data),
  update: (id: string, data: any) => api.put(`/letterheads/${id}`, data),
  delete: (id: string) => api.delete(`/letterheads/${id}`),
};

export const fuelService = {
  getAll: () => api.get('/fuel'),
  create: (data: any) => api.post('/fuel', data),
  update: (id: string, data: any) => api.put(`/fuel/${id}`, data),
  delete: (id: string) => api.delete(`/fuel/${id}`),
  getByVehicle: (vehicleId: string) => api.get(`/fuel/vehicle/${vehicleId}`),
};

export const maintenanceService = {
  getAll: () => api.get('/maintenance'),
  create: (data: any) => api.post('/maintenance', data),
  update: (id: string, data: any) => api.put(`/maintenance/${id}`, data),
  delete: (id: string) => api.delete(`/maintenance/${id}`),
};

export const rtaFinesService = {
  getTotal: () => api.get('/rta-fines/total'),
  getAll: () => api.get('/rta-fines/all'),
  getByVehicle: (vehicleInfo: string) => api.get(`/rta-fines/vehicle/${vehicleInfo}`),
  delete: (id: string) => api.delete(`/rta-fines/${id}`),
};

export const companyService = {
  getAll: () => api.get('/companies'),
  create: (data: any) => api.post('/companies', data),
  getSettings: () => api.get('/company'),
  updateSettings: (data: any) => api.put('/company', data),
  uploadLogo: (formData: FormData) =>
    api.post('/company/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const userService = {
  getAll: () => api.get('/users'),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
