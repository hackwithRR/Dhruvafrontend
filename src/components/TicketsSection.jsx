import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, where } from 'firebase/firestore';
import { toast } from 'react-toastify';

import IssueThreadWindow from './admin/IssueThreadWindow';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';


/**
 * User-side tickets:
 * - Create: issues/{issueId}
 * - Messages: issues/{issueId}/messages (handled by IssueThreadWindow)
 */
const TicketsSection = ({
  id,
  themeColors,
  currentUser,
  db,
  serverTimestamp: _serverTimestampProp, // keep compatibility if passed
  IssueThreadWindow: IssueThreadWindowProp, // keep compatibility if passed
}) => {
  const IssueThreadWindowToUse = IssueThreadWindowProp || IssueThreadWindow;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  const userId = currentUser?.uid;

  const issuesQuery = useMemo(() => {
    if (!db || !userId) return null;

    // Fetch only this user's tickets.
    // If your Firestore console reports a missing index for this query,
    // click the provided link and create the index (this is required for the query to run).
    //
    // Query shape: where(createdBy == userId) + orderBy(createdAt desc)
    return query(
      collection(db, 'issues'),
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [db, userId]);



  useEffect(() => {
    if (!issuesQuery) return;
    const unsub = onSnapshot(issuesQuery, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Debug help: verify createdBy matches current uid.
      // Remove later if you want.
      // eslint-disable-next-line no-console
      console.log('[TicketsSection] userId=', userId, 'totalIssues=', all.length, 'sampleCreatedBy=', all[0]?.createdBy);

      setIssues(all.filter((x) => x.createdBy === userId));
    });
    return () => unsub();
  }, [issuesQuery, userId]);

  const handleCreate = async () => {
    if (!userId) return;
    if (!title.trim()) return;
    if (!description.trim()) return;

    setLoading(true);
    try {
      const createdAtTs = _serverTimestampProp || serverTimestamp();
      // Create a user-friendly complaintId (used by Admin UI)
      // Example: CMP-jJB3-MPB8PBYG
      const complaintId = `CMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      await addDoc(collection(db, 'issues'), {
        complaintId,
        title: title.trim(),
        description: description.trim(),
        screenshotUrl: screenshotUrl || null,
        status: 'open',
        createdBy: userId,
        createdByName: currentUser?.displayName || currentUser?.email || 'User',
        createdAt: typeof createdAtTs === 'function' ? createdAtTs() : createdAtTs,
        // optional: keep a normalized history for thread UI
        // Firestore cannot store serverTimestamp() inside arrays in some SDK/configs.
        // Keep statusHistory optional for legacy UI; store it later if needed.
        statusHistory: [],
      });

      // Visible feedback.
      // Profile page already mounts <ToastContainer>, so toast will render there.
      toast.success?.('Ticket submitted successfully.');


      setTitle('');
      setDescription('');
      setScreenshotUrl('');
    } finally {
      setLoading(false);
    }
  };

  const theme = themeColors || {};
  const [openIssueId, setOpenIssueId] = useState(null);

  return (
    <div id={id} className="mt-6">
      <div className="rounded-3xl p-6 border" style={{ borderColor: theme.border || 'rgba(255,255,255,0.15)', background: theme.card || 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="text-lg font-black uppercase tracking-wide" style={{ color: theme.text || '#fff' }}>
              Raise / Follow Up Ticket
            </div>
            <div className="text-sm opacity-70" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
              Admin will respond in a per-ticket thread.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ticket title"
            className="w-full p-4 rounded-2xl border-2 outline-none font-bold"
            style={{ borderColor: theme.border || 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: theme.text || '#fff' }}
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your issue..."
            className="w-full p-4 rounded-2xl border-2 outline-none font-bold"
            style={{ borderColor: theme.border || 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: theme.text || '#fff', minHeight: 90 }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              placeholder="Optional screenshot URL (or leave blank)"
              className="w-full p-4 rounded-2xl border-2 outline-none font-bold"
              style={{ borderColor: theme.border || 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: theme.text || '#fff' }}
            />

            <label className="w-full p-4 rounded-2xl border-2 font-black text-sm uppercase tracking-widest cursor-pointer select-none text-center"
              style={{ borderColor: theme.border || 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: theme.text || '#fff' }}>
              Upload screenshot
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const base64 = reader.result;
                    // store base64 directly as screenshotUrl (works with current UI)
                    setScreenshotUrl(typeof base64 === 'string' ? base64 : '');
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !title.trim() || !description.trim()}
            className="px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest"
            style={{
              background: loading || !title.trim() || !description.trim()
                ? 'rgba(255,255,255,0.10)'
                : 'linear-gradient(90deg, rgba(168,85,247,0.9), rgba(6,182,212,0.85))',
              color: theme.isDark ? '#000' : '#fff',
              opacity: loading || !title.trim() || !description.trim() ? 0.6 : 1,
            }}
          >
            {loading ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>

        <div className="mt-8">
          <div className="text-sm font-bold uppercase tracking-widest opacity-70" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
            Your Tickets
          </div>

          <div className="mt-3 space-y-4 max-h-[360px] overflow-auto pr-1">
            {issues.length === 0 ? (
              <div className="text-sm opacity-70" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
                No tickets yet.
              </div>
            ) : (
              issues.map((issue) => {
                const isOpen = openIssueId === issue.id;

                return (
                  <div key={issue.id} className="p-4 rounded-2xl border" style={{ borderColor: 'rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.03)' }}>
                    <button
                      type="button"
                      onClick={() => setOpenIssueId((prev) => (prev === issue.id ? null : issue.id))}
                      className="w-full text-left"
                      style={{ color: theme.text || '#fff' }}
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold" style={{ color: theme.text || '#fff' }}>
                            {issue.title}
                          </div>

                          {/* Collapsed/expanded behavior for status + ticket details */}
                          {isOpen && issue.description ? (
                            <div className="text-sm opacity-80" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.35 }}>
                              {issue.description}
                            </div>
                          ) : null}

                          {isOpen && issue.screenshotUrl ? (
                            <a
                              href={issue.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block mt-3 px-3 py-2 rounded-xl border"
                              style={{ borderColor: 'rgba(255,255,255,0.10)', color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}
                            >
                              View Screenshot
                            </a>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3">
                          <div
                            className="text-xs font-bold rounded-full px-3 py-1 whitespace-nowrap"
                            style={{
                              background: issue.status === 'open' ? 'rgba(52,211,153,0.16)' : 'rgba(251,146,60,0.18)',
                              color: issue.status === 'open' ? '#34d399' : '#fb923c',
                              border: `1px solid ${issue.status === 'open' ? 'rgba(52,211,153,0.35)' : 'rgba(251,146,60,0.35)'}`,
                            }}
                          >
                            {issue.status?.toUpperCase()}
                          </div>

                          <span className="opacity-70" aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                          </span>
                        </div>
                      </div>
                    </button>

                    {isOpen ? (
                      <IssueThreadWindowToUseWrapper
                        key={issue.id + '-thread'}
                        issueId={issue.id}
                        mode="user"
                        themeColors={theme}
                        isOpen
                      />
                    ) : null}
                  </div>
                );
              })
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

const IssueThreadWindowToUseWrapper = ({ issueId, mode, themeColors, isOpen }) => {
  // pass isOpen=true so thread composer is visible
  return <IssueThreadWindow issueId={issueId} mode={mode} themeColors={themeColors} isOpen={isOpen ?? true} />;
};

export default TicketsSection;

