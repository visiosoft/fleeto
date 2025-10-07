import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface WhatsAppExpense {
  _id: string;
  vehicleId: string;
  driverId: string;
  expenseType: string;
  amount: number;
  date: string;
  description: string;
  paymentStatus: string;
  paymentMethod: string;
  vendor?: string;
  source: string;
  whatsappMessageId: string;
  rawMessage: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    _id: string;
    licensePlate: string;
    make: string;
    model: string;
  };
  driver?: {
    _id: string;
    firstName: string;
    lastName: string;
    contact: string;
  };
}

export interface WhatsAppExpenseStats {
  total: number;
  totalAmount: number;
  pending: number;
  approved: number;
  rejected: number;
  pendingAmount: number;
  approvedAmount: number;
}

export interface BotStatus {
  isRunning: boolean;
  isReady: boolean;
}

class WhatsAppService {
  private static instance: WhatsAppService;

  private constructor() {}

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Get all WhatsApp expenses
  async getExpenses(params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ expenses: WhatsAppExpense[]; pagination: any }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await axios.get(
        `${BASE_URL}/api/whatsapp/expenses?${queryParams.toString()}`,
        { headers: this.getHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching WhatsApp expenses:', error);
      throw error;
    }
  }

  // Get single WhatsApp expense
  async getExpense(id: string): Promise<WhatsAppExpense> {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/whatsapp/expenses/${id}`,
        { headers: this.getHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching WhatsApp expense:', error);
      throw error;
    }
  }

  // Update expense status
  async updateExpenseStatus(id: string, status: 'approved' | 'rejected' | 'pending', notes?: string): Promise<void> {
    try {
      await axios.patch(
        `${BASE_URL}/api/whatsapp/expenses/${id}/status`,
        { status, notes },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error updating expense status:', error);
      throw error;
    }
  }

  // Get expense statistics
  async getExpenseStats(): Promise<WhatsAppExpenseStats> {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/whatsapp/expenses/stats`,
        { headers: this.getHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error fetching expense stats:', error);
      throw error;
    }
  }

  // Delete WhatsApp expense
  async deleteExpense(id: string): Promise<void> {
    try {
      await axios.delete(
        `${BASE_URL}/api/whatsapp/expenses/${id}`,
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  // Bot management
  async getBotStatus(): Promise<BotStatus> {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/whatsapp/bot/status`,
        { headers: this.getHeaders() }
      );

      return response.data.data;
    } catch (error) {
      console.error('Error getting bot status:', error);
      throw error;
    }
  }

  async startBot(): Promise<void> {
    try {
      await axios.post(
        `${BASE_URL}/api/whatsapp/bot/start`,
        {},
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error starting bot:', error);
      throw error;
    }
  }

  async stopBot(): Promise<void> {
    try {
      await axios.post(
        `${BASE_URL}/api/whatsapp/bot/stop`,
        {},
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error stopping bot:', error);
      throw error;
    }
  }

  async restartBot(): Promise<void> {
    try {
      await axios.post(
        `${BASE_URL}/api/whatsapp/bot/restart`,
        {},
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error restarting bot:', error);
      throw error;
    }
  }

  async sendTestMessage(to: string, message: string): Promise<void> {
    try {
      await axios.post(
        `${BASE_URL}/api/whatsapp/bot/send-test`,
        { to, message },
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error sending test message:', error);
      throw error;
    }
  }
}

export default WhatsAppService;



