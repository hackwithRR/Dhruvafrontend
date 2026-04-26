import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatContext } from '../../context/ChatContext';
import {
  FaBook, FaRobot, FaHistory, FaTimes, FaArrowLeft,
  FaCheckCircle, FaSyncAlt, FaGraduationCap, FaTrophy
} from 'react-icons/fa';
import PYQModeSelector from './PYQModeSelector';
import PYQContainer from './PYQContainer';

const PYQModal = ({ isOpen, onClose, theme = {} }) => {
  const { subject, chapter, board, classLevel, setBoard, setClassLevel } = useChatContext();
  const [selectedMode, setSelectedMode] = useState(null);
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [sessionStats, setSessionStats] = useState({ solved: 0, score: 0 });
  const [contextSynced, setContextSynced] = useState(false);

  const isDark = theme.isDark !== false;
  const primaryColor = theme.primaryHex || "#4f46e5";

  // Sync context on modal open
  useEffect(() => {
    if (isOpen) {
      setContextSynced(true);
      setTimeout(() => setContextSynced(false), 1500);
    }
  }, [isOpen]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedMode(null);
      setShowModeSelector(true);
    }
  }, [isOpen]);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setShowModeSelector(false);
  };

  const handleBack = () => {
    if (!showModeSelector) {
      setShowModeSelector(true);
      setSelectedMode(null);
    } else {
      onClose();
    }
  };

  const contextChips = [
    { label: subject || 'Select Subject', icon: FaBook, color: primaryColor },
    { label: chapter || 'Select Chapter', icon: FaGraduationCap, color: primaryColor },
    { label: `${board} • Class ${classLevel}`, icon: FaTrophy, color: primaryColor },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99998] bg-black/80 backdrop-blur-sm"
            onClick={handleBack}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-8 pointer-events-none"
          >
            <div
              className="w-full max-w-6xl max-h-[95vh] rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
              style={{
                background: isDark
                  ? 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95))',
                backdropFilter: 'blur(40px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
                boxShadow: `0 50px 100px -20px rgba(0,0,0,0.5), 0 0 0 1px ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
              }}
            >
              {/* Top Glow Bar */}
              <div className="h-1.5 shadow-lg" style={{ background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd, ${primaryColor})`, boxShadow: `0 0 30px ${primaryColor}50` }} />

              {/* Header */}
              <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b backdrop-blur-xl"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>

                <div className="flex items-center gap-4">
                  {/* Back Button */}
                  {!showModeSelector && (
                    <motion.button
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBack}
                      className="p-2.5 rounded-xl transition-all"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        color: theme.text || (isDark ? '#fff' : '#000')
                      }}
                    >
                      <FaArrowLeft size={16} />
                    </motion.button>
                  )}

                  {/* Logo + Title */}
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: selectedMode ? 360 : 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                        boxShadow: `0 0 25px ${primaryColor}40`
                      }}
                    >
                      {selectedMode === 'ai' ? (
                        <FaRobot className="text-white" size={22} />
                      ) : selectedMode === 'classic' ? (
                        <FaBook className="text-white" size={22} />
                      ) : (
                        <FaHistory className="text-white" size={22} />
                      )}
                    </motion.div>
                    <div>
                      <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide"
                        style={{ color: theme.text || (isDark ? '#fff' : '#000') }}>
                        {selectedMode === 'ai' ? 'AI PYQs' : selectedMode === 'classic' ? 'Classic PYQs' : 'PYQ Practice'}
                      </h1>
                      <p className="text-xs font-medium" style={{ color: theme.text + '80' || 'rgba(255,255,255,0.7)' }}>
                        {selectedMode ? 'Board exam questions' : 'Select your practice mode'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2.5 rounded-xl transition-all"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: theme.text || (isDark ? '#fff' : '#000')
                  }}
                >
                  <FaTimes size={18} />
                </motion.button>
              </div>

              {/* Context Sync Indicator */}
              <AnimatePresence>
                {contextSynced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 md:px-8 py-3 flex items-center gap-2"
                      style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                        borderBottom: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'}`
                      }}>
                      <FaCheckCircle className="text-emerald-500" size={14} />
                      <span className="text-xs font-medium text-emerald-500">
                        Context synced from Chat • {subject} • {chapter}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Context Chips */}
              {showModeSelector && (
                <div className="px-6 md:px-8 py-4 flex flex-wrap gap-3"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`
                  }}>
                  {contextChips.map((chip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold border"
                      style={{ backgroundColor: primaryColor + '10', color: primaryColor, borderColor: primaryColor + '30' }}
                    >
                      <chip.icon size={12} />
                      <span className="whitespace-nowrap">{chip.label}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {showModeSelector ? (
                  <PYQModeSelector
                    onSelect={handleModeSelect}
                    theme={theme}
                    subject={subject}
                    chapter={chapter}
                    board={board}
                    classLevel={classLevel}
                  />
                ) : (
                  <PYQContainer
                    theme={theme}
                    board={board}
                    classLevel={classLevel}
                    subject={subject}
                    chapter={chapter}
                    mode={selectedMode}
                    onBack={handleBack}
                    updateStats={(stats) => setSessionStats(s => ({ ...s, ...stats }))}
                  />
                )}
              </div>

              {/* Footer Stats */}
              {selectedMode && (
                <div className="px-6 md:px-8 py-4 border-t flex items-center justify-between"
                  style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <FaCheckCircle className="text-emerald-500" size={14} />
                      <span className="text-xs font-bold" style={{ color: theme.text }}>
                        {sessionStats.solved} Solved
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                      <FaTrophy className="text-amber-500" size={14} />
                      <span className="text-xs font-bold" style={{ color: theme.text }}>
                        {sessionStats.score} XP
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowModeSelector(true); setSelectedMode(null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: theme.text
                    }}
                  >
                    <FaSyncAlt size={12} />
                    Change Mode
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PYQModal;
