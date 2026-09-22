import { AxiosInstance } from 'axios';

/**
 * Session expiry handling.
 *
 * The API signs tokens with a 24h expiry. Without this guard an expired token stays in
 * localStorage, the app still renders as "logged in", and every request quietly 401s -
 * which looks like a dashboard full of zeroes rather than a logged-out session.
 */

const AUTH_STORAGE_KEYS = ['token', 'user', 'companies', 'selectedCompanyId', 'tcNumber'];

// Routes that are allowed to render without a session; never redirect away from these.
const PUBLIC_PATHS = ['/login', '/register', '/'];

export const SESSION_EXPIRED_FLAG = 'sessionExpired';

export const clearAuthStorage = (): void => {
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
};

/** Reads the `exp` claim without verifying the signature (the server still does that). */
export const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
};

/** Malformed tokens count as expired: they can't authenticate anything. */
export const isTokenExpired = (token: string | null | undefined): boolean => {
  if (!token) return true;
  const expiresAt = getTokenExpiry(token);
  if (expiresAt === null) return false; // no exp claim - let the server decide
  return Date.now() >= expiresAt;
};

let redirecting = false;

/**
 * Clears the session and sends the user to the login page.
 * Uses a full location change so no stale authenticated state survives the transition.
 */
export const handleUnauthorized = (): void => {
  if (redirecting) return;

  const path = window.location.pathname;
  clearAuthStorage();

  if (PUBLIC_PATHS.includes(path)) return;

  redirecting = true;
  sessionStorage.setItem(SESSION_EXPIRED_FLAG, '1');
  window.location.replace('/login');
};

const isApiRequest = (url: string): boolean => url.includes('/api/');

/** Instances made with axios.create() don't inherit the default instance's interceptors. */
export const attachAuthInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        handleUnauthorized();
      }
      return Promise.reject(error);
    }
  );
};

/** Covers every direct axios.get/post/... call in the app. */
export const installGlobalAxiosGuard = (axiosDefault: AxiosInstance): void => {
  attachAuthInterceptor(axiosDefault);
};

/**
 * Covers the fetch-based services (letterheads, notes, costs, the mongo client) in one place
 * instead of repeating a status check at every call site.
 */
export const installGlobalFetchGuard = (): void => {
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await originalFetch(input, init);

    if (response.status === 401) {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (isApiRequest(url)) {
        handleUnauthorized();
      }
    }

    return response;
  };
};
