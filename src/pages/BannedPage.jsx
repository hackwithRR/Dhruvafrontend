import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ShieldX,
  Mail,
  User,
  FileText,
  LockKeyhole,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import UnbanAppealComposer from '../components/UnbanAppealComposer';
import { db } from '../firebase';
import { doc, getDoc, onSnapshot, query, collection, where, orderBy, limit } from 'firebase/firestore';
import LoadingOverlay from '../components/LoadingOverlay';


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
  const { userData, currentUser, loading } = useAuth();
  
  const [viewingUser, setViewingUser] = useState(null);
  const [pageLoading, setPageLoading] = useState(!!targetUid);
  const [existingAppeal, setExistingAppeal] = useState(null);

  // Check if current user is admin
  const isAdmin = useMemo(() => {
    const phone = currentUser?.phoneNumber;
    return phone && ['+919148860082', '+919123456789'].includes(phone);
  }, [currentUser]);

  // Logic to fetch the "target" user data if an admin is reviewing
  useEffect(() => {
    if (!targetUid || !isAdmin) {
      setViewingUser(userData);
      setPageLoading(false);
      return;
    }

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

    const q = query(
      collection(db, 'unbanAppeals'),
      where('createdBy', '==', uid),
      where('status', '==', 'open'),
      limit(1)
    );
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setExistingAppeal({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setExistingAppeal(null);
    });
  }, [targetUid, currentUser]);

  const banReason = viewingUser?.banReason || viewingUser?.ban_reason || viewingUser?.ban?.reason || 'No specific reason provided.';
  const displayUid = viewingUser?.uid || viewingUser?.id || targetUid || 'N/A';
  const accountName = viewingUser?.name || viewingUser?.displayName || 'Account';
  const emailMasked = maskEmail(viewingUser?.email);

  if (pageLoading || loading) return <LoadingOverlay duration={1000} theme="DeepSpace" />;



  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="relative w-full max-w-4xl">
        {/* backdrop */}
        <div className="absolute inset-0 -z-10 rounded-[3rem] bg-gradient-to-br from-red-500/15 via-white/[0.02] to-cyan-500/10 blur-0 border border-white/10" />

        <div className="relative rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_0_120px_rgba(239,68,68,0.15)] p-6 sm:p-10 md:p-12 overflow-hidden">
          {/* header */}
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-[1.2rem] border border-red-500/30 bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-300" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.35em] text-red-200/80">
                  <ShieldX className="w-4 h-4" />
                  ACCOUNT STATUS
                </div>
                <h1 className="mt-3 text-[clamp(24px,4vw,38px)] font-black tracking-tight leading-none">
                  {isAdmin 
                    ? `Reviewing: ${accountName}` 
                    : 'Your Account Has Been Suspended'}
                </h1>
                <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed">
                  You’ve been blocked from using the application due to a policy violation.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 inline-flex items-center gap-3">
              <Sparkles className="w-4 h-4" style={{ color: '#60a5fa' }} />
              <div>
                <div className="text-xs font-black uppercase tracking-[0.3em] text-white/55">Review Window</div>
                <div className="text-sm font-bold text-white/85">Appeals are processed by admin review</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {/* left column: ban details */}
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <LockKeyhole className="w-5 h-5 text-cyan-200/80" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.3em] text-white/55">Ban Reason</div>
                      <div className="mt-2 text-sm sm:text-base font-semibold text-white/90">
                        {banReason}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-white/60">
                  {displayUid ? (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span className="font-bold text-white/80">UID:</span> {displayUid}
                    </div>
                  ) : (
                    <div className="text-white/60">UID will be shown once available.</div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
                <div className="text-xs font-black uppercase tracking-[0.3em] text-white/55">The Review Process</div>

                <div className="mt-4 space-y-3">
                  {[
                    { t: 'Submit your unban request', d: 'Explain what happened and why you should be reinstated.' },
                    { t: 'Admin reviews evidence', d: 'We cross-check policy + your context.' },
                    { t: 'Decision + follow-up', d: 'If needed, admins will ask for extra details.' },
                  ].map((x, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white/90">{x.t}</div>
                        <div className="text-xs text-white/60 mt-1 leading-relaxed">{x.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* right column: appeal composer */}
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6 overflow-hidden">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-red-200/80" />
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.3em] text-white/55">Appeal</div>
                    <div className="mt-2 text-sm sm:text-base font-semibold text-white/90">Request reinstatement from admin</div>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <div className="text-xs text-white/60 leading-relaxed">
                    Include <span className="font-bold text-white/80">your UID</span> and <span className="font-bold text-white/80">account name</span> for faster processing.
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Account: <span className="font-bold text-white/80">{accountName}</span>
                      </span>
                    </div>
                    {emailMasked ? (
                      <div className="mt-2">Email on record (masked): {emailMasked}</div>
                    ) : null}
                  </div>
                </div>

                {!isAdmin && (
                  <div className="mt-4">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-[1.5rem] px-5 py-3 text-sm font-black border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 transition text-red-200 w-full sm:w-auto"
                      onClick={() => navigate('/cimplaint')}
                    >
                      Appeal Ban (CIM Plaint)
                      <motion.span
                        whileHover={{ x: 3 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-[1.5rem] px-5 py-3 text-sm font-black border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/15 transition text-cyan-200 w-full sm:w-auto"
                      onClick={() => {
                        const el = document.getElementById('unban-composer');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      Unban Request
                      <motion.span
                        whileHover={{ x: 3 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </motion.span>
                    </button>
                  </div>
                  </div>
                )}

                <div className="mt-6" id="unban-composer" />
                <UnbanAppealComposer 
                  appealType="unban_request" 
                  existingAppeal={existingAppeal} 
                  readOnly={isAdmin}
                />

                {existingAppeal && !isAdmin && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-cyan-300 font-bold mt-4 flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Your unban request is currently under active review.
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              className="rounded-[1.5rem] px-4 py-2 text-xs font-black border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/70"
              onClick={() => {
                if (isAdmin) navigate('/admin');
                else navigate('/login');
              }}
            >
              {isAdmin ? 'Back to Admin' : 'Return to Login'}
            </button>
            <div className="text-xs text-white/40 font-bold">Ban enforced: real-time policy state</div>
          </div>
        </div>
      </div>
    </div>
  );
}
