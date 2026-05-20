import React from 'react';
import { motion } from 'framer-motion';

const AdminButton = ({
  children,
  onClick,
  themeColors,
  variant = 'primary',
  disabled = false,
  type = 'button',
}) => {
  const baseStyle = {
    borderRadius: '16px',
    border: `1px solid ${themeColors.border}`,
  };

  const variants = {
    primary: {
      background: `linear-gradient(90deg, ${themeColors.primary}, rgba(168,85,247,0.95))`,
      color: 'white',
    },
    green: {
      background: 'rgba(34,197,94,0.18)',
      color: 'rgba(134,239,172,1)',
      border: '1px solid rgba(74,222,128,0.35)',
    },
    red: {
      background: 'rgba(239,68,68,0.16)',
      color: 'rgba(252,165,165,1)',
      border: '1px solid rgba(239,68,68,0.35)',
    },
    ghost: {
      background: 'rgba(255,255,255,0.04)',
      color: themeColors.text,
    },
  };

  const style = { ...baseStyle, ...variants[variant] };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className="px-5 py-3 font-bold transition-all shadow-sm"
      style={style}
      aria-disabled={disabled}
    >
      {children}
    </motion.button>
  );
};

export default AdminButton;

