export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  ENDPOINTS: {
    DRIVERS: '/drivers',
    VEHICLES: '/vehicles',
    MAINTENANCE: '/maintenance',
    FUEL: '/fuel',
    COSTS: '/costs',
    CONTRACTS: '/contracts',
    REPORTS: '/reports',
    COMPLIANCE: '/compliance'
  }
};

export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 