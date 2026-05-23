import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatContext } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import PYQModeSelector from './pyq/PYQModeSelector';
import PYQContainer from './pyq/PYQContainer';
import { FaTimes, FaHistory, FaCheckCircle, FaSyncAlt } from 'react-icons/fa';

const PYQModal = ({ isOpen, onClose, theme }) => {
  const { subject, chapter, board, classLevel, setBoard, setClassLevel } = useChatContext();
  const { userData } = useAuth();
  const [mode, setMode] = useState(null);
  const [syncStatus, setSyncStatus] = useState('syncing');

  const isDark = theme?.isDark ?? true;

  // Real-time sync with userData (board, class) and ChatContext (subject, chapter)
  useEffect(() => {
    if (isOpen) {
      setSyncStatus('syncing');

      // Sync board/class from userData if not set in context
      if (userData?.board && !board) {
        setBoard(userData.board);
      }
      if (userData?.classLevel && !classLevel) {
        setClassLevel(userData.classLevel);
      }

      // Show sync animation
      const timer = setTimeout(() => {
        setSyncStatus('synced');
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isOpen, userData?.board, userData?.classLevel, board, classLevel, setBoard, setClassLevel]);

  // Reset mode on close
  useEffect(() => {
    if (!isOpen) {
      setMode(null);
    }
  }, [isOpen]);

  // Active board/class from userData or context
  const activeBoard = userData?.board || board || 'CBSE';
  const activeClass = userData?.classLevel || classLevel || '10';

  const contextChips = [
    { label: subject || 'Select Subject', icon: '📚', color: 'from-indigo-500/20 to-purple-500/20', textColor: 'text-indigo-300', borderColor: 'border-indigo-500/30' },
    { label: chapter || 'Select Chapter', icon: '🎯', color: 'from-purple-500/20 to-pink-500/20', textColor: 'text-purple-300', borderColor: 'border-purple-500/30' },
    { label: `${activeBoard} • Class ${activeClass}`, icon: '🏫', color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-300', borderColor: 'border-emerald-500/30' },
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
            className="fixed inset-0 z-[99998] bg-black/80 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 pointer-events-none"
            onClick={onClose}
          >
            <div
              className="w-full max-w-7xl h-[95vh] rounded-3xl overflow-hidden shadow-2xl pointer-events-auto flex flex-col relative"
              style={{
                background: isDark
                  ? 'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(30,41,59,0.95))'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))',
                backdropFilter: 'blur(50px)',
                border: `1px solid ${isDark ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.08)'}`,
                boxShadow: isDark
                  ? '0 80px 160px -40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 80px 160px -40px rgba(0,0,0,0.25)'
              }}
            >
              {/* Rainbow Glow Border Top */}
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_30px_rgba(147,51,234,0.5)]" />

              {/* Sync Status Bar */}
              <AnimatePresence>
                {syncStatus === 'syncing' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b"
                    style={{ borderColor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)' }}
                  >
                    <div className="px-8 py-3 flex items-center gap-3"
                      style={{ background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)' }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <FaSyncAlt className="text-indigo-400" size={14} />
                      </motion.div>
                      <span className="text-xs font-medium text-indigo-400">
                        Syncing with your profile • {userData?.board || 'CBSE'} Class {userData?.classLevel || '10'}
                      </span>
                    </div>
                  </motion.div>
                )}
                {syncStatus === 'synced' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b"
                    style={{ borderColor: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.06)' }}
                  >
                    <div className="px-8 py-2.5 flex items-center gap-2"
                      style={{ background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)' }}>
                      <FaCheckCircle className="text-emerald-500" size={12} />
                      <span className="text-xs font-medium text-emerald-500">
                        Context synced • {activeBoard} Class {activeClass} • {subject || 'No subject'} • {chapter || 'No chapter'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div className="sticky top-0 p-6 md:p-8 bg-inherit backdrop-blur-xl z-20 border-b"
                style={{ borderColor: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(0,0,0,0.08)' }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-5">
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-50 animate-pulse" />
                      <FaHistory className="text-3xl text-white relative z-10" />
                    </motion.div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                        PYQ Universe
                      </h1>
                      <p className="text-lg font-medium mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}>
                        {mode ? 'Practice Mode Active' : 'Choose your practice style'}
                      </p>
                    </div>
                  </div>

                  {/* Close Button */}
                  <motion.button
                    whileHover={{ scale: 1.15, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-4 rounded-2xl hover:bg-white/10 backdrop-blur-xl border transition-all shadow-xl group"
                    style={{
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                      color: isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }}
                    onClick={onClose}
                  >
                    <FaTimes className="text-xl group-hover:text-red-400 transition-colors" />
                  </motion.button>
                </div>

                {/* Context Chips */}
                <div className="flex flex-wrap gap-3">
                  {contextChips.map((chip, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm backdrop-blur-sm border ${chip.color} ${chip.textColor} ${chip.borderColor}`}
                    >
                      <span>{chip.icon}</span>
                      <span className="whitespace-nowrap">{chip.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {!mode ? (
                  <PYQModeSelector
                    onSelect={setMode}
                    theme={theme}
                    subject={subject}
                    chapter={chapter}
                    board={activeBoard}
                    classLevel={activeClass}
                  />
                ) : (
                  <PYQContainer
                    theme={theme}
                    board={activeBoard}
                    classLevel={activeClass}
                    subject={subject}
                    chapter={chapter}
                    mode={mode}
                    onBack={() => setMode(null)}
                  />
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PYQModal;
