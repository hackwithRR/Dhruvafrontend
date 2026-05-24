import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp, where } from 'firebase/firestore';

import { toast } from 'react-toastify';

import IssueThreadWindow from './admin/IssueThreadWindow';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const cx = (...classes) => classes.filter(Boolean).join(' ');




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
  // Keep backwards-compatible prop override (functionality unchanged)
  // Note: we still render IssueThreadWindow below to preserve existing behavior.
  // keep override for backwards-compatibility; used by IssueThreadWindowToUseWrapper
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
      <div
        className="rounded-[34px] p-6 border relative overflow-hidden"
        style={{
          borderColor: theme.border || 'rgba(255,255,255,0.15)',
          background: theme.card || 'rgba(255,255,255,0.03)',
        }}
      >
        {/* decorative glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-30"
          style={{
            background: `radial-gradient(circle at center, ${theme.primary || 'rgba(168,85,247,0.7)'}, transparent 60%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-28 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{
            background: `radial-gradient(circle at center, rgba(56,189,248,0.55), transparent 60%)`,
          }}
        />

        <div className="relative z-[1]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="text-lg sm:text-xl font-black uppercase tracking-wide" style={{ color: theme.text || '#fff' }}>
                Raise / Follow Up Ticket
              </div>
              <div className="text-sm opacity-70" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
                Admin replies inside a per-ticket thread.
              </div>
            </div>

            <div className="text-right">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${theme.border || 'rgba(255,255,255,0.15)'}`,
                  color: theme.textSecondary || 'rgba(255,255,255,0.7)',
                }}
              >
                <span className="opacity-70">Tickets</span>
                <span style={{ color: theme.text || '#fff' }}>{issues.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 relative">
            {/* Composer */}
            <section
              className="rounded-[28px] p-4 sm:p-5 border"
              style={{
                borderColor: theme.border || 'rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="text-sm font-bold uppercase tracking-widest opacity-70" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
                    Ticket Composer
                  </div>
                  <div className="text-xs opacity-70" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    Provide details—threads are auto-pinned below.
                  </div>
                </div>
                <div
                  className={cx(
                    'shrink-0 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest border',
                  )}
                  style={{
                    borderColor: theme.border || 'rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.03)',
                    color: theme.textSecondary || 'rgba(255,255,255,0.7)',
                  }}
                >
                  {loading ? 'Submitting…' : 'Ready'}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ticket title"
                  className={cx(
                    'w-full p-4 rounded-2xl border-2 outline-none font-bold transition-all',
                    'focus:shadow-[0_0_30px_rgba(56,189,248,0.18)]'
                  )}
                  style={{
                    borderColor: theme.border || 'rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.03)',
                    color: theme.text || '#fff',
                  }}
                />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue..."
                  className={cx(
                    'w-full p-4 rounded-2xl border-2 outline-none font-bold transition-all',
                    'focus:shadow-[0_0_30px_rgba(168,85,247,0.18)]'
                  )}
                  style={{
                    borderColor: theme.border || 'rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.03)',
                    color: theme.text || '#fff',
                    minHeight: 110,
                  }}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    placeholder="Optional screenshot URL (or leave blank)"
                    className="w-full p-4 rounded-2xl border-2 outline-none font-bold transition-all"
                    style={{
                      borderColor: theme.border || 'rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.03)',
                      color: theme.text || '#fff',
                    }}
                  />

                  <label
                    className="w-full p-4 rounded-2xl border-2 font-black text-sm uppercase tracking-widest cursor-pointer select-none text-center transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      borderColor: theme.border || 'rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.03)',
                      color: theme.text || '#fff',
                    }}
                  >
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
                          // store base64 directly as screenshotUrl (existing functionality)
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
                  className="px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:brightness-110 active:brightness-95"
                  style={{
                    background:
                      loading || !title.trim() || !description.trim()
                        ? 'rgba(255,255,255,0.10)'
                        : 'linear-gradient(90deg, rgba(168,85,247,0.9), rgba(6,182,212,0.85))',
                    color: theme.isDark ? '#000' : '#fff',
                    opacity: loading || !title.trim() || !description.trim() ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </section>

            {/* Tickets list */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-sm font-bold uppercase tracking-widest opacity-70" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
                  Your Tickets
                </div>

                <div
                  className="text-[11px] font-black uppercase tracking-widest opacity-50"
                  style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}
                >
                  Tap to open thread
                </div>
              </div>

              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {issues.length === 0 ? (
                  <div
                    className="rounded-2xl border p-4 relative overflow-hidden"
                    style={{
                      borderColor: theme.border || 'rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-40"
                      style={{ background: `radial-gradient(circle at center, ${theme.primary || 'rgba(168,85,247,0.7)'}, transparent 60%)` }}
                    />
                    <div className="text-sm font-bold uppercase tracking-widest" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
                      No tickets yet
                    </div>
                    <div className="text-sm opacity-70 mt-2" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
                      Submit one above to start a support thread.
                    </div>
                  </div>
                ) : (
                  issues.map((issue) => {
                    const isOpen = openIssueId === issue.id;
                    const statusIsOpen = issue.status === 'open';
                    const statusText = (issue.status || '').toUpperCase();

                    return (
                      <article
                        key={issue.id}
                        className={cx(
                          'rounded-2xl border overflow-hidden transition-all',
                          'hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04)]',
                        )}
                        style={{
                          borderColor: 'rgba(255,255,255,0.10)',
                          background: isOpen ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenIssueId((prev) => (prev === issue.id ? null : issue.id))}
                          className="w-full text-left p-4 sm:p-5"
                          style={{ color: theme.text || '#fff' }}
                          aria-expanded={isOpen}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                                  style={{
                                    background: statusIsOpen ? '#34d399' : '#fb923c',
                                    boxShadow: statusIsOpen
                                      ? '0 0 0 4px rgba(52,211,153,0.12)'
                                      : '0 0 0 4px rgba(251,146,60,0.12)',
                                  }}
                                />
                                <div className="font-bold break-words leading-snug" style={{ color: theme.text || '#fff' }}>
                                  {issue.title}
                                </div>
                              </div>

                              {isOpen && issue.description ? (
                                <div
                                  className="text-sm opacity-85 mt-2"
                                  style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)', lineHeight: 1.35 }}
                                >
                                  {issue.description}
                                </div>
                              ) : null}

                              {!isOpen && issue.description ? (
                                <div
                                  className="text-sm opacity-55 mt-2 line-clamp-2"
                                  style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}
                                >
                                  {issue.description}
                                </div>
                              ) : null}

                              {isOpen && issue.screenshotUrl ? (
                                <a
                                  href={issue.screenshotUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center mt-3 px-3 py-2 rounded-xl border text-sm font-bold transition-all hover:translate-y-[-1px]"
                                  style={{
                                    borderColor: 'rgba(255,255,255,0.10)',
                                    color: theme.textSecondary || 'rgba(255,255,255,0.7)',
                                  }}
                                >
                                  View Screenshot
                                </a>
                              ) : null}
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div
                                className="text-xs font-bold rounded-full px-3 py-1 whitespace-nowrap transition-colors"
                                style={{
                                  background: statusIsOpen ? 'rgba(52,211,153,0.16)' : 'rgba(251,146,60,0.18)',
                                  color: statusIsOpen ? '#34d399' : '#fb923c',
                                  border: `1px solid ${statusIsOpen ? 'rgba(52,211,153,0.35)' : 'rgba(251,146,60,0.35)'}`,
                                }}
                              >
                                {statusText || 'OPEN'}
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
                      </article>
                    );
                  })
                )}
              </div>
            </section>
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


