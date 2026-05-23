import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaBook, FaStar, FaDatabase, FaBolt, FaClock } from 'react-icons/fa';

const PYQModeSelector = ({ onSelect, theme, subject, chapter, board, classLevel }) => {
  const isDark = theme?.isDark !== false;
  const primaryColor = theme?.primaryHex || "#6366f1";

  const modes = [
    {
      id: 'ai',
      title: 'AI-Generated PYQs',
      subtitle: 'Unlimited Practice',
      icon: FaRobot,
      gradient: 'from-blue-500 via-purple-500 to-pink-500',
      accentColor: '#8b5cf6',
      description: 'Get unlimited AI-generated board exam questions tailored to your exact chapter and class level.',
      features: [
        { icon: FaBolt, text: 'Instant generation' },
        { icon: FaRobot, text: 'Adaptive difficulty' },
        { icon: FaStar, text: 'Progressive hints' },
      ],
      badge: 'Most Popular',
      badgeColor: 'from-amber-500 to-orange-500',
      timeEstimate: '15-30 min'
    },
    {
      id: 'classic',
      title: 'Classic PDF PYQs',
      subtitle: 'Authentic Papers',
      icon: FaBook,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      accentColor: '#10b981',
      description: 'Practice with real uploaded previous year question papers from your board.',
      features: [
        { icon: FaDatabase, text: 'Real board papers' },
        { icon: FaBook, text: 'Chapter-wise PDFs' },
        { icon: FaClock, text: 'Exam timing practice' },
      ],
      badge: 'Authentic',
      badgeColor: 'from-emerald-500 to-teal-500',
      timeEstimate: '30-60 min'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-5 text-xs font-bold uppercase tracking-wider"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            color: theme?.text || (isDark ? '#fff' : '#000'),
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
          }}
        >
          <FaStar className="text-amber-500" size={12} />
          {board} Class {classLevel} • {subject || 'Select Subject'} • {chapter || 'Select Chapter'}
        </motion.div>
        <h2 className="text-3xl md:text-4xl font-black mb-3"
          style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
          Select PYQ Mode
        </h2>
        <p className="text-lg font-medium" style={{ color: theme?.text + '80' || 'rgba(255,255,255,0.7)' }}>
          Choose how you want to practice previous year questions
        </p>
      </div>

      {/* Mode Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {modes.map((mode) => (
          <motion.button
            key={mode.id}
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(mode.id)}
            className="group relative p-8 rounded-[2rem] text-left overflow-hidden transition-all duration-500"
            style={{
              background: isDark
                ? `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)`
                : `linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%)`,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: `0 20px 40px -10px rgba(0,0,0,0.3)`
            }}
          >
            {/* Hover Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

            {/* Badge */}
            {mode.badge && (
              <div className="absolute top-5 right-5">
                <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r ${mode.badgeColor} text-white shadow-lg`}>
                  {mode.badge}
                </div>
              </div>
            )}

            {/* Icon */}
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${mode.gradient} shadow-2xl`}
            >
              <mode.icon className="text-white" size={28} />
            </motion.div>

            {/* Title */}
            <h3 className="text-2xl font-black mb-1" style={{ color: theme?.text || (isDark ? '#fff' : '#000') }}>
              {mode.title}
            </h3>
            <p className="text-sm font-medium mb-4" style={{ color: theme?.text + '80' || 'rgba(255,255,255,0.7)' }}>
              {mode.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm mb-6 leading-relaxed" style={{ color: theme?.text + '90' || 'rgba(255,255,255,0.8)' }}>
              {mode.description}
            </p>

            {/* Features */}
            <div className="space-y-2 mb-6">
              {mode.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: mode.accentColor + '20' }}>
                    <feature.icon size={10} style={{ color: mode.accentColor }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: theme?.text + '90' || 'rgba(255,255,255,0.8)' }}>
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer with CTA and Time */}
            <div className="flex items-center justify-between pt-4 border-t"
              style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: theme?.text + '60' || 'rgba(255,255,255,0.5)' }}>
                <FaClock size={12} />
                {mode.timeEstimate}
              </div>
              <div className="flex items-center gap-2 text-sm font-bold"
                style={{ color: mode.accentColor }}>
                <span>Start Now</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </div>
            </div>

            {/* Glow Effect on Hover */}
            <div
              className="absolute -inset-1 opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-xl"
              style={{
                background: `radial-gradient(circle at center, ${mode.accentColor} 0%, transparent 70%)`
              }}
            />
          </motion.button>
        ))}
      </div>

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center p-6 rounded-2xl"
        style={{
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
        }}
      >
        <p className="text-sm font-medium" style={{ color: theme?.text + '70' || 'rgba(255,255,255,0.6)' }}>
          💡 Tip: AI mode works for any chapter instantly. Classic mode shows uploaded PDFs from your board.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default PYQModeSelector;
