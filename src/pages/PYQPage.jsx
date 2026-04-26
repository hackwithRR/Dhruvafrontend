import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useChatContext } from '../context/ChatContext';
import PYQContainer from '../components/pyq/PYQContainer';
import { useLocation, useNavigate } from 'react-router-dom';

const PYQPage = () => {
  const { currentUser, userData, theme: authTheme } = useAuth();
  const { subject, chapter, board, classLevel } = useChatContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const activeTheme = authTheme || { isDark: true, primaryHex: '#4f46e5' };

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleBack = () => {
    navigate(location.state?.from || '/chat');
  };

  return (
    <div className="h-screen overflow-hidden relative" style={{ backgroundColor: activeTheme.hex || '#050505' }}>
      <Navbar userData={userData} />
      
      <div className="absolute inset-0 pt-16 overflow-y-auto">
        <PYQContainer 
          theme={activeTheme} 
          onClose={handleBack} 
        />
      </div>
    </div>
  );
};

export default PYQPage;

