import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.log('Found stored token, setting auth state');
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (newToken: string) => {
    console.log('Login called with token');
    setToken(newToken);
    setIsAuthenticated(true);
    localStorage.setItem('token', newToken);
    console.log('Auth state updated:', { isAuthenticated: true, token: newToken });
  };

  const logout = () => {
    console.log('Logout called');
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
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