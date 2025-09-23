import axios from 'axios';
import { Invoice } from '../types/api';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class InvoiceService {
  private static instance: InvoiceService;
  private axiosInstance;

  private constructor() {
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    this.axiosInstance = axios.create({
      baseURL: `${BASE_URL}/invoices`,
      headers: {
        'Content-Type': 'application/json',
        // Include the Authorization header if token exists
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      timeout: 5000, // 5 seconds timeout
    });

    // Add request interceptor to always use the latest token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Update token on each request to ensure we have the latest
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers['Authorization'] = `Bearer ${currentToken}`;
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
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response:', error.response.data);
          return Promise.reject(new Error(error.response.data.message || 'An error occurred'));
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          return Promise.reject(new Error('No response received from server. Please check your connection.'));
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error setting up request:', error.message);
          return Promise.reject(new Error('Error setting up request. Please try again.'));
        }
      }
    );
  }

  public static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  private async retryRequest<T>(request: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
    try {
      return await request();
    } catch (error: any) {
      if (retries > 0 && (error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
        console.log(`Retrying request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.retryRequest(request, retries - 1);
      }
      throw error;
    }
  }

  // Get all invoices with pagination
  async getAllInvoices(page: number = 1, limit: number = 10) {
    return this.retryRequest(() => 
      this.axiosInstance.get('/', {
        params: { page, limit }
      })
    );
  }

  // Get invoice by ID
  async getInvoiceById(id: string) {
    return this.retryRequest(() => 
      this.axiosInstance.get(`/${id}`)
    );
  }

  // Create new invoice
  async createInvoice(invoice: Omit<Invoice, '_id' | 'createdAt' | 'updatedAt'>) {
    return this.retryRequest(() => 
      this.axiosInstance.post('/', invoice)
    );
  }

  // Update invoice
  async updateInvoice(id: string, invoice: Partial<Invoice>) {
    return this.retryRequest(() => 
      this.axiosInstance.put(`/${id}`, invoice, {
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: (status) => status < 500, // Don't retry on 4xx errors
      })
    );
  }

  // Delete invoice
  async deleteInvoice(id: string) {
    return this.retryRequest(() => 
      this.axiosInstance.delete(`/${id}`)
    );
  }

  // Get invoice statistics
  async getInvoiceStats() {
    return this.retryRequest(() => 
      this.axiosInstance.get('/stats')
    );
  }

  // Record payment for invoice
  async recordPayment(id: string, payment: {
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    notes?: string;
  }) {
    return this.retryRequest(() => 
      this.axiosInstance.post(`/${id}/payments`, payment)
    );
  }

  // Send invoice
  async sendInvoice(id: string) {
    return this.retryRequest(() => 
      this.axiosInstance.post(`/${id}/send`)
    );
  }

  // Get invoices by contract
  async getInvoicesByContract(contractId: string) {
    return this.retryRequest(() => 
      this.axiosInstance.get(`/contract/${contractId}`)
    );
  }
}

export default InvoiceService; 