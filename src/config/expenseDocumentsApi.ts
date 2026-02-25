// Add this to API_ENDPOINTS.costs
import { API_BASE_URL } from './environment';
export const getDocuments = (expenseId: string) => `${API_BASE_URL}/expenses/${expenseId}/documents`;
