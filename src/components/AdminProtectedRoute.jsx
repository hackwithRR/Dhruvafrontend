import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminContext';
import { validateAdminSession } from '../utils/adminOTP';
import LoadingOverlay from './LoadingOverlay';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated, adminLoading } = useAdminAuth();
  const { theme: activeTheme } = useAuth();
  const location = useLocation();
  const [sessionValid, setSessionValid] = React.useState(null);

  React.useEffect(() => {
    const checkSession = async () => {
      const valid = await validateAdminSession();
      setSessionValid(valid);
    };
    checkSession();
  }, []);

  // Loading state
  if (adminLoading || sessionValid === null) {
    const theme = activeTheme?.theme || 'DeepSpace';
    return <LoadingOverlay duration={1500} theme={theme} />;
  }

  // Admin authenticated → show children
  if (isAdminAuthenticated || sessionValid) {
    return children;
  }

  // Not admin → redirect to admin login
  return <Navigate to="/adminlogin" state={{ from: location }} replace />;
};

export default AdminProtectedRoute;

