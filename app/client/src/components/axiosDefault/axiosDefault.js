import axios from 'axios';
import Cookies from 'universal-cookie';
import { URL_ROOT } from '../../configs/config';

const cookies = new Cookies();
const getToken = () => {
  try {
    let token = cookies.get('apitoken');
    if (token) return token;
    const match = document.cookie.match(/apitoken=([^;]+)/);
    if (match) return match[1];
    token = localStorage.getItem('apitoken');
    if (token) return token;
    return null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const getRefreshToken = () => {
  try {
    let refresh = cookies.get('refreshToken');
    if (refresh) return refresh;
    const match = document.cookie.match(/refreshToken=([^;]+)/);
    if (match) return match[1];
    refresh = localStorage.getItem('refreshToken');
    if (refresh) return refresh;
    return null;
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

const setAuthCookies = (token, refreshToken) => {
  try {
    cookies.set('apitoken', token, { 
      path: '/',
      maxAge: 86400,
      secure: true,
      sameSite: 'lax'
    });
    cookies.set('refreshToken', refreshToken, { 
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      secure: true,
      sameSite: 'lax'
    });
    document.cookie = `apitoken=${token}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
    localStorage.setItem('apitoken', token);
    localStorage.setItem('refreshToken', refreshToken);
  } catch (error) {
    console.error('Error setting auth cookies:', error);
  }
};

const clearAuthCookies = () => {
  try {
    cookies.remove('apitoken', { path: '/' });
    cookies.remove('refreshToken', { path: '/' });
    document.cookie = 'apitoken=; path=/; max-age=0';
    document.cookie = 'refreshToken=; path=/; max-age=0';
    localStorage.removeItem('apitoken');
    localStorage.removeItem('refreshToken');
  } catch (error) {
    console.error('Error clearing auth cookies:', error);
  }
};
const axiosDefault = () => {
  const instance = axios.create({
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
  });
  instance.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token');
          }
          const response = await axios.post(`${URL_ROOT}/api/user/refresh-token`, {
            refreshToken: refreshToken
          });
          if (response.data.success) {
            const { token, refreshToken: newRefreshToken } = response.data;
            setAuthCookies(token, newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          clearAuthCookies();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
  return instance;
};
export default axiosDefault;