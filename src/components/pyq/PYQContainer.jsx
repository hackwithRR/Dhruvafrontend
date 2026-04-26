import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaSyncAlt,
  FaCheckCircle, FaSpinner
} from 'react-icons/fa';
import AIQuestionView from './AIQuestionView';
import ClassicQuestionView from './ClassicQuestionView';

const PYQContainer = ({ theme, board, classLevel, subject, chapter, mode, onBack }) => {
  const [sessionStats, setSessionStats] = useState({ solved: 0, score: 0, streak: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const isDark = theme?.isDark !== false;
  const primaryColor = theme?.primaryHex || "#6366f1";

  // Validate context
  const hasValidContext = subject && chapter;

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const updateStats = (newStats) => {
    setSessionStats(prev => ({ ...prev, ...newStats }));
  };

  if (!hasValidContext) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md p-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`,
              border: `2px dashed ${primaryColor}40`
            }}
          >
            <FaSyncAlt className="text-3xl" style={{ color: primaryColor }} />
          </motion.div>
          <h3 className="text-2xl font-black mb-3" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
            No Context Selected
          </h3>
          <p className="text-lg mb-6" style={{ color: theme?.text + '80' || 'rgba(255,255,255,0.7)' }}>
            Please select a subject and chapter from the Chat page first.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="px-6 py-3 rounded-xl font-bold text-white"
            style={{ backgroundColor: primaryColor }}
          >
            Go Back to Chat
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}80)`,
              boxShadow: `0 0 30px ${primaryColor}40`
            }}
          >
            <FaSpinner className="text-white text-2xl animate-spin" />
          </motion.div>
          <p className="text-lg font-bold" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
            Loading PYQs...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Session Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 p-4 rounded-2xl"
        style={{
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
        }}
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2.5 rounded-xl transition-all"
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: theme?.text || (isDark ? '#fff' : '#000')
            }}
          >
            <FaArrowLeft size={16} />
          </motion.button>
          <div>
            <h3 className="font-bold" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
              {mode === 'ai' ? 'AI PYQs' : 'Classic PYQs'}
            </h3>
            <p className="text-xs" style={{ color: theme?.text + '60' || 'rgba(255,255,255,0.5)' }}>
              {subject} • {chapter}
            </p>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' }}>
            <FaCheckCircle className="text-emerald-500" size={12} />
            <span className="text-xs font-bold text-emerald-500">{sessionStats.solved}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
            style={{ background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)' }}>
            <span className="text-xs font-bold text-amber-500">⚡ {sessionStats.score} XP</span>
          </div>
        </div>
      </motion.div>

      {/* Question View */}
      <div className="flex-1 overflow-y-auto">
        {mode === 'ai' ? (
          <AIQuestionView
            theme={theme}
            board={board}
            classLevel={classLevel}
            subject={subject}
            chapter={chapter}
            updateStats={updateStats}
          />
        ) : mode === 'classic' ? (
          <ClassicQuestionView
            theme={theme}
            board={board}
            classLevel={classLevel}
            subject={subject}
            chapter={chapter}
            updateStats={updateStats}
          />
        ) : null}
      </div>
    </div>
  );
};

export default PYQContainer;
