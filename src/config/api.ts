export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  ENDPOINTS: {
    MAINTENANCE: '/maintenance',
    VEHICLES: '/vehicles',
    FUEL: '/fuel',
    CONTRACTS: '/contracts',
    DRIVERS: '/drivers'
  }
};

export const getApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`; 