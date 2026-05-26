import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  User as UserIcon,
  X,
  LayoutGrid,
  List as ListIcon,
  Filter,
  Image as ImageIcon,
  MessageCircle,
  ExternalLink,
  AlertCircle,
  Inbox
} from 'lucide-react';
import AdminCreateIssueSection from './AdminCreateIssueSection';

/**
 * Remade Admin Tickets Section
 * Features high-end glassmorphism, real-time filtering, and motion-enhanced list interactions.
 */
const AdminTicketsSection = ({ 
  issues = [], 
  themeColors, 
  onToggleIssueStatus, 
  onDeleteIssue,
  onViewThread,
  db,
  adminPhone
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | open | closed
  const [showCreator, setShowCreator] = useState(false);

  // Filter logic for search and status
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const content = (issue.title + ' ' + (issue.createdBy || '') + ' ' + (issue.createdByName || '') + ' ' + (issue.complaintId || '')).toLowerCase();
      const matchesSearch = content.includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || issue.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [issues, searchTerm, filterStatus]);

  const stats = useMemo(() => ({
    total: issues.length,
    open: issues.filter(i => i.status === 'open').length,
    closed: issues.filter(i => i.status === 'closed').length,
  }), [issues]);

  return (
    <div className="space-y-6">
      {/* Header & Main Stats */}
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            Support <span style={{ color: themeColors.primaryHex || themeColors.primary }}>Terminal</span>
          </h2>
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest">
            Managing {stats.open} active transmissions from nodes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
            {[
              { id: 'all', label: 'All', count: stats.total },
              { id: 'open', label: 'Open', count: stats.open },
              { id: 'closed', label: 'Closed', count: stats.closed },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterStatus === tab.id 
                  ? 'bg-white text-black shadow-xl shadow-white/10' 
                  : 'text-white/40 hover:text-white/70'
                }`}
              >
                {tab.label} <span className="opacity-50 ml-1">({tab.count})</span>
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowCreator(!showCreator)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 hover:border-white/20 active:scale-95"
            style={{ 
              background: showCreator ? 'white' : 'rgba(255,255,255,0.05)',
              color: showCreator ? 'black' : 'white'
            }}
          >
            <Plus size={14} /> {showCreator ? 'Close Composer' : 'New Ticket'}
          </button>
        </div>
      </div>

      {/* Composer Section */}
      <AnimatePresence>
        {showCreator && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <AdminCreateIssueSection 
              db={db} 
              adminPhone={adminPhone} 
              themeColors={themeColors} 
              onCreated={() => setShowCreator(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={16} />
          <input 
            type="text"
            placeholder="Search by ID, Title, or User..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] py-4 pl-12 pr-6 text-sm text-white placeholder:text-white/20 outline-none focus:border-white/30 transition-all backdrop-blur-xl"
          />
        </div>

        <div className="flex items-center gap-2 p-2 bg-white/5 border border-white/10 rounded-[1.5rem] backdrop-blur-xl">
          <div className="flex items-center gap-2 px-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Real-time Sync</span>
          </div>
        </div>
      </div>

      {/* Tickets Grid/List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <motion.div
                layout
                key={issue.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -2 }}
                className="group relative flex flex-col p-6 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all"
              >
                {/* Top Row: Status & Meta */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                    issue.status === 'open' 
                    ? 'border-orange-500/20 bg-orange-500/10 text-orange-400' 
                    : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {issue.status || 'open'}
                  </div>
                  <div className="text-[10px] font-bold text-white/20 font-mono">
                    {issue.complaintId || issue.id.slice(0, 8)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 cursor-pointer" onClick={() => onViewThread?.(issue.id)}>
                  <h3 className="text-base font-black text-white group-hover:text-cyan-400 transition-colors uppercase italic tracking-tight mb-2 truncate">
                    {issue.title || 'Untitled Transmission'}
                  </h3>
                  <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mb-4">
                    {issue.description || 'No diagnostic report provided.'}
                  </p>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-white/40">
                        {issue.createdByName?.[0] || issue.createdBy?.[0] || '?'}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-white/80 uppercase tracking-tight">{issue.createdByName || 'Unknown Node'}</span>
                          <span className="text-[8px] font-bold text-cyan-400/60 font-mono tracking-tighter">[{issue.createdBy || 'N/A'}]</span>
                        </div>
                        <span className="text-[8px] font-bold text-white/30 uppercase mt-0.5">
                          {new Date(issue.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {issue.screenshotUrl && (
                      <button 
                        onClick={() => window.open(issue.screenshotUrl, '_blank')}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all"
                        title="View Screenshot"
                      >
                        <ImageIcon size={14} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleIssueStatus(issue.id); }}
                      className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all"
                      style={{ 
                        borderColor: issue.status === 'open' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                        color: issue.status === 'open' ? '#34d399' : 'rgba(255,255,255,0.4)',
                        background: issue.status === 'open' ? 'rgba(16,185,129,0.05)' : 'transparent'
                      }}
                    >
                      {issue.status === 'open' ? 'Resolve' : 'Re-open'}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteIssue(issue.id); }}
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full py-20 flex flex-col items-center justify-center opacity-20">
              <Inbox size={48} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">No matching transmissions found in buffer</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminTicketsSection;