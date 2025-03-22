import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface Driver {
  _id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  contact: string;
  address: string;
  certifications: string[];
  notes: string;
}

interface CreateDriverData extends Omit<Driver, '_id'> {}

class DriverService {
  async getAllDrivers(): Promise<Driver[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching drivers:', error);
      throw error;
    }
  }

  async getDriver(id: string): Promise<Driver> {
    try {
      const response = await axios.get(`${API_BASE_URL}/drivers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching driver:', error);
      throw error;
    }
  }

  async createDriver(data: CreateDriverData): Promise<Driver> {
    try {
      const response = await axios.post(`${API_BASE_URL}/drivers`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating driver:', error);
      throw error;
    }
  }

  async updateDriver(id: string, data: Partial<CreateDriverData>): Promise<Driver> {
    try {
      const response = await axios.put(`${API_BASE_URL}/drivers/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating driver:', error);
      throw error;
    }
  }

  async deleteDriver(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/drivers/${id}`);
    } catch (error) {
      console.error('Error deleting driver:', error);
      throw error;
    }
  }
}

export const driverService = new DriverService(); 