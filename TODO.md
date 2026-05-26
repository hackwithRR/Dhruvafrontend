# Task TODO

- [ ] Restore Firestore rules to the previous tested version (the one user pasted as “old rules”).
- [ ] Re-apply the new rules additions on top of the old ones (so functionality is retained).
- [ ] Focus on fixing the FirebaseError: Missing or insufficient permissions happening in `Profile.jsx` and `Chat.jsx` (session sync + chat context).
- [ ] Validate that `users/{userId}/sessions/{sessionId}` and `issues/{issueId}/messages` permissions match what the frontend actually reads/writes.
- [ ] Confirm resulting `firestore.rules` compiles.

