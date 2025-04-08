import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';

interface DashboardData {
  totalVehicles: number;
  activeDrivers: number;
  totalTrips: number;
  totalRevenue: number;
  recentTrips: any[];
  vehicleStatus: any[];
  driverStatus: any[];
}

interface CacheConfig {
  duration: number; // in milliseconds
}

const CACHE_KEY = 'dashboard_cache';
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useDashboardCache = (config: CacheConfig = { duration: DEFAULT_CACHE_DURATION }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getCachedData = (): DashboardData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > config.duration;

      if (isExpired) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error reading cache:', err);
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  const setCachedData = (newData: DashboardData) => {
    try {
      const cacheData = {
        data: newData,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Error setting cache:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // If no cache or expired, fetch new data
      const [vehiclesResponse, driversResponse, tripsResponse, revenueResponse] = await Promise.all([
        axios.get(getApiUrl('/vehicles/stats')),
        axios.get(getApiUrl('/drivers/stats')),
        axios.get(getApiUrl('/trips/stats')),
        axios.get(getApiUrl('/revenue/stats'))
      ]);

      // Combine the data from all endpoints
      const newData: DashboardData = {
        totalVehicles: vehiclesResponse.data.total || 0,
        activeDrivers: driversResponse.data.active || 0,
        totalTrips: tripsResponse.data.total || 0,
        totalRevenue: revenueResponse.data.total || 0,
        recentTrips: tripsResponse.data.recent || [],
        vehicleStatus: vehiclesResponse.data.status || [],
        driverStatus: driversResponse.data.status || []
      };

      setData(newData);
      setCachedData(newData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(new Error(errorMessage));
      
      // If we have cached data, use it as fallback
      const cachedData = getCachedData();
      if (cachedData) {
        setData(cachedData);
      }
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = () => {
    localStorage.removeItem(CACHE_KEY);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: invalidateCache,
  };
}; 