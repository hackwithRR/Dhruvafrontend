import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, orderBy } from 'firebase/firestore';

import { toast } from 'react-toastify';

import IssueThreadWindow from './admin/IssueThreadWindow';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaHistory,
  FaInbox,
  FaTimes,
  FaPlus,
  FaImage,
  FaPaperPlane,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';


const cx = (...classes) => classes.filter(Boolean).join(' ');

/**
 * User-side tickets:
 * - Create: issues/{issueId}
 * - Messages: issues/{issueId}/messages (handled by IssueThreadWindow)
 */
const TicketsSection = ({
  id,
  themeColors,
  currentUser,
  db,
  serverTimestamp: _serverTimestampProp, // keep compatibility if passed
  IssueThreadWindow: IssueThreadWindowProp, // keep compatibility if passed
}) => {
  // Keep backwards-compatible prop override (functionality unchanged)
  // If an override is passed, we use it for the thread window.
  const ThreadWindowToRender = IssueThreadWindowProp || IssueThreadWindow;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [issues, setIssues] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [openIssueId, setOpenIssueId] = useState(null);

  const userId = currentUser?.uid;

  const issuesQuery = useMemo(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'issues'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [db, userId]);

  useEffect(() => {
    if (!issuesQuery) return;
    const unsub = onSnapshot(issuesQuery, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setIssues(data);
    });
    return () => unsub();
  }, [issuesQuery, userId]);

  const handleCreate = async () => {
    if (!userId) return;
    if (!title.trim()) return;
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const createdAtTs = _serverTimestampProp || serverTimestamp();
      const complaintId = `CMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      await addDoc(collection(db, 'issues'), {
        complaintId,
        title: title.trim(),
        description: description.trim(),
        screenshotUrl: screenshotUrl || null,
        status: 'open',
        createdBy: userId,
        createdByName: currentUser?.displayName || currentUser?.email || 'User',
        createdAt: typeof createdAtTs === 'function' ? createdAtTs() : createdAtTs,
        statusHistory: [{
          status: 'open',
          timestamp: new Date(),
          updatedByName: currentUser?.displayName || currentUser?.email || 'User'
        }],
      });

      toast.success('Ticket submitted successfully.');

      setTitle('');
      setDescription('');
      setScreenshotUrl('');
      setIsCreating(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const theme = themeColors || {};

  return (
    <div id={id} className="mt-8 w-full">
      {/* Modern Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight" style={{ color: theme.text || '#fff' }}>
            Support <span style={{ color: theme.primary }}>Tickets</span>
          </h2>
          <p className="text-xs sm:text-sm opacity-60 mt-1" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
            Manage your inquiries and follow up with administrators.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreating(!isCreating)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 md:py-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all"
          style={{
            background: isCreating ? 'rgba(255,255,255,0.1)' : theme.primary || '#38bdf8',
            color: isCreating ? theme.text : (theme.isDark ? '#000' : '#fff'),
            boxShadow: isCreating ? 'none' : `0 10px 30px ${theme.accentGlow || 'rgba(56, 189, 248, 0.2)'}`
          }}
        >
          {isCreating ? <><FaTimes /> Close</> : <><FaPlus /> New Ticket</>}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {isCreating ? (
          <motion.div
            key="composer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-[28px] sm:rounded-[32px] p-5 sm:p-8 border mb-10 overflow-hidden relative"
            style={{
              borderColor: theme.border || 'rgba(255,255,255,0.15)',
              background: theme.card || 'rgba(255,255,255,0.03)',
            }}
          >
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 blur-[80px] -z-10" style={{ backgroundColor: `${theme.primary}20` }} />

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Short summary of the issue..."
                    className={cx(
                      'w-full p-4 rounded-2xl border-2 outline-none font-bold transition-all text-sm',
                      'focus:shadow-[0_0_20px_rgba(56,189,248,0.1)]'
                    )}
                    style={{
                      borderColor: theme.border || 'rgba(255,255,255,0.1)',
                      background: 'rgba(0,0,0,0.2)',
                      color: theme.text || '#fff',
                    }}
                  />
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us more about what's happening..."
                  className={cx(
                    'w-full p-4 rounded-2xl border-2 outline-none font-bold transition-all text-sm resize-none',
                    'focus:shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                  )}
                  style={{
                    borderColor: theme.border || 'rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)',
                    color: theme.text || '#fff',
                    minHeight: 140,
                  }}
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      value={screenshotUrl}
                      onChange={(e) => setScreenshotUrl(e.target.value)}
                      placeholder="Link to screenshot (optional)"
                      className="w-full p-4 pl-12 rounded-2xl border-2 outline-none font-bold text-sm transition-all"
                      style={{
                        borderColor: theme.border || 'rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.2)',
                        color: theme.text || '#fff',
                      }}
                    />
                    <FaImage className="absolute left-5 top-1/2 -translate-y-1/2 opacity-40" />
                  </div>

                  <label
                    className="px-6 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-white/5 active:scale-95 whitespace-normal sm:whitespace-nowrap"
                    style={{
                      borderColor: theme.border || 'rgba(255,255,255,0.15)',
                      color: theme.text || '#fff',
                    }}
                  >
                    <FaPlus size={10} /> {screenshotUrl ? 'Change Image' : 'Upload File'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) return toast.error("File is too large (max 10MB)");
                        const reader = new FileReader();
                        reader.onload = () => setScreenshotUrl(typeof reader.result === 'string' ? reader.result : '');
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCreate}
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  style={{
                    background: `linear-gradient(90deg, ${theme.primary || '#a855f7'}, #06b6d4)`,
                    color: theme.isDark ? '#000' : '#fff',
                  }}
                >
                  {isSubmitting ? <FaClock className="animate-spin" /> : <FaPaperPlane />}
                  {isSubmitting ? 'Transmitting...' : 'Submit Inquiry'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {issues.length === 0 ? (
              <div
                className="rounded-[40px] border p-12 text-center relative overflow-hidden"
                style={{
                  borderColor: theme.border || 'rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <FaInbox size={32} className="opacity-20" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest opacity-60">No Active Tickets</h3>
                <p className="text-sm opacity-40 mt-2 max-w-xs mx-auto leading-relaxed">
                  Everything is clear! If you encounter any issues, create a ticket using the button above.
                </p>
              </div>
            ) : (
              issues.map((issue) => {
                const isExpanded = openIssueId === issue.id;
                const isClosed = issue.status === 'closed';
                const statusColor = isClosed ? '#94a3b8' : (issue.status === 'open' ? '#34d399' : '#fb923c');

                return (
                  <motion.article
                    layout
                    key={issue.id}
                    className={cx(
                      'rounded-[28px] border transition-all duration-300 overflow-hidden',
                      isExpanded ? 'shadow-2xl' : 'hover:border-white/20'
                    )}
                    style={{
                      borderColor: isExpanded ? theme.primary || 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                      background: isExpanded ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <button
                      onClick={() => setOpenIssueId(isExpanded ? null : issue.id)}
                      className="w-full text-left p-5 sm:p-6 md:p-8 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        <div 
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}
                        >
                          {isClosed ? <FaCheckCircle style={{ color: statusColor }} /> : <FaExclamationCircle style={{ color: statusColor }} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[9px] sm:text-[10px] font-black tracking-widest opacity-40 uppercase truncate">
                              {issue.complaintId || 'REF-ID'}
                            </span>
                            <span 
                              className="px-2 py-0.5 rounded-md text-[7px] sm:text-[8px] font-black uppercase tracking-tighter"
                              style={{ background: statusColor, color: '#000' }}
                            >
                              {issue.status || 'OPEN'}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm sm:text-base truncate" style={{ color: theme.text || '#fff' }}>
                            {issue.title}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden md:block text-right">
                          <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">Modified</div>
                          <div className="text-[11px] font-bold opacity-60">
                            {issue.createdAt?.toDate ? new Date(issue.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                          </div>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="opacity-30">
                          <FaChevronDown />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5"
                        >
                          <div className="p-4 sm:p-8 pt-0">
                            <div className="mt-8 space-y-8">
                              {/* 📄 Original Inquiry */}
                              <div className="bg-black/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/5 shadow-inner">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: theme.text }}>
                                    Original_Brief
                                  </h4>
                                </div>
                                <p className="text-sm leading-relaxed opacity-80" style={{ color: theme.textSecondary || theme.text }}>
                                  {issue.description}
                                </p>
                                {issue.screenshotUrl && (
                                  <a
                                    href={issue.screenshotUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center mt-5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest transition-all hover:bg-white/10 active:scale-95"
                                    style={{ color: theme.primary }}
                                  >
                                    <FaImage className="mr-2" /> Media_Attachment
                                  </a>
                                )}
                              </div>

                              {/* 🔄 Status History Trail */}
                              {(issue.statusHistory || []).length > 0 && (
                                <div className="pl-2">
                                  <div className="flex items-center gap-2 mb-6">
                                    <FaHistory className="text-[10px] opacity-30" style={{ color: theme.primary }} />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40" style={{ color: theme.text }}>
                                      Status_Trail
                                    </h4>
                                  </div>
                                  <div className="space-y-6 relative pl-4">
                                    <div className="absolute left-[3px] top-2 bottom-2 w-[1px] bg-white/5" />
                                    {issue.statusHistory.map((h, idx) => (
                                      <div key={idx} className="relative group">
                                        <div 
                                          className="absolute -left-[16px] top-1.5 w-2 h-2 rounded-full z-10 transition-colors" 
                                          style={{ background: idx === 0 ? theme.primary : '#222' }}
                                        />
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 sm:gap-4">
                                          <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter" 
                                              style={{ background: idx === 0 ? theme.primary : 'rgba(255,255,255,0.03)', color: idx === 0 ? '#000' : 'rgba(255,255,255,0.4)' }}>
                                              {h.status}
                                            </span>
                                            <span className="text-[10px] sm:text-[11px] font-bold opacity-70" style={{ color: theme.text }}>
                                              {h.updatedByName}
                                            </span>
                                          </div>
                                          <div className="text-[8px] sm:text-[9px] font-black opacity-20 uppercase tracking-widest md:text-right">
                                            {h.timestamp?.toDate ? new Date(h.timestamp.toDate()).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : String(h.timestamp)}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 💬 Correspondence Thread */}
                              <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 pl-2" style={{ color: theme.text }}>
                                  Active_Correspondence
                                </h4>
                                <div className="rounded-3xl overflow-hidden bg-black/40 border border-white/5 shadow-2xl">
                                  <ThreadWindowToRender
                                    issueId={issue.id}
                                    mode="user"
                                    themeColors={theme}
                                    isOpen
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketsSection;
