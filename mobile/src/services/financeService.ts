import api from '../config/api';

export const invoiceService = {
  getAll: () => api.get('/invoices/beta'),
  getStats: () => api.get('/invoices/beta/stats'),
  getById: (id: string) => api.get(`/invoices/beta/${id}`),
  create: (data: any) => api.post('/invoices/beta', data),
  update: (id: string, data: any) => api.put(`/invoices/beta/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/beta/${id}`),
  addPayment: (id: string, data: any) => api.post(`/invoices/beta/${id}/payments`, data),
  // Issues a shareable receipt for a payment (latest payment when no id given)
  createReceipt: (id: string, data: any = {}) => api.post(`/invoices/beta/${id}/receipt`, data),
  getInvoiceHtml: (id: string) => api.get(`/invoices/beta/${id}/html`),
  getPdfUrl: (id: string) => `/invoices/beta/${id}/pdf`,
  getUpcoming: () => api.get('/invoices/upcoming'),
  sendWhatsApp: (id: string) => api.post(`/invoices/${id}/whatsapp/send`),
  sendReminder: (id: string) => api.post(`/invoices/${id}/whatsapp/remind`),
};

export const receiptService = {
  getAll: () => api.get('/receipts'),
  getById: (id: string) => api.get(`/receipts/${id}`),
  create: (data: any) => api.post('/receipts', data),
  update: (id: string, data: any) => api.put(`/receipts/${id}`, data),
  delete: (id: string) => api.delete(`/receipts/${id}`),
  getDocument: (id: string) => api.get(`/receipts/${id}/document`),
};

export const costService = {
  getAll: () => api.get('/expenses'),
  getCurrentMonth: () => api.get('/costs/current-month'),
  getByVehicle: (vehicleId: string) => api.get(`/costs/vehicles/${vehicleId}`),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  getById: (id: string) => api.get(`/expenses/${id}`),
};

export const expenseService = {
  getAll: () => api.get('/expenses'),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const payrollService = {
  getAll: () => api.get('/payroll/entries'),
  getById: (id: string) => api.get(`/payroll/entries/${id}`),
  create: (data: any) => api.post('/payroll/entries', data),
  update: (id: string, data: any) => api.put(`/payroll/entries/${id}`, data),
  delete: (id: string) => api.delete(`/payroll/entries/${id}`),
  getSummary: () => api.get('/payroll/summary'),
  export: () => api.get('/payroll/export'),
  // Advances handed out before payday, and settlement payments
  addAdvance: (id: string, data: any) => api.post(`/payroll/entries/${id}/advances`, data),
  deleteAdvance: (id: string, rowId: string) => api.delete(`/payroll/entries/${id}/advances/${rowId}`),
  addPayment: (id: string, data: any) => api.post(`/payroll/entries/${id}/payments`, data),
  deletePayment: (id: string, rowId: string) => api.delete(`/payroll/entries/${id}/payments/${rowId}`),
};
