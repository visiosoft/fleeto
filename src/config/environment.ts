const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000'
  : 'https://api.mypaperlessoffice.org';

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
  
  // Driver endpoints
  drivers: `${API_BASE_URL}/drivers`,
  driverDetails: (id: string) => `${API_BASE_URL}/drivers/${id}`,
  
  // Contract endpoints
  contracts: `${API_BASE_URL}/contracts`,
  contractDetails: (id: string) => `${API_BASE_URL}/contracts/${id}`,
  contractTemplates: `${API_BASE_URL}/contracts/templates`,
  
  // Profile endpoints
  profile: `${API_BASE_URL}/profile`,
  updateProfile: `${API_BASE_URL}/profile/update`,
  
  // Reports endpoints
  reports: `${API_BASE_URL}/reports`,
  generateReport: (type: string) => `${API_BASE_URL}/reports/${type}`,
  
  // Settings endpoints
  settings: `${API_BASE_URL}/settings`,
  companySettings: `${API_BASE_URL}/company-settings`,
};

export const API_HEADERS = {
  'Content-Type': 'application/json',
};

export const getAuthHeader = (token: string) => ({
  ...API_HEADERS,
  'Authorization': `Bearer ${token}`,
}); 