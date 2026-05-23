# TODO: Notification indicators (Admin + User)

- [ ] Add Firestore listeners to compute unread indicators.
  - [ ] Admin: listen to issues/{issueId}/messages where role=='user' and message createdAt > lastSeen (or use local heuristic if no field).
  - [ ] User: listen to issues where createdBy==currentUser.uid and messages where role=='admin' and createdAt > lastSeen.

- [ ] Persist “last seen” per user/admin.
  - [ ] Use Firestore doc: users/{uid}/ticketNotifications.lastSeenAt
  - [ ] For admin: use admin doc in users collection? (needs decision; fallback to adminPhone doc)

- [ ] UI updates
  - [ ] AdminRemadeShell.jsx: replace placeholder notifCount=3 with real unread count.
  - [ ] AdminRemadeShell.jsx: on clicking Alerts button / Issues nav, mark as seen and set unread=0.
  - [ ] Navbar.jsx: add red dot / badge on avatar when user has unread admin replies.

- [ ] Toast alerts
  - [ ] AdminRemadeShell.jsx: show toast when unread count increments.
  - [ ] User pages (Navbar visible): toast when unread increments while not on Profile.

- [ ] Edge cases
  - [ ] Ensure listener cleanup.
  - [ ] Clamp unread counts.
  - [ ] Avoid double toasts on initial load.

- [ ] Manual test checklist
  - [ ] Create ticket as user.
  - [ ] Admin replies.
  - [ ] User sees dot/badge + toast.
  - [ ] Admin sees alert badge + toast.
  - [ ] After opening Issues/Thread, badge clears.
