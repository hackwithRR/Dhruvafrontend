import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  orderBy,
  updateDoc,
  setDoc,
} from 'firebase/firestore';

/**
 * NOTE: Firestore-only helpers for unread counters.
 *
 * Storage model (recommended):
 *  - users/{uid}/ticketNotifications
 *      - lastSeenAt: Timestamp | null
 *      - lastSeenUpdatedAt: Timestamp
 */

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export async function getLastSeenAt({ db, uid }) {
  const ref = doc(db, 'users', uid, 'ticketNotifications', 'meta');
  const snap = await getDoc(ref);
  const data = snap.data() || {};
  return data.lastSeenAt || null;
}

export async function markSeen({ db, uid }) {
  if (!db || !uid) return;
  const ref = doc(db, 'users', uid, 'ticketNotifications', 'meta');

  try {
    await updateDoc(ref, {
      lastSeenAt: serverTimestamp(),
      lastSeenUpdatedAt: serverTimestamp(),
    });
  } catch (e) {
    // If doc doesn't exist yet, create it.
    try {
      await setDoc(ref, {
        lastSeenAt: serverTimestamp(),
        lastSeenUpdatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[ticketNotifications] markSeen failed:', e?.message || e, err?.message || err);
    }
  }
}

export function subscribeUserUnreadCount({
  db,
  uid,
  getUserIssueIds,
  onChange,
  onError,
}) {
  // User unread definition:
  // unread = # of messages with role=='admin' across this user's tickets
  // with createdAt > lastSeenAt

  if (!db || !uid) return () => {};
  const metaRef = doc(db, 'users', uid, 'ticketNotifications', 'meta');

  let lastSeenAt = null;
  let unsubMessageListeners = [];

  const cleanup = () => {
    unsubMessageListeners.forEach((u) => u?.());
    unsubMessageListeners = [];
  };

  const attachListeners = async () => {
    cleanup();
    const last = lastSeenAt;

    // Caller supplies issue IDs to avoid expensive cross-user scanning.
    const issueIds = (await getUserIssueIds?.()) || [];
    if (!issueIds.length) {
      onChange(0);
      return;
    }

    if (!last) {
      // If never seen, we still treat everything as unread.
      // We'll count admin messages on snapshot.
    }

    // Robust client-side aggregation:
    // subscribe to all admin messages per ticket, then count messages newer than lastSeenAt.
    cleanup();

    const counts = new Map();
    const recompute = () => {
      let total = 0;
      for (const v of counts.values()) total += v;
      onChange(total);
    };

    const lastMillis = last
      ? (last?.toMillis ? last.toMillis() : Date.parse(last) || 0)
      : null;

    const robustUnsubs = issueIds.map((issueId) => {
      const q = query(
        collection(db, 'issues', issueId, 'messages'),
        where('role', '==', 'admin'),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(
        q,
        (snap) => {
          let c = 0;
          snap.docs.forEach((d) => {
            const data = d.data() || {};
            const createdAt = data.createdAt;
            const createdMillis = createdAt?.toMillis
              ? createdAt.toMillis()
              : createdAt
                ? Date.parse(createdAt)
                : 0;

            if (lastMillis === null) {
              // never seen => everything counts
              if (createdMillis) c += 1;
              return;
            }

            if (createdMillis && createdMillis > lastMillis) c += 1;
          });
          counts.set(issueId, c);
          recompute();
        },
        (e) => onError?.(e)
      );
    });

    unsubMessageListeners = robustUnsubs;
  };

  const unsubMeta = onSnapshot(metaRef, (snap) => {
    lastSeenAt = snap.data()?.lastSeenAt || null;
    attachListeners();
    // Do not call onChange(0) immediately; wait for snapshots.
  }, (e) => {
    onError?.(e);
  });

  return () => {
    unsubMeta?.();
    cleanup();
  };
}

export function subscribeAdminUnreadCount({ db, adminUid, onChange, onError }) {
  // TODO: not implemented yet.
  if (!adminUid) return () => {};
  try {
    const metaRef = doc(db, 'users', adminUid, 'ticketNotifications', 'meta');
    const unsubMeta = onSnapshot(metaRef, () => onChange(0), (e) => onError?.(e));
    return () => unsubMeta?.();
  } catch (e) {
    onError?.(e);
    return () => {};
  }
}

export function toUnreadBadgeText(count) {
  if (count <= 0) return '';
  return clamp(count, 0, 99);
}

