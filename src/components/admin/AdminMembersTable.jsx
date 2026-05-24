import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Shield, X, Ban, Eye, EyeOff, User } from 'lucide-react';

function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const [name, domain] = email.split('@');
  if (!domain) return '';
  const safeName = name.length <= 1 ? name : name[0];
  return `${safeName}***@${domain}`;
}

function BanModal({ open, onClose, user, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setError('');
    setSubmitting(false);
  }, [open]);

  const canSubmit = reason.trim().length >= 3;

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative w-full max-w-lg rounded-[2rem] border border-white/10 bg-black/60 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-300" />
              <div className="text-sm font-black uppercase tracking-[0.35em] text-red-200/80">Ban user</div>
            </div>
            <div className="mt-2 text-lg font-black text-white truncate">
              {user.name || user.displayName || 'User'}
            </div>
            <div className="text-xs text-white/60 mt-1">UID: {user.uid}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-2"
            aria-label="Close ban modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="text-xs text-white/60 font-bold uppercase tracking-[0.2em]">Reason for Ban</div>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            rows={5}
            placeholder="Enter a clear reason (required)"
            className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-white outline-none focus:border-red-500/40"
          />
          {error ? <div className="text-sm text-red-200 font-semibold">{error}</div> : null}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[1.5rem] px-4 py-3 border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/70 font-black"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={submitting || !canSubmit}
              onClick={async () => {
                if (!canSubmit) {
                  setError('Reason must be at least 3 characters.');
                  return;
                }
                setSubmitting(true);
                try {
                  await onConfirm({ reason: reason.trim() });
                  onClose();
                } catch (e) {
                  setError(e?.message || 'Ban failed.');
                } finally {
                  setSubmitting(false);
                }
              }}
              className="rounded-[1.5rem] px-6 py-3 bg-red-500/15 border border-red-500/30 hover:bg-red-500/20 transition text-red-200 font-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Banning...' : 'Confirm Ban'}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 text-xs text-white/45">
          Admin note: tokens are not revocable from the frontend. Enforcement happens instantly via realtime ban state.
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminMembersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState(null);

  const [revealedEmailUid, setRevealedEmailUid] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aB = a?.isBanned === true || Boolean(a?.ban_reason) || Boolean(a?.ban?.reason) ? 1 : 0;
      const bB = b?.isBanned === true || Boolean(b?.ban_reason) || Boolean(b?.ban?.reason) ? 1 : 0;
      // show banned first
      return bB - aB;
    });
  }, [users]);

  const effectiveBanReason = (u) => u?.ban_reason || u?.ban?.reason || u?.banReason || null;

  const setBan = async (uid, { reason }) => {
    // Validate before sending to Firestore to avoid storing empty/garbage ban reasons.
    const safeReason = String(reason || '').trim();
    if (safeReason.length < 3) {
      throw new Error('Ban reason must be at least 3 characters.');
    }

    const userRef = doc(db, 'users', uid);

    // Standardized ban schema (new) + legacy compatibility fields.
    // Firestore rules/Frontend both rely on these fields.
    await updateDoc(userRef, {
      isBanned: true,
      ban_reason: safeReason,
      banned_at: serverTimestamp(),

      // Legacy shapes used in existing code.
      'ban.reason': safeReason,
      'ban.at': serverTimestamp(),
    });

    toast.success('User banned successfully.');
  };


  const openBanModal = (u) => {
    setBanTarget({ uid: u.uid, name: u.name, email: u.email });
    setBanModalOpen(true);
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-xs font-bold text-white/60">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold text-white/55 uppercase">Members</div>
        <div className="text-2xl font-black">User Management</div>
        <div className="text-xs text-white/60 mt-1">Ban users with an auditable reason.</div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-3 grid grid-cols-[1.8fr_0.6fr_1.1fr_0.8fr_0.7fr] gap-2 text-xs font-black text-white/60 border-b border-white/10">
          <div>User</div>
          <div>UID</div>
          <div>Email</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>

        <div className="max-h-[560px] overflow-auto">
          {sortedUsers.length === 0 ? (
            <div className="p-10 text-center text-white/60 text-sm font-bold">No users found.</div>
          ) : (
            sortedUsers.map((u, idx) => {
              const banned = u?.isBanned === true || Boolean(effectiveBanReason(u));
              const badge = banned
                ? {
                    bg: 'rgba(239,68,68,0.10)',
                    border: 'rgba(239,68,68,0.25)',
                    color: '#fecaca',
                    label: 'Banned',
                  }
                : {
                    bg: 'rgba(34,197,94,0.10)',
                    border: 'rgba(34,197,94,0.25)',
                    color: '#bbf7d0',
                    label: 'Active',
                  };

              const displayName = u?.name || u?.displayName || 'User';
              const avatar = u?.pfp;

              const masked = maskEmail(u?.email);
              const canReveal = Boolean(u?.email);

              return (
                <div
                  key={u.uid}
                  className={
                    'grid grid-cols-[1.8fr_0.6fr_1.1fr_0.8fr_0.7fr] gap-2 px-5 py-4 items-center border-b border-white/10 ' +
                    (idx % 2 === 0 ? 'bg-black/10' : 'bg-black/0')
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-white/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-white/90 truncate">{displayName}</div>
                      {banned && effectiveBanReason(u) ? (
                        <div className="text-[11px] text-red-200/70 truncate max-w-[260px] mt-0.5" title={effectiveBanReason(u)}>
                          {effectiveBanReason(u)}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-xs font-black text-white/70 truncate">{u.uid}</div>

                  <div className="min-w-0">
                    <button
                      type="button"
                      disabled={!canReveal}
                      onClick={() => {
                        setRevealedEmailUid((cur) => (cur === u.uid ? null : u.uid));
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                      title={canReveal ? 'Click to reveal email' : 'No email stored'}
                    >
                      <span className="truncate">{revealedEmailUid === u.uid ? u.email : masked}</span>
                      {canReveal ? (
                        revealedEmailUid === u.uid ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />
                      ) : null}
                    </button>
                  </div>

                  <div>
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black border"
                      style={{ background: badge.bg, borderColor: badge.border, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-right">
                    {banned ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!u?.uid) return;
                          if (!window.confirm(`Unban ${displayName}?`)) return;
                          const userRef = doc(db, 'users', u.uid);
                          await updateDoc(userRef, {
                            isBanned: false,
                            ban_reason: null,
                            banned_at: null,
                            // legacy compatibility
                            'ban.reason': null,
                            'ban.at': null,
                          });
                          toast.success('User unbanned successfully.');
                        }}
                        className="rounded-xl px-3 py-2 text-xs font-black border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/70"
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openBanModal(u)}
                        disabled={false}
                        className="rounded-xl px-3 py-2 text-xs font-black border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 transition text-red-200"
                      >
                        Ban
                      </button>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      <BanModal
        open={banModalOpen}
        user={banTarget}
        onClose={() => setBanModalOpen(false)}
        onConfirm={async ({ reason }) => {
          if (!banTarget?.uid) throw new Error('Missing target UID');
          await setBan(banTarget.uid, { reason });
        }}
      />

      <div className="text-xs text-white/45 leading-relaxed">
        Masking: emails are hidden by default and only reveal on explicit click. Ban reason is required.
      </div>
    </div>
  );
}

