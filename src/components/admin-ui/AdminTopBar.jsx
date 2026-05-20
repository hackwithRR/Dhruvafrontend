import React from 'react';
import { motion } from 'framer-motion';

import { FaSignOutAlt } from 'react-icons/fa';

const AdminTopBar = ({ onLogout, themeColors, label = 'Logout' }) => {
  return (
    <motion.button
      onClick={onLogout}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-5 py-2 bg-red-600/85 hover:bg-red-600 text-white rounded-xl font-semibold shadow-sm"
      style={{ border: '1px solid rgba(255,255,255,0.12)' }}
    >
      <FaSignOutAlt />
      {label}
    </motion.button>
  );
};

export default AdminTopBar;

