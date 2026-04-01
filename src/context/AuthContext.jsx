// src/context/AuthContext.jsx — Global auth state
import { createContext, useContext, useEffect, useState } from 'react';

// Mock Firebase functions for development
const mockLogin = async (email, password) => {
  console.log('Mock login:', email);
  return Promise.resolve();
};

const mockRegister = async (userData) => {
  console.log('Mock register:', userData);
  return Promise.resolve();
};

const mockLogout = async () => {
  console.log('Mock logout');
  return Promise.resolve();
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Skip Firebase initialization for now and use mock mode
    setLoading(false);
    setError('Using mock authentication mode');
  }, []);

  const login = async (email, password) => {
    try {
      await mockLogin(email, password);
      // Mock successful login
      setUser({ email, uid: 'mock-user-123' });
      setProfile({ name: 'Mock User', role: 'citizen' });
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData) => {
    try {
      await mockRegister(userData);
      // Mock successful registration
      setUser({ email: userData.email, uid: 'mock-user-123' });
      setProfile({ name: userData.name, role: userData.role });
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await mockLogout();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
