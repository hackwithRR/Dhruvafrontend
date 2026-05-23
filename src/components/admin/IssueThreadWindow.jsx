import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

import { db } from '../../firebase';
import { markSeen } from '../../utils/ticketNotifications';
import { useAuth } from '../../context/AuthContext';


const IssueThreadWindow = ({
  issueId,
  mode = 'admin',
  themeColors,
  isOpen,
  onThreadViewed,
}) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [adminSolution, setAdminSolution] = useState('');
  const [loading, setLoading] = useState(false);

  const [statusHistory, setStatusHistory] = useState([]);
  const [issueMeta, setIssueMeta] = useState(null);

  // Keep a resilient copy for older documents that may not store statusHistory
  // in the expected shape.
  const [fallbackStatus, setFallbackStatus] = useState(null);



  const listRef = useRef(null);

  const didInitToastRef = useRef(false);
  const lastNotifiedMessageIdRef = useRef(null);

  const { currentUser } = useAuth?.() || {};
  const uid = currentUser?.uid;
  const isDark = !!themeColors?.isDark;


  const q = useMemo(() => {
    if (!issueId) return null;
    return query(
      collection(db, 'issues', issueId, 'messages'),
      orderBy('createdAt', 'asc')
    );
  }, [issueId]);

  useEffect(() => {
    if (!q) return;
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(list);

      const lastMsg = list[list.length - 1];
      const lastId = lastMsg?.id;

      // toast only after first snapshot to avoid spam on open
      if (!didInitToastRef.current) {
        didInitToastRef.current = true;
        lastNotifiedMessageIdRef.current = lastId || null;
      } else {
        // If we received a new message (based on newest doc id), notify admins.
        // This is the most reliable trigger given Firestore snapshots.
        if (lastId && lastId !== lastNotifiedMessageIdRef.current) {
          // Show toast on ANY newly appended message so we can confirm alerts work.
          // (User info is still displayed from createdBy fields on the message.)
          if (mode === 'admin') {
            const who =
              lastMsg?.createdByName ||
              lastMsg?.createdBy ||
              lastMsg?.createdByEmail ||
              lastMsg?.from ||
              'User';

            const role = lastMsg?.role ? String(lastMsg.role).toUpperCase() : 'MESSAGE';
            toast.info(`New ${role.toLowerCase()} message from ${who}`, {
              position: 'top-right',
              autoClose: 5000,
              hideProgressBar: true,
              onClick: () => {
                const el = document.getElementById('ticket-thread-' + issueId);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              },
            });
          }


          lastNotifiedMessageIdRef.current = lastId;
        }
      }


      // autoscroll to bottom
      setTimeout(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 0);
    });
    return () => unsub();
  }, [q, mode]);

  // Fetch ticket history from parent issue doc.
  // Admin panel used to show history even when older documents didn't store `statusHistory`
  // in the exact same structure, so we normalize multiple possible shapes.
  useEffect(() => {
    if (!issueId) return;

    const issueRef = doc(db, 'issues', issueId);
    const unsub = onSnapshot(issueRef, (snap) => {
      if (!snap.exists()) {
        setIssueMeta(null);
        setStatusHistory([]);
        setFallbackStatus(null);
        return;
      }

      const data = snap.data() || {};
      setIssueMeta(data);

      // 1) Preferred: `statusHistory: [{ status, changedAt, changedBy }]`
      const rawStatusHistory = Array.isArray(data.statusHistory) ? data.statusHistory :
        Array.isArray(data.statusHistory?.items) ? data.statusHistory.items :
        null;

      // 2) Legacy / alternative shapes (best-effort):
      // - history: [{ status, changedAt, changedBy }]
      // - statusChanges: [{ newStatus, timestamp, by }]
      // - complaintHistory / complaint_history
      // - status_history / status_history.items
      const candidateHistory =
        rawStatusHistory ||
        (Array.isArray(data.history) ? data.history : null) ||
        (Array.isArray(data.statusChanges) ? data.statusChanges : null) ||
        (Array.isArray(data.complaintHistory) ? data.complaintHistory : null) ||
        (Array.isArray(data.complaint_history) ? data.complaint_history : null) ||
        (Array.isArray(data.status_history) ? data.status_history : null) ||
        (Array.isArray(data.status_history?.items) ? data.status_history.items : null) ||
        null;

      const rawNormalized = (candidateHistory || [])
        .map((h) => {
          if (!h || typeof h !== 'object') return null;

          // Support multiple key names
          const status = h?.status ?? h?.newStatus ?? h?.value ?? h?.toStatus;
          const changedAt = h?.changedAt ?? h?.timestamp ?? h?.time ?? h?.changed_timestamp ?? h?.createdAt;
          const changedBy = h?.changedBy ?? h?.by ?? h?.changedByName ?? h?.changed_by ?? h?.actor;

          return { status, changedAt, changedBy };
        })
        .filter((x) => x && x.status);

      // If nothing matches, fall back to current issue status so user still sees something.
      const hasAny = rawNormalized.length > 0;

      // IMPORTANT: also handle cases where legacy docs only have {status, createdAt/updatedAt}
      const fallback = hasAny
        ? null
        : data?.status
          ? [{
              status: data.status,
              changedAt: data?.updatedAt ?? data?.createdAt ?? null,
              changedBy:
                data?.updatedBy ??
                data?.updatedByName ??
                data?.createdByName ??
                data?.createdBy ??
                null,
            }]
          : null;

      let historyToUse = hasAny ? rawNormalized : (fallback || []);

      // sort oldest -> newest
      historyToUse.sort((a, b) => {
        const ta = a.changedAt?.toMillis ? a.changedAt.toMillis() : Date.parse(a.changedAt) || 0;
        const tb = b.changedAt?.toMillis ? b.changedAt.toMillis() : Date.parse(b.changedAt) || 0;
        return ta - tb;
      });

      // If we still ended up with nothing, show an ultra-minimal history
      // derived from issue doc status (if exists) or messages (best-effort, conservative).
      if (!historyToUse || historyToUse.length === 0) {
        // Keep it conservative: only add if we have a status field.
        if (data?.status) {
          historyToUse = [{
            status: data.status,
            changedAt: data?.updatedAt ?? data?.createdAt ?? null,
            changedBy: data?.updatedBy ?? data?.createdByName ?? data?.createdBy ?? null,
          }];
        }
      }

      setFallbackStatus(fallback);
      setStatusHistory(historyToUse || []);
    });

    return () => unsub();
  }, [issueId]);



  useEffect(() => {
    if (!isOpen) return;

    const t = setTimeout(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;

      // Mark user notifications as seen when they open/read their ticket threads.
      if (mode === 'user' && uid) {
        markSeen({ db, uid }).catch(() => {});
      }

      onThreadViewed?.();
    }, 0);

    return () => clearTimeout(t);
  }, [isOpen, mode, uid, onThreadViewed]);

  const bubbleStyle = {
    borderColor: themeColors?.border || 'rgba(255,255,255,0.15)',
  };

  const userColor = isDark ? 'rgba(34,211,153,0.18)' : 'rgba(34,211,153,0.10)';
  const adminColor = isDark ? 'rgba(168,85,247,0.18)' : 'rgba(168,85,247,0.10)';

  const submitUserMessage = async () => {
    // Auto-reopen on user follow-up
    // If ticket is closed, switch it back to open.
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      // Always attempt reopen.
      // If reopen fails, we still send the message so user doesn't get stuck.
      try {
        await updateDoc(doc(db, 'issues', issueId), { status: 'open' });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[IssueThreadWindow] reopen failed (non-fatal):', e?.code || e?.message || e);
      }

      await addDoc(collection(db, 'issues', issueId, 'messages'), {
        role: 'user',
        text: trimmed,
        screenshotUrl: null,
        createdAt: serverTimestamp(),
      });

      setText('');
    } finally {
      setLoading(false);
    }
  };

  // Admin: send as admin message (two-sided)
  const submitAdminMessage = async () => {
    // Admin messages do not auto-close. Close is handled separately via issue fields/buttons.
    
    const payloadText = adminSolution?.trim();
    if (!payloadText) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'issues', issueId, 'messages'), {
        role: 'admin',
        text: payloadText,
        screenshotUrl: null,
        createdAt: serverTimestamp(),
      });
      setAdminSolution('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id={'ticket-thread-' + issueId}
      className="mt-4 rounded-2xl border"
      style={{
        borderColor: themeColors?.border || 'rgba(255,255,255,0.15)',
        background: themeColors?.bgCard || 'rgba(255,255,255,0.03)',
        display: isOpen ? 'block' : 'none',
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-70">Ticket Thread</div>
            <div className="text-[10px] opacity-70" style={{ color: themeColors?.textSecondary || 'rgba(255,255,255,0.7)' }}>
              {statusHistory.length > 0 ? 'Status trail is shown below' : 'No status history available yet'}
            </div>
          </div>

          {statusHistory.length > 0 && (
            <div className="shrink-0">
              {(() => {
                const latest = statusHistory[statusHistory.length - 1];
                const s = (latest?.status || '').toUpperCase();
                const badgeBg = s === 'OPEN' ? 'rgba(52,211,153,0.16)' : 'rgba(251,146,60,0.18)';
                const badgeBorder = s === 'OPEN' ? 'rgba(52,211,153,0.35)' : 'rgba(251,146,60,0.35)';
                const badgeColor = s === 'OPEN' ? '#34d399' : '#fb923c';
                return (
                  <div
                    className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
                    style={{ background: badgeBg, border: `1px solid ${badgeBorder}`, color: badgeColor }}
                    title="Latest ticket status"
                  >
                    {s || 'UNKNOWN'}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {statusHistory.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Status History</div>

            <div className="mt-2 rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.08)' }}>
              <div className="max-h-32 overflow-y-auto pr-1 py-2 space-y-2">
                {statusHistory.map((h, idx) => {
                  const isLatest = idx === statusHistory.length - 1;
                  const status = (h.status || '').toUpperCase();
                  const changedAt =
                    h.changedAt?.toDate?.() ||
                    (h.changedAt?.toMillis ? new Date(h.changedAt.toMillis()) : new Date(h.changedAt));
                  const dateStr = changedAt && !Number.isNaN(changedAt.getTime())
                    ? changedAt.toLocaleString()
                    : '';

                  const badgeBg = status === 'OPEN'
                    ? 'rgba(52,211,153,0.16)'
                    : 'rgba(251,146,60,0.18)';
                  const badgeBorder = status === 'OPEN'
                    ? 'rgba(52,211,153,0.35)'
                    : 'rgba(251,146,60,0.35)';
                  const badgeColor = status === 'OPEN'
                    ? '#34d399'
                    : '#fb923c';

                  return (
                    <div
                      key={`${h.changedAt?.toString?.() || idx}-${idx}`}
                      className="px-3 flex items-start justify-between gap-3"
                      style={{ opacity: isLatest ? 1 : 0.92 }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
                          style={{
                            background: badgeBg,
                            border: `1px solid ${badgeBorder}`,
                            color: badgeColor,
                          }}
                        >
                          {status}
                        </div>
                        <div
                          className="text-[10px] opacity-75 truncate"
                          style={{ color: themeColors?.textSecondary || 'rgba(255,255,255,0.7)', maxWidth: 220 }}
                        >
                          {dateStr}
                        </div>
                      </div>

                      {h.changedBy && (
                        <div
                          className="text-[10px] opacity-60 whitespace-nowrap"
                          style={{ color: themeColors?.textSecondary || 'rgba(255,255,255,0.7)' }}
                        >
                          {`by ${h.changedBy}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Thread body: keep composer pinned and make messages the only scroll area */}
      <div className="flex flex-col" style={{ height: 'min(80vh, 720px)' }}>

        <div
          className="p-4 flex-1 overflow-y-auto"
          ref={listRef}
          style={{ background: 'rgba(0,0,0,0.10)' }}
        >
          {messages.length === 0 ? (
            <div className="text-sm opacity-60">No messages yet.</div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => {
                const isAdmin = m.role === 'admin';
                return (
                  <div
                    key={m.id}
                    className="flex"
                    style={{ justifyContent: isAdmin ? 'flex-start' : 'flex-end' }}
                  >
                    <div
                      className="px-4 py-3 rounded-2xl border"
                      style={{
                        borderColor: 'rgba(255,255,255,0.12)',
                        background: isAdmin ? adminColor : userColor,
                        maxWidth: '92%',
                      }}
                    >
                      <div
                        className="text-[11px] font-bold uppercase tracking-widest opacity-70"
                        style={{
                          color: themeColors?.textSecondary || 'rgba(255,255,255,0.7)',
                          marginBottom: 6,
                        }}
                      >
                        {isAdmin ? 'Admin' : 'User'}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: themeColors?.text || '#fff', whiteSpace: 'pre-wrap' }}
                      >
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Composer */}
        {mode === 'admin' ? (
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
            <div className="flex flex-col gap-3">
              <textarea
                value={adminSolution}
                onChange={(e) => setAdminSolution(e.target.value)}
                placeholder="Admin reply / solution description..."
                className="w-full p-3 rounded-xl outline-none border"
                style={{
                  borderColor: themeColors?.border || 'rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.03)',
                  color: themeColors?.text || '#fff',
                  minHeight: 80,
                }}
              />

              <button
                onClick={submitAdminMessage}
                disabled={loading || !adminSolution.trim()}
                className="px-4 py-3 rounded-xl font-bold text-sm"
                style={{
                  background: 'linear-gradient(90deg, rgba(168,85,247,0.9), rgba(6,182,212,0.85))',
                  color: isDark ? '#000' : '#fff',
                  opacity: loading || !adminSolution.trim() ? 0.6 : 1,
                }}
              >
                {loading ? 'Sending...' : 'Post Admin Reply'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.10)' }}>
            <div className="flex flex-col gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your follow-up / message..."
                className="w-full p-3 rounded-xl outline-none border"
                style={{
                  borderColor: themeColors?.border || 'rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.03)',
                  color: themeColors?.text || '#fff',
                  minHeight: 70,
                }}
              />

              <button
                onClick={submitUserMessage}
                disabled={loading || !text.trim()}
                className="px-4 py-3 rounded-xl font-bold text-sm"
                style={{
                  background: 'linear-gradient(90deg, rgba(34,211,153,0.9), rgba(251,146,60,0.85))',
                  color: isDark ? '#000' : '#fff',
                  opacity: loading || !text.trim() ? 0.6 : 1,
                }}
              >
                {loading ? 'Sending...' : 'Send Follow-up'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueThreadWindow;

