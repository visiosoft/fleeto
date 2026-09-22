// API Configuration
// Re-exported from config/api so there is one definition of the base URL, including the /api prefix.
export { API_CONFIG } from './config/api';
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Other configuration constants can be added here
export const APP_NAME = 'FleetOZ';
export const APP_VERSION = '1.0.0';

// Add any other configuration constants as needed 