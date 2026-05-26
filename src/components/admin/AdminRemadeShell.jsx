import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Circle,
  Command,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Users,
  FileText,
  MoreVertical,
  Check,
  X,
  Trash2,
  Send,
  Loader2,
  ShieldAlert,
  Activity,
  Zap,
  Database,
  Copy,
  History as HistoryIcon,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare
} from 'lucide-react';

import ReactDOM from 'react-dom';

import { collection, doc, onSnapshot, query, where, orderBy, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';

import AdminCreateIssueSection from './AdminCreateIssueSection';
import AdminMembersTable from '../admin/AdminMembersTable';
import AdminTicketsSection from './AdminTicketsSection';



const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Sub-component for Appeal Follow-ups
function AppealFollowUps({ appealId, adminPhone }) {
  const [messages, setMessages] = useState([]);
  const [adminText, setAdminText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!appealId) return;
    const q = query(
      collection(db, 'unbanAppeals', appealId, 'followUps'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [appealId]);

  const handleSend = async () => {
    if (!adminText.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'unbanAppeals', appealId, 'followUps'), {
        createdAt: serverTimestamp(),
        createdBy: adminPhone || 'System',
        createdByName: 'Admin',
        role: 'admin',
        followUp: adminText.trim(),
      });
      setAdminText('');
      toast.success('Reply posted.');
    } catch (e) {
      console.error('Admin Follow-up Error:', {
        code: e.code,
        message: e.message,
        adminPhone
      });
      toast.error(`Neural link failure: ${e.code === 'permission-denied' ? `Access Denied for ${adminPhone || 'Unknown Admin'}. Check Rules.` : e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="max-h-[35vh] overflow-y-auto pr-2 space-y-3 no-scrollbar">
        {messages.length === 0 ? (
          <div className="text-xs text-white/40 italic p-2">No follow-up messages yet.</div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`rounded-2xl p-4 border ${m.role === 'admin' ? 'bg-cyan-500/10 border-cyan-500/20 ml-8' : 'bg-white/5 border-white/5 mr-8'}`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className={`text-[10px] font-black uppercase ${m.role === 'admin' ? 'text-cyan-400' : 'text-white/40'}`}>
                  {m.createdByName || (m.role === 'admin' ? 'Admin' : 'User')}
                </div>
                <div className="text-[10px] text-white/30">{m.createdAt?.toDate()?.toLocaleString() || 'Just now'}</div>
              </div>
              <div className="text-sm text-white/80 leading-relaxed">{m.followUp}</div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="relative group">
          <textarea
            value={adminText}
            onChange={(e) => setAdminText(e.target.value)}
            placeholder="Post a follow-up or reply..."
            className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 pr-14 text-sm text-white outline-none focus:border-cyan-500/40 transition-all"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={sending || !adminText.trim()}
            className="absolute right-3 bottom-3 p-2 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnbanAppealsInbox({ themeColors, adminPhone }) {
  const navigate = useNavigate();

  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [selectedAppeal, setSelectedAppeal] = useState(null);

  useEffect(() => {
    const qRef = query(
      collection(db, 'unbanAppeals'),
      where('status', '==', 'open')
      // orderBy('createdAt', 'desc') removed to bypass index requirement; sorting handled in client below
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Client-side sort by date descending
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds || 0;
          const tB = b.createdAt?.seconds || 0;
          return tB - tA;
        });
        setAppeals(list);
        setLoading(false);
      },
      (e) => {
        console.error('Failed to load unban appeals:', e);
        setError(e);
        setLoading(false);
      }
    );

    return () => unsub?.();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return appeals;
    return appeals.filter((a) => {
      const id = String(a.appealId || '').toLowerCase();
      const name = String(a.createdByName || '').toLowerCase();
      const uid = String(a.createdBy || '').toLowerCase();
      const reason = String(a.reason || '').toLowerCase();
      return id.includes(s) || name.includes(s) || uid.includes(s) || reason.includes(s);
    });
  }, [appeals, q]);

  const activeGlow = themeColors?.primary || themeColors?.primaryHex || '#4f46e5';

  const handleAction = async (appeal, newStatus) => {
    if (!appeal.id) return;
    const confirmMsg = newStatus === 'approved' 
      ? `Are you sure you want to APPROVE this appeal and UNBAN user ${appeal.createdByName || appeal.createdBy}?`
      : `Are you sure you want to REJECT this appeal?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const appealRef = doc(db, 'unbanAppeals', appeal.id);
      await updateDoc(appealRef, {
        status: newStatus,
        lastUpdatedAt: serverTimestamp(),
      });

      if (newStatus === 'approved' && appeal.createdBy) {
        const userRef = doc(db, 'users', appeal.createdBy);
        await updateDoc(userRef, {
          isBanned: false,
          ban: null,
          ban_reason: null,
          banned_at: null
        });
        toast.success('Appeal approved and user unbanned.');
      } else {
        toast.info(`Appeal marked as ${newStatus}.`);
      }
    } catch (err) {
      console.error(`Failed to ${newStatus} appeal:`, err);
      toast.error(`Action failed: ${err.message}`);
    }
  }

  return (
    <div className="space-y-6">
      {selectedAppeal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl h-[85vh] flex flex-col rounded-[3rem] border shadow-2xl overflow-hidden"
            style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}
          >
            {/* Appeal Header */}
            <div className="flex items-center justify-between gap-4 px-8 py-6 border-b" style={{ backgroundColor: themeColors.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderColor: themeColors.border }}>
              <div>
                <div className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.3em]">Neural Appeal Review</div>
                <h2 className="text-2xl font-black mt-1 italic uppercase tracking-tighter" style={{ color: themeColors.text }}>{selectedAppeal.createdByName || 'Requester'}</h2>
              </div>
              <button onClick={() => setSelectedAppeal(null)} className="p-3 rounded-2xl border transition-all active:scale-95" style={{ backgroundColor: themeColors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: themeColors.border }}>
                <X className="w-6 h-6" style={{ color: themeColors.text }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scroll px-8 py-8 space-y-8 no-scrollbar">
              <div className="rounded-[2rem] p-8 border relative overflow-hidden" style={{ backgroundColor: themeColors.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)', borderColor: themeColors.border }}>
                <div className="absolute top-0 right-0 p-6 opacity-5" style={{ color: themeColors.text }}><Sparkles size={60} /></div>
                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase mb-3 tracking-[0.2em]" style={{ color: themeColors.textSecondary, opacity: 0.5 }}>Transmission Payload / Reason</div>
                  <p className="text-lg leading-relaxed font-bold italic" style={{ color: themeColors.text }}>"{selectedAppeal.reason}"</p>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-black uppercase text-white/30 mb-5 tracking-[0.2em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Live Thread Activity
                </div>
                <AppealFollowUps appealId={selectedAppeal.id} adminPhone={adminPhone} />
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-black/40 flex items-center gap-4">
              <button 
                onClick={() => { handleAction(selectedAppeal, 'approved'); setSelectedAppeal(null); }} 
                className="flex-1 py-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-500/20 transition-all active:scale-[0.98]"
              >
                Authorize & Unban
              </button>
              <button 
                onClick={() => { handleAction(selectedAppeal, 'rejected'); setSelectedAppeal(null); }} 
                className="flex-1 py-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/20 transition-all active:scale-[0.98]"
              >
                Reject Appeal
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-white/55 uppercase">Appeal Inbox</div>
          <div className="text-2xl font-black">Unban Requests</div>
          <div className="text-xs text-white/60 mt-1">Live pending unban appeals (status: open)</div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/banned')}
            className="rounded-2xl px-4 py-3 text-sm font-black border border-cyan-500/25 bg-cyan-500/10 hover:bg-cyan-500/15 transition text-cyan-200 inline-flex items-center gap-2"
          >
            View /banned
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: activeGlow }}
            />
          </button>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: themeColors.textSecondary }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search appeals..."
              className="w-[260px] max-w-[45vw] rounded-2xl border pl-11 pr-4 py-3 text-sm outline-none focus:ring-1"
              style={{ backgroundColor: themeColors.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)', borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border overflow-hidden shadow-sm" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
        <div className="grid grid-cols-[1.2fr_0.5fr_1fr_1.3fr] gap-0 px-5 py-3 text-xs font-black border-b" style={{ borderColor: themeColors.border, color: themeColors.textSecondary }}>
          <div>Appeal</div>
          <div>Status</div>
          <div>Requester</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="max-h-[560px] overflow-auto">
          {loading ? (
            <div className="p-10 text-center text-white/60 text-sm font-bold">Loading appeals...</div>
          ) : error ? (
            <div className="p-10 text-center text-red-200/80 text-sm font-bold">
              <div className="text-red-400 mb-2">Failed to load appeals</div>
              <div className="text-xs font-medium opacity-70">
                {error.code === 'permission-denied' 
                  ? 'Access Denied: Update Firestore Security Rules for "unbanAppeals" collection.' 
                  : `Error: ${error.message}`}
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-white/60 text-sm font-bold">No open appeals</div>
          ) : (
            <div className="divide-y divide-white/10">
              {filtered.map((a, idx) => {
                const reasonPreview = String(a.reason || '').slice(0, 90);
                const requester = a.createdByName || a.createdBy || 'Unknown';
                return (
                  <div
                    key={a.id}
                    className={
                      'grid grid-cols-[1.2fr_0.5fr_1fr_1.3fr] items-center px-5 py-4 ' +
                      (idx % 2 === 0 ? 'bg-black/10' : 'bg-black/0')
                    }
                  >
                    <div className="min-w-0">
                      <div className="font-black text-sm text-white/90 truncate">
                        {a.appealId || a.type || 'UNBAN'}
                      </div>
                      {reasonPreview ? (
                        <div className="text-xs text-white/55 mt-1 line-clamp-2">
                          {reasonPreview}{String(a.reason || '').length > 90 ? '…' : ''}
                        </div>
                      ) : (
                        <div className="text-xs text-white/40 mt-1">No reason provided.</div>
                      )}
                    </div>

                    <div>
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black border"
                        style={{
                          background: 'rgba(56,189,248,0.10)',
                          borderColor: 'rgba(56,189,248,0.25)',
                          color: '#bae6fd',
                        }}
                      >
                        {(a.status || 'open').toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs text-white/70 font-semibold truncate">{requester}</div>
                      {a.createdByEmailMasked ? (
                        <div className="text-[11px] text-white/50 truncate mt-0.5">{a.createdByEmailMasked}</div>
                      ) : null}
                    </div>

                    <div className="text-right flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedAppeal(a)}
                        className="rounded-xl px-3 py-2 text-xs font-black border border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20 transition text-cyan-200"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(a, 'approved')}
                        className="rounded-xl px-3 py-2 text-xs font-black border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 transition text-emerald-200"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(a, 'rejected')}
                        className="rounded-xl px-3 py-2 text-xs font-black border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition text-red-200"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/banned?uid=${a.createdBy}`)}
                        className="rounded-xl px-3 py-2 text-xs font-black border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/70"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function ModalIssueStatusSync({ issueId, open, db, setModalIssueStatus }) {
  useEffect(() => {
    if (!open || !issueId) return;

    const refDoc = doc(db, 'issues', issueId);
    const unsub = onSnapshot(refDoc, (snap) => {
      const data = snap?.data?.() || {};
      setModalIssueStatus(data?.status || null);
    }, (e) => {
      console.error('Failed to sync modal issue status', e);
    });

    return () => unsub?.();
  }, [issueId, open, db, setModalIssueStatus]);

  return null;
}


function useHotkeyCtrlK(onTrigger) {
  useEffect(() => {
    const handler = (e) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const isCtrlOrMeta = isMac ? e.metaKey : e.ctrlKey;
      if (!isCtrlOrMeta) return;
      if (e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      onTrigger();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onTrigger]);
}

function Sparkline({ values, stroke = 'rgba(255,255,255,0.85)' }) {
  const d = useMemo(() => {
    if (!values || values.length < 2) return '';
    const w = 120;
    const h = 32;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return { x, y };
    });
    return pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
        return `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
      })
      .join(' ');
  }, [values]);

  return (
    <svg width="120" height="32" viewBox="0 0 120 32" className="drop-shadow">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d={d} fill="none" stroke={stroke} strokeOpacity="0.25" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  trendLabel,
  trendPct,
  glow,
  themeColors,
}) {
  const trendUp = trendPct >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="relative overflow-hidden rounded-3xl border"
      style={{
        borderColor: themeColors.border,
        backgroundColor: themeColors.bgCard,
      }}
    >
      <div
        className="absolute -inset-20 opacity-60 blur-3xl"
        style={{ background: `radial-gradient(circle at 30% 20%, ${glow}, transparent 55%)` }}
      />
      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm" style={{ color: themeColors.textSecondary }}>
              <Icon className="w-5 h-5" style={{ color: glow }} />
              <span className="font-semibold">{title}</span>
            </div>
            <div className="mt-3 text-3xl font-black" style={{ color: themeColors.text }}>{value}</div>
          </div>
          <motion.div
            initial={{ opacity: 0, rotate: -10, scale: 0.9 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-white/10 bg-black/20 px-3 py-1"
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center"
                style={{ color: trendUp ? '#34d399' : '#fb7185' }}
              >
                <Circle className="w-2.5 h-2.5 fill-current" />
              </span>
              <span className="text-xs font-bold" style={{ color: trendUp ? '#34d399' : '#fb7185' }}>
                {trendLabel} {Math.abs(trendPct)}%
              </span>
            </div>
          </motion.div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs" style={{ color: themeColors.textSecondary, opacity: 0.6 }}>Live Trend</div>
            <div className="text-sm font-semibold mt-1" style={{ color: themeColors.textSecondary }}>
              {trendUp ? 'Momentum ↑' : 'Momentum ↓'}
            </div>
          </div>
          <Sparkline values={trendUp ? [3, 4, 6, 5, 7, 9, 10] : [10, 9, 8, 7, 6, 5, 4]} stroke={glow} />
        </div>
      </div>
    </motion.div>
  );
}

function FloatingLabelInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  autoComplete,
  inputMode,
  maxLength,
  disabled,
}) {
  const [focused, setFocused] = useState(false);
  const showFloat = focused || (value ?? '').toString().length > 0;

  return (
    <div className="relative">
      <motion.div
        animate={error ? { x: [0, -6, 6, -3, 3, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="relative"
      >
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || ' '}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          disabled={disabled}
          className={
            'w-full rounded-2xl border bg-black/20 px-4 pt-5 pb-3 text-white placeholder-transparent outline-none transition ' +
            (error
              ? 'border-red-500/70 ring-1 ring-red-500/20'
              : 'border-white/15 focus:border-white/25 focus:ring-1 focus:ring-white/10')
          }
        />
        <label
          className={
            'pointer-events-none absolute left-4 top-4 origin-left text-sm transition-all select-none ' +
            (showFloat
              ? 'text-white/70 -translate-y-3 scale-90'
              : 'text-white/35 translate-y-0 scale-100')
          }
        >
          {label}
        </label>
      </motion.div>
    </div>
  );
}

const InlineImageModal = ({
  open,
  onClose,
  src,
  title,
  themeColors, // Add themeColors prop
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onMouseDown={(e) => {
          // click outside closes
          if (e.target === e.currentTarget) onClose?.();
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="relative w-full max-w-3xl rounded-3xl border overflow-hidden shadow-2xl"
        style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b" style={{ borderColor: themeColors.border }}>
          <div className="min-w-0">
            <div className="text-sm font-black text-white/90 truncate">
              {title || 'Screenshot Preview'}
            </div>
            <div className="text-xs text-white/55 mt-0.5">Click outside or press Esc to close</div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-2xl border transition px-3 py-2"
            style={{ backgroundColor: themeColors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border, color: themeColors.textSecondary }}
            aria-label="Close image preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5" style={{ backgroundColor: themeColors.bgCard }}>
          {src ? (
            <img
              src={src}
              alt={title || 'Screenshot'}
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-white/10 bg-black/30"
            />
          ) : (
            <div className="text-sm" style={{ color: themeColors.textSecondary }}>No image available.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Dropdown({
  open,
  onClose,
  anchorRef,
  children,
  themeColors,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const t = e.target;
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (anchorRef.current && anchorRef.current.contains(t)) return;
      onClose?.();
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose, anchorRef]);

  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!open) return;
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 10, left: r.right - 190 });
  }, [open, anchorRef]);

  return (
          <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}

          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
          style={{ top: pos.top, left: pos.left, backgroundColor: themeColors?.bgCard, borderColor: themeColors?.border }}
          className="fixed z-[60] w-[190px] rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TableRowActionItem({ label, onClick, danger, themeColors }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'w-full text-left px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ' +
        (danger
          ? `text-red-300 hover:bg-red-500/10`
          : `text-[${themeColors.text}] hover:bg-[${themeColors.bgCard}]`)
      }
    >
      {label}
    </button>
  );
}

export default function AdminRemadeShell({
  themeColors,
  adminPhone,
  activeSection,
  setActiveSection,
  stats,
  issues,
  newIssue,
  setNewIssue,
  adminPhones,
  setAdminPhones,
  newAdminPhone,
  setNewAdminPhone,
  isSuperAdmin,
  onAddIssue,
  onDeleteIssue,
  onAddAdminPhone,
  onRemoveAdminPhone,
  onToggleIssueStatus,
  onToggleTheme,
}) {
  const { isDark } = themeColors;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef(null);

  useHotkeyCtrlK(() => {
    setSidebarOpen((v) => v); // no-op for layout
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  });

  const navItems = useMemo(
    () => [
      { zone: 'Core', id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { zone: 'Management', id: 'issues', label: 'Issues', icon: ShieldCheck },
      { zone: 'Management', id: 'unbanAppeals', label: 'Unban Appeals', icon: ShieldCheck },
      { zone: 'Management', id: 'materials', label: 'Materials', icon: FileText },
      { zone: 'Settings', id: 'members', label: 'Admin Members', icon: Users },
      { zone: 'Settings', id: 'settings', label: 'Settings', icon: Settings },
    ],
    []
  );


  const zones = useMemo(() => {
    const z = {};
    for (const item of navItems) {
      z[item.zone] = z[item.zone] || [];
      z[item.zone].push(item);
    }
    return z;
  }, [navItems]);

  const filteredIssues = useMemo(() => { // Fallback for missing properties
    const q = searchValue.trim().toLowerCase();
    if (!q) return issues;
    return issues.filter((it) => {
      const title = (it.title || '').toLowerCase();
      const createdBy = (it.createdBy || it.createdByName || '').toLowerCase();
      const status = (it.status || '').toLowerCase();
      return title.includes(q) || createdBy.includes(q) || status.includes(q);
    });
  }, [issues, searchValue]);

  const breadcrumbs = useMemo(() => {
    const map = {
      dashboard: ['Admin', 'Dashboard'],
      issues: ['Admin', 'Issues'],
      materials: ['Admin', 'Materials'],
      members: ['Admin', 'Admin Members'],
      settings: ['Admin', 'Settings'],
    };
    return map[activeSection] || ['Admin', 'Dashboard'];
  }, [activeSection]);

  const [notifCount, setNotifCount] = useState(0);
  const [unreadPulse, setUnreadPulse] = useState(false);
  const prevNotifCountRef = useRef(0);


  const [notifBump, setNotifBump] = useState(false);
  useEffect(() => {
    // Light pulse when unread count increases.
    if (notifCount > prevNotifCountRef.current) {
      setNotifBump(true);
      setUnreadPulse(true);
      const t2 = setTimeout(() => {
        setNotifBump(false);
        setUnreadPulse(false);
      }, 900);
      return () => clearTimeout(t2);
    }
    prevNotifCountRef.current = notifCount;
  }, [notifCount]);


  const [rowFilter, setRowFilter] = useState('all');
  const visibleIssues = useMemo(() => {
    const base = filteredIssues;
    if (rowFilter === 'all') return base;
    if (rowFilter === 'open') return base.filter((i) => i.status === 'open');
    if (rowFilter === 'closed') return base.filter((i) => i.status === 'closed');
    return base;
  }, [filteredIssues, rowFilter]);

  const [openDropdownFor, setOpenDropdownFor] = useState(null);
  const dropdownAnchorRef = useRef(null);

  const [selectedIssueId, setSelectedIssueId] = useState(null);

  // Get current active issue data for the modal
  const selectedIssue = useMemo(() => 
    issues.find(i => i.id === selectedIssueId), 
    [issues, selectedIssueId]
  );

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueThreadKey, setIssueThreadKey] = useState(0);
  const [modalIssueStatus, setModalIssueStatus] = useState(null);
  const [showSidebarInModal, setShowSidebarInModal] = useState(true);
  const issueReplyRef = useRef(null);
  const [isTogglingIssue, setIsTogglingIssue] = useState(false);

  const [issueReply, setIssueReply] = useState('');
  const [isReplySending, setIsReplySending] = useState(false);
  const [modalMessages, setModalMessages] = useState([]);

  useEffect(() => {
    if (!isIssueModalOpen || !selectedIssueId) return;
    // Read the same messages collection that IssueThreadWindow (user side) listens to.
    const q = query(collection(db, 'issues', selectedIssueId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      setModalMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => {
        const el = document.getElementById('modal-messages-feed');
        if (el) el.scrollTop = el.scrollHeight;
      }, 150);
    }, (err) => {
      console.error("Neural Link Read Error:", err);
      if (err.code === 'permission-denied') {
        toast.error("Security Breach: Core rejected message sync.");
      }
    });
  }, [isIssueModalOpen, selectedIssueId]);

  const handleSendIssueReply = async () => {
    if (!issueReply.trim() || !selectedIssueId) return;
    setIsReplySending(true);
    try {
      await addDoc(collection(db, 'issues', selectedIssueId, 'messages'), {
        role: 'admin',
        text: issueReply.trim(),
        screenshotUrl: null,
        createdAt: serverTimestamp(),
        // keep extra fields for compatibility / debugging
        createdBy: adminPhone || 'admin_node',
        createdByName: 'Admin',
      });
      setIssueReply('');
      toast.success('Follow-up transmission sent.');
      // Refresh the viewer to show the new message
      setIssueThreadKey(k => k + 1);
    } catch (e) {
      console.error('[Firestore Rules] Admin Dispatch Failure:', {
        code: e?.code,
        message: e?.message,
        authId: db.app.options.authDomain // Verify connection
      });
      toast.error(`Neural link failure: ${e?.code === 'permission-denied' ? 'Neural permissions rejected. Check whitelist.' : 'Buffer synchronization error.'}`);
    } finally {
      setIsReplySending(false);
    }
  };

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState('');
  const [imagePreviewTitle, setImagePreviewTitle] = useState('');


  // Use themeColors.primaryHex for activeGlow to ensure it matches the current theme's primary color
  const activeGlow = themeColors?.primaryHex || '#4f46e5';

  const sidebarPillRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ top: 0, height: 40, opacity: 0 });

  useEffect(() => {
    const btn = sidebarPillRef.current;
    const el = document.querySelector(`[data-nav-id="${activeSection}"]`);
    if (!btn || !el || !sidebarOpen) return;
    const r = el.getBoundingClientRect();
    const parentR = btn.getBoundingClientRect();
    setPillStyle({
      top: r.top - parentR.top,
      height: r.height,
      opacity: 1,
    });
  }, [activeSection, sidebarOpen]);

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ color: themeColors.text, backgroundColor: isDark ? '#0a0a0c' : '#fcfbf7' }}>
      <ToastContainer theme={isDark ? "dark" : "light"} position="top-right" autoClose={2500} hideProgressBar />
      {/* sync modalIssueStatus from Firestore so button label reflects changes instantly */}
      <ModalIssueStatusSync issueId={selectedIssueId} open={isIssueModalOpen} db={db} setModalIssueStatus={setModalIssueStatus} />

      <div className="relative min-h-screen flex flex-col md:flex-row">
        {/* Background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-60" style={{ background: `radial-gradient(circle at 30% 30%, ${activeGlow}66 0%, transparent 60%)` }} />
          <div className="absolute -bottom-60 -right-60 w-[620px] h-[620px] rounded-full blur-3xl opacity-50" style={{ background: `radial-gradient(circle at 70% 70%, ${activeGlow}33 0%, transparent 70%)` }} />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)`, backgroundSize: '44px 44px' }} />
          <motion.div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ background: `linear-gradient(180deg, transparent, ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.05)'})` }}
            animate={{ opacity: [0.35, 0.5, 0.35] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="flex flex-1 min-w-0">
          <motion.aside
            initial={false}
            animate={{ width: sidebarOpen ? 272 : 88 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative shrink-0 z-40 md:sticky md:top-0 border-r"
            style={{ background: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)', backdropFilter: 'blur(18px)', borderColor: themeColors.border }}
          >
            <div className="h-full">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl border flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border }}>
                    <Sparkles className="w-5 h-5" style={{ color: activeGlow }} />
                  </div>
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                        <div className="font-black leading-tight" style={{ color: themeColors.text }}>Admin</div>
                        <div className="text-[11px] -mt-1" style={{ color: themeColors.textSecondary, opacity: 0.7 }}>Command Center</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl border transition hover:opacity-80" // Removed hardcoded colors
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border }}
                  aria-label="Toggle sidebar"
                >
                  <ChevronRight className={`w-4 h-4 transition ${sidebarOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div ref={sidebarPillRef} className="relative px-2 pb-4">
                {/* Active pill */}
                <motion.div
                  animate={{ top: pillStyle.top, height: pillStyle.height, opacity: pillStyle.opacity }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  className="absolute left-2 right-2 rounded-2xl border shadow-lg"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderColor: themeColors.border, boxShadow: `0 0 28px ${activeGlow}20` }}
                />

                {Object.entries(zones).map(([zoneName, items]) => (
                  <div key={zoneName} className="mt-4">
                    {sidebarOpen && <div className="px-4 text-[11px] font-bold uppercase" style={{ color: themeColors.textSecondary }}>{zoneName}</div>}
                    <div className="mt-2 space-y-1">
                      {items.map((it) => {
                        const Icon = it.icon;
                        const isActive = it.id === activeSection;
                        return (
                          <motion.button
                            key={it.id}
                            data-nav-id={it.id}
                            type="button"
                            onClick={() => setActiveSection(it.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.99 }}
                            className={
                              'relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition z-10 ' + // Removed hardcoded text-white/70
                              (isActive ? '' : 'hover:opacity-80')
                            }
                            style={{ 
                              color: isActive ? themeColors.text : themeColors.textSecondary,
                            }}
                          >
                            <Icon
                              className="w-5 h-5"
                              style={{ color: isActive ? activeGlow : undefined }}
                            />
                            <AnimatePresence>
                              {sidebarOpen && (
                                <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                                  <span className="font-semibold text-sm">{it.label}</span>
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-6">
                <div className="rounded-2xl border p-4 shadow-sm" style={{ backgroundColor: themeColors.bgCard, borderColor: themeColors.border }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl border flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border }}>
                        <ShieldCheck className="w-4 h-4" style={{ color: activeGlow }} />
                      </div>
                      {sidebarOpen && (
                        <div>
                          <div className="text-xs" style={{ color: themeColors.textSecondary, opacity: 0.7 }}>Signed in</div>
                          <div className="font-black truncate text-sm" style={{ color: themeColors.text }}>{adminPhone || 'Verified'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="sticky top-0 z-30 backdrop-blur-xl border-b" // Removed hardcoded bg-black/30
              style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', borderColor: themeColors.border }}
            >
              <div className="px-5 md:px-8 py-4 flex items-center gap-4">
                <div className="min-w-[220px]">
                  <div className="text-xs" style={{ color: themeColors.textSecondary, opacity: 0.7 }}>Breadcrumbs</div>
                  <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: themeColors.text }}>
                    <ChevronDown className="w-4 h-4 rotate-180 opacity-0" />
                    {breadcrumbs.map((b, idx) => (
                      <span key={b} style={{ color: idx === breadcrumbs.length - 1 ? themeColors.text : themeColors.textSecondary }}>
                        {idx === 0 ? b : ` / ${b}`}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: themeColors.textSecondary }} />
                    <input
                      ref={searchRef}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onFocus={() => setSearchOpen(true)}
                      onBlur={() => {
                        // Delay to allow dropdown clicks if any in future.
                        setTimeout(() => setSearchOpen(false), 120);
                      }}
                      className="w-full rounded-2xl border pl-11 pr-28 py-3 text-sm outline-none focus:ring-1" // Removed hardcoded bg-white/5, text-white, placeholder:text-white/30
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', borderColor: themeColors.border, color: themeColors.text, '--tw-ring-color': `${activeGlow}40` }}
                      placeholder="Search admins, issues, statuses..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="hidden md:flex items-center gap-2" style={{ color: themeColors.textSecondary, opacity: 0.7 }}>
                        <span className="text-[11px] font-bold">Ctrl</span>
                        <span className="w-7 h-6 rounded-lg border flex items-center justify-center text-[11px] font-black" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', borderColor: themeColors.border }}>K</span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {searchOpen && searchValue.trim().length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-0 right-0 mt-3 rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden" // Removed hardcoded bg-black/65
                        style={{ backgroundColor: themeColors.bgCard, borderColor: themeColors.border }}
                      >
                        <div className="px-4 py-3 flex items-center justify-between">
                          <div className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>Quick Filter</div> {/* Removed opacity: 0.55 */}
                          <div className="text-xs" style={{ color: themeColors.textSecondary }}>{visibleIssues.length} results</div> {/* Removed opacity: 0.55 */}
                        </div>
                        <div className="max-h-64 overflow-auto">
                          {visibleIssues.slice(0, 6).map((it) => (
                            <button
                              key={it.id}
                              type="button"
                              className="w-full px-4 py-3 text-left hover:opacity-80 transition flex items-center justify-between gap-3" // Removed hardcoded text-white
                              style={{ color: themeColors.text, backgroundColor: isDark ? 'transparent' : 'transparent', hover: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' } }}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setActiveSection('issues');
                              }}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-bold truncate" style={{ color: themeColors.text }}>{it.title || 'Untitled issue'}</div>
                                <div className="text-xs truncate mt-0.5" style={{ color: themeColors.textSecondary }}> {/* Removed opacity: 0.55 */}
                                  {(it.createdByName || it.createdBy || '') + (it.status ? ` • ${it.status}` : '')}
                                </div>
                              </div>
                              <div
                                className="text-xs font-bold px-2.5 py-1 rounded-full border" // Removed hardcoded text-white
                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border, color: themeColors.textSecondary }}
                              >
                                {(it.status || 'open').toUpperCase()}
                              </div>
                            </button>
                          ))}
                          {visibleIssues.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm font-semibold" style={{ color: themeColors.textSecondary }}> {/* Removed opacity: 0.6 */}
                              No matches.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="rounded-2xl border transition px-3 py-2 relative" // Removed hardcoded bg-white/5, text-white
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', borderColor: themeColors.border, color: themeColors.textSecondary }} // Removed hardcoded text-white/70
                    onClick={() => {
                      setActiveSection('issues');
                    }}
                    aria-label="Go to issues"
                  >
                    <span className="inline-flex items-center gap-2 relative">
                      <Bell className={`w-4 h-4 opacity-90 ${notifCount > 0 ? 'text-red-400' : ''}`} />
                      <span className="hidden sm:inline text-xs font-bold">Alerts</span>
                      {notifCount > 0 && (
                        <motion.span
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: unreadPulse ? 1.15 : 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-black/50"
                        >
                          {clamp(notifCount, 0, 99)}
                        </motion.span>
                      )}
                    </span>
                  </button>


                  <button
                    type="button"
                    className="relative rounded-2xl border transition px-3 py-2" // Removed hardcoded bg-white/5, text-white
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', borderColor: themeColors.border, color: themeColors.textSecondary }} // Removed hardcoded text-white/80
                    aria-label="Notifications"
                  >
                    <Bell className={`w-4 h-4 transition`} style={{ color: notifBump ? themeColors.primary : themeColors.textSecondary }} /> {/* Removed hardcoded text-white/80 */}
                    {notifCount > 0 && (
                      <motion.span
                        key={notifCount}
                        initial={{ y: 2, opacity: 0, scale: 0.7 }}
                        animate={{ y: notifBump ? -6 : 0, opacity: 1, scale: notifBump ? 1.1 : 1 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 18 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-black/50"
                      >
                        {clamp(notifCount, 0, 99)}
                      </motion.span>
                    )}
                  </button>

                  <ThemeToggle themeColors={themeColors} onToggle={onToggleTheme} />
                </div>
              </div>
            </motion.header>

            {/* Content */}
            <div className="px-5 md:px-8 py-7">
              <AnimatePresence mode="wait">
                <InlineImageModal
                  open={imagePreviewOpen}
                  onClose={() => setImagePreviewOpen(false)}
                  src={imagePreviewSrc}
                  title={imagePreviewTitle}
                  themeColors={themeColors} // Pass themeColors to InlineImageModal
                />

                {isIssueModalOpen && selectedIssueId && (
                  <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8"
                    role="dialog"
                    aria-modal="true"
                  >
                    <div
                      className="absolute inset-0 bg-black/85 backdrop-blur-md"
                      onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                          setIsIssueModalOpen(false);
                          setSelectedIssueId(null);
                        }
                      }}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      className="relative w-full max-w-6xl h-[85vh] flex flex-col rounded-[3rem] border shadow-[0_0_100px_rgba(0,0,0,0.6)] overflow-hidden" // Removed hardcoded bg-[#0a0a0c]
                    >
                      {/* Premium Header */}
                      <div className="flex items-center justify-between gap-6 px-8 py-6 bg-white/[0.02] border-b border-white/5 shrink-0">
                        <div className="flex items-start gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${modalIssueStatus === 'closed' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-orange-500/20 bg-orange-500/10 text-orange-400'}`}>
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Console</h2>
                              <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${
                                modalIssueStatus === 'closed' 
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                                : 'border-orange-500/20 bg-orange-500/10 text-orange-400'
                              }`}>
                                {modalIssueStatus || 'open'}
                              </div>
                            </div>
                            <div className="text-[8px] font-bold text-white/20 uppercase tracking-[0.4em] mt-1 font-mono">ID: {selectedIssue?.complaintId || selectedIssueId}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowSidebarInModal(!showSidebarInModal)}
                            className={`p-3 rounded-2xl border transition-all active:scale-95 ${showSidebarInModal ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-white/10 bg-white/5 text-white/40 hover:text-white'}`}
                            title={showSidebarInModal ? 'Hide Sidebar' : 'Show Sidebar'}
                          >
                            {showSidebarInModal ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsIssueModalOpen(false);
                              setSelectedIssueId(null);
                            }}
                            className="p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95"
                            aria-label="Close modal" // Removed hardcoded colors
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* REMADE UI: Intelligence Split-Pane */}
                      <div className="flex-1 flex overflow-hidden">
                        {/* Left Sidebar: Case Intelligence & History */}
                        <AnimatePresence mode="popLayout">
                          {showSidebarInModal && (
                            <motion.div 
                              initial={{ x: -100, opacity: 0, width: 0 }}
                              animate={{ x: 0, opacity: 1, width: 320 }}
                              exit={{ x: -100, opacity: 0, width: 0 }}
                              className="shrink-0 flex flex-col border-r overflow-y-auto no-scrollbar" // Removed hardcoded bg-white/[0.01]
                            >
                              <div className="p-8 space-y-8">
                            {/* Section: Node Specs */}
                            <div className="space-y-4">
                              <div className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">Node Intelligence</div>
                              <div className="p-5 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-bold text-white/20 uppercase">Subject Node</span>
                                  <span className="text-xs font-black text-white/90 truncate mt-1">{selectedIssue?.createdByName || 'Unknown'}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-bold text-white/20 uppercase">Network Uplink</span>
                                  <span className="text-[10px] font-mono text-cyan-400/80 mt-1 truncate">{selectedIssue?.createdBy || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Section: Status Evolution (Timeline) */}
                            <div className="space-y-5">
                              <div className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">Status Evolution</div>
                              <div className="relative pl-6 space-y-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                                {selectedIssue?.statusHistory?.length > 0 ? (
                                  [...selectedIssue.statusHistory].reverse().map((history, idx) => (
                                    <div key={idx} className="relative">
                                      <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0c] bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                                      <div className="flex flex-col">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-black uppercase text-white/80">{history.status}</span>
                                          <span className="text-[8px] font-bold text-white/20">{new Date(history.changedAt).toLocaleDateString()}</span>
                                        </div>
                                        <span className="text-[8px] font-bold text-white/40 uppercase mt-0.5 tracking-tighter">By: {history.changedBy || 'System'}</span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="relative">
                                    <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0c] bg-orange-500" />
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black uppercase text-white/80">Record Created</span>
                                      <span className="text-[8px] font-bold text-white/20">Initial Sync</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Section: Diagnostic Specs */}
                            <div className="space-y-4 pt-4">
                              <div className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em]">Diagnostics</div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                  <div className="text-[7px] font-black text-white/20 uppercase">Encryption</div>
                                  <div className="text-[9px] font-bold text-emerald-400 mt-1">AES-256</div>
                                </div>
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                  <div className="text-[7px] font-black text-white/20 uppercase">Uptime</div>
                                  <div className="text-[9px] font-bold text-cyan-400 mt-1">Nominal</div>
                                </div>
                              </div>
                            </div>
                          </div>
                              </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Right Pane: Main Support Stream */}
                        <div className="flex-1 overflow-hidden flex flex-col relative" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }}>
                          <div id="modal-messages-feed" className="flex-1 overflow-y-auto px-10 py-10 space-y-8 no-scrollbar scroll-smooth">
                            {modalMessages.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center opacity-20 italic space-y-4">
                                <MessageSquare size={48} />
                                <p className="text-xs uppercase tracking-[0.4em] font-black">No transmissions detected</p>
                              </div>
                            ) : (
                              modalMessages.map((m) => {
                                const isAdmin = m.role === 'admin';
                                return (
                                  <div key={m.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'} w-full`}>
                                    <div className={`max-w-[85%] rounded-[2rem] p-6 border ${isAdmin ? (isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200') + ' rounded-bl-none' : 'bg-cyan-500/10 border-cyan-500/20 rounded-br-none'}`} style={{ color: isAdmin ? themeColors.text : '#fff' }}>
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${isAdmin ? 'text-white/30' : 'text-cyan-400'}`}>
                                          {isAdmin ? 'System_Admin' : (selectedIssue?.createdByName || 'User_Node')}
                                        </span>
                                      </div>
                                      <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{m.text || m.followUp}</div>
                                      {m.createdAt && (
                                        <div className="mt-3 text-[8px] font-bold text-white/20 uppercase tracking-tighter">
                                          {new Date(m.createdAt.seconds * 1000).toLocaleString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Console Footer moved inside the main content area for better focus */}
                          <div className="px-8 py-6 border-t space-y-4 shrink-0"
                          style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }}>
                            <div className="relative group flex items-center gap-3">
                              <textarea
                                value={issueReply}
                                onChange={(e) => setIssueReply(e.target.value)}
                                placeholder="Transmit follow-up response..."
                                className="flex-1 rounded-[1.5rem] border p-4 pr-12 text-sm outline-none focus:ring-1 resize-none shadow-inner"
                                style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)', color: themeColors.text, '--tw-ring-color': `${activeGlow}40` }}
                                rows={1}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                      e.preventDefault();
                                      handleSendIssueReply();
                                    }
                                  }}
                              />
                              <button
                                onClick={handleSendIssueReply}
                                disabled={isReplySending || !issueReply.trim()}
                                className="absolute right-2 top-2 p-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-all active:scale-95 disabled:opacity-30 shadow-lg" // Removed hardcoded text-white
                              >
                                {isReplySending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                disabled={!selectedIssueId || !onToggleIssueStatus}
                                onClick={async () => {
                                  if (!selectedIssueId) return;
                                  try {
                                    await onToggleIssueStatus?.(selectedIssueId); // Removed hardcoded text-white/40
                                    setIssueThreadKey((k) => k + 1);
                                  } catch (e) {
                                    console.error('Failed to toggle issue status', e);
                                  }
                                }}
                                className={`flex-1 py-3.5 rounded-[1.25rem] text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                                  modalIssueStatus === 'closed' 
                                  ? (isDark ? 'border-white/10 bg-white/5 text-white/40 hover:text-white' : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200')
                                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                }`}
                              >
                                {modalIssueStatus === 'closed' ? 'Re-open record' : 'Authorize Resolution'}
                              </button>

                              <button
                                type="button"
                                disabled={!selectedIssueId || !onDeleteIssue}
                                onClick={async () => {
                                  if (!selectedIssueId) return;
                                  const ok = window.confirm('Permanently delete this neural record?');
                                  if (!ok) return;
                                  await onDeleteIssue(selectedIssueId);
                                  setIsIssueModalOpen(false); // Removed hardcoded text-red-400/60
                                  setSelectedIssueId(null);
                                }}
                                className="px-6 py-3.5 rounded-[1.25rem] border border-red-500/20 bg-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-all active:scale-95"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}


                <motion.section
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                >
                  {activeSection === 'dashboard' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold uppercase" style={{ color: themeColors.textSecondary }}>KPIs</div>
                          <div className="text-2xl font-black" style={{ color: themeColors.text }}>Operational Overview</div>
                        </div>
                        <div className="rounded-2xl border px-4 py-2 flex items-center gap-2" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                          <ShieldCheck className="w-4 h-4" style={{ color: activeGlow }} />
                          <span className="text-xs font-bold text-white/70">Live Updated</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard
                          icon={Users}
                          title="Total Users"
                          value={stats?.users ?? 0}
                          trendLabel="Trend"
                          trendPct={18}
                          glow={themeColors?.primaryHex || '#4f46e5'}
                          themeColors={themeColors}
                        />
                        <MetricCard
                          icon={FileText}
                          title="Materials"
                          value={stats?.pdfs ?? stats?.materials ?? 0}
                          trendLabel="Trend"
                          trendPct={stats?.pdfs ? 9 : -3}
                          glow={'#34d399'}
                          themeColors={themeColors}
                        />
                        <MetricCard
                          icon={Bell}
                          title="Open Issues"
                          value={stats?.issues ?? (issues || []).filter((i) => i.status === 'open').length}
                          trendLabel="Trend"
                          trendPct={-7}
                          glow={'#fb923c'}
                          themeColors={themeColors}
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Dynamic Grid: Security & Ops */}
                        <div className="rounded-[2.5rem] border p-8 relative overflow-hidden group"
                        style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity" style={{ color: themeColors.textSecondary }}><Activity size={80} /></div>
                          <div className="relative z-10">
                            <h4 className="text-sm font-black uppercase tracking-widest" style={{ color: themeColors.text }}>Neural Pulse</h4>
                            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: themeColors.textSecondary }}>Real-time infrastructure diagnostic</p>
                            
                            <div className="mt-8 grid grid-cols-3 gap-4">
                            {[
                                { label: 'Auth Gate', val: 'Pass', icon: Zap, color: '#34d399' },
                                { label: 'Query Lat', val: '12ms', icon: Database, color: activeGlow },
                                { label: 'Buffer', val: 'Clear', icon: Activity, color: '#60a5fa' },
                              ].map((stat) => ( // Removed hardcoded bg-black/30, border-white/5, bg-white/5
                                <div key={stat.label} className="p-4 rounded-2xl border space-y-3 hover:opacity-80 transition-colors" style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)' }}>
                                  <div className="p-2 w-fit rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: stat.color }}><stat.icon size={12} /></div>
                                  <div>
                                    <div className="text-[8px] font-black uppercase tracking-widest" style={{ color: themeColors.textSecondary }}>{stat.label}</div>
                                    <div className="text-sm font-black italic uppercase tracking-tighter" style={{ color: themeColors.text }}>{stat.val}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[2.5rem] border p-8 relative overflow-hidden group"
                        style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity" style={{ color: themeColors.textSecondary }}><Command size={80} /></div>
                          <div className="relative z-10">
                            <h4 className="text-sm font-black uppercase tracking-widest" style={{ color: themeColors.text }}>Action Hub</h4>
                            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: themeColors.textSecondary }}>Accelerated management shortcuts</p>
                            
                            <div className="mt-8 flex flex-col gap-2">
                            {[
                                { id: 'issues', label: 'Neural Thread Review', desc: 'Manage open support sessions' },
                                { id: 'materials', label: 'Knowledge Vault', desc: 'Sync PDF diagnostic data' },
                                { id: 'members', label: 'Enforcement Deck', desc: 'Manage node access privileges' },
                              ].map((btn) => ( // Removed hardcoded bg-black/30, border-white/5, text-white/90, text-white/30
                                <button
                                  key={btn.id}
                                  onClick={() => setActiveSection(btn.id)}
                                  className="w-full flex items-center justify-between p-4 rounded-2xl border hover:opacity-80 transition-all text-left group/btn"
                                  style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)' }}
                                >
                                  <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: themeColors.text }}>{btn.label}</div>
                                    <div className="text-[8px] uppercase font-bold mt-0.5" style={{ color: themeColors.textSecondary }}>{btn.desc}</div>
                                  </div>
                                  <ChevronRight size={14} className="text-white/20 group-hover/btn:text-white transition-all group-hover/btn:translate-x-1" />
                                </button>
                              ))}
                              </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'issues' && (
                    <AdminTicketsSection
                      issues={issues}
                      themeColors={themeColors}
                      onToggleIssueStatus={onToggleIssueStatus} // Pass down the function
                      onDeleteIssue={onDeleteIssue} // Pass down the function
                      onViewThread={(id) => { // Pass down the function
                        setSelectedIssueId(id); // Set the selected issue ID
                        setIsIssueModalOpen(true); // Open the modal
                      }}
                      db={db} // Pass Firestore instance
                      adminPhone={adminPhone} // Pass admin phone
                    />
                  )}

                  {activeSection === 'materials' && (
                    <div className="rounded-3xl border p-6" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                      <div className="text-xs font-bold uppercase" style={{ color: themeColors.textSecondary }}>Materials</div>
                      <div className="text-2xl font-black mt-1" style={{ color: themeColors.text }}>Upload & Manage</div>
                      <div className="text-xs mt-2" style={{ color: themeColors.textSecondary }}>This section currently uses your existing AdminPDFUploader route.</div>
                      <div className="mt-6" />
                    </div>
                  )}

                  {activeSection === 'unbanAppeals' && (
                    <UnbanAppealsInbox
                      themeColors={themeColors}
                      adminPhone={adminPhone}
                    />
                  )}

                  {activeSection === 'members' && (
                    <div className="space-y-6">

                      {/* Legacy admin-phone management remains for super admin */}
                      <div>
                        <div className="text-xs font-bold uppercase" style={{ color: themeColors.textSecondary }}>Access</div>
                        <div className="text-2xl font-black" style={{ color: themeColors.text }}>Admin Members</div>
                        <div className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>Ban enforcement is available to super admin.</div>
                      </div>

                      {isSuperAdmin ? (
                        <div className="space-y-6">
                          <div className="rounded-3xl border p-6" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                            <div className="flex items-center gap-3 flex-wrap">
                              <input
                                value={newAdminPhone}
                                onChange={(e) => setNewAdminPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="flex-1 min-w-[260px] rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-1"
                                style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)', color: themeColors.text, '--tw-ring-color': `${activeGlow}40` }}
                              />
                              <button
                                type="button"
                                onClick={onAddAdminPhone}
                                className="rounded-2xl px-4 py-3 text-sm font-black transition"
                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border, color: themeColors.text, hover: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' } }}
                              >
                                Add Admin
                              </button>
                            </div>

                            <div className="mt-5 space-y-3">
                              {adminPhones.map((p) => (
                                <div key={p} className="flex items-center justify-between rounded-2xl border px-4 py-3"
                                style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.7)' }}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl border flex items-center justify-center"
                                    style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
                                      <ShieldCheck className="w-4 h-4" style={{ color: activeGlow }} />
                                    </div>
                                    <div className="text-sm font-black" style={{ color: themeColors.text }}>{p}</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => onRemoveAdminPhone(p)}
                                    className="px-3 py-2 rounded-xl text-sm font-black border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 transition"
                                    style={{ color: isDark ? '#fecaca' : '#dc2626' }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* New user ban management table */}
                          <AdminMembersTable themeColors={themeColors} />
                        </div>
                      ) : (
                        <div className="rounded-3xl border p-10 text-center" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                          <div className="text-sm font-bold" style={{ color: themeColors.text }}>Restricted</div>
                          <div className="text-xs mt-2" style={{ color: themeColors.textSecondary }}>Only super admin can manage user bans.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === 'settings' && (
                    <div className="rounded-3xl border p-6" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                      <div className="text-xs font-bold uppercase" style={{ color: themeColors.textSecondary }}>Settings</div>
                      <div className="text-2xl font-black mt-1" style={{ color: themeColors.text }}>Theme & Preferences</div>
                      <div className="text-xs mt-2" style={{ color: themeColors.textSecondary }}>Theme toggle is available in the header.</div>
                    </div>
                  )}
                </motion.section>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({ themeColors, onToggle }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
      aria-label="Theme toggle"
      onClick={onToggle}
    >
      <span className="inline-flex items-center gap-2">
        {themeColors.isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        <span className="hidden sm:inline text-xs font-bold text-white/70">Theme</span>
      </span>
    </motion.button>
  );
}

function RowAction({
  openId,
  setOpenId,
  row,
  themeGlow,
  dropdownAnchorRef,
  onDelete,
  onToggleStatus,
  themeColors,
}) {
  const isOpen = openId === row.id;
  return (
    <div className="relative">
      <button
        type="button"
        ref={dropdownAnchorRef}
        onClick={() => setOpenId(isOpen ? null : row.id)}
        className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
        aria-label="Row actions"
      >
        <MoreVertical className="w-4 h-4" style={{ color: isOpen ? themeGlow : undefined }} />
      </button>

      <Dropdown
        open={isOpen}
        onClose={() => setOpenId(null)}
        anchorRef={dropdownAnchorRef}
        themeColors={themeColors}
      >
        <div className="py-1">
          <TableRowActionItem
            label={row.status === 'open' ? 'Close issue' : 'Re-open issue'}
            themeColors={themeColors}
            onClick={() => {
              onToggleStatus(row.id);
              setOpenId(null);
            }}
          />
          <TableRowActionItem
            label="Delete"
            themeColors={themeColors}
            danger
            onClick={() => {
              onDelete(row.id);
              setOpenId(null);
            }}
          />
        </div>
      </Dropdown>
    </div>
  );
}
