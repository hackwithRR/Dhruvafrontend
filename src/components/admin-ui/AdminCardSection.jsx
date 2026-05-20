import React from 'react';
import { motion } from 'framer-motion';

const AdminCardSection = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.18 }}
      className="rounded-3xl border"
    >
      {children}
    </motion.div>
  );
};

export default AdminCardSection;

