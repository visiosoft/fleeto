import { useState, useEffect, useCallback } from 'react';
import dashboardService from '../services/dashboardService';

interface DashboardData {
  activeDrivers: number;
  activeVehicles: number;
  fuelConsumption: {
    total: number;
    trend: number;
  };
  maintenanceCost: {
    total: number;
    trend: number;
  };
  contractStats: {
    totalContracts: number;
    activeContracts: number;
    expiringSoon: number;
    totalValue: number;
  };
  costData: {
    monthlyCost: number;
    yearToDate: number;
    trendPercentage: number;
    byCategory: Array<{
      id: string;
      value: number;
      label: string;
    }>;
  };
  fuelData: {
    monthlyCost: number;
    yearToDate: number;
    avgConsumption: number;
    trendPercentage: number;
    byVehicleType: Array<{
      id: string;
      value: number;
      label: string;
    }>;
    monthlyTrend: Array<{
      month: string;
      cost: number;
    }>;
  };
  maintenanceData: {
    monthlyCost: number;
    yearToDate: number;
    scheduledPercentage: number;
    trendPercentage: number;
    byType: Array<{
      id: string;
      value: number;
      label: string;
    }>;
    monthlyTrend: Array<{
      month: string;
      cost: number;
    }>;
  };
}

interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshAll: () => Promise<void>;
  isRefreshing: boolean;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch all data in parallel
      const [
        driversResponse,
        vehiclesResponse,
        fuelResponse,
        maintenanceResponse,
        contractResponse,
        monthlyCostResponse,
        yearlyCostResponse,
        categoryResponse,
      ] = await Promise.allSettled([
        dashboardService.getActiveDrivers(forceRefresh),
        dashboardService.getActiveVehicles(forceRefresh),
        dashboardService.getCurrentMonthFuel(forceRefresh),
        dashboardService.getCurrentMonthMaintenance(forceRefresh),
        dashboardService.getContractStats(forceRefresh),
        dashboardService.getMonthlyExpenses(forceRefresh),
        dashboardService.getYearlyExpenses(forceRefresh),
        dashboardService.getExpensesByCategory(forceRefresh),
      ]);

      // Process responses and handle errors
      const activeDrivers = driversResponse.status === 'fulfilled' 
        ? driversResponse.value.totalActiveDrivers 
        : 0;

      const activeVehicles = vehiclesResponse.status === 'fulfilled' 
        ? vehiclesResponse.value.totalActiveVehicles 
        : 0;

      const fuelConsumption = fuelResponse.status === 'fulfilled' 
        ? {
            total: fuelResponse.value.totalCost,
            trend: 0 // No trend data available
          }
        : { total: 0, trend: 0 };

      const maintenanceCost = maintenanceResponse.status === 'fulfilled' 
        ? {
            total: maintenanceResponse.value.totalCost,
            trend: 0 // No trend data available
          }
        : { total: 0, trend: 0 };

      const contractStats = contractResponse.status === 'fulfilled' 
        ? {
            totalContracts: contractResponse.value.totalContracts,
            activeContracts: contractResponse.value.activeContracts,
            expiringSoon: contractResponse.value.expiringSoon,
            totalValue: contractResponse.value.totalValue,
          }
        : {
            totalContracts: 0,
            activeContracts: 0,
            expiringSoon: 0,
            totalValue: 0,
          };

      // Process cost data
      const monthlyExpenses = monthlyCostResponse.status === 'fulfilled' 
        ? monthlyCostResponse.value.monthlyExpenses 
        : [];
      const currentMonthTotal = monthlyExpenses.length > 0 ? monthlyExpenses[0].totalAmount : 0;

      const yearlyTotal = yearlyCostResponse.status === 'fulfilled' 
        ? yearlyCostResponse.value.grandTotal 
        : 0;

      const categories = categoryResponse.status === 'fulfilled' 
        ? categoryResponse.value.categories 
        : [];

      const categoryChartData = categories.map((item) => ({
        id: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        value: item.totalAmount,
        label: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      }));

      const costData = {
        monthlyCost: currentMonthTotal,
        yearToDate: yearlyTotal,
        trendPercentage: 5, // Mock trend
        byCategory: categoryChartData,
      };

      // Process fuel data
      const fuelData = {
        monthlyCost: fuelConsumption.total,
        yearToDate: fuelConsumption.total, // Since we only have current month
        avgConsumption: fuelResponse.status === 'fulfilled' 
          ? (fuelResponse.value.totalTransactions > 0 ? fuelResponse.value.totalCost / fuelResponse.value.totalTransactions : 0)
          : 0,
        trendPercentage: 0,
        byVehicleType: [
          { id: 'Sedan', value: fuelConsumption.total * 0.4, label: 'Sedan' },
          { id: 'SUV', value: fuelConsumption.total * 0.3, label: 'SUV' },
          { id: 'Van', value: fuelConsumption.total * 0.2, label: 'Van' },
          { id: 'Truck', value: fuelConsumption.total * 0.1, label: 'Truck' },
        ],
        monthlyTrend: [
          {
            month: new Date().toLocaleDateString('en-US', { month: 'short' }),
            cost: fuelConsumption.total
          }
        ],
      };

      // Process maintenance data
      const maintenanceData = {
        monthlyCost: maintenanceCost.total,
        yearToDate: maintenanceCost.total, // Since we only have current month
        scheduledPercentage: 65, // Mock percentage
        trendPercentage: 0,
        byType: [
          { id: 'Scheduled', value: maintenanceCost.total * 0.6, label: 'Scheduled' },
          { id: 'Repairs', value: maintenanceCost.total * 0.3, label: 'Repairs' },
          { id: 'Inspection', value: maintenanceCost.total * 0.1, label: 'Inspection' },
        ],
        monthlyTrend: [
          {
            month: new Date().toLocaleDateString('en-US', { month: 'short' }),
            cost: maintenanceCost.total
          }
        ],
      };

      setData({
        activeDrivers,
        activeVehicles,
        fuelConsumption,
        maintenanceCost,
        contractStats,
        costData,
        fuelData,
        maintenanceData,
      });

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  const refreshAll = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      await dashboardService.refreshAllData();
      await fetchData(true);
    } catch (err) {
      console.error('Failed to refresh all data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    refreshAll,
    isRefreshing,
  };
};
