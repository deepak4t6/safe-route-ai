import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('safe_route_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getMe();
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session expired or server unavailable', err.message);
          // If offline or first load, keep demo user if stored
          const savedUser = localStorage.getItem('safe_route_user');
          if (savedUser) {
            try { setUser(JSON.parse(savedUser)); } catch (e) {}
          }
        }
      }
      setIsLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('safe_route_token', res.data.token);
        localStorage.setItem('safe_route_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await authAPI.register(userData);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('safe_route_token', res.data.token);
        localStorage.setItem('safe_route_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('safe_route_token');
    localStorage.removeItem('safe_route_user');
  };

  const setDemoUser = (role = 'user') => {
    let demoUser = {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Ananya Sharma',
      email: 'ananya@saferoute.ai',
      role: 'user',
      preferred_mode: 'walking',
      phone: '+919876543210'
    };
    if (role === 'moderator') {
      demoUser = {
        id: 'a0000000-0000-0000-0000-000000000002',
        name: 'Rahul Verma',
        email: 'rahul@saferoute.ai',
        role: 'moderator',
        preferred_mode: 'cycling',
        phone: '+919811223344'
      };
    } else if (role === 'admin') {
      demoUser = {
        id: 'a0000000-0000-0000-0000-000000000003',
        name: 'Dr. Priya Mehta (Admin)',
        email: 'admin@saferoute.ai',
        role: 'admin',
        preferred_mode: 'driving',
        phone: '+919800000000'
      };
    }
    const fakeToken = 'demo-token-' + role;
    setToken(fakeToken);
    setUser(demoUser);
    localStorage.setItem('safe_route_token', fakeToken);
    localStorage.setItem('safe_route_user', JSON.stringify(demoUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      setDemoUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
