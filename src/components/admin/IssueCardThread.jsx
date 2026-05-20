import React, { useState } from 'react';
import { motion } from 'framer-motion';
import IssueThreadWindow from './IssueThreadWindow';

const IssueCardThread = ({
  issue,
  themeColors,
  isOpen,
  onToggleClosed,
  onToggleThread,
  defaultThreadOpen = false,
  children,
}) => {
  const [threadOpen, setThreadOpen] = useState(defaultThreadOpen);

  const toggleThread = () => {
    setThreadOpen((v) => !v);
    onToggleThread?.();
  };

  return (
    <motion.div
      className="p-5 rounded-2xl border group"
      style={{
        borderColor: 'rgba(255,255,255,0.10)',
        background: 'rgba(255,255,255,0.03)',
      }}
      whileHover={{ y: -2 }}
    >
      {children ? children : null}

      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          onClick={toggleThread}
          className="text-xs font-bold uppercase tracking-widest px-3 py-2 rounded-xl border"
          style={{
            borderColor: themeColors?.border,
            color: themeColors?.textSecondary || 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.03)',
          }}
        >
          {threadOpen ? 'Hide Thread' : 'Open Follow-ups / Messages'}
        </button>

        <div className="flex gap-3 items-center">
          {onToggleClosed}
          {/* placeholder for future per-ticket actions */}
        </div>
      </div>

      {threadOpen && (
        <IssueThreadWindow issueId={issue.id} mode="admin" themeColors={themeColors} isOpen />
      )}
    </motion.div>
  );
};

export default IssueCardThread;

