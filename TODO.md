# TODO (Admin unban appeal + banned UX)

## Step 1
- [x] Inspect existing admin shell (`AdminRemadeShell.jsx`) and confirm `unbanAppeals` tab is currently a placeholder.

## Step 2
- [ ] Implement an “Appeal Inbox” UI under `activeSection === 'unbanAppeals'`.
  - [ ] Read open unban appeals from Firestore collection `unbanAppeals`.
  - [ ] Provide a CTA button that navigates to `/banned`.


## Step 3
- [ ] Redesign `/banned` UI/UX (`BannedPage.jsx`).
  - [ ] Add a clear “What happens next” checklist.
  - [ ] Improve visual hierarchy and CTA layout around `UnbanAppealComposer`.


## Step 4
- [ ] Sanity-check build.
  - [ ] Run `npm run build` (or `npm test` if no build script).

