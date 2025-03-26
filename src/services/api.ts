/**
 * API Service for making HTTP requests to the backend
 */

import { API_ENDPOINTS, API_HEADERS, getAuthHeader } from '../config/environment';

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  private constructor() {
    this.token = localStorage.getItem('token');
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  public removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers = this.token 
      ? getAuthHeader(this.token)
      : API_HEADERS;

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        window.location.href = '/login';
      }
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth methods
  public async register(data: {
    companyData: {
      name: string;
      registrationNumber: string;
      email: string;
      phone: string;
      address: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
      };
    };
    adminData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    };
  }) {
    // Registration doesn't need auth token
    const response = await fetch(API_ENDPOINTS.register, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    return response.json();
  }

  public async login(email: string, password: string) {
    const response = await fetch(API_ENDPOINTS.login, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.token) {
      this.setToken(data.token);
      localStorage.setItem('isAuthenticated', 'true');
    }
    return data;
  }

  public async logout() {
    if (this.token) {
      try {
        await this.fetchWithAuth(API_ENDPOINTS.logout, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
    this.removeToken();
    localStorage.removeItem('isAuthenticated');
  }

  // Dashboard methods
  public async getDashboardStats() {
    return this.fetchWithAuth(API_ENDPOINTS.dashboardStats);
  }

  public async getContractStats() {
    return this.fetchWithAuth(API_ENDPOINTS.contractStats);
  }

  // Vehicle methods
  public async getVehicles() {
    return this.fetchWithAuth(API_ENDPOINTS.vehicles);
  }

  public async getVehicleDetails(id: string) {
    return this.fetchWithAuth(API_ENDPOINTS.vehicleDetails(id));
  }

  // Driver methods
  public async getDrivers() {
    return this.fetchWithAuth(API_ENDPOINTS.drivers);
  }

  public async getDriverDetails(id: string) {
    return this.fetchWithAuth(API_ENDPOINTS.driverDetails(id));
  }

  // Contract methods
  public async getContracts() {
    return this.fetchWithAuth(API_ENDPOINTS.contracts);
  }

  public async getContractDetails(id: string) {
    return this.fetchWithAuth(API_ENDPOINTS.contractDetails(id));
  }

  public async getContractTemplates() {
    return this.fetchWithAuth(API_ENDPOINTS.contractTemplates);
  }

  // Profile methods
  public async getProfile() {
    return this.fetchWithAuth(API_ENDPOINTS.profile);
  }

  public async updateProfile(data: any) {
    return this.fetchWithAuth(API_ENDPOINTS.updateProfile, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Reports
  getExpensesReport = async () => {
    return this.fetchWithAuth(API_ENDPOINTS.reports.expenses);
  };

  getVehiclesReport = async () => {
    return this.fetchWithAuth(API_ENDPOINTS.reports.vehicles);
  };

  getDriversReport = async () => {
    return this.fetchWithAuth(API_ENDPOINTS.reports.drivers);
  };

  getContractsReport = async () => {
    return this.fetchWithAuth(API_ENDPOINTS.reports.contracts);
  };

  // Settings
  getSettings = async () => {
    return this.fetchWithAuth(API_ENDPOINTS.settings);
  };

  updateSettings = async (data: any) => {
    return this.fetchWithAuth(API_ENDPOINTS.settings, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  getCompanySettings = async () => {
    return this.fetchWithAuth(API_ENDPOINTS.companySettings);
  };

  updateCompanySettings = async (data: any) => {
    return this.fetchWithAuth(API_ENDPOINTS.companySettings, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  // Cost Management
  getCurrentMonthCosts = async () => {
    return this.fetchWithAuth(API_ENDPOINTS.costs.currentMonth);
  };

  createCost = async (data: {
    vehicleId: string;
    driverId: string;
    expenseType: string;
    amount: string;
    date: string;
    description: string;
    paymentStatus: string;
    paymentMethod: string;
  }) => {
    return this.fetchWithAuth(API_ENDPOINTS.costs.create, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  updateCost = async (id: string, data: {
    vehicleId: string;
    driverId: string;
    expenseType: string;
    amount: string;
    date: string;
    description: string;
    paymentStatus: string;
    paymentMethod: string;
  }) => {
    return this.fetchWithAuth(API_ENDPOINTS.costs.update(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  deleteCost = async (id: string) => {
    return this.fetchWithAuth(`${API_ENDPOINTS.costs.create}/${id}`, {
      method: 'DELETE',
    });
  };
}

export const api = ApiService.getInstance(); 