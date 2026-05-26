import React from 'react';
import { FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
import { adminLogout } from '../utils/adminOTP';
import { useNavigate } from 'react-router-dom';

const AdminNavbar = ({ adminPhone, themeColors, activeTab, setActiveTab, tabs }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await adminLogout();
    navigate('/adminlogin');
  };

  return (
    <nav
      className="sticky top-0 z-[100] w-full border-b backdrop-blur-xl transition-all duration-300"
      style={{ 
        backgroundColor: themeColors.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)', // Adjusted light theme opacity
        borderColor: themeColors.border
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-xl border flex items-center justify-center shadow-lg"
            style={{ backgroundColor: themeColors.isDark ? themeColors.primary + '10' : 'rgba(0,0,0,0.05)', borderColor: themeColors.border }} // Adjusted light theme bg
          >
            <FaShieldAlt style={{ color: themeColors.primary }} className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase italic" style={{ color: themeColors.text }}>
              Admin<span style={{ color: themeColors.primary }}>Portal</span>
            </h1>
            <p className="text-[8px] font-bold uppercase tracking-[0.4em]" style={{ color: themeColors.text, opacity: 0.4 }}>
              Security_Node
            </p>
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-2xl border" style={{ backgroundColor: themeColors.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', borderColor: themeColors.border }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all`}
              style={{ 
                backgroundColor: activeTab === tab.id ? themeColors.primary : 'transparent',
                color: activeTab === tab.id ? (themeColors.isDark ? '#000' : '#fff') : themeColors.text, // Changed to themeColors.text for better visibility
                opacity: activeTab === tab.id ? 1 : 0.6,
                boxShadow: activeTab === tab.id ? `0 4px 15px ${themeColors.primary}40` : 'none'
              }}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Admin Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: themeColors.textSecondary, opacity: 0.5 }}>Authenticated</span>
            <span className="text-xs font-bold" style={{ color: themeColors.text }}>{adminPhone}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
            title="Terminate Session"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;