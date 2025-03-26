export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  ENDPOINTS: {
    MAINTENANCE: '/maintenance',
    VEHICLES: '/vehicles',
    FUEL: '/fuel-records',
    CONTRACTS: '/contracts',
    TEMPLATE: '/contracts/template',
    DRIVERS: {
      LIST: '/drivers',
      CREATE: '/drivers',
      UPDATE: (id: string) => `/drivers/${id}`,
      DELETE: (id: string) => `/drivers/${id}`,
    },
    COMPANY_SETTINGS: '/company-settings',
    UPLOAD_LOGO: '/company-settings/upload-logo',
    CONTRACT_TEMPLATES: '/contract-templates',
    COSTS: '/expenses',
    PAYROLL: {
      LIST: '/payroll/entries',
      CREATE: '/payroll/entries',
      UPDATE: (id: string) => `/payroll/entries/${id}`,
      DELETE: (id: string) => `/payroll/entries/${id}`,
      SUMMARY: '/payroll/summary',
      EXPORT: '/payroll/export'
    }
  }
};

export const getApiUrl = (endpoint: string) => `${API_CONFIG.BASE_URL}${endpoint}`