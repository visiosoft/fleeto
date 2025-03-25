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
  public async login(email: string, password: string) {
    const response = await this.fetchWithAuth(API_ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  public async logout() {
    await this.fetchWithAuth(API_ENDPOINTS.logout, {
      method: 'POST',
    });
    this.removeToken();
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

  // Reports methods
  public async getReports() {
    return this.fetchWithAuth(API_ENDPOINTS.reports);
  }

  public async generateReport(type: string) {
    return this.fetchWithAuth(API_ENDPOINTS.generateReport(type));
  }

  // Settings methods
  public async getSettings() {
    return this.fetchWithAuth(API_ENDPOINTS.settings);
  }

  public async getCompanySettings() {
    return this.fetchWithAuth(API_ENDPOINTS.companySettings);
  }
}

export const api = ApiService.getInstance(); 