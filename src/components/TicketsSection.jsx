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
        statusHistory: [],
      });

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
    <div id={id} className="w-full mt-6 px-1 box-border">
      {/* 
        Changed from `items-stretch` to `items-start`. 
        This stops the left and right panels from forcing each other to match heights.
      */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        
        {/* LEFT PANEL: Intake Form (Sticky so it stays visible as right side expands) */}
        <div 
          className="w-full lg:w-[38%] xl:w-[32%] rounded-2xl p-5 border flex flex-col gap-4 lg:sticky lg:top-4 transition-all duration-200 shrink-0" 
          style={{ borderColor: theme.border || 'rgba(255,255,255,0.10)', background: theme.card || 'rgba(255,255,255,0.02)' }}
        >
          <div>
            <div className="text-base font-extrabold uppercase tracking-wider" style={{ color: theme.text || '#fff' }}>
              Raise Ticket
            </div>
            <div className="text-xs opacity-60 mt-0.5" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
              Initialize a monitoring loop for administrative analysis.
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ticket context title..."
              className="w-full p-3.5 rounded-xl border outline-none font-medium text-xs transition-all focus:border-opacity-40"
              style={{ borderColor: theme.border || 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.15)', color: theme.text || '#fff' }}
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe systemic environment parameters regarding your issue..."
              className="w-full p-3.5 rounded-xl border outline-none font-medium text-xs resize-none transition-all focus:border-opacity-40"
              style={{ borderColor: theme.border || 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.15)', color: theme.text || '#fff', minHeight: 110 }}
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
                placeholder="Optional payload url..."
                className="w-full p-3 rounded-xl border outline-none font-medium text-[11px] truncate"
                style={{ borderColor: theme.border || 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.15)', color: theme.text || '#fff' }}
              />

              <label 
                className="w-full sm:w-auto px-4 py-3 rounded-xl border font-bold text-[11px] uppercase tracking-wider cursor-pointer select-none text-center whitespace-nowrap inline-flex items-center justify-center transition-all hover:bg-white/5 active:scale-[0.99]"
                style={{ borderColor: theme.border || 'rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.08)', color: theme.text || '#fff' }}
              >
                Upload
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
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-[0.99]"
              style={{
                background: loading || !title.trim() || !description.trim()
                  ? 'rgba(255,255,255,0.04)'
                  : 'linear-gradient(90deg, rgba(168,85,247,0.9), rgba(6,182,212,0.85))',
                color: theme.isDark ? '#000' : '#fff',
                opacity: loading || !title.trim() || !description.trim() ? 0.35 : 1,
              }}
            >
              {loading ? 'Processing...' : 'Submit Loop'}
            </button>
          </div>
        </div>

        {/* 
          RIGHT PANEL: Completely Dynamic Height Container 
          Removed all `h-[...]` fixed or max height limitations. `h-auto` lets it expand down naturally.
        */}
        <div 
          className="w-full lg:flex-1 rounded-2xl p-5 border flex flex-col min-w-0 transition-all duration-300 h-auto" 
          style={{ 
            borderColor: theme.border || 'rgba(255,255,255,0.10)', 
            background: theme.card || 'rgba(255,255,255,0.02)'
          }}
        >
          <div className="mb-4">
            <div className="text-base font-extrabold uppercase tracking-wider" style={{ color: theme.text || '#fff' }}>
              Operational Histories
            </div>
            <div className="text-xs opacity-60 mt-0.5" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
              Track diagnostics, operational trails, and live developer feeds.
            </div>
          </div>

          {/* The list itself is also unbanned from scrolling limits so it expands naturally */}
          <div className="space-y-3.5 w-full">
            {issues.length === 0 ? (
              <div className="text-xs opacity-40 py-12 text-center tracking-wide" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
                No active tracking files mapped to this signature.
              </div>
            ) : (
              issues.map((issue) => {
                const isOpen = openIssueId === issue.id;

                return (
                  <div 
                    key={issue.id} 
                    className="p-4 rounded-xl border transition-all duration-300 flex flex-col w-full" 
                    style={{ 
                      borderColor: isOpen ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)', 
                      background: isOpen ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.01)',
                      boxShadow: isOpen ? '0 12px 30px -8px rgba(0,0,0,0.3)' : 'none'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIssueId((prev) => (prev === issue.id ? null : issue.id))}
                      className="w-full text-left focus:outline-none block group"
                      style={{ color: theme.text || '#fff' }}
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs tracking-wide truncate group-hover:opacity-90 transition-opacity" style={{ color: theme.text || '#fff' }}>
                            {issue.title}
                          </div>

                          {isOpen && issue.description ? (
                            <div className="text-xs opacity-75 mt-2 leading-relaxed whitespace-pre-wrap font-medium" style={{ color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}>
                              {issue.description}
                            </div>
                          ) : null}

                          {isOpen && issue.screenshotUrl ? (
                            <div className="mt-2.5">
                              <a
                                href={issue.screenshotUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex text-[10px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-lg border bg-white/5 transition-all hover:bg-white/10"
                                style={{ borderColor: 'rgba(255,255,255,0.06)', color: theme.textSecondary || 'rgba(255,255,255,0.7)' }}
                              >
                                View Attachment
                              </a>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-start mt-0.5">
                          <div
                            className="text-[9px] font-extrabold tracking-widest rounded-full px-2 py-0.5 whitespace-nowrap"
                            style={{
                              background: issue.status === 'open' ? 'rgba(52,211,153,0.08)' : 'rgba(251,146,60,0.08)',
                              color: issue.status === 'open' ? '#34d399' : '#fb923c',
                              border: `1px solid ${issue.status === 'open' ? 'rgba(52,211,153,0.15)' : 'rgba(251,146,60,0.15)'}`,
                            }}
                          >
                            {issue.status?.toUpperCase()}
                          </div>

                          <span className="opacity-40 text-[10px]" aria-hidden="true">
                            {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Chat component container will now dynamically push the height down safely */}
                    {isOpen ? (
                      <div className="mt-3 border-t pt-2 w-full transition-all duration-300" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <IssueThreadWindowToUseWrapper
                          key={issue.id + '-thread'}
                          issueId={issue.id}
                          mode="user"
                          themeColors={theme}
                          isOpen
                        />
                      </div>
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
  return <IssueThreadWindow issueId={issueId} mode={mode} themeColors={themeColors} isOpen={isOpen ?? true} />;
};

export default TicketsSection;