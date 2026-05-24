import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
          <div className="rounded-[1.5rem] border border-cyan-500/20 bg-cyan-500/5 p-4">
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
