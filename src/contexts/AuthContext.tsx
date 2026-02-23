import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/AuthService';
import { NavigateFunction } from 'react-router-dom';
import { User, LoginResponse } from '../types/api';

interface Company {
  _id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  companies: Company[];
  selectedCompany: Company | null;
  selectedCompanyId: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedCompany: (company: Company) => void;
  setSelectedCompanyId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  navigate: NavigateFunction;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, navigate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  useEffect(() => {
    // Load saved auth state from localStorage
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedCompanies = localStorage.getItem('companies');
    const savedSelectedCompanyId = localStorage.getItem('selectedCompanyId');

    if (savedToken && savedUser && savedCompanies) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const parsedCompanies = JSON.parse(savedCompanies);
        setUser(parsedUser);
        setToken(savedToken);
        setCompanies(parsedCompanies);

        if (savedSelectedCompanyId) {
          setSelectedCompanyId(savedSelectedCompanyId);
          const company = parsedCompanies.find((c: Company) => c._id === savedSelectedCompanyId);
          if (company) {
            setSelectedCompany(company);
          }
        } else if (parsedCompanies.length === 1) {
          // Auto-select if only one company
          setSelectedCompany(parsedCompanies[0]);
          setSelectedCompanyId(parsedCompanies[0]._id);
          localStorage.setItem('selectedCompanyId', parsedCompanies[0]._id);
        }
      } catch (error) {
        console.error('Error loading saved auth state:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('companies');
        localStorage.removeItem('selectedCompanyId');
      }
    }

    // Set loading to false after attempting to load auth state
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await AuthService.getInstance().login(email, password);
      console.log('Login response:', response);

      if (response.status === 'success' && response.data) {
        const { user, token, company } = response.data;

        // Convert the single company to the expected format
        const companies = [{
          _id: company.id,
          name: company.name,
          role: user.role
        }];

        setUser(user);
        setToken(token);
        setCompanies(companies);

        // Auto-select the company since there's only one
        setSelectedCompany(companies[0]);
        setSelectedCompanyId(companies[0]._id);

        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('companies', JSON.stringify(companies));
        localStorage.setItem('selectedCompanyId', companies[0]._id);

        // Store tcNumber for RTA fines fetching
        if (company.tcNumber) {
          localStorage.setItem('tcNumber', company.tcNumber);
        }

        // Don't navigate here - let the calling component handle navigation
        // This allows for more flexible routing (e.g., redirect to intended page)
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await AuthService.getInstance().logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all state and localStorage
      setUser(null);
      setToken(null);
      setCompanies([]);
      setSelectedCompany(null);
      setSelectedCompanyId(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('companies');
      localStorage.removeItem('selectedCompanyId');
      localStorage.removeItem('tcNumber');
      navigate('/login');
    }
  };

  const handleSetSelectedCompany = (company: Company) => {
    setSelectedCompany(company);
    setSelectedCompanyId(company._id);
    localStorage.setItem('selectedCompanyId', company._id);
  };

  const handleSetSelectedCompanyId = (id: string) => {
    const company = companies.find(c => c._id === id);
    if (company) {
      setSelectedCompany(company);
      setSelectedCompanyId(id);
      localStorage.setItem('selectedCompanyId', id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        companies,
        selectedCompany,
        selectedCompanyId,
        login,
        logout,
        setSelectedCompany: handleSetSelectedCompany,
        setSelectedCompanyId: handleSetSelectedCompanyId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 