import React from 'react';
import { motion } from 'framer-motion';

const AdminStatCard = ({ icon: Icon, title, value, glowColor, themeColors }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="relative overflow-hidden rounded-3xl border"
      style={{
        borderColor: themeColors.border,
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="absolute inset-0 opacity-40 blur-2xl"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${glowColor}, transparent 55%)`,
        }}
      />
      <div className="relative p-7 text-center">
        <div className="flex items-center justify-center mb-4">
          <Icon className="w-14 h-14" style={{ color: glowColor }} />
        </div>
        <h3 className="text-base md:text-lg font-semibold" style={{ color: themeColors.text }}>
          {title}
        </h3>
        <div className="mt-2 text-3xl md:text-4xl font-black" style={{ color: themeColors.primary }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminStatCard;

