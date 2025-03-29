const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = process.env.REACT_APP_API_URL

export const API_ENDPOINTS = {
  // Auth endpoints
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  logout: `${API_BASE_URL}/auth/logout`,
  
  // Dashboard endpoints
  dashboardStats: `${API_BASE_URL}/dashboard/stats`,
  contractStats: `${API_BASE_URL}/dashboard/contracts/stats`,
  
  // Vehicle endpoints
  vehicles: `${API_BASE_URL}/vehicles`,
  vehicleDetails: (id: string) => `${API_BASE_URL}/vehicles/${id}`,
  vehicleExpenses: (id: string) => `${API_BASE_URL}/vehicles/${id}/expenses`,
  
  // Driver endpoints
  drivers: `${API_BASE_URL}/drivers`,
  driverDetails: (id: string) => `${API_BASE_URL}/drivers/${id}`,
  driverExpenses: (id: string) => `${API_BASE_URL}/drivers/${id}/expenses`,
  
  // Contract endpoints
  contracts: `${API_BASE_URL}/contracts`,
  contractDetails: (id: string) => `${API_BASE_URL}/contracts/${id}`,
  contractTemplates: `${API_BASE_URL}/contracts/templates`,
  
  // Cost Management endpoints
  costs: {
    currentMonth: `${API_BASE_URL}/api/costs/current-month`,
    byVehicle: (id: string) => `${API_BASE_URL}/costs/vehicle/${id}`,
    byDriver: (id: string) => `${API_BASE_URL}/costs/driver/${id}`,
    byDateRange: `${API_BASE_URL}/costs/date-range`,
    create: `${API_BASE_URL}/api/expenses`,
    update: (id: string) => `${API_BASE_URL}/api/expenses/${id}`,
  },
  
  // Profile endpoints
  profile: `${API_BASE_URL}/profile`,
  updateProfile: `${API_BASE_URL}/profile/update`,
  changePassword: `${API_BASE_URL}/profile/change-password`,
  
  // Reports endpoints
  reports: {
    expenses: `${API_BASE_URL}/reports/expenses`,
    vehicles: `${API_BASE_URL}/reports/vehicles`,
    drivers: `${API_BASE_URL}/reports/drivers`,
    contracts: `${API_BASE_URL}/reports/contracts`,
  },
  
  // Settings endpoints
  settings: `${API_BASE_URL}/settings`,
  companySettings: `${API_BASE_URL}/settings/company`,
  
  // Notes endpoints
  notes: {
    list: `${API_BASE_URL}/api/notes`,
    create: `${API_BASE_URL}/api/notes`,
    update: (id: string) => `${API_BASE_URL}/api/notes/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/notes/${id}`,
  },
};

export const API_HEADERS = {
  'Content-Type': 'application/json',
};

export const getAuthHeader = (token: string) => ({
  ...API_HEADERS,
  'Authorization': `Bearer ${token}`,
}); 