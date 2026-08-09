import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  if (__DEV__) {
    // Expo Go: use your machine's local IP or the Expo dev server host
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost) return `http://${debuggerHost}:5000/api`;
    return 'http://localhost:5000/api';
  }
  return 'https://api.mypaperlessoffice.org/api';
};

const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let axios set the correct Content-Type with boundary for FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'companies', 'selectedCompanyId']);
    }
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
export default api;
