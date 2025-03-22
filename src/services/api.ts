/**
 * API Service for making HTTP requests to the backend
 */

import axios from 'axios';
import type { Driver, APIResponse } from '../types/api';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Generic API request handler
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'An error occurred while fetching the data.');
  }

  return response.json();
}

/**
 * Driver API endpoints
 */
export const driverAPI = {
  getAll: () => api.get<APIResponse<Driver[]>>('/drivers'),
  
  getById: (id: string) => api.get<APIResponse<Driver>>(`/drivers/${id}`),
  
  create: (data: Omit<Driver, '_id'>) => api.post<APIResponse<Driver>>('/drivers', data),
  
  update: (id: string, data: Partial<Driver>) => api.put<APIResponse<Driver>>(`/drivers/${id}`, data),
  
  delete: (id: string) => api.delete<APIResponse<void>>(`/drivers/${id}`),
  
  search: (query: string) => api.get<APIResponse<Driver[]>>(`/drivers/search?q=${query}`),
};

/**
 * Vehicle API endpoints
 */
export const vehicleAPI = {
  getAll: () => request<any[]>('/vehicles'),
  
  getById: (id: string) => request<any>(`/vehicles/${id}`),
  
  create: (data: any) => request<any>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => request<any>(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => request<void>(`/vehicles/${id}`, {
    method: 'DELETE',
  }),
  
  search: (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return request<any[]>(`/vehicles/search?${searchParams.toString()}`);
  },
};

/**
 * Maintenance API endpoints
 */
export const maintenanceAPI = {
  getAll: () => request<any[]>('/maintenance'),
  
  getById: (id: string) => request<any>(`/maintenance/${id}`),
  
  create: (data: any) => request<any>('/maintenance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => request<any>(`/maintenance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => request<void>(`/maintenance/${id}`, {
    method: 'DELETE',
  }),
  
  search: (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return request<any[]>(`/maintenance/search?${searchParams.toString()}`);
  },
};

/**
 * Fuel API endpoints
 */
export const fuelAPI = {
  getAll: () => request<any[]>('/fuel'),
  
  getById: (id: string) => request<any>(`/fuel/${id}`),
  
  create: (data: any) => request<any>('/fuel', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => request<any>(`/fuel/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => request<void>(`/fuel/${id}`, {
    method: 'DELETE',
  }),
  
  search: (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return request<any[]>(`/fuel/search?${searchParams.toString()}`);
  },
};

/**
 * Contract API endpoints
 */
export const contractAPI = {
  getAll: () => request<any[]>('/contracts'),
  
  getById: (id: string) => request<any>(`/contracts/${id}`),
  
  create: (data: any) => request<any>('/contracts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: any) => request<any>(`/contracts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => request<void>(`/contracts/${id}`, {
    method: 'DELETE',
  }),
  
  search: (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return request<any[]>(`/contracts/search?${searchParams.toString()}`);
  },
}; 