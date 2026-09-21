import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { auth, setUnauthorizedHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (_) {
    } finally {
      auth.clearToken();
      setAdmin(null);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      auth.clearToken();
      setAdmin(null);
    });
  }, []);

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await api.me();
        setAdmin(data.admin);
      } catch (_) {
        auth.clearToken();
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    auth.setToken(data.token);
    setAdmin(data.admin);
    return data.admin;
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function hasPermission(admin, perm) {
  if (!admin) return false;
  if (admin.role === 'SUPER_ADMIN') return true;
  return (admin.permissions || []).includes(perm);
}