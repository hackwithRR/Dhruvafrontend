# TODO_ADMIN_ISSUES_FIX.md

## Goal
Admin Panel → Issues tab: change status of ticket in admin issues panel works reliably and UI updates instantly.

## Plan
1. Locate current admin Issues table implementation (AdminRemadeShell.jsx).
2. Identify why modal status UI is stale after toggling.
3. Fix modal status syncing by switching ModalIssueStatusSync from `getDoc` (one-time) to `onSnapshot` (real-time).
4. Keep existing status toggle implementation (already updates Firestore + statusHistory).
5. Smoke test: open Issues modal, toggle Close/Re-open, verify button label + status history update immediately.

## Progress
- [x] 0-2 Identify modal status staleness cause
- [x] 3 Replace modal sync logic with onSnapshot
- [ ] 5 Smoke test


