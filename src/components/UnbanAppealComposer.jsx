import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, LockKeyhole, User } from 'lucide-react';

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const [name, domain] = email.split('@');
  if (!domain) return '';
  const safeName = name.length <= 1 ? name : name[0];
  return `${safeName}***@${domain}`;
}

/**
 * Creates an unban appeal record inside a dedicated collection.
 * Admin panel must read this collection to approve/deny.
 */
export default function UnbanAppealComposer({ appealType = 'unban_request', existingAppeal = null, readOnly = false }) {
  const { currentUser, userData } = useAuth();

  const [unbanReason, setUnbanReason] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [messages, setMessages] = useState([]);
  // Keep track of the latest appeal id we've rendered follow-ups for,
  // so we can avoid showing old follow-ups after admin rejects/approves/unbans.
  const [followUpsAppealId, setFollowUpsAppealId] = useState(existingAppeal?.id || null);

  // Real-time listener for follow-up history
  useEffect(() => {
    // Whenever appeal changes (unban->ban again), clear any previous follow-up draft.
    // This prevents stale UI from the previous appeal lifecycle.
    setFollowUp('');
    const nextAppealId = existingAppeal?.id || null;
    setFollowUpsAppealId(nextAppealId);

    if (!nextAppealId) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'unbanAppeals', nextAppealId, 'followUps'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        // Ignore late snapshots if appeal changed while listener was setting up
        if (followUpsAppealId !== nextAppealId) return;
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error('Failed to load follow-ups on banned page', err);
      }
    );

    return () => unsub();
  }, [existingAppeal?.id, followUpsAppealId]);

  const { uid, accountName, emailMasked } = useMemo(() => {
    const effectiveUid = userData?.uid || userData?.id || currentUser?.uid || null;
    const name = userData?.name || userData?.displayName || 'Account';
    const effectiveEmail = userData?.email || currentUser?.email || null;
    return {
      uid: effectiveUid,
      accountName: name,
      emailMasked: maskEmail(effectiveEmail),
    };
  }, [userData, currentUser]);

  const createUnbanAppeal = async () => {
    // When the user gets unbanned then banned again, old approved/closed appeals
    // can still exist with follow-ups. For UX, always base the follow-up UI on the
    // newly created appeal.
    setMessages([]);

    if (!uid) {
      toast.error('Login/session expired. Please login again.');
      return;
    }
    if (!unbanReason.trim()) {
      toast.warn('Write a short unban request reason first.');
      return;
    }

    setSubmitting(true);
    try {
      const appealId = `UNBAN-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      await addDoc(collection(db, 'unbanAppeals'), {
        appealId,
        type: appealType,
        status: 'open',
        createdBy: uid,
        createdByName: accountName,
        createdByEmailMasked: emailMasked || null,
        createdAt: serverTimestamp(),
        reason: unbanReason.trim(),
        // audit
        lastUpdatedAt: serverTimestamp(),
      });

      setUnbanReason('');
      toast.success('Unban request submitted.');
    } catch (e) {
      console.error('Unban appeal create failed', e);
      toast.error('Could not submit unban request (permissions/rules).');
    } finally {
      setSubmitting(false);
    }
  };

  const submitFollowUp = async () => {
    const appealId = existingAppeal?.id;
    if (!uid || !appealId) return;
    if (!followUp.trim()) {
      toast.warn('Write follow-up details first.');
      return;
    }

    setSubmittingFollowUp(true);
    try {
      // Correct path: subcollection of the specific appeal
      await addDoc(collection(db, 'unbanAppeals', appealId, 'followUps'), {
        createdAt: serverTimestamp(),
        createdBy: uid,
        createdByName: accountName,
        role: 'user',
        followUp: followUp.trim(),
      });

      setFollowUp('');
      toast.success('Follow-up added (will be visible to admin).');
    } catch (e) {
      console.error('Unban follow-up failed', e);
      toast.error('Could not submit follow-up (permissions/rules).');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  return (
    <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <LockKeyhole className="w-5 h-5 text-cyan-200/80" />
        <div>
          <div className="text-xs font-black uppercase tracking-[0.3em] text-white/55">Unban Request</div>
          <div className="mt-2 text-sm sm:text-base font-semibold text-white/90">
            Ask for account reinstatement
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {!existingAppeal ? (
          <div>
            <div className="text-xs text-white/60 font-bold uppercase tracking-widest">Request Reason</div>
            <textarea
              className="mt-2 w-full rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-white outline-none focus:border-red-500/40"
              rows={4}
              value={unbanReason}
              onChange={(e) => setUnbanReason(e.target.value)}
              placeholder="Explain what happened + why you should be unbanned..."
            />
          </div>
        ) : (
          <div className={`rounded-[1.5rem] p-4 border ${
            existingAppeal.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20' :
            existingAppeal.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
            'bg-cyan-500/5 border-cyan-500/20'
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs font-black uppercase text-white/40 tracking-widest">Appeal Status</div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                existingAppeal.status === 'approved' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                existingAppeal.status === 'rejected' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
              }`}>
                {existingAppeal.status || 'Pending'}
              </span>
            </div>
            <div className="text-xs font-black uppercase text-cyan-200/60 mb-2">Original Request</div>
            <div className="text-sm text-white/80 italic">"{existingAppeal.reason}"</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-xs text-white/60 leading-relaxed">
            {existingAppeal 
              ? `Request ID: ${existingAppeal.appealId || existingAppeal.id}` 
              : 'Include your UID and account details.'}
            <div className="mt-2">
              <span className="inline-flex items-center gap-2">
                <FileText className="w-4 h-4" />
                UID: <span className="font-bold text-white/80">{uid || 'N/A'}</span>
              </span>
            </div>
            {emailMasked ? (
              <div className="mt-2">Email on record (masked): {emailMasked}</div>
            ) : null}
          </div>

          {!existingAppeal && !readOnly && (
            <motion.button
              type="button"
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="inline-flex items-center justify-center gap-2 rounded-[1.5rem] px-5 py-3 text-sm font-black border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/15 transition text-cyan-200"
              onClick={createUnbanAppeal}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit Unban Request'}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {(existingAppeal || !readOnly) && (
          <div className="rounded-[1.5rem] border border-white/10 bg-black/15 p-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-white/70" />
              <div className="text-xs font-black uppercase tracking-widest text-white/60">Follow-ups</div>
            </div>

            {/* Message History moved inside Follow-ups block */}
            {/* Redesigned Communication History */}
            {messages.length > 0 && (
              <div className="space-y-4 mt-6 mb-6 max-h-[300px] overflow-y-auto pr-3 no-scrollbar border-t border-b border-white/5 py-6">
                {messages.map((m) => (
                  <div 
                    key={m.id} 
                    className={`relative rounded-3xl p-5 border transition-all ${
                      m.role === 'admin' 
                        ? 'bg-cyan-500/10 border-cyan-500/20 ml-8' 
                        : 'bg-white/[0.03] border-white/10 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${m.role === 'admin' ? 'text-cyan-300' : 'text-white/40'}`}>
                        {m.role === 'admin' ? 'ADMIN RESPONSE' : 'YOUR FOLLOW-UP'}
                      </div>
                      <div className="text-[10px] text-white/20 font-mono">{m.createdAt?.toDate()?.toLocaleString() || 'PENDING'}</div>
                    </div>
                    <div className="text-[13px] text-white/80 leading-relaxed font-medium">{m.followUp}</div>
                  </div>
                ))}
              </div>
            )}

            {!readOnly && (
              <textarea
                className="mt-3 w-full rounded-[1.2rem] border border-white/10 bg-black/20 p-4 text-sm text-white outline-none focus:border-red-500/40"
                rows={3}
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Add extra context for admin review..."
              />
            )}
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                className="rounded-[1.5rem] px-5 py-3 text-sm font-black border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/70 disabled:opacity-50"
                onClick={submitFollowUp}
                disabled={submittingFollowUp || readOnly}
              >
                {submittingFollowUp ? 'Adding…' : 'Add Follow-up'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
