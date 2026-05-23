import React, { useEffect, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';


const AdminCreateIssueSection = ({
  db,
  serverTimestamp: serverTimestampProp,
  adminPhone,
  themeColors,
  onCreated,
}) => {
  const [userName, setUserName] = useState('');
  const [uid, setUid] = useState('');
  const [email, setEmail] = useState('');




  const [collapsed, setCollapsed] = useState(false);
  const [userLookupLoading, setUserLookupLoading] = useState(false);
  const [userLookupError, setUserLookupError] = useState('');

  const lastLookupEmailRef = useRef('');


  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

  const [loading, setLoading] = useState(false);

  const theme = themeColors || {};



  useEffect(() => {
    // Auto-fill user details when admin types email.
    // Only trigger when email changes and looks valid.
    const e = (email || '').trim();
    if (!db) return;
    if (!e) {
      setUserLookupError('');
      return;
    }

    const looksLikeEmail = /.+@.+\..+/.test(e);
    if (!looksLikeEmail) return;

    let cancelled = false;
    const run = async () => {
      // avoid repeat lookups on same email
      if (lastLookupEmailRef.current === e.toLowerCase()) return;
      lastLookupEmailRef.current = e.toLowerCase();

      setUserLookupLoading(true);
      setUserLookupError('');

      try {
        const emailLower = e.toLowerCase();

        // Query users by email.
        // NOTE: If Firestore rules don’t allow admin reads, this will throw
        // `Missing or insufficient permissions`.
        const q = query(collection(db, 'users'), where('email', '==', emailLower));
        const snap = await getDocs(q);

        if (cancelled) return;


        if (snap.empty) {
          setUid('');
          setUserName('');
          setUserLookupError('No user found for this email');
          return;
        }

        const userDoc = snap.docs[0];
        const data = userDoc.data() || {};
        setUid(userDoc.id || '');
        setUserName((data?.name || data?.displayName || '').trim());
        setUserLookupError('');
      } catch (err) {
        console.error('[AdminCreateIssueSection] user lookup failed', err);
        if (!cancelled) {
          const msg = err?.message || String(err);
          setUserLookupError(
            msg.includes('permission')
              ? 'Missing/insufficient permissions to read users. Fix Firestore rules or admin auth.'
              : 'Lookup failed (check Firestore rules / index)'
          );
        }
      } finally {
        if (!cancelled) setUserLookupLoading(false);
      }
    };


    run();
    return () => {
      cancelled = true;
    };
  }, [db, email]);

  const submit = async () => {
    // Admin creates on behalf of student; uid MUST be student uid for rules.
    if (!uid.trim()) return;
    if (!title.trim()) return;
    if (!description.trim()) return;



    setLoading(true);
    try {
      const createdAtTs = serverTimestampProp || serverTimestamp();
      const complaintId = `CMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      await addDoc(collection(db, 'issues'), {
        complaintId,
        // ticket identity
        title: title.trim(),
        description: description.trim(),
        screenshotUrl: screenshotUrl || null,

        // routing / display
        status: 'open',
        createdBy: uid.trim(),
        createdByName: (userName || email || 'User').trim(),
        createdByEmail: (email || '').trim() || null,

        // audit / origin
        createdByAdmin: adminPhone || null,
        createdFrom: 'admin_email_complaint',

        createdAt: typeof createdAtTs === 'function' ? createdAtTs() : createdAtTs,

        // optional
        statusHistory: [],
      });

      setUserName('');
      setUid('');
      setEmail('');
      setTitle('');
      setDescription('');
      setScreenshotUrl('');

      onCreated?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-white/55 uppercase">Admin Composer</div>
            <div className="text-2xl font-black mt-1">Create Issue</div>
            <div className="text-xs text-white/60 mt-2">
              Raise an email-complaint ticket for a specific user.
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="rounded-2xl border border-white/10 bg-black/20 hover:bg-black/30 transition px-4 py-2 text-xs font-black text-white/90"
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
        </div>

        {collapsed ? null : (
          <div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <div className="text-xs font-bold text-white/60 mb-2">User Name</div>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none text-white focus:border-white/25"
                  placeholder="e.g. Dhruv"
                />
              </label>

              <label className="block">
                <div className="text-xs font-bold text-white/60 mb-2">User Email</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none text-white focus:border-white/25"
                  placeholder="e.g. user@example.com"
                />
                {userLookupLoading ? (
                  <div className="mt-1 text-[11px] text-white/60">Looking up...</div>
                ) : userLookupError ? (
                  <div className="mt-1 text-[11px] text-red-300">{userLookupError}</div>
                ) : null}
              </label>

              <label className="block md:col-span-2">
                <div className="text-xs font-bold text-white/60 mb-2">User UID</div>
                <input
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none text-white focus:border-white/25"
                  placeholder="Firestore uid (e.g. 123abc...)"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <label className="block">
                <div className="text-xs font-bold text-white/60 mb-2">Ticket Title</div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none text-white focus:border-white/25"
                  placeholder="e.g. Payment issue / Complaint"
                />
              </label>

              <label className="block">
                <div className="text-xs font-bold text-white/60 mb-2">Description</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none text-white focus:border-white/25 min-h-[120px]"
                  placeholder="Write complaint details..."
                />
              </label>

              <label className="block">
                <div className="text-xs font-bold text-white/60 mb-2">Screenshot URL (optional)</div>
                <input
                  value={screenshotUrl}
                  onChange={(e) => setScreenshotUrl(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none text-white focus:border-white/25"
                  placeholder="leave blank to skip"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={loading || !uid.trim() || !title.trim() || !description.trim()}
                className="rounded-2xl px-5 py-3 text-sm font-black text-white border border-white/10 transition"
                style={{
                  background: 'linear-gradient(90deg, rgba(168,85,247,0.9), rgba(6,182,212,0.85))',
                  opacity: loading || !uid.trim() || !title.trim() || !description.trim() ? 0.6 : 1,
                }}
              >
                {loading ? 'Creating...' : 'Create Issue for User'}
              </button>

              <div className="text-xs text-white/55">
                Saves into <span className="font-bold text-white/70">issues</span> and appears in user’s My Tickets.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default AdminCreateIssueSection;


