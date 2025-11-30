import axios from 'axios';

const API_URL = 'http://localhost:5000/api/invoices/beta';

class BetaInvoiceService {
    private static instance: BetaInvoiceService;

    private constructor() { }

    public static getInstance(): BetaInvoiceService {
        if (!BetaInvoiceService.instance) {
            BetaInvoiceService.instance = new BetaInvoiceService();
        }
        return BetaInvoiceService.instance;
    }

    private getAuthHeader() {
        const token = localStorage.getItem('token');
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    }

    async getAllInvoices(page: number = 1, limit: number = 10) {
        return axios.get(`${API_URL}?page=${page}&limit=${limit}`, this.getAuthHeader());
    }

    async getInvoiceById(id: string) {
        return axios.get(`${API_URL}/${id}`, this.getAuthHeader());
    }

    async createInvoice(invoiceData: any) {
        return axios.post(API_URL, invoiceData, this.getAuthHeader());
    }

    async updateInvoice(id: string, invoiceData: any) {
        return axios.put(`${API_URL}/${id}`, invoiceData, this.getAuthHeader());
    }

    async deleteInvoice(id: string) {
        return axios.delete(`${API_URL}/${id}`, this.getAuthHeader());
    }

    async addPayment(id: string, paymentData: any) {
        return axios.post(`${API_URL}/${id}/payments`, paymentData, this.getAuthHeader());
    }

    async deletePayment(id: string, paymentId: string) {
        return axios.delete(`${API_URL}/${id}/payments/${paymentId}`, this.getAuthHeader());
    }

    async getInvoiceStats() {
        return axios.get(`${API_URL}/stats`, this.getAuthHeader());
    }
}

export default BetaInvoiceService;
