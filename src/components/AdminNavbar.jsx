import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ClickSpark from './ClickSpark';
import RippleEffect from './RippleEffect';
import BorderGlow from './BorderGlow';
import { FaBars, FaTimes, FaUsers, FaFilePdf, FaExclamationTriangle, FaChartBar, FaSignOutAlt, FaPhone } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { adminLogout } from '../utils/adminOTP';
import { useAdminAuth } from '../context/AdminContext';

const AdminNavbar = ({ adminPhone, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { adminUser } = useAdminAuth();
  const [navTheme] = useState('Cyberpunk'); 

  const SUPER_ADMIN_PHONE = '+919148860082';
  const isSuperAdmin = adminPhone === SUPER_ADMIN_PHONE;

  const menuItems = [
    { icon: FaChartBar, label: 'Dashboard', id: 'dashboard' },
    { icon: FaFilePdf, label: 'PDF Upload', id: 'pdfs' },
    { icon: FaExclamationTriangle, label: 'Issues', id: 'issues' },
    ...(isSuperAdmin ? [{ icon: FaUsers, label: 'Members', id: 'members' }] : [])
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <ClickSpark sparkColor="#00ffff" sparkCount={12} sparkRadius={25}>
      <BorderGlow glowColor="180 100 50" glowIntensity={1.5} className="sticky top-0 z-[100]">
        <motion.nav 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="h-20 bg-black/30 backdrop-blur-3xl border-b border-cyan-500/30 shadow-2xl animate-pulse-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.4), rgba(192,132,252,0.3)), rgba(2,0,5,0.9)',
            boxShadow: '0 0 60px rgba(0,255,255,0.7), 0 0 120px rgba(192,132,252,0.4), inset 0 0 30px rgba(0,255,255,0.2)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <FaPhone className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-black bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Dhruva Admin
                  </h1>
                  <p className="text-xs opacity-75 font-medium">Secure Panel</p>
                </div>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-1">
                {menuItems.map((item, i) => (
                  <motion.button
                    key={item.label}
                    onClick={() => handleNavClick(item.id)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 group"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <item.icon className="text-lg group-hover:scale-110 transition-transform" />
                    <span>{item.label}</span>
                  </motion.button>
                ))}
                <motion.button
                  onClick={adminLogout}
                  className="ml-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FaSignOutAlt />
                  Logout
                </motion.button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden flex items-center gap-2">
                <div className="text-sm font-mono opacity-75">
                  {adminPhone?.slice(0, 6)}...
                </div>
                <motion.button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20"
                  whileTap={{ scale: 0.95 }}
                >
                  {mobileOpen ? <FaTimes /> : <FaBars />}
                </motion.button>
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="md:hidden pb-4 border-t border-white/10"
                exit={{ opacity: 0, height: 0 }}
              >
                {menuItems.map((item) => (
                  <motion.button
                    key={item.label}
                    onClick={() => handleNavClick(item.id)}
                    className="block px-4 py-3 border-l-4 border-transparent hover:border-emerald-400 hover:bg-white/5 rounded-r-xl flex items-center gap-3 font-semibold w-full text-left"
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon />
                    {item.label}
                  </motion.button>
                ))}
                <motion.button
                  onClick={() => {
                    adminLogout();
                    setMobileOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-xl flex items-center gap-3 font-semibold mt-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <FaSignOutAlt />
                  Logout Admin
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.nav>
      </BorderGlow>
    </ClickSpark>
  );
};

export default AdminNavbar;
