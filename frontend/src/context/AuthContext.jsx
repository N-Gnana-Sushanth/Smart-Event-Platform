import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [volunteer, setVolunteer] = useState(() => {
    const saved = localStorage.getItem('volunteer');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(data => {
          setUser(data.user);
        })
        .catch(err => {
          console.error('Session validation error:', err);
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const loginAdmin = (userData, authToken) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const loginVolunteer = (volunteerData, volunteerToken) => {
    localStorage.setItem('volunteerToken', volunteerToken);
    localStorage.setItem('volunteer', JSON.stringify(volunteerData));
    setVolunteer(volunteerData);
  };

  const logoutVolunteer = () => {
    localStorage.removeItem('volunteerToken');
    localStorage.removeItem('volunteer');
    setVolunteer(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        volunteer,
        loading,
        loginAdmin,
        loginVolunteer,
        logoutVolunteer,
        logout,
        isAuthenticated: !!token && !!user,
        isVolunteer: !!volunteer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
