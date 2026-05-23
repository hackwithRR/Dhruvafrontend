import { collection, query, where, onSnapshot, getDocs, updateDoc } from 'firebase/firestore';

/**
 * Subscribes to the count of tickets that have unread updates for a specific user.
 * 
 * @param {Object} params
 * @param {Object} params.db - The Firestore database instance
 * @param {string} params.uid - The current user's UID
 * @param {Function} params.onChange - Callback function receiving the unread count
 * @param {Function} [params.onError] - Optional error callback
 * @returns {Function} Unsubscribe function
 */
export const subscribeUserUnreadCount = ({ db, uid, onChange, onError }) => {
  if (!db || !uid) return () => {};

  // We listen for issues created by this user that have a 'userUnread' flag set to true.
  // This flag should be set by the admin when they reply to a ticket.
  const q = query(
    collection(db, 'issues'),
    where('createdBy', '==', uid),
    where('userUnread', '==', true)
  );

  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.size);
  }, (error) => {
    console.error("Failed to subscribe to unread count:", error);
    if (onError) onError(error);
  });
};

/**
 * Marks all unread tickets for a user as 'seen' by setting the 'userUnread' flag to false.
 * 
 * @param {Object} params
 * @param {Object} params.db - The Firestore database instance
 * @param {string} params.uid - The current user's UID
 */
export const markSeen = async ({ db, uid }) => {
  if (!db || !uid) return;

  try {
    const q = query(
      collection(db, 'issues'),
      where('createdBy', '==', uid),
      where('userUnread', '==', true)
    );

    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map((doc) => updateDoc(doc.ref, { userUnread: false }));
    await Promise.all(updates);
  } catch (error) {
    console.error("Failed to mark tickets as seen:", error);
  }
};

/**
 * Formats the unread count for display in a badge.
 */
export const toUnreadBadgeText = (count) => {
  if (!count || count <= 0) return '';
  return count > 99 ? '99+' : String(count);
};