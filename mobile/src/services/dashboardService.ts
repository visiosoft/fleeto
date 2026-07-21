import api from '../config/api';

export const dashboardService = {
  getActiveCounts: () => api.get('/dashboard/active-counts'),
  getActiveVehicles: () => api.get('/dashboard/active-vehicles'),
  getActiveDrivers: () => api.get('/dashboard/active-drivers'),
  getCurrentMonthFuel: () => api.get('/dashboard/fuel/current-month'),
  getCurrentMonthFuelByVehicle: () => api.get('/dashboard/fuel/current-month/by-vehicle'),
  getCurrentMonthMaintenance: () => api.get('/dashboard/maintenance/current-month'),
  getCurrentMonthMaintenanceByVehicle: () => api.get('/dashboard/maintenance/current-month/by-vehicle'),
  getContractStats: () => api.get('/dashboard/contracts/stats'),
  getInvoiceStats: () => api.get('/invoices/beta/stats'),
  getExpenseSummary: () => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    return api.get(`/expenses/summary?startDate=${startDate}&endDate=${endDate}`);
  },
};
