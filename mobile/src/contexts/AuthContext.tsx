import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  companyId?: string;
}

interface Company {
  _id: string;
  name: string;
  logo?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  companies: Company[];
  selectedCompanyId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectCompany: (companyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStoredAuth = useCallback(async () => {
    try {
      const [storedToken, storedCompanies, storedCompanyId] = await AsyncStorage.multiGet([
        'token',
        'companies',
        'selectedCompanyId',
      ]);
      if (storedToken[1]) {
        setToken(storedToken[1]);
        api.defaults.headers.common.Authorization = `Bearer ${storedToken[1]}`;
        try {
          const res = await api.get('/auth/me');
          const payload = res.data?.data || res.data;
          setUser(payload.user || payload);
          if (payload.company) {
            setCompanies([payload.company]);
            setSelectedCompanyId(payload.company.id || payload.company._id);
            await AsyncStorage.setItem('companies', JSON.stringify([payload.company]));
            await AsyncStorage.setItem('selectedCompanyId', payload.company.id || payload.company._id);
          }
        } catch {
          await AsyncStorage.multiRemove(['token', 'companies', 'selectedCompanyId']);
        }
      }
      if (storedCompanies[1]) setCompanies(JSON.parse(storedCompanies[1]));
      if (storedCompanyId[1]) setSelectedCompanyId(storedCompanyId[1]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const payload = res.data?.data || res.data;
    const { token: newToken, user: newUser, company } = payload;
    setToken(newToken);
    setUser(newUser);
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    await AsyncStorage.setItem('token', newToken);
    if (company) {
      setCompanies([company]);
      setSelectedCompanyId(company.id || company._id);
      await AsyncStorage.setItem('companies', JSON.stringify([company]));
      await AsyncStorage.setItem('selectedCompanyId', company.id || company._id);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post('/auth/register', {
      companyData: { name: `${name}'s Company`, email },
      adminData: { name, email, password },
    });
    const payload = res.data?.data || res.data;
    const { token: newToken, user: newUser, company } = payload;
    setToken(newToken);
    setUser(newUser);
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    await AsyncStorage.setItem('token', newToken);
    if (company) {
      setCompanies([company]);
      setSelectedCompanyId(company.id || company._id);
      await AsyncStorage.setItem('companies', JSON.stringify([company]));
      await AsyncStorage.setItem('selectedCompanyId', company.id || company._id);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    setToken(null);
    setUser(null);
    setCompanies([]);
    setSelectedCompanyId(null);
    await AsyncStorage.multiRemove(['token', 'companies', 'selectedCompanyId']);
  };

  const selectCompany = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    await AsyncStorage.setItem('selectedCompanyId', companyId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        companies,
        selectedCompanyId,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        selectCompany,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
