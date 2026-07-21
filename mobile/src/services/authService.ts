import api from '../config/api';

export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),

  logout: () => api.post('/auth/logout'),

  verify: () => api.get('/auth/verify'),

  me: () => api.get('/auth/me'),
};
