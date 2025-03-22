// API Configuration for Fleet Management Application

// MongoDB connection string (for server-side use only)
const MONGODB_URI = 'mongodb+srv://devxulfiqar:nSISUpLopruL7S8j@mypaperlessoffice.z5g84.mongodb.net/?retryWrites=true&w=majority&appName=mypaperlessoffice';

// MongoDB connection information (for reference)
export const mongoDbInfo = {
  uri: MONGODB_URI,
  database: 'fleet-management',
  collections: {
    drivers: 'drivers',
    vehicles: 'vehicles',
    maintenance: 'maintenance',
    fuel: 'fuel',
    contracts: 'contracts',
  }
};

// API client using native fetch
// This replaces axios due to disk space issues

const API_BASE_URL = "/api"; // Replace with actual API endpoint if available

// Type for request options
type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string>;
};

// Create a fetch-based API client
const apiClient = {
  // GET request
  async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    let requestUrl = `${API_BASE_URL}${url}`;
    
    // Add query parameters if provided
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      requestUrl += `?${queryString}`;
    }
    
    const response = await fetch(requestUrl);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // POST request
  async post<T>(url: string, data: any, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // PUT request
  async put<T>(url: string, data: any, options?: RequestOptions): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // DELETE request
  async delete(url: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }
};

export default apiClient; 