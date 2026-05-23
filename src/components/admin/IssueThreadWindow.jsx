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

      if (!didInitToastRef.current) {
        didInitToastRef.current = true;
        lastNotifiedMessageIdRef.current = lastId || null;
      } else {
        if (lastId && lastId !== lastNotifiedMessageIdRef.current) {
          if (mode === 'admin') {
            const who = lastMsg?.createdByName || lastMsg?.createdBy || lastMsg?.createdByEmail || lastMsg?.from || 'User';
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

      setTimeout(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 0);
    });
    return () => unsub();
  }, [q, mode, issueId]);

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

      const rawStatusHistory = Array.isArray(data.statusHistory) ? data.statusHistory :
        Array.isArray(data.statusHistory?.items) ? data.statusHistory.items : null;

      const candidateHistory = rawStatusHistory ||
        (Array.isArray(data.history) ? data.history : null) ||
        (Array.isArray(data.statusChanges) ? data.statusChanges : null) ||
        (Array.isArray(data.complaintHistory) ? data.complaintHistory : null) ||
        (Array.isArray(data.complaint_history) ? data.complaint_history : null) ||
        (Array.isArray(data.status_history) ? data.status_history : null) ||
        (Array.isArray(data.status_history?.items) ? data.status_history.items : null) || null;

      const rawNormalized = (candidateHistory || [])
        .map((h) => {
          if (!h || typeof h !== 'object') return null;
          const status = h?.status ?? h?.newStatus ?? h?.value ?? h?.toStatus;
          const changedAt = h?.changedAt ?? h?.timestamp ?? h?.time ?? h?.changed_timestamp ?? h?.createdAt;
          const changedBy = h?.changedBy ?? h?.by ?? h?.changedByName ?? h?.changed_by ?? h?.actor;
          return { status, changedAt, changedBy };
        })
        .filter((x) => x && x.status);

      const hasAny = rawNormalized.length > 0;
      const fallback = hasAny ? null : data?.status ? [{
        status: data.status,
        changedAt: data?.updatedAt ?? data?.createdAt ?? null,
        changedBy: data?.updatedBy ?? data?.updatedByName ?? data?.createdByName ?? data?.createdBy ?? null,
      }] : null;

      let historyToUse = hasAny ? rawNormalized : (fallback || []);

      historyToUse.sort((a, b) => {
        const ta = a.changedAt?.toMillis ? a.changedAt.toMillis() : Date.parse(a.changedAt) || 0;
        const tb = b.changedAt?.toMillis ? b.changedAt.toMillis() : Date.parse(b.changedAt) || 0;
        return ta - tb;
      });

      if (!historyToUse || historyToUse.length === 0) {
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

      if (mode === 'user' && uid) {
        markSeen({ db, uid }).catch(() => {});
      }
      onThreadViewed?.();
    }, 0);

    return () => clearTimeout(t);
  }, [isOpen, mode, uid, onThreadViewed]);

  // Clean conditional termination to keep operational lifecycle light when closed
  if (!isOpen) return null;

  const userColor = isDark ? 'rgba(34,211,153,0.12)' : 'rgba(34,211,153,0.06)';
  const adminColor = isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.06)';

  const submitUserMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      try {
        await updateDoc(doc(db, 'issues', issueId), { status: 'open' });
      } catch (e) {
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

  const submitAdminMessage = async () => {
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
      className="mt-6 rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 shadow-sm"
      style={{
        borderColor: themeColors?.border || 'rgba(255,255,255,0.12)',
        background: themeColors?.bgCard || 'rgba(255,255,255,0.02)',
        height: 'min(85vh, 760px)', // The structural frame is now explicitly driven by the window root
      }}
    >
      {/* 1. Rigid Header Segment */}
      <div className="p-5 border-b shrink-0 flex flex-col gap-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest opacity-80">Ticket Thread</div>
            <div className="text-[11px] mt-0.5" style={{ color: themeColors?.textSecondary || 'rgba(255,255,255,0.6)' }}>
              {statusHistory.length > 0 ? 'Full operational history path' : 'No history updates recorded'}
            </div>
          </div>

          {statusHistory.length > 0 && (
            <div>
              {(() => {
                const latest = statusHistory[statusHistory.length - 1];
                const s = (latest?.status || '').toUpperCase();
                const isOpenStatus = s === 'OPEN';
                return (
                  <div
                    className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-colors"
                    style={{ 
                      background: isOpenStatus ? 'rgba(52,211,153,0.12)' : 'rgba(251,146,60,0.12)', 
                      border: `1px solid ${isOpenStatus ? 'rgba(52,211,153,0.25)' : 'rgba(251,146,60,0.25)'}`, 
                      color: isOpenStatus ? '#34d399' : '#fb923c' 
                    }}
                  >
                    {s}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Status Horizontal Compact Trail */}
        {statusHistory.length > 0 && (
          <div className="rounded-xl border p-3" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
            <div className="max-h-24 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {statusHistory.map((h, idx) => {
                const isLatest = idx === statusHistory.length - 1;
                const status = (h.status || '').toUpperCase();
                const changedAt = h.changedAt?.toDate?.() || (h.changedAt?.toMillis ? new Date(h.changedAt.toMillis()) : new Date(h.changedAt));
                const dateStr = changedAt && !Number.isNaN(changedAt.getTime()) ? changedAt.toLocaleString() : '';
                const isOpenStatus = status === 'OPEN';

                return (
                  <div key={idx} className="flex items-center justify-between gap-4 text-[11px]" style={{ opacity: isLatest ? 1 : 0.55 }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span style={{ color: isOpenStatus ? '#34d399' : '#fb923c', fontWeight: 600 }}>
                        [{status}]
                      </span>
                      <span className="truncate opacity-80" style={{ color: themeColors?.textSecondary || 'rgba(255,255,255,0.7)' }}>
                        {dateStr}
                      </span>
                    </div>
                    {h.changedBy && (
                      <span className="text-[10px] opacity-60 italic whitespace-nowrap">
                        by {h.changedBy}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Fluid Conversation Layer */}
      <div
        className="p-5 flex-1 overflow-y-auto space-y-4"
        ref={listRef}
        style={{ background: 'rgba(0,0,0,0.06)' }}
      >
        {messages.length === 0 ? (
          <div className="text-sm opacity-40 text-center mt-6 tracking-wide">No messages recorded in this thread.</div>
        ) : (
          messages.map((m) => {
            const isAdmin = m.role === 'admin';
            return (
              <div key={m.id} className="flex flex-col" style={{ alignItems: isAdmin ? 'flex-start' : 'flex-end' }}>
                <div
                  className="px-4 py-3 rounded-2xl border max-w-[82%] shadow-sm"
                  style={{
                    borderColor: 'rgba(255,255,255,0.06)',
                    background: isAdmin ? adminColor : userColor,
                  }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1" style={{ color: themeColors?.textSecondary || 'rgba(255,255,255,0.6)' }}>
                    {isAdmin ? 'Representative' : 'Client Action Log'}
                  </div>
                  <div className="text-sm break-words leading-relaxed" style={{ color: themeColors?.text || '#fff', whiteSpace: 'pre-wrap' }}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Rigid Input Frame */}
      <div className="p-5 border-t shrink-0 bg-black/10" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex flex-col gap-3">
          <textarea
            value={mode === 'admin' ? adminSolution : text}
            onChange={(e) => mode === 'admin' ? setAdminSolution(e.target.value) : setText(e.target.value)}
            placeholder={mode === 'admin' ? "Type admin diagnostic feedback steps..." : "Provide an internal update or message..."}
            className="w-full p-3 rounded-xl outline-none border text-sm resize-none transition-all focus:border-opacity-40"
            style={{
              borderColor: themeColors?.border || 'rgba(255,255,255,0.12)',
              background: 'rgba(0,0,0,0.25)',
              color: themeColors?.text || '#fff',
              minHeight: '80px',
            }}
          />

          <button
            onClick={mode === 'admin' ? submitAdminMessage : submitUserMessage}
            disabled={loading || (mode === 'admin' ? !adminSolution.trim() : !text.trim())}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all tracking-wide shadow-md active:scale-[0.99]"
            style={{
              background: mode === 'admin' 
                ? 'linear-gradient(90deg, rgba(168,85,247,0.9), rgba(6,182,212,0.85))'
                : 'linear-gradient(90deg, rgba(34,211,153,0.9), rgba(251,146,60,0.85))',
              color: isDark ? '#000' : '#fff',
              opacity: loading || (mode === 'admin' ? !adminSolution.trim() : !text.trim()) ? 0.35 : 1,
            }}
          >
            {loading ? 'Processing transaction...' : mode === 'admin' ? 'Dispatch Response to Client' : 'Dispatch Update Wire'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueThreadWindow;