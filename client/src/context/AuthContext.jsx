import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ─── Fetch current user on mount ──────────────
  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await authService.getMe();
      setUser(data.data.user);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('accessToken');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // ─── Login ────────────────────────────────────
  const login = async (credentials) => {
    const { data } = await authService.login(credentials);
    const { user, accessToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    setUser(user);
    setIsAuthenticated(true);
    return user;
  };

  // ─── Register ─────────────────────────────────
  const register = async (formData) => {
    const { data } = await authService.register(formData);
    const { user, accessToken } = data.data;
    localStorage.setItem('accessToken', accessToken);
    setUser(user);
    setIsAuthenticated(true);
    return user;
  };

  // ─── Logout ───────────────────────────────────
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // proceed anyway
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
