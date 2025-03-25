export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  ENDPOINTS: {
    MAINTENANCE: '/maintenance',
    VEHICLES: '/vehicles',
    FUEL: '/fuel-records',
    CONTRACTS: '/contracts',
    TEMPLATE: '/contracts/template',
    DRIVERS: '/drivers',
    COMPANY_SETTINGS: '/company-settings',
    UPLOAD_LOGO: '/company-settings/upload-logo',
    CONTRACT_TEMPLATES: '/contract-templates',
    COSTS: '/expenses',
  }
};

export const getApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`