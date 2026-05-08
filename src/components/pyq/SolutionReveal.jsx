import React from 'react';
import { motion } from 'framer-motion';

<<<<<<< HEAD
import { renderFormattedAnswer } from '../../utils/pyqFormatting';


=======
>>>>>>> 2307b21a9e73fa8a172289a5ee60126d8ddf8c3b
const SolutionReveal = ({ solution, theme, hintCount }) => {
  const isDark = theme.isDark !== false;
  const primaryColor = theme.primaryHex || '#6366f1';
  
  if (!solution || hintCount < 4) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`p-8 rounded-3xl border-4 shadow-2xl backdrop-blur-xl relative overflow-hidden ${
        isDark ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/50' : 'bg-gradient-to-br from-gray-50 to-white'
      }`}
      style={{ 
        borderColor: primaryColor + '50',
        boxShadow: `0 25px 50px -12px ${primaryColor}40`
      }}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${primaryColor}10, transparent, ${primaryColor}10)` }} />
      
      {/* Header */}
      <div className="relative flex items-center gap-4 mb-6">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
            boxShadow: `0 0 30px ${primaryColor}50`
          }}
        >
          <span className="text-white font-bold text-xl">✓</span>
        </motion.div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-wide" style={{ color: theme.text }}>
            Complete Solution
          </h3>
          <p className="text-sm font-medium" style={{ color: theme.text + '80' || 'rgba(255,255,255,0.7)' }}>
            Full step-by-step answer with explanation
          </p>
        </div>
      </div>

      {/* Solution Content */}
      <div className={`prose prose-lg max-w-none leading-relaxed ${isDark ? 'prose-invert' : ''}`} style={{ color: theme.text }}>
        <div dangerouslySetInnerHTML={{ 
          __html: solution
            .replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${primaryColor}" class="font-black">$1</strong>`)
            .replace(/\$\$/g, '$')
        }} />
      </div>

      {/* Key Takeaways */}
      <div className="mt-8 pt-8 border-t flex flex-wrap gap-3" style={{ borderColor: primaryColor + '30' }}>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border" style={{ background: primaryColor + '20', color: primaryColor, borderColor: primaryColor + '30' }}>
          Key Formula Used
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border" style={{ background: primaryColor + '20', color: primaryColor, borderColor: primaryColor + '30' }}>
          Board Marking Ready
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border" style={{ background: primaryColor + '20', color: primaryColor, borderColor: primaryColor + '30' }}>
          Full Explanation
        </span>
      </div>
    </motion.div>
  );
};

export default SolutionReveal;

