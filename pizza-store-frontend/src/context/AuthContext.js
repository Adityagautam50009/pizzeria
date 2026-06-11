import React, { createContext, useState, useContext, useEffect } from 'react';
import { getProfile } from '../api/api';

var AuthContext = createContext();

export function AuthProvider({ children }) {
  var [user, setUser] = useState(null);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    var token = localStorage.getItem('token');
    if (token) {
      getProfile().then(function(res) {
        setUser(res.data);
      }).catch(function() {
        localStorage.removeItem('token');
      }).finally(function() {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem('token', token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
