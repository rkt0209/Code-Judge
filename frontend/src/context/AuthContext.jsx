import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('jwt_token'));
  const [role, setRole] = useState(localStorage.getItem('user_role'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if token exists and validate it
    const storedToken = localStorage.getItem('jwt_token');
    const storedRole = localStorage.getItem('user_role');
    const storedUser = localStorage.getItem('user_data');

    if (storedToken && storedRole) {
      setToken(storedToken);
      setRole(storedRole);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, []);

  const login = (token, role, userData) => {
    setLoading(true);
    try {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_role', role);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      setToken(token);
      setRole(role);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    try {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_data');
      
      setToken(null);
      setRole(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, role, loading, login, logout, isAuthenticated }}>
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
