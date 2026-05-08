import React from 'react';
import { motion } from 'framer-motion';
import { FaLightbulb } from 'react-icons/fa';

const HintButton = ({ hintCount, onHint, maxHints = 4, theme }) => {
  const isDark = theme.isDark !== false;
  const primaryColor = theme.primaryHex || "#4f46e5";

  const getHintLabel = () => {
    switch (hintCount) {
      case 0: return '💡 Get Hint';
      case 1: return '🔍 More Help';
      case 2: return '📝 Strong Hint';
      case 3: return '✅ Full Solution';
      default: return '🌟 New Question';
    }
  };

  const getBgColor = () => {
    if (hintCount === 0) return primaryColor + '20';
    if (hintCount === 1) return '#f59e0b20';
    if (hintCount === 2) return '#06b6d420';
    if (hintCount === 3) return '#10b98120';
    return primaryColor + '30';
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onHint}
      className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold uppercase tracking-wide text-sm shadow-lg transition-all relative overflow-hidden"
      style={{
        backgroundColor: getBgColor(),
        color: hintCount >= 3 ? '#059669' : primaryColor,
        border: `2px solid ${primaryColor}40`
      }}
    >
      <FaLightbulb size={18} />
      <span>{getHintLabel()}</span>
      
      {/* Progress dots */}
      <div className="flex gap-1 ml-auto">
        {Array.from({ length: maxHints }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${i < hintCount ? 'scale-125 bg-current shadow-lg' : 'bg-current/30'}`}
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0"
        animate={{ 
          opacity: [0, 0.3, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 1.5,
          repeat: Infinity 
        }}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${primaryColor}20 0%, transparent 50%)`,
          filter: 'blur(20px)'
        }}
      />
    </motion.button>
  );
};

export default HintButton;

