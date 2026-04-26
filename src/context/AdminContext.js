// src/context/AdminContext.js - Dedicated Admin Auth State
import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateAdminSession } from '../utils/adminOTP';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPhone, setAdminPhone] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    // Check session on mount
    const checkAdminSession = async () => {
      const valid = await validateAdminSession();
      setIsAdminAuthenticated(valid);
      setAdminLoading(false);
    };

    checkAdminSession();

    // Listen to auth changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.phoneNumber) {
        setAdminUser(user);
        localStorage.setItem('adminPhone', user.phoneNumber);
        setAdminPhone(user.phoneNumber);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    isAdminAuthenticated,
    adminPhone,
    adminUser,
    adminLoading,
    setIsAdminAuthenticated,
    setAdminPhone
  };

  return (
    <AdminContext.Provider value={value}>
      {!adminLoading && children}
    </AdminContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminProvider');
  }
  return context;
}

