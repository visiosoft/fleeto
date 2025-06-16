import axios from 'axios';
import { Receipt } from '../types/api';

const BASE_URL = process.env.REACT_APP_API_URL;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

class ReceiptService {
  private static instance: ReceiptService;
  private axiosInstance;

  private constructor() {
    const token = localStorage.getItem('token');
    
    this.axiosInstance = axios.create({
      baseURL: `${BASE_URL}/receipts`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      timeout: 5000,
    });

    this.axiosInstance.interceptors.request.use(
      (config) => {
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
  }

  public static getInstance(): ReceiptService {
    if (!ReceiptService.instance) {
      ReceiptService.instance = new ReceiptService();
    }
    return ReceiptService.instance;
  }

  private async retryRequest(requestFn: () => Promise<any>, retries = MAX_RETRIES): Promise<any> {
    try {
      return await requestFn();
    } catch (error: any) {
      if (retries > 0 && error.response?.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.retryRequest(requestFn, retries - 1);
      }
      throw error;
    }
  }

  // Get all receipts
  async getAllReceipts(page: number = 1, limit: number = 10) {
    return this.retryRequest(() => 
      this.axiosInstance.get('/', {
        params: { page, limit }
      })
    );
  }

  // Get receipt by ID
  async getReceiptById(id: string) {
    return this.retryRequest(() => 
      this.axiosInstance.get(`/${id}`)
    );
  }

  // Create new receipt
  async createReceipt(receipt: Omit<Receipt, '_id' | 'createdAt' | 'updatedAt'>) {
    return this.retryRequest(() => 
      this.axiosInstance.post('/', receipt)
    );
  }

  // Update receipt
  async updateReceipt(id: string, receipt: Partial<Receipt>) {
    return this.retryRequest(() => 
      this.axiosInstance.put(`/${id}`, receipt)
    );
  }

  // Delete receipt
  async deleteReceipt(id: string) {
    return this.retryRequest(() => 
      this.axiosInstance.delete(`/${id}`)
    );
  }

  // Generate PDF
  async generatePDF(id: string) {
    return this.retryRequest(() => 
      this.axiosInstance.get(`/${id}/pdf`, {
        responseType: 'blob'
      })
    );
  }
}

export default ReceiptService; 