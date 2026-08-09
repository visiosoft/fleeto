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

// Staff cash accounts: advances given to a person, what they spent, balance left
export const staffAccountService = {
  getAll: () => api.get('/staff-accounts'),
  getById: (id: string) => api.get(`/staff-accounts/${id}`),
  create: (data: any) => api.post('/staff-accounts', data),
  update: (id: string, data: any) => api.put(`/staff-accounts/${id}`, data),
  delete: (id: string) => api.delete(`/staff-accounts/${id}`),
  addTransaction: (id: string, data: any) => api.post(`/staff-accounts/${id}/transactions`, data),
  deleteTransaction: (id: string, txId: string) => api.delete(`/staff-accounts/${id}/transactions/${txId}`),
};

// Pre-defined client message templates
export const templateService = {
  getAll: () => api.get('/templates'),
  create: (data: any) => api.post('/templates', data),
  update: (id: string, data: any) => api.put(`/templates/${id}`, data),
  delete: (id: string) => api.delete(`/templates/${id}`),
  getLog: () => api.get('/templates/log'),
  logSent: (data: any) => api.post('/templates/log', data),
};

// Letters written on the company letterhead, saved against contracts
export const letterService = {
  getAll: () => api.get('/letters'),
  create: (data: any) => api.post('/letters', data),
  update: (id: string, data: any) => api.put(`/letters/${id}`, data),
  delete: (id: string) => api.delete(`/letters/${id}`),
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
  updateStatus: (id: string, status: string) => api.patch(`/maintenance/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/maintenance/${id}`),
};

export const rtaFinesService = {
  getTotal: () => api.get('/rta-fines/total'),
  getAll: () => api.get('/rta-fines/all'),
  getWithClients: () => api.get('/rta-fines/with-clients'),
  markReminderSent: (id: string, phone?: string) => api.post(`/rta-fines/${id}/reminder-sent`, { phone }),
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
