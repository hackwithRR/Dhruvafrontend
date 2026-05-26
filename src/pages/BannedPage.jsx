import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  TriangleAlert,
  ShieldX,
  Mail,
  User,
  LockKeyhole,
  CircleCheckBig,
  ArrowRight,
  Sparkles,
  Terminal,
  Activity,
  History,
  ArrowLeft
} from 'lucide-react';
import UnbanAppealComposer from '../components/UnbanAppealComposer';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, query, collection, where } from 'firebase/firestore';
import ThemeAwareLoader from '../components/ThemeAwareLoader';


function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const [name, domain] = email.split('@');
  if (!domain) return '';
  const safeName = name.length <= 1 ? name : name[0];
  return `${safeName}***@${domain}`;
}

export default function BannedPage() {
  const [searchParams] = useSearchParams();
  const targetUid = searchParams.get('uid');
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  
  const [viewingUser, setViewingUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [existingAppeal, setExistingAppeal] = useState(null);

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    const phone = currentUser?.phoneNumber;
    return phone && ['+919148860082', '+919123456789', '+919876543210'].includes(phone);
  }, [currentUser]);

  // Logic to fetch the "target" user data if an admin is reviewing
  useEffect(() => {
    if (!targetUid || !isAdmin) {
      setViewingUser(userData);
      return;
    }

    setPageLoading(true);
    const fetchTarget = async () => {
      try {
        const docRef = doc(db, 'users', targetUid);
        const snap = await getDoc(docRef);
        if (snap.exists()) setViewingUser(snap.data());
      } catch (err) {
        console.error('Failed to fetch user for review:', err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchTarget();
  }, [targetUid, isAdmin, userData]);

  // Fetch latest open appeal for the viewing user
  useEffect(() => {
    const uid = targetUid || currentUser?.uid;
    if (!uid) return;

    // Fetch most recent appeal for the user regardless of status so history persists
    const q = query(
      collection(db, 'unbanAppeals'),
      where('createdBy', '==', uid)
    );
    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Client-side sort to avoid index requirement for simple user check
        all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        // UX requirement: after unban (or when a new appeal is created), we must show the latest
        // appeal lifecycle, not the last historical approved one.
        // Fresh-state rule:
        // - Prefer the newest OPEN appeal (current lifecycle)
        // - If none OPEN exist, DO NOT fall back to historical approved/rejected/closed appeals,
        //   because unban should reset the user experience to a fresh thread.
        const newestOpen = all.find((a) => a?.status === 'open') || null;
        setExistingAppeal(newestOpen);
      } else {
        setExistingAppeal(null);
      }
    });
  }, [targetUid, currentUser]);

  // Prefer the admin-target viewingUser (when ?uid=...), otherwise fall back to current user's AuthContext userData.
  // This prevents blank/flicker cases during realtime/loading + handles multiple legacy shapes.
  const effectiveUser = viewingUser || userData || null;

  const banReason =
    effectiveUser?.banReason ||
    effectiveUser?.ban_reason ||
    effectiveUser?.ban?.reason ||
    'No specific reason provided.';

  const displayUid = effectiveUser?.uid || effectiveUser?.id || targetUid || 'N/A';
  const accountName = effectiveUser?.name || effectiveUser?.displayName || 'Account';
  const emailMasked = maskEmail(effectiveUser?.email);

  // Gate UI until we have either admin fetch finished OR we have userData available for non-admin flows.
  // (prevents "reason not showing" due to transient null viewingUser)
  const shouldBlockRender = pageLoading || (!targetUid && !effectiveUser);
  if (shouldBlockRender) return <ThemeAwareLoader />;




  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black relative overflow-hidden">
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-red-900/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-cyan-900/20 blur-[120px]" 
        />
      </div>

      {/* Terminal Grid Overlay */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ 
        backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <div className="relative w-full max-w-5xl z-10">
        {/* Main Bento Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Header Card (Span 12) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-12 rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-3xl p-6 md:p-10 overflow-hidden shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Terminal size={120} />
            </div>
            
            <div className="flex items-start justify-between gap-6 flex-wrap relative z-10">
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-14 h-14 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-center">
                  <TriangleAlert className="w-7 h-7 text-red-400" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-red-400/80">
                    <ShieldX className="w-3 h-3" />
                    SECURITY_LOCKDOWN
                  </div>
                  <h1 className="mt-3 text-[clamp(24px,5vw,48px)] font-black tracking-tighter leading-tight text-white uppercase italic">
                    {isAdmin ? `REVIEW_NODE: ${accountName}` : 'TERMINAL_ACCESS_REVOKED'}
                  </h1>
                  <p className="mt-4 text-sm md:text-base text-white/50 font-medium max-w-2xl leading-relaxed">
                    Account identification <span className="text-white/80">{displayUid}</span> is currently suspended due to automated policy enforcement protocols.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 inline-flex items-center gap-4 backdrop-blur-md">
                <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">Uptime Status</div>
                  <div className="text-xs font-bold text-white/80">Admin review window open</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Left Column: Stats & Process (Span 5) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-8 shadow-xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <LockKeyhole className="w-6 h-6 text-red-400" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Violation_Logs</h3>
              </div>
              
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 shadow-inner">
                <p className="text-lg font-bold text-white/90 italic leading-relaxed">
                  "{banReason}"
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <div className="flex items-center gap-2"><User size={12} /> ID_HASH</div>
                  <span className="text-white/60 font-mono">{displayUid}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/30">
                  <div className="flex items-center gap-2"><Mail size={12} /> MASKED_UPLINK</div>
                  <span className="text-white/60 font-mono">{emailMasked || 'N/A'}</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <History className="w-6 h-6 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Recovery_Sequence</h3>
              </div>
              <div className="space-y-4">
                {[
                  { t: 'Submit unban request', d: 'Provide context for policy bypass.' },
                  { t: 'Evidence analysis', d: 'Admins evaluate neural behavior.' },
                  { t: 'Uplink Restoration', d: 'Decision based on verification.' },
                ].map((x, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CircleCheckBig className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white uppercase tracking-wider">{x.t}</div>
                      <div className="text-[10px] text-white/40 mt-1 uppercase font-bold">{x.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Appeal Node (Span 7) */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-7 rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl p-6 md:p-10 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                  <Mail className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/90">Appeal_Uplink</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Request core reinstatement</p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <UnbanAppealComposer 
                appealType="unban_request" 
                existingAppeal={existingAppeal} 
                readOnly={isAdmin}
              />
              {existingAppeal && !isAdmin && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex items-center gap-3"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                    Neural request transmitted. Waiting for admin authorization.
                  </span>
                </motion.div>
              )}
            </div>
            {!isAdmin && (
              <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/cimplaint')}
                  className="flex-1 group relative overflow-hidden py-4 rounded-2xl bg-red-600/10 border border-red-500/30 text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
                >
                  Email Support (CIM)
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Global Footer Controls */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <button
            type="button"
            onClick={() => isAdmin ? navigate('/admin') : navigate('/login')}
            className="group flex items-center gap-3 px-8 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all shadow-xl backdrop-blur-md"
          >
            <ArrowLeft className="text-white/40 group-hover:text-white group-hover:-translate-x-1 transition-all" size={12} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 group-hover:text-white">
              {isAdmin ? 'TERMINATE_SESSION' : 'RETURN_TO_LOGIN'}
            </span>
          </button>
        </motion.div>
      </div>
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]">
        <div className="w-full h-1 bg-white absolute top-0 animate-scan" />
      </div>
    </div>
  );
}
