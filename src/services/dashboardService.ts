import axios from 'axios';
import { getApiUrl } from '../config/api';
import cacheService from './cacheService';

// Define cache keys
const CACHE_KEYS = {
  ACTIVE_DRIVERS: 'dashboard_active_drivers',
  ACTIVE_VEHICLES: 'dashboard_active_vehicles',
  FUEL_CURRENT_MONTH: 'dashboard_fuel_current_month',
  MAINTENANCE_CURRENT_MONTH: 'dashboard_maintenance_current_month',
  CONTRACT_STATS: 'dashboard_contract_stats',
  COST_MONTHLY: 'dashboard_cost_monthly',
  COST_YEARLY: 'dashboard_cost_yearly',
  COST_BY_CATEGORY: 'dashboard_cost_by_category',
} as const;

// Cache TTL in milliseconds
const CACHE_TTL = {
  SHORT: 2 * 60 * 1000, // 2 minutes for frequently changing data
  MEDIUM: 5 * 60 * 1000, // 5 minutes for moderately changing data
  LONG: 15 * 60 * 1000, // 15 minutes for rarely changing data
} as const;

// API Response interfaces
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

interface DriverResponse {
  totalActiveDrivers: number;
  drivers: Array<{
    _id: string;
    status: string;
    firstName: string;
    lastName: string;
    licenseNumber: string;
    licenseState: string;
    licenseExpiry: string;
    contact: string;
    address: string;
    rating: number;
    notes?: string;
  }>;
}

interface VehicleResponse {
  totalActiveVehicles: number;
  vehicles: Array<{
    _id: string;
    status: string;
    make: string;
    model: string;
    year: string;
    licensePlate: string;
  }>;
}

interface CurrentMonthFuelResponse {
  totalCost: number;
  totalTransactions: number;
  fuelExpenses: Array<{
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
    invoiceNumber?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  month: number;
  year: number;
}

interface CurrentMonthMaintenanceResponse {
  totalCost: number;
  totalTransactions: number;
  maintenanceExpenses: Array<{
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
    invoiceNumber?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  month: number;
  year: number;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  expiringSoon: number;
  totalValue: number;
  recentContracts: Array<{
    _id: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
  lastUpdated: string;
  debug: {
    totalFound: number;
    contractsWithFutureEndDate: number;
    currentDate: string;
    manualCounts: {
      active: number;
      expiringSoon: number;
      totalValue: number;
    };
    aggregateCounts: {
      active: number;
      expiringSoon: number;
      totalValue: number;
    };
  };
}

interface MonthlyExpensesResponse {
  monthlyExpenses: Array<{
    totalAmount: number;
    count: number;
    month: number;
    year: number;
    categories: Array<{
      category: string;
      vehicleType: string;
      totalAmount: number;
      count: number;
    }>;
  }>;
  yearlyTotal: number;
}

interface YearlyExpensesResponse {
  yearlyExpenses: Array<{
    totalAmount: number;
    count: number;
    year: number;
    categories: Array<{
      category: string;
      vehicleType: string;
      totalAmount: number;
      count: number;
    }>;
  }>;
  grandTotal: number;
}

interface CategoryExpensesResponse {
  categories: Array<{
    totalAmount: number;
    count: number;
    category: string;
    percentage: number;
  }>;
  total: number;
}

class DashboardService {
  /**
   * Fetch active drivers with caching
   */
  async getActiveDrivers(forceRefresh = false): Promise<DriverResponse> {
    const cacheKey = CACHE_KEYS.ACTIVE_DRIVERS;
    
    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get<DriverResponse>(cacheKey)!;
    }

    try {
      const response = await axios.get<ApiResponse<DriverResponse>>(
        getApiUrl('/dashboard/active-drivers')
      );

      if (response.data.status === 'error' || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch active drivers');
      }

      const data = response.data.data;
      cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM);
      return data;
    } catch (error) {
      console.error('Failed to fetch active drivers:', error);
      throw error;
    }
  }

  /**
   * Fetch active vehicles with caching
   */
  async getActiveVehicles(forceRefresh = false): Promise<VehicleResponse> {
    const cacheKey = CACHE_KEYS.ACTIVE_VEHICLES;
    
    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get<VehicleResponse>(cacheKey)!;
    }

    try {
      const response = await axios.get<ApiResponse<VehicleResponse>>(
        getApiUrl('/dashboard/active-vehicles')
      );

      if (response.data.status === 'error' || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch active vehicles');
      }

      const data = response.data.data;
      cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM);
      return data;
    } catch (error) {
      console.error('Failed to fetch active vehicles:', error);
      throw error;
    }
  }

  /**
   * Fetch current month fuel data with caching
   */
  async getCurrentMonthFuel(forceRefresh = false): Promise<CurrentMonthFuelResponse> {
    const cacheKey = CACHE_KEYS.FUEL_CURRENT_MONTH;
    
    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get<CurrentMonthFuelResponse>(cacheKey)!;
    }

    try {
      const response = await axios.get<ApiResponse<CurrentMonthFuelResponse>>(
        getApiUrl('/dashboard/fuel/current-month')
      );

      if (response.data.status === 'error' || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch fuel data');
      }

      const data = response.data.data;
      cacheService.set(cacheKey, data, CACHE_TTL.SHORT);
      return data;
    } catch (error) {
      console.error('Failed to fetch fuel data:', error);
      throw error;
    }
  }

  /**
   * Fetch current month maintenance data with caching
   */
  async getCurrentMonthMaintenance(forceRefresh = false): Promise<CurrentMonthMaintenanceResponse> {
    const cacheKey = CACHE_KEYS.MAINTENANCE_CURRENT_MONTH;
    
    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get<CurrentMonthMaintenanceResponse>(cacheKey)!;
    }

    try {
      const response = await axios.get<ApiResponse<CurrentMonthMaintenanceResponse>>(
        getApiUrl('/dashboard/maintenance/current-month')
      );

      if (response.data.status === 'error' || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch maintenance data');
      }

      const data = response.data.data;
      cacheService.set(cacheKey, data, CACHE_TTL.SHORT);
      return data;
    } catch (error) {
      console.error('Failed to fetch maintenance data:', error);
      throw error;
    }
  }

  /**
   * Fetch contract statistics with caching
   */
  async getContractStats(forceRefresh = false): Promise<ContractStats> {
    const cacheKey = CACHE_KEYS.CONTRACT_STATS;
    
    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get<ContractStats>(cacheKey)!;
    }

    try {
      const response = await axios.get<ApiResponse<ContractStats>>(
        getApiUrl('/dashboard/contracts/stats')
      );

      if (response.data.status === 'error' || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch contract stats');
      }

      const data = response.data.data;
      cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM);
      return data;
    } catch (error) {
      console.error('Failed to fetch contract stats:', error);
      throw error;
    }
  }

  /**
   * Fetch monthly expenses with caching
   */
  async getMonthlyExpenses(forceRefresh = false): Promise<MonthlyExpensesResponse> {
    const cacheKey = CACHE_KEYS.COST_MONTHLY;
    
    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get<MonthlyExpensesResponse>(cacheKey)!;
    }

    try {
      const response = await axios.get<ApiResponse<MonthlyExpensesResponse>>(
        getApiUrl('/costs/monthly')
      );

      if (response.data.status === 'error' || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch monthly expenses');
      }

      const data = response.data.data;
      cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM);
      return data;
    } catch (error) {
      console.error('Failed to fetch monthly expenses:', error);
      throw error;
    }
  }

  /**
   * Fetch yearly expenses with caching
   */
  async getYearlyExpenses(forceRefresh = false): Promise<YearlyExpensesResponse> {
    const cacheKey = CACHE_KEYS.COST_YEARLY;
    
    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get<YearlyExpensesResponse>(cacheKey)!;
    }

    try {
      const response = await axios.get<ApiResponse<YearlyExpensesResponse>>(
        getApiUrl('/costs/yearly')
      );

      if (response.data.status === 'error' || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch yearly expenses');
      }

      const data = response.data.data;
      cacheService.set(cacheKey, data, CACHE_TTL.LONG);
      return data;
    } catch (error) {
      console.error('Failed to fetch yearly expenses:', error);
      throw error;
    }
  }

  /**
   * Fetch expenses by category with caching
   */
  async getExpensesByCategory(forceRefresh = false): Promise<CategoryExpensesResponse> {
    const cacheKey = CACHE_KEYS.COST_BY_CATEGORY;
    
    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get<CategoryExpensesResponse>(cacheKey)!;
    }

    try {
      const response = await axios.get<ApiResponse<CategoryExpensesResponse>>(
        getApiUrl('/costs/by-category')
      );

      if (response.data.status === 'error' || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch category expenses');
      }

      const data = response.data.data;
      cacheService.set(cacheKey, data, CACHE_TTL.MEDIUM);
      return data;
    } catch (error) {
      console.error('Failed to fetch category expenses:', error);
      throw error;
    }
  }

  /**
   * Invalidate specific cache keys
   */
  invalidateCache(keys?: string[]): void {
    if (keys) {
      keys.forEach(key => cacheService.delete(key));
    } else {
      // Invalidate all dashboard cache
      Object.values(CACHE_KEYS).forEach(key => cacheService.delete(key));
    }
  }

  /**
   * Force refresh all dashboard data
   */
  async refreshAllData(): Promise<void> {
    this.invalidateCache();
    // Preload critical data
    await Promise.allSettled([
      this.getActiveDrivers(true),
      this.getActiveVehicles(true),
      this.getCurrentMonthFuel(true),
      this.getCurrentMonthMaintenance(true),
      this.getContractStats(true),
    ]);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheService.getStats();
  }
}

// Create singleton instance
const dashboardService = new DashboardService();

export default dashboardService;
