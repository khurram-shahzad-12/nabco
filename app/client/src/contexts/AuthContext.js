import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import Cookies from 'universal-cookie';
import jwtDecode from 'jwt-decode';
import axiosDefault from '../components/axiosDefault/axiosDefault';
import axios from 'axios';
import { URL_ROOT } from '../configs/config';

const AuthContext = createContext();
const cookies = new Cookies();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);

  const extractPermissionsFromToken = (token) => {
    if (!token) return [];
    try {
      const decoded = jwtDecode(token);
      return decoded.permissions || [];
    } catch (error) { console.error('Error decoding token:', error);
      return []; }
  };

  const getAuthToken = () => {
    try {
      let token = cookies.get('apitoken');
      if (token) return token;
      const cookieMatch = document.cookie?.match(/apitoken=([^;]+)/);
      if (cookieMatch) return cookieMatch[1];
      token = localStorage.getItem('apitoken');
      if (token) return token;
      return null;
    } catch (error) { console.error('Error getting auth token:', error);
      return null; }
  };

  const getRefreshToken = () => {
    try {
      let refresh = cookies.get('refreshToken');
      if (refresh) return refresh;
      const cookieMatch = document.cookie?.match(/refreshToken=([^;]+)/);
      if (cookieMatch) return cookieMatch[1];
      refresh = localStorage.getItem('refreshToken');
      if (refresh) return refresh;
      return null;
    } catch (error) { console.error('Error getting refresh token:', error);
      return null;}
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = getAuthToken();
        const storedRefresh = getRefreshToken();   
        if (storedToken) {
          try {
            const response = await axiosDefault().get(`${URL_ROOT}/api/user/me`, { headers: { Authorization: `Bearer ${storedToken}` } });
            if (response.data.success) {
              const userData = response.data.user;
              const perms = extractPermissionsFromToken(storedToken);
              setUser(userData);
              setPermissions(perms);
              setToken(storedToken);
              setRefreshToken(storedRefresh);
              setIsAuthenticated(true);
            } else {
              if (storedRefresh) {
                await refreshAccessToken(storedRefresh);
              } else { await logout(); }
            }
          } catch (error) {
            console.error('Auth initialization error:', error);
            if (storedRefresh) {
              await refreshAccessToken(storedRefresh);
            } else { await logout(); }
          }
        } else if (storedRefresh) {
          await refreshAccessToken(storedRefresh);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally { setIsLoading(false); }
    };
    initAuth();
  }, []);

  const refreshAccessToken = useCallback(async (refresh) => {
    try {
      const response = await axios.post(`${URL_ROOT}/api/user/refresh-token`, { refreshToken: refresh });
      if (response.data.success) {
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        const perms = extractPermissionsFromToken(newToken);
        cookies.set('apitoken', newToken, { 
          path: '/',
          maxAge: 24 * 60 * 60,
          secure: true,
          sameSite: 'lax'
        });
        cookies.set('refreshToken', newRefreshToken || refresh, { 
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
          secure: true,
          sameSite: 'lax'
        });
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
        setPermissions(perms);
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      await logout();
      return false;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${URL_ROOT}/api/user/login`, { email, password });
      if (response.data.success) {
        const { token: newToken, refreshToken: newRefreshToken, user } = response.data;
        const perms = extractPermissionsFromToken(newToken);
        localStorage.setItem('user', JSON.stringify(user));
        cookies.set('apitoken', newToken, { 
          path: '/',
          maxAge: 24 * 60 * 60,
          secure: true,
          sameSite: 'lax'
        });
        cookies.set('refreshToken', newRefreshToken, { 
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
          secure: true,
          sameSite: 'lax'
        });
        const verifyToken = getAuthToken();      
        setUser(user);
        setPermissions(perms);
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        setIsAuthenticated(true);
        return { success: true, user };
      }
      return { success: false, error: response.data.message };
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.message || 'Login failed';
      setError(errorMsg);
      return { 
        success: false, 
        error: errorMsg 
      };
    } finally { setIsLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
    setUser(null);
    setPermissions([]);
    setToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    setError(null);
    try {
      if (token) {
        await axiosDefault().post(`${URL_ROOT}/api/user/logout`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (error) { console.error('Logout error:', error); }
    cookies.remove('apitoken', { path: '/' });
    cookies.remove('refreshToken', { path: '/' });    
    localStorage.removeItem('apitoken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }, [token]);

  const hasAnyPermission = useCallback((permissionArray=[]) => {
    if (!permissionArray || permissionArray.length === 0) return false;
    return permissionArray.some(p => permissions.includes(p));
  }, [permissions]);

  const hasPermission = useCallback((permissionString) => {
    return permissions.includes(permissionString);
  }, [permissions]);

  const hasAllPermissions = useCallback((permissionArray=[]) => {
    if (!permissionArray || permissionArray.length === 0) return false;
    return permissionArray.every(p => permissions.includes(p));
  }, [permissions]);


  const value = useMemo(() => ({
    user,
    token,
    permissions,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshAccessToken,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    cookies
  }), [
    user,
    token,
    permissions,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshAccessToken,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;