import axios from 'axios';
import { Company } from '../types/api';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class CompanyService {
  private static instance: CompanyService;
  private axiosInstance;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${BASE_URL}/companies`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    // Add request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for better error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNABORTED') {
          console.error('Request timed out');
          return Promise.reject(new Error('Request timed out. Please try again.'));
        }
        if (error.response) {
          console.error('Error response:', error.response.data);
          return Promise.reject(new Error(error.response.data.message || 'An error occurred'));
        } else if (error.request) {
          console.error('No response received:', error.request);
          return Promise.reject(new Error('No response received from server. Please check your connection.'));
        } else {
          console.error('Error setting up request:', error.message);
          return Promise.reject(new Error('Error setting up request. Please try again.'));
        }
      }
    );
  }

  public static getInstance(): CompanyService {
    if (!CompanyService.instance) {
      CompanyService.instance = new CompanyService();
    }
    return CompanyService.instance;
  }

  private async retryRequest<T>(requestFn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  // Create a new company
  async createCompany(companyData: Partial<Company>) {
    return this.retryRequest(() => 
      this.axiosInstance.post('/', companyData)
    );
  }

  // Get all companies
  async getAllCompanies(page = 1, limit = 10) {
    return this.retryRequest(() => 
      this.axiosInstance.get(`/?page=${page}&limit=${limit}`)
    );
  }

  // Get company by ID
  async getCompanyById(id: string) {
    return this.retryRequest(() => 
      this.axiosInstance.get(`/${id}`)
    );
  }

  // Update company
  async updateCompany(id: string, companyData: Partial<Company>) {
    return this.retryRequest(() => 
      this.axiosInstance.put(`/${id}`, companyData)
    );
  }

  // Delete company
  async deleteCompany(id: string) {
    return this.retryRequest(() => 
      this.axiosInstance.delete(`/${id}`)
    );
  }

  // Get company settings
  async getCompanySettings(id: string) {
    return this.retryRequest(() => 
      this.axiosInstance.get(`/${id}/settings`)
    );
  }

  // Update company settings
  async updateCompanySettings(id: string, settings: Partial<Company['settings']>) {
    return this.retryRequest(() => 
      this.axiosInstance.put(`/${id}/settings`, settings)
    );
  }
}

export default CompanyService; 