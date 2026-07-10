import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { authService } from '../services/apiService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('auth_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(false);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('auth_user');

      if (!storedToken) {
        return;
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      try {
        const { data } = await api.get('auth/me/');
        setUser(data);
        localStorage.setItem('auth_user', JSON.stringify(data));
      } catch {
        logout();
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const { data } = await authService.login({ email, password });

      if (!data?.access || !data?.refresh) {
        throw new Error('The API did not return JWT tokens.');
      }

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      let nextUser = { email };

      try {
        const profile = await authService.me();
        nextUser = profile.data;
      } catch {
        nextUser = { email };
      }

      localStorage.setItem('auth_user', JSON.stringify(nextUser));
      setToken(data.access);
      setUser(nextUser);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'Unable to sign in';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
