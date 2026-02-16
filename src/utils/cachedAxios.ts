import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiCache, generateCacheKey } from './apiCache';

// URLs that should be cached
const CACHEABLE_ENDPOINTS = [
  '/api/vehicles',
  '/api/contracts',
  '/api/dashboard/contracts/stats',
  '/api/drivers',
  '/api/company-settings'
];

// URLs that should NOT be cached
const NON_CACHEABLE_ENDPOINTS = [
  '/upload',
  '/delete',
  '/auth',
  '/login',
  '/register'
];

function shouldCache(url: string, method: string): boolean {
  // Only cache GET requests
  if (method?.toUpperCase() !== 'GET') {
    return false;
  }

  // Check if URL matches non-cacheable patterns
  if (NON_CACHEABLE_ENDPOINTS.some(pattern => url.includes(pattern))) {
    return false;
  }

  // Check if URL matches cacheable patterns
  return CACHEABLE_ENDPOINTS.some(pattern => url.includes(pattern));
}

// Create axios instance with caching
export const createCachedAxios = (): AxiosInstance => {
  const instance = axios.create();

  // Request interceptor for caching
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      // Check if this request should use cache
      if (shouldCache(config.url || '', config.method || 'GET')) {
        const cacheKey = generateCacheKey(config.url || '', config.params);
        const cachedData = apiCache.get(cacheKey);

        if (cachedData) {
          console.log(`[Cache HIT] ${config.url}`);
          // Return cached data as a fulfilled promise
          return Promise.reject({
            config,
            response: {
              data: cachedData,
              status: 200,
              statusText: 'OK (from cache)',
              headers: {},
              config
            },
            isCache: true
          });
        } else {
          console.log(`[Cache MISS] ${config.url}`);
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for caching
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // Cache successful GET responses
      if (shouldCache(response.config.url || '', response.config.method || 'GET')) {
        const cacheKey = generateCacheKey(response.config.url || '', response.config.params);
        apiCache.set(cacheKey, response.data, 5 * 60 * 1000); // 5 minutes
        console.log(`[Cached] ${response.config.url}`);
      }
      return response;
    },
    (error) => {
      // Handle cache hits
      if (error.isCache) {
        return Promise.resolve(error.response);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const cachedAxios = createCachedAxios();

// Clear cache function (useful after mutations)
export function clearApiCache(pattern?: string) {
  if (pattern) {
    // Clear specific cache entries
    console.log(`Clearing cache for pattern: ${pattern}`);
  } else {
    apiCache.clear();
    console.log('Cleared all API cache');
  }
}
