import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import {
  Activity,
  Bell,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  Users,
  Settings,
  MessageSquare,
  CircleAlert,
  Check,
  X,
  Trash2,
  Send,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  MoreVertical,
  Zap,
  Database,
  Command,
} from 'lucide-react';

import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteDoc,
} from 'firebase/firestore';

import { db } from '../../firebase';

import AdminTicketsSection from './AdminTicketsSection';
import AdminMembersTable from '../admin/AdminMembersTable';
import AdminPDFUploader from '../AdminPDFUploader';

// Note: this file is intentionally self-contained for mobile reflow.

// Desktop uses src/components/admin-ui/AdminRemadeShell.jsx unchanged.


const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function ThemeToggle({ themeColors, onToggle }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-2xl border transition px-3 py-2"
      style={{ backgroundColor: themeColors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border, color: themeColors.textSecondary }}
      aria-label="Theme toggle"
      onClick={onToggle}
    >
      <span className="inline-flex items-center gap-2">
        {themeColors.isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        <span className="text-[11px] font-bold hidden sm:inline">Theme</span>
      </span>
    </motion.button>
  );
}

function MetricCard({ icon: Icon, title, value, glow, themeColors }) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border"
      style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}
    >
      <div className="absolute -inset-20 opacity-60 blur-3xl" style={{ background: `radial-gradient(circle at 30% 20%, ${glow}, transparent 55%)` }} />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm" style={{ color: themeColors.textSecondary }}>
              <Icon className="w-5 h-5" style={{ color: glow }} />
              <span className="font-semibold">{title}</span>
            </div>
            <div className="mt-3 text-4xl font-black drop-shadow-sm tracking-tight" style={{ color: themeColors.text }}>{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileTabGrid({ tabs, activeSection, setActiveSection, themeColors }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeSection;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={
              'p-4 rounded-3xl flex flex-col items-center justify-center gap-1.5 transition-all border ' +
              (isActive
                ? 'shadow-2xl'
                : 'hover:opacity-80')
            }
            style={{
              background: isActive ? `linear-gradient(90deg, ${themeColors.primary}, rgba(168,85,247,0.95))` : undefined,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.4)',
            }}
          >
            <Icon className="w-6 h-6" style={{ color: isActive ? '#fff' : themeColors.primary }} />
            <span className="text-[9px] font-bold uppercase tracking-tight text-center">
              {tab.shortLabel ?? tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function InlineImageModal({ open, onClose, src, title, themeColors }) {
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      /> 
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="relative w-full max-w-md rounded-3xl border overflow-hidden shadow-2xl" // Removed hardcoded colors
        style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b" style={{ borderColor: themeColors.border }}>
          <div className="min-w-0">
            <div className="text-sm font-black truncate" style={{ color: themeColors.text }}>{title || 'Screenshot Preview'}</div>
            <div className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: themeColors.textSecondary }}>Tap outside or press Esc</div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="p-2 rounded-xl border" // Removed hardcoded colors
            style={{ backgroundColor: themeColors.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border, color: themeColors.textSecondary }}
            aria-label="Close image preview"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="p-4">
          {src ? (
            <img src={src} alt={title || 'Screenshot'} className="w-full max-h-[60vh] object-contain rounded-2xl border" // Removed hardcoded colors
            style={{ borderColor: themeColors.border, backgroundColor: themeColors.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)' }} />
          ) : (
            <div className="text-sm" style={{ color: themeColors.textSecondary }}>No image available.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminRemadeShellMobile({
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
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const searchRef = useRef(null);

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewSrc, setImagePreviewSrc] = useState('');
  const [imagePreviewTitle, setImagePreviewTitle] = useState('');

  // Mobile: reuse same panels by delegating to existing sections.
  const tabs = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: LayoutDashboard },
      { id: 'issues', label: 'Issues', shortLabel: 'Issues', icon: ShieldCheck },
      { id: 'unbanAppeals', label: 'Unban', shortLabel: 'Unban', icon: Users },
      { id: 'materials', label: 'Materials', shortLabel: 'Docs', icon: FileText },
      { id: 'members', label: 'Members', shortLabel: 'Admins', icon: Settings },
      { id: 'settings', label: 'Settings', shortLabel: 'Prefs', icon: Sparkles },
    ],
    []
  );

  const displayedTabs = tabs.slice(0, 6);

  const breadcrumbs = useMemo(() => {
    const map = {
      dashboard: ['Admin', 'Dashboard'],
      issues: ['Admin', 'Issues'],
      materials: ['Admin', 'Materials'],
      members: ['Admin', 'Admin Members'],
      settings: ['Admin', 'Settings'],
      unbanAppeals: ['Admin', 'Unban Appeals'],
    };
    return map[activeSection] || ['Admin', 'Dashboard'];
  }, [activeSection]);

  const activeGlow = themeColors?.primary || '#4f46e5';
  const isDark = themeColors.isDark;

  const filteredIssues = useMemo(() => {
    const q = searchValue.trim().toLowerCase();
    const safeIssues = issues || [];
    if (!q) return safeIssues;
    return safeIssues.filter((it) => {
      const title = (it.title || '').toLowerCase(); // Fallback for missing title
      const createdBy = (it.createdBy || it.createdByName || '').toLowerCase(); // Fallback for missing createdBy
      const status = (it.status || '').toLowerCase(); // Fallback for missing status
      return title.includes(q) || createdBy.includes(q) || status.includes(q);
    });
  }, [issues, searchValue]);

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ color: themeColors.text, backgroundColor: isDark ? '#0a0a0c' : '#fcfbf7' }}>
      <ToastContainer theme={isDark ? "dark" : "light"} position="top-right" autoClose={2500} hideProgressBar />

      <div className="relative min-h-screen">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full blur-3xl opacity-60"
            style={{ background: `radial-gradient(circle at 30% 30%, ${activeGlow}66 0%, transparent 60%)` }}
          />
          <div
            className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full blur-3xl opacity-50"
            style={{ background: `radial-gradient(circle at 70% 70%, ${activeGlow}33 0%, transparent 70%)` }}
          />
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(180deg, transparent, ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.05)'})` }}
            animate={{ opacity: [0.35, 0.5, 0.35] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <InlineImageModal
          open={imagePreviewOpen}
          onClose={() => setImagePreviewOpen(false)}
          src={imagePreviewSrc}
          title={imagePreviewTitle}
          themeColors={themeColors} // Pass themeColors to InlineImageModal
        />

        {/* Mobile header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="px-5 pt-6 pb-4 border-b backdrop-blur-xl"
          style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[11px]" style={{ color: themeColors.textSecondary }}>Breadcrumbs</div>
              <div className="text-sm font-semibold truncate" style={{ color: themeColors.text }}>
                {breadcrumbs.map((b, idx) => (
                  <span key={b} style={{ color: idx === breadcrumbs.length - 1 ? themeColors.text : themeColors.textSecondary }}>
                    {idx === 0 ? b : ` / ${b}`}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2" style={{ color: themeColors.textSecondary }}>
              <ThemeToggle themeColors={themeColors} onToggle={onToggleTheme} />
              <div className="hidden" />
            </div>
          </div>

          {/* Search row */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: themeColors.textSecondary }} />
            <input
              ref={searchRef}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
              className="w-full rounded-2xl border pl-11 pr-4 py-3 text-sm outline-none focus:ring-1"
              style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: themeColors.text, '--tw-ring-color': `${activeGlow}40` }}
              placeholder="Search issues..."
            />

            <AnimatePresence>
              {searchOpen && searchValue.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 mt-2 rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden"
                  style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}
                >
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="text-xs font-bold" style={{ color: themeColors.textSecondary }}>Quick Results</div>
                    <div className="text-xs" style={{ color: themeColors.textSecondary }}>{filteredIssues.length} items</div>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    {filteredIssues.slice(0, 6).map((it, idx) => (
                      <button
                        key={it.id || idx}
                        type="button"
                        className="w-full px-4 py-3 text-left transition flex items-center justify-between gap-3"
                        style={{ color: themeColors.text, backgroundColor: isDark ? 'transparent' : 'transparent', hover: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' } }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setActiveSection('issues');
                          setSearchOpen(false);
                        }}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate" style={{ color: themeColors.text }}>{it.title || 'Untitled issue'}</div>
                          <div className="text-xs truncate mt-0.5" style={{ color: themeColors.textSecondary }}>{it.createdByName || it.createdBy || ''}</div>
                        </div>
                        <div className="text-xs font-bold px-2.5 py-1 rounded-full border"
                        style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', color: themeColors.textSecondary }}>
                          {(it.status || 'open').toUpperCase()}
                        </div>
                      </button>
                    ))}
                    {filteredIssues.length === 0 && (
                      <div className="px-4 py-10 text-center text-sm font-semibold" style={{ color: themeColors.textSecondary }}>No matches.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4">
            <MobileTabGrid
              tabs={displayedTabs}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              themeColors={themeColors}
            />
          </div>
        </motion.header>

        {/* Content */}
        <div className="px-5 py-8 pb-32">
          {activeSection === 'dashboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase" style={{ color: themeColors.textSecondary }}>KPIs</div>
                  <div className="text-2xl font-black" style={{ color: themeColors.text }}>Operational Overview</div>
                </div>
                <div className="rounded-2xl border px-4 py-2 flex items-center gap-2 shadow-sm" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                  <ShieldCheck className="w-4 h-4" style={{ color: activeGlow }} />
                  <span className="text-xs font-bold" style={{ color: themeColors.textSecondary, opacity: 0.8 }}>Live</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <MetricCard icon={Users} title="Total Users" value={stats?.users ?? 0} glow={themeColors?.primary || '#4f46e5'} themeColors={themeColors} />
                <MetricCard icon={FileText} title="Materials Node" value={stats?.pdfs ?? 0} glow={'#34d399'} themeColors={themeColors} />
                <MetricCard
                  icon={Bell}
                  title="Open Issues"
                  value={stats?.issues ?? (issues || []).filter((i) => i.status === 'open').length}
                  glow={'#fb923c'}
                  themeColors={themeColors}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('issues')}
                  className="w-full rounded-[2.5rem] border p-5 text-left"
                  style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard, color: themeColors.text }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black uppercase tracking-widest" style={{ color: themeColors.text }}>Neural Thread Review</div>
                      <div className="text-[11px] mt-1" style={{ color: themeColors.textSecondary }}>Manage open support sessions</div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-30" style={{ color: themeColors.text }} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('members')}
                  className="w-full rounded-[2.5rem] border p-5 text-left"
                  style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard, color: themeColors.text }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black uppercase tracking-widest" style={{ color: themeColors.text }}>Enforcement Deck</div>
                      <div className="text-[11px] mt-1" style={{ color: themeColors.textSecondary }}>Manage node access privileges</div>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-30" style={{ color: themeColors.text }} />
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeSection === 'issues' && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: themeColors.textSecondary }}>Support</div>
                <div className="text-2xl font-black mt-1" style={{ color: themeColors.text }}>Neural Tickets</div>
              </div>
              <AdminTicketsSection themeColors={themeColors} />
            </div>
          )}

          {activeSection === 'unbanAppeals' && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: themeColors.textSecondary }}>Safety</div>
                <div className="text-2xl font-black mt-1" style={{ color: themeColors.text }}>Unban Appeals</div>
              </div>
              <div className="rounded-3xl border p-8 text-center" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: themeColors.textSecondary, opacity: 0.3 }} />
                <div className="text-sm font-bold" style={{ color: themeColors.text }}>Inbox Offline</div>
                <div className="text-xs mt-2" style={{ color: themeColors.textSecondary }}>Appeals management is currently optimized for desktop node control.</div>
              </div>
            </div>
          )}

          {activeSection === 'materials' && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest" style={{ color: themeColors.textSecondary }}>Assets</div>
                <div className="text-2xl font-black mt-1" style={{ color: themeColors.text }}>Materials Node</div>
              </div>
              <div className="rounded-3xl border overflow-hidden shadow-2xl" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                <AdminPDFUploader themeColors={themeColors} />
              </div>
            </div>
          )}

          {activeSection === 'members' && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-bold uppercase" style={{ color: themeColors.textSecondary }}>Access</div>
                <div className="text-2xl font-black" style={{ color: themeColors.text }}>Admin Members</div>
                <div className="text-xs mt-1" style={{ color: themeColors.textSecondary }}>Ban enforcement is available to super admin.</div>
              </div>

              {isSuperAdmin ? (
                <div className="space-y-6">
                  <div className="rounded-3xl border p-5" style={{ borderColor: themeColors.border, backgroundColor: themeColors.bgCard }}>
                    <div className="flex items-center gap-3">
                      <input
                        value={newAdminPhone}
                        onChange={(e) => setNewAdminPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="flex-1 rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-1"
                        style={{ borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)', color: themeColors.text, '--tw-ring-color': `${activeGlow}40` }}
                      />
                      <button
                        type="button"
                        onClick={onAddAdminPhone}
                        className="rounded-2xl px-4 py-3 text-sm font-black transition"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: themeColors.border, color: themeColors.text, hover: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' } }}
                      >
                        Add
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
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
        </div>
      </div>
    </div>
  );
}
