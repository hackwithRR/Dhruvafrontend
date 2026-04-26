import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

const PYQCloseButton = ({ onClose, theme }) => {
  const primaryColor = theme.primaryHex || "#4f46e5";
  const isDark = theme.isDark !== false;
  
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClose}
      className="fixed top-6 right-6 z-[70] p-4 rounded-2xl backdrop-blur-xl border shadow-2xl flex items-center justify-center group"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
        borderColor: primaryColor + '40',
        color: primaryColor
      }}
    >
      <FaTimes size={20} className="group-hover:rotate-90 transition-transform duration-200" />
    </motion.button>
  );
};

export default PYQCloseButton;
