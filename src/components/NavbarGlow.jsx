import { motion } from 'framer-motion';

const NavbarGlow = ({ children, color, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      <motion.div 
        className="absolute inset-0 rounded-2xl blur-xl opacity-80 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle at 20% 80%, ${color}66 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${color}66 0%, transparent 50%), radial-gradient(circle at 50% 50%, ${color}33 0%, transparent 70%)`,
        }}
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%', '0% 100%', '100% 0%']
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
      />
      <motion.div 
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ 
          boxShadow: `0 0 0 2px ${color}40, 0 0 20px ${color}60, 0 0 40px ${color}30`
        }}
        animate={{ 
      />
    </div>
  );
};

export default NavbarGlow;

