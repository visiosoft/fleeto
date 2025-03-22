// MongoDB service for fleet-management application
// This service handles all interactions with MongoDB database

import apiClient from '../api/setupAxios';

const MONGODB_CONNECTION_STRING = "mongodb+srv://devxulfiqar:nSISUpLopruL7S8j@mypaperlessoffice.z5g84.mongodb.net/?retryWrites=true&w=majority&appName=mypaperlessoffice";

// Generic error handler for API requests
const handleApiError = (error: any, operation: string) => {
  console.error(`MongoDB API Error during ${operation}:`, error);
  throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
};

// MongoDB service for CRUD operations
const mongoDbService = {
  // Check connection to MongoDB
  async checkConnection(): Promise<boolean> {
    try {
      await apiClient.get('/health');
      return true;
    } catch (error) {
      console.warn("MongoDB connection check failed:", error);
      return false;
    }
  },

  // Get all documents from a collection
  async getAll<T>(collection: string): Promise<T[]> {
    try {
      return await apiClient.get(`/${collection}`);
    } catch (error) {
      handleApiError(error, `get all documents from ${collection}`);
      return [];
    }
  },

  // Get document by ID
  async getById<T>(collection: string, id: string | number): Promise<T | null> {
    try {
      return await apiClient.get(`/${collection}/${id}`);
    } catch (error) {
      handleApiError(error, `get document ${id} from ${collection}`);
      return null;
    }
  },

  // Create new document
  async create<T>(collection: string, data: any): Promise<T> {
    try {
      return await apiClient.post(`/${collection}`, data);
    } catch (error) {
      handleApiError(error, `create document in ${collection}`);
      throw error;
    }
  },

  // Update document
  async update<T>(collection: string, id: string | number, data: any): Promise<T> {
    try {
      return await apiClient.put(`/${collection}/${id}`, data);
    } catch (error) {
      handleApiError(error, `update document ${id} in ${collection}`);
      throw error;
    }
  },

  // Delete document
  async delete(collection: string, id: string | number): Promise<boolean> {
    try {
      await apiClient.delete(`/${collection}/${id}`);
      return true;
    } catch (error) {
      handleApiError(error, `delete document ${id} from ${collection}`);
      return false;
    }
  },

  // Search documents
  async search<T>(collection: string, query: object): Promise<T[]> {
    try {
      return await apiClient.get(`/${collection}/search`, query as Record<string, string>);
    } catch (error) {
      handleApiError(error, `search documents in ${collection}`);
      return [];
    }
  }
};

export default mongoDbService; 