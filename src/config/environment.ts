const isDevelopment = process.env.NODE_ENV === 'development';

// In development, use relative paths because of proxy in package.json
// In production, use the full API URL
export const API_BASE_URL = isDevelopment ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

const API_PREFIX = '/api';

export const API_ENDPOINTS = {
  // Auth endpoints
  register: `${API_BASE_URL}${API_PREFIX}/auth/register`,
  login: `${API_BASE_URL}${API_PREFIX}/auth/login`,
  logout: `${API_BASE_URL}${API_PREFIX}/auth/logout`,
  
  // Dashboard endpoints
  dashboardStats: `${API_BASE_URL}${API_PREFIX}/dashboard/stats`,
  contractStats: `${API_BASE_URL}${API_PREFIX}/dashboard/contracts/stats`,
  
  // Vehicle endpoints
  vehicles: `${API_BASE_URL}${API_PREFIX}/vehicles`,
  vehicleDetails: (id: string) => `${API_BASE_URL}${API_PREFIX}/vehicles/${id}`,
  vehicleExpenses: (id: string) => `${API_BASE_URL}${API_PREFIX}/vehicles/${id}/expenses`,
  
  // Driver endpoints
  drivers: `${API_BASE_URL}${API_PREFIX}/drivers`,
  driverDetails: (id: string) => `${API_BASE_URL}${API_PREFIX}/drivers/${id}`,
  driverExpenses: (id: string) => `${API_BASE_URL}${API_PREFIX}/drivers/${id}/expenses`,
  
  // Contract endpoints
  contracts: `${API_BASE_URL}${API_PREFIX}/contracts`,
  contractDetails: (id: string) => `${API_BASE_URL}${API_PREFIX}/contracts/${id}`,
  contractTemplates: `${API_BASE_URL}${API_PREFIX}/contract-templates`,
  
  // Expense Management endpoints
  costs: {
    all: `${API_BASE_URL}${API_PREFIX}/costs/all`,
    currentMonth: `${API_BASE_URL}${API_PREFIX}/costs/current-month`,
    byVehicle: (id: string) => `${API_BASE_URL}${API_PREFIX}/costs/vehicle/${id}`,
    byDriver: (id: string) => `${API_BASE_URL}${API_PREFIX}/costs/driver/${id}`,
    byDateRange: `${API_BASE_URL}${API_PREFIX}/costs/date-range`,
    create: `${API_BASE_URL}${API_PREFIX}/expenses`,
    update: (id: string) => `${API_BASE_URL}${API_PREFIX}/expenses/${id}`,
  },
  
  // Profile endpoints
  profile: `${API_BASE_URL}${API_PREFIX}/profile`,
  updateProfile: `${API_BASE_URL}${API_PREFIX}/profile/update`,
  changePassword: `${API_BASE_URL}${API_PREFIX}/profile/change-password`,
  
  // Reports endpoints
  reports: {
    expenses: `${API_BASE_URL}${API_PREFIX}/reports/expenses`,
    vehicles: `${API_BASE_URL}${API_PREFIX}/reports/vehicles`,
    drivers: `${API_BASE_URL}${API_PREFIX}/reports/drivers`,
    contracts: `${API_BASE_URL}${API_PREFIX}/reports/contracts`,
  },
  
  // Settings endpoints
  settings: `${API_BASE_URL}${API_PREFIX}/settings`,
  companySettings: `${API_BASE_URL}${API_PREFIX}/company`,
  companies: `${API_BASE_URL}${API_PREFIX}/companies`,
  
  // Notes endpoints
  notes: {
    list: `${API_BASE_URL}${API_PREFIX}/notes`,
    create: `${API_BASE_URL}${API_PREFIX}/notes`,
    update: (id: string) => `${API_BASE_URL}${API_PREFIX}/notes/${id}`,
    delete: (id: string) => `${API_BASE_URL}${API_PREFIX}/notes/${id}`,
  },
};

export const API_HEADERS = {
  'Content-Type': 'application/json',
};

export const getAuthHeader = (token: string) => ({
  ...API_HEADERS,
  'Authorization': `Bearer ${token}`,
}); 