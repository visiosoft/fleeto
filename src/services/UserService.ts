import axios from 'axios';
import { User, APIResponse } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL ;

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'user';
  status: 'active' | 'inactive';
  password: string;
  companyId: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'manager' | 'user';
  status?: 'active' | 'inactive';
  password?: string;
  companyId?: string;
}

interface UsersResponse {
  status: string;
  data: {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class UserService {
  private static instance: UserService;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getToken(): string {
    if (!this.token) {
      throw new Error('No authentication token available');
    }
    return this.token;
  }

  private handleError(error: any): Error {
    if (error.response) {
      return new Error(error.response.data.message || 'An error occurred');
    }
    return new Error('Network error occurred');
  }

  async getUsers(companyId?: string): Promise<APIResponse<UsersResponse>> {
    try {
      const url = companyId 
        ? `${API_BASE_URL}/companies/${companyId}/users`
        : `${API_BASE_URL}/users`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserById(userId: string): Promise<APIResponse<User>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createUser(userData: CreateUserData): Promise<APIResponse<User>> {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, userData, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUser(userId: string, userData: UpdateUserData): Promise<APIResponse<User>> {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${userId}`, userData, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteUser(userId: string): Promise<APIResponse<void>> {
    try {
      const response = await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<APIResponse<void>> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/users/${userId}/password`,
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${this.getToken()}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export default UserService; 