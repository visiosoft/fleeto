/**
 * Utility functions for API calls
 */

/**
 * Gets the full API URL for a given endpoint
 * @param endpoint The API endpoint path
 * @returns The complete API URL
 */
export const getApiUrl = (endpoint: string): string => {
    const baseUrl = process.env.REACT_APP_API_URL;
    return `${baseUrl}${endpoint}`;
};

/**
 * Creates headers for API requests
 * @param includeAuth Whether to include authentication headers
 * @returns Headers object for API requests
 */
export const getHeaders = (includeAuth: boolean = true): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (includeAuth) {
        const token = localStorage.getItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
};

/**
 * Handles API errors
 * @param error The error object from the API call
 * @returns A formatted error message
 */
export const handleApiError = (error: any): string => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return error.response.data.message || 'An error occurred while processing your request';
    } else if (error.request) {
        // The request was made but no response was received
        return 'No response received from server';
    } else {
        // Something happened in setting up the request that triggered an Error
        return error.message || 'An unexpected error occurred';
    }
}; 