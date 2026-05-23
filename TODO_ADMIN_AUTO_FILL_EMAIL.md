# TODO_ADMIN_AUTO_FILL_EMAIL

- [ ] Implement admin email → user details autofill
  - [ ] Update `src/components/admin-ui/AdminCreateIssueSection.jsx` to actually query user by email (find uid, name) and populate `uid` + `userName`.
  - [ ] Remove the hardcoded “Auto-fill disabled by security rules” message.
  - [ ] Debounce / avoid repeat lookups on same email.

- [ ] Update `firestore.rules`
  - [ ] Ensure whitelisted admin can read `users` docs by id (minimum change) so the email lookup can succeed.

- [ ] Manual verification
  - [ ] Open Admin Panel → Issues → Create Issue
  - [ ] Type a known registered user email → confirm `User Name` and `User UID` auto-fill.

- [ ] Build verification
  - [ ] Run `npm run build` and confirm no JS errors.

