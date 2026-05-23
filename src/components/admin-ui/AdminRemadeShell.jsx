import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
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
} from 'lucide-react';

import ReactDOM from 'react-dom';

import IssueThreadWindow from '../admin/IssueThreadWindow';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

import AdminCreateIssueSection from './AdminCreateIssueSection';



const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

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
        borderColor: 'rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="absolute -inset-20 opacity-60 blur-3xl"
        style={{ background: `radial-gradient(circle at 30% 20%, ${glow}, transparent 55%)` }}
      />
      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Icon className="w-5 h-5" style={{ color: glow }} />
              <span className="font-semibold">{title}</span>
            </div>
            <div className="mt-3 text-3xl font-black text-white">{value}</div>
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
            <div className="text-xs text-white/60">Live Trend</div>
            <div className="text-sm text-white/80 font-semibold mt-1">
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
        className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-black/60 overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
          <div className="min-w-0">
            <div className="text-sm font-black text-white/90 truncate">
              {title || 'Screenshot Preview'}
            </div>
            <div className="text-xs text-white/55 mt-0.5">Click outside or press Esc to close</div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
            aria-label="Close image preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {src ? (
            <img
              src={src}
              alt={title || 'Screenshot'}
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-white/10 bg-black/30"
            />
          ) : (
            <div className="text-sm text-white/60">No image available.</div>
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
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[60] w-[190px] rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TableRowActionItem({ label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'w-full text-left px-4 py-3 text-sm font-semibold transition flex items-center gap-2 ' +
        (danger
          ? 'text-red-300 hover:bg-red-500/10'
          : 'text-white/90 hover:bg-white/10')
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
}) {
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

  const filteredIssues = useMemo(() => {
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
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueThreadKey, setIssueThreadKey] = useState(0);
  const [modalIssueStatus, setModalIssueStatus] = useState(null);
  const [isTogglingIssue, setIsTogglingIssue] = useState(false);



  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState('');
  const [imagePreviewTitle, setImagePreviewTitle] = useState('');



  const activeGlow = themeColors?.primaryHex || '#4f46e5';

  const sidebarPillRef = useRef(null);
  const [pillStyle, setPillStyle] = useState({ top: 0, height: 40, opacity: 0 });

  useEffect(() => {
    const btn = sidebarPillRef.current;
    const el = document.querySelector(`[data-nav-id="${activeSection}"]`);
    if (!btn || !el) return;
    const r = el.getBoundingClientRect();
    const parentR = btn.getBoundingClientRect();
    setPillStyle({
      top: r.top - parentR.top,
      height: r.height,
      opacity: 1,
    });
  }, [activeSection, sidebarOpen]);

  return (
    <div className="min-h-screen text-white">
      <ToastContainer theme="dark" position="top-right" autoClose={2500} hideProgressBar />
      {/* sync modalIssueStatus from Firestore so button label reflects changes instantly */}
      <ModalIssueStatusSync
        issueId={selectedIssueId}
        open={isIssueModalOpen}
        db={db}
        setModalIssueStatus={setModalIssueStatus}
      />

      <div className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-60" style={{ background: `radial-gradient(circle at 30% 30%, ${activeGlow}66 0%, transparent 60%)` }} />
          <div className="absolute -bottom-60 -right-60 w-[620px] h-[620px] rounded-full blur-3xl opacity-50" style={{ background: `radial-gradient(circle at 70% 70%, ${activeGlow}33 0%, transparent 70%)` }} />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
          <motion.div
            className="absolute inset-0 opacity-40"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.75))' }}
            animate={{ opacity: [0.35, 0.5, 0.35] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="flex">
          {/* Sidebar */}
          <motion.aside
            initial={false}
            animate={{ width: sidebarOpen ? 272 : 88 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative shrink-0 z-40"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(18px)' }}
          >
            <div className="h-full border-r border-white/10">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" style={{ color: activeGlow }} />
                  </div>
                  <AnimatePresence>
                    {sidebarOpen && (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                        <div className="font-black leading-tight">Admin</div>
                        <div className="text-[11px] text-white/55 -mt-1">Command Center</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => setSidebarOpen((v) => !v)}
                  className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
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
                  className="absolute left-2 right-2 rounded-2xl bg-white/10 border border-white/15"
                  style={{ boxShadow: `0 0 0 1px ${activeGlow}22, 0 0 28px ${activeGlow}20` }}
                />

                {Object.entries(zones).map(([zoneName, items]) => (
                  <div key={zoneName} className="mt-4">
                    {sidebarOpen && <div className="px-4 text-[11px] font-bold text-white/45 uppercase">{zoneName}</div>}
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
                              'relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition z-10 ' +
                              (isActive ? 'text-white' : 'text-white/70 hover:text-white')
                            }
                            style={{
                              background: 'transparent',
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
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" style={{ color: activeGlow }} />
                      </div>
                      {sidebarOpen && (
                        <div>
                          <div className="text-xs text-white/55">Signed in</div>
                          <div className="font-black truncate text-sm">{adminPhone || 'Verified'}</div>
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
              className="sticky top-0 z-30 backdrop-blur-xl bg-black/30 border-b border-white/10"
            >
              <div className="px-5 md:px-8 py-4 flex items-center gap-4">
                <div className="min-w-[220px]">
                  <div className="text-xs text-white/45">Breadcrumbs</div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <ChevronDown className="w-4 h-4 rotate-180 opacity-0" />
                    {breadcrumbs.map((b, idx) => (
                      <span key={b} className={idx === breadcrumbs.length - 1 ? 'text-white' : 'text-white/60'}>
                        {idx === 0 ? b : ` / ${b}`}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Search */}
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/45" />
                    <input
                      ref={searchRef}
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onFocus={() => setSearchOpen(true)}
                      onBlur={() => {
                        // Delay to allow dropdown clicks if any in future.
                        setTimeout(() => setSearchOpen(false), 120);
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-28 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      placeholder="Search admins, issues, statuses..."
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="hidden md:flex items-center gap-2">
                        <span className="text-[11px] font-bold text-white/60">Ctrl</span>
                        <span className="w-7 h-6 rounded-lg border border-white/15 bg-black/30 flex items-center justify-center text-[11px] font-black">K</span>
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
                        className="absolute left-0 right-0 mt-3 rounded-2xl border border-white/10 bg-black/65 backdrop-blur-xl shadow-2xl overflow-hidden"
                      >
                        <div className="px-4 py-3 flex items-center justify-between">
                          <div className="text-xs text-white/55 font-bold">Quick Filter</div>
                          <div className="text-xs text-white/55">{visibleIssues.length} results</div>
                        </div>
                        <div className="max-h-64 overflow-auto">
                          {visibleIssues.slice(0, 6).map((it) => (
                            <button
                              key={it.id}
                              type="button"
                              className="w-full px-4 py-3 text-left hover:bg-white/10 transition flex items-center justify-between gap-3"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setActiveSection('issues');
                              }}
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-bold truncate">{it.title || 'Untitled issue'}</div>
                                <div className="text-xs text-white/55 truncate mt-0.5">
                                  {(it.createdByName || it.createdBy || '') + (it.status ? ` • ${it.status}` : '')}
                                </div>
                              </div>
                              <div
                                className="text-xs font-bold px-2.5 py-1 rounded-full border border-white/10 bg-white/5"
                              >
                                {(it.status || 'open').toUpperCase()}
                              </div>
                            </button>
                          ))}
                          {visibleIssues.length === 0 && (
                            <div className="px-4 py-8 text-center text-white/60 text-sm font-semibold">
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
                    className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2 relative"
                    onClick={() => {
                      // Mark as seen is handled below when issues are opened.
                      setActiveSection('issues');
                    }}
                    aria-label="Go to issues"
                  >
                    <span className="inline-flex items-center gap-2 relative">
                      <Bell className={`w-4 h-4 opacity-90 ${notifCount > 0 ? 'text-red-200' : ''}`} />
                      <span className="hidden sm:inline text-xs font-bold text-white/70">Alerts</span>
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
                    className="relative rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
                    aria-label="Notifications"
                  >
                    <Bell className={`w-4 h-4 ${notifBump ? 'text-white' : 'text-white/80'} transition`} />
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

                  <ThemeToggle />
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
                />

                {isIssueModalOpen && selectedIssueId && (
                  <div
                    className="fixed inset-0 z-[90] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                  >
                    <div
                      className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                      onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                          setIsIssueModalOpen(false);
                          setSelectedIssueId(null);
                        }
                      }}
                    />

                    <motion.div
                      initial={{ opacity: 0, scale: 0.98, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 6 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                      className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-black/70 overflow-hidden shadow-2xl"
                    >
                      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
                        <div className="min-w-0">
                          <div className="text-sm font-black text-white/90 truncate">
                            Ticket Thread
                          </div>
                          <div className="text-xs text-white/55 mt-0.5">Close / re-open, status history & follow-ups</div>
                        </div>
                        <div className="flex items-center gap-3">


                          <button
                            type="button"
                            disabled={!selectedIssueId || !onToggleIssueStatus}
                            onClick={async () => {
                              if (!selectedIssueId) return;
                              try {
                                await onToggleIssueStatus?.(selectedIssueId);
                                // Force re-render of IssueThreadWindow by changing its key.
                                // This ensures header/status history UI reflects updated Firestore data.
                                setIssueThreadKey((k) => k + 1);
                              } catch (e) {
                                console.error('Failed to toggle issue status', e);
                              }
                            }}
                            className="rounded-2xl px-4 py-2 text-xs font-black border border-white/10 bg-white/5 hover:bg-white/10 transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {(() => {
                              // Use live Firestore-synced status only.
                              // If not yet available, default to current issue open/closed from the latest known value.
                              const status = modalIssueStatus ?? 'open';
                              const isOpen = status !== 'closed';
                              return isOpen ? 'Close Ticket' : 'Re-open Ticket';
                            })()}

                          </button>


                          <button
                            type="button"
                            disabled={!selectedIssueId || !onDeleteIssue}
                            onClick={async () => {
                              if (!selectedIssueId) return;
                              const ok = window.confirm('Delete this ticket permanently?');
                              if (!ok) return;
                              await onDeleteIssue(selectedIssueId);
                              setIsIssueModalOpen(false);
                              setSelectedIssueId(null);
                            }}
                            className="rounded-2xl px-4 py-2 text-xs font-black border border-red-500/25 bg-red-500/10 hover:bg-red-500/15 transition text-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete Ticket
                          </button>


                          <button
                            type="button"
                            onClick={() => {
                              setIsIssueModalOpen(false);
                              setSelectedIssueId(null);
                            }}
                            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
                            aria-label="Close ticket modal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4">
                        <IssueThreadWindow
                          key={issueThreadKey}
                          issueId={selectedIssueId}
                          mode="admin"
                          themeColors={themeColors}
                          isOpen
                        />
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
                          <div className="text-xs font-bold text-white/55 uppercase">KPIs</div>
                          <div className="text-2xl font-black">Operational Overview</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 flex items-center gap-2">
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
                        />
                        <MetricCard
                          icon={FileText}
                          title="Materials"
                          value={stats?.pdfs ?? stats?.materials ?? 0}
                          trendLabel="Trend"
                          trendPct={stats?.pdfs ? 9 : -3}
                          glow={'#34d399'}
                        />
                        <MetricCard
                          icon={Bell}
                          title="Open Issues"
                          value={stats?.issues ?? (issues || []).filter((i) => i.status === 'open').length}
                          trendLabel="Trend"
                          trendPct={-7}
                          glow={'#fb923c'}
                        />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold text-white/80">Security Pulse</div>
                              <div className="text-xs text-white/60 mt-1">Status & latency signals</div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-center">
                              <Sparkles className="w-5 h-5" style={{ color: activeGlow }} />
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-3">
                            {[
                              { k: 'Auth', v: 'Pass', c: '#34d399' },
                              { k: 'DB', v: 'Sync', c: activeGlow },
                              { k: 'Queue', v: 'Nominal', c: '#60a5fa' },
                            ].map((x) => (
                              <div key={x.k} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                <div className="text-[11px] font-bold text-white/55 uppercase">{x.k}</div>
                                <div className="mt-1 font-black text-sm" style={{ color: x.c }}>{x.v}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-bold text-white/80">Action Center</div>
                              <div className="text-xs text-white/60 mt-1">Fast navigation</div>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            {[
                              { id: 'issues', label: 'Review Issues' },
                              { id: 'materials', label: 'Upload Materials' },
                              { id: 'members', label: 'Manage Members' },
                            ].map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setActiveSection(b.id)}
                                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white/80 hover:bg-white/10 transition"
                              >
                                {b.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'issues' && (
                    <div className="space-y-6">

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-xs font-bold text-white/55 uppercase">Interactive Table</div>
                          <div className="text-2xl font-black">Issues</div>
                          <div className="text-xs text-white/60 mt-1">Structured, scannable, and action-ready</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="text-xs font-bold text-white/55">Quick Add</div>
                          <div className="mt-2 flex items-center gap-3">
                            <input
                              value={newIssue}
                              onChange={(e) => setNewIssue(e.target.value)}
                              placeholder="Describe a new issue..."
                              className="w-[260px] max-w-[45vw] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/20"
                            />
                            <button
                              type="button"
                              onClick={onAddIssue}
                              disabled={!newIssue.trim()}
                              className="rounded-2xl px-4 py-3 text-sm font-black text-white bg-white/10 hover:bg-white/15 transition border border-white/15 disabled:opacity-40 disabled:hover:bg-white/10"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Create Issue for a specific user (Admin Email Complaints) */}
                      <div className="mt-2">
                        <AdminCreateIssueSection
                          db={db}
                          adminPhone={adminPhone}
                          themeColors={themeColors}
                        />
                      </div>





                      <div className="flex items-center flex-wrap gap-3">
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'open', label: 'Open' },
                          { id: 'closed', label: 'Closed' },
                        ].map((chip) => (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={() => setRowFilter(chip.id)}
                            className={
                              'rounded-full px-4 py-2 text-xs font-black border transition ' +
                              (rowFilter === chip.id
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-black/20 border-white/10 text-white/70 hover:bg-white/10')
                            }
                          >
                            {chip.label}
                          </button>
                        ))}

                        <div className="ml-auto text-xs text-white/55 font-bold">
                          {visibleIssues.length} items
                        </div>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="grid grid-cols-[1.6fr_0.7fr_0.9fr_0.6fr_0.6fr] gap-0 px-5 py-3 text-xs font-black text-white/60 border-b border-white/10">
                          <div>Issue</div>
                          <div>Status</div>
                          <div>Created By</div>
                          <div className="text-right">Actions</div>
                          <div />
                        </div>

                        <div className="max-h-[540px] overflow-auto">
                          <AnimatePresence>

                            {visibleIssues.length === 0 ? (
                              <div className="p-10 text-center">
                                <div className="text-sm font-bold text-white/70">No issues found</div>
                                <div className="text-xs text-white/50 mt-1">Try changing filters or search.</div>
                              </div>
                            ) : (
                              visibleIssues.map((it, idx) => {
                                const isOpen = it.status === 'open';
                                return (
                                  <motion.div
                                    key={it.id}
                                    initial={false}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.18, delay: idx * 0.01 }}
                                    className={
                                      'grid grid-cols-[1.6fr_0.7fr_0.9fr_0.6fr_0.6fr] px-5 py-4 items-center border-b border-white/10 ' +
                                      (idx % 2 === 0 ? 'bg-black/10' : 'bg-black/0')
                                    }
                                  >
                                    <div className="min-w-0">
                                      <div className="font-black text-sm text-white/90 truncate">{it.title || 'Untitled issue'}</div>
                                      {it.description && (
                                        <div className="text-xs text-white/55 mt-1 line-clamp-2">
                                          {it.description}
                                        </div>
                                      )}
                                      {it.screenshotUrl && (
                                        <div className="mt-2">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // open modal preview
                                              setImagePreviewSrc(it.screenshotUrl);
                                              setImagePreviewTitle(`Screenshot: ${it.title || 'Issue'}`);
                                              setImagePreviewOpen(true);
                                            }}
                                            className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white transition"
                                          >
                                            <span className="w-2 h-2 rounded-full bg-white/40" />
                                            View Screenshot
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <div>
                                      <span
                                        className={
                                          'inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black border ' +
                                          (isOpen
                                            ? 'bg-orange-400/10 border-orange-400/20 text-orange-200'
                                            : 'bg-emerald-400/10 border-emerald-400/20 text-emerald-200')
                                        }
                                      >
                                        {(it.status || 'open').toUpperCase()}
                                      </span>
                                    </div>

                                    <div className="text-xs text-white/70 font-semibold truncate">
                                      {it.createdBy ? `${it.createdBy}` : it.createdByName ? `${it.createdByName}` : ''}
                                      {it.createdByName && it.createdBy && (
                                        <div className="text-[11px] text-white/50 truncate">
                                          {it.createdByName}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex justify-end items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={!onToggleIssueStatus}
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            await onToggleIssueStatus?.(it.id);
                                          } catch (err) {
                                            console.error('Failed to toggle issue status', err);
                                          }
                                        }}
                                        className="rounded-xl px-3 py-2 text-xs font-black border border-white/10 bg-white/5 hover:bg-white/10 transition text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {it.status === 'open' ? 'Close' : 'Re-open'}
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedIssueId(it.id);
                                          setIsIssueModalOpen(true);
                                          setOpenDropdownFor(null);
                                        }}
                                        className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
                                        aria-label="Open ticket thread"
                                      >
                                        <MoreVertical className="w-4 h-4" style={{ color: themeColors?.primaryHex || activeGlow }} />
                                      </button>
                                    </div>

                                    <div className="text-right text-xs text-white/45 font-bold">
                                      <div>{it.complaintId ? `Complaint ID: ${it.complaintId}` : ''}</div>
                                    </div>
                                  </motion.div>
                                );
                              })
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'materials' && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <div className="text-xs font-bold text-white/55 uppercase">Materials</div>
                      <div className="text-2xl font-black mt-1">Upload & Manage</div>
                      <div className="text-xs text-white/60 mt-2">This section currently uses your existing AdminPDFUploader route.</div>
                      <div className="mt-6" />
                    </div>
                  )}

                  {activeSection === 'members' && (
                    <div className="space-y-6">
                      <div>
                        <div className="text-xs font-bold text-white/55 uppercase">Access</div>
                        <div className="text-2xl font-black">Admin Members</div>
                      </div>

                      {isSuperAdmin ? (
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                          <div className="flex items-center gap-3 flex-wrap">
                            <input
                              value={newAdminPhone}
                              onChange={(e) => setNewAdminPhone(e.target.value)}
                              placeholder="+91 98765 43210"
                              className="flex-1 min-w-[260px] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/20"
                            />
                            <button
                              type="button"
                              onClick={onAddAdminPhone}
                              className="rounded-2xl px-4 py-3 text-sm font-black text-white bg-white/10 hover:bg-white/15 transition border border-white/15"
                            >
                              Add Admin
                            </button>
                          </div>

                          <div className="mt-5 space-y-3">
                            {adminPhones.map((p) => (
                              <div key={p} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4" style={{ color: activeGlow }} />
                                  </div>
                                  <div className="text-sm font-black">{p}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => onRemoveAdminPhone(p)}
                                  className="px-3 py-2 rounded-xl text-sm font-black text-red-200 border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 transition"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
                          <div className="text-sm font-bold text-white/80">Restricted</div>
                          <div className="text-xs text-white/60 mt-2">Only super admin can manage admin members.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === 'settings' && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <div className="text-xs font-bold text-white/55 uppercase">Settings</div>
                      <div className="text-2xl font-black mt-1">Theme & Preferences</div>
                      <div className="text-xs text-white/60 mt-2">Theme toggle is available in the header.</div>
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

function ThemeToggle() {
  const [mode, setMode] = useState('dark');
  useEffect(() => {
    // Visual-only toggle; do not attempt to override global theme system.
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setMode(prefersDark ? 'dark' : 'light');
  }, []);

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
      aria-label="Theme toggle"
      onClick={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
    >
      <span className="inline-flex items-center gap-2">
        {mode === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
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
      >
        <div className="py-1">
          <TableRowActionItem
            label={row.status === 'open' ? 'Close issue' : 'Re-open issue'}
            onClick={() => {
              onToggleStatus(row.id);
              setOpenId(null);
            }}
          />
          <TableRowActionItem
            label="Delete"
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

