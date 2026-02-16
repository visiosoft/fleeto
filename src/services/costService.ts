import axios from 'axios';
import { Cost } from '../types';
import { API_CONFIG, getApiUrl } from '../config/api';

/**
 * Expense Management API Service
 */
export const costService = {
  /**
   * Get all costs
   */
  getAllCosts: async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.COSTS));
      return response.data;
    } catch (error) {
      console.error('Error fetching costs', error);
      throw error;
    }
  },

  /**
   * Get cost by ID
   */
  getCostById: async (id: string) => {
    try {
      const response = await axios.get(`${getApiUrl(API_CONFIG.ENDPOINTS.COSTS)}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching cost with id ${id}`, error);
      throw error;
    }
  },

  /**
   * Create a new cost
   */
  createCost: async (costData: Omit<Cost, '_id'>) => {
    try {
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.COSTS), costData);
      return response.data;
    } catch (error) {
      console.error('Error creating cost', error);
      throw error;
    }
  },

  /**
   * Update an existing cost
   */
  updateCost: async (id: string, costData: Partial<Cost>) => {
    try {
      const response = await axios.put(`${getApiUrl(API_CONFIG.ENDPOINTS.COSTS)}/${id}`, costData);
      return response.data;
    } catch (error) {
      console.error(`Error updating cost with id ${id}`, error);
      throw error;
    }
  },

  /**
   * Delete a cost
   */
  deleteCost: async (id: string) => {
    try {
      const response = await axios.delete(`${getApiUrl(API_CONFIG.ENDPOINTS.COSTS)}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting cost with id ${id}`, error);
      throw error;
    }
  },

  /**
   * Get costs by vehicle ID
   */
  getCostsByVehicle: async (vehicleId: string) => {
    try {
      const response = await axios.get(`${getApiUrl(API_CONFIG.ENDPOINTS.COSTS)}/vehicle/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching costs for vehicle ${vehicleId}`, error);
      throw error;
    }
  },

  /**
   * Get costs by date range
   */
  getCostsByDateRange: async (startDate: string, endDate: string) => {
    try {
      const response = await axios.get(`${getApiUrl(API_CONFIG.ENDPOINTS.COSTS)}/date-range`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching costs for date range`, error);
      throw error;
    }
  },

  /**
   * Get costs summary (total by category)
   */
  getCostsSummary: async () => {
    try {
      const response = await axios.get(`${getApiUrl(API_CONFIG.ENDPOINTS.COSTS)}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching costs summary', error);
      throw error;
    }
  }
};

export default costService; 