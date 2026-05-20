import React from 'react';
import { motion } from 'framer-motion';

const AdminSideTabs = ({ tabs, activeTab, onTabChange, themeColors }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-7">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`p-4 md:p-6 rounded-2xl flex flex-col items-center gap-2 transition-all group ${
              isActive
                ? 'text-white shadow-2xl'
                : 'bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
            style={{
              borderColor: themeColors.border,
              background: isActive ? `linear-gradient(90deg, ${themeColors.primary}, rgba(168,85,247,0.95))` : undefined,
            }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
          >
            <Icon className={`text-2xl ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'}`} />
            <span className="font-semibold text-xs md:text-sm" style={{ color: isActive ? 'white' : undefined }}>
              {tab.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default AdminSideTabs;

