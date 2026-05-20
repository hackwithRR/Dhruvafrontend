# TODO - Admin Panel UI Remake

## Step 1: Assess current UI
- [x] Read current `src/pages/AdminPanel.jsx`
- [x] Identify existing animation/theme primitives used (framer-motion, Background, ClickSpark, BorderGlow, RippleEffect)
- [ ] Confirm whether `src/components/admin/*` can be read via tooling (currently blocked by tool/file mismatch)

## Step 2: Create clean Admin UI primitives (new folder)
- [ ] Create `src/components/admin-ui/` components:
  - [ ] `AdminLayoutShell.jsx` (header + content frame)
  - [ ] `AdminTopBar.jsx` (title + logout)
  - [ ] `AdminSideTabs.jsx` (tab buttons)
  - [ ] `AdminStatCard.jsx` (glow card)
  - [ ] `AdminPanelSection.jsx` (section wrapper)
  - [ ] `AdminInput.jsx` + `AdminButton.jsx` (consistent styling)
  - [ ] `AdminEmptyState.jsx`

## Step 3: Rebuild `src/pages/AdminPanel.jsx`
- [ ] Replace legacy inline layout with new primitives
- [ ] Add modern UX details:
  - [ ] better spacing/typography
  - [ ] skeleton/empty states
  - [ ] micro-interactions (hover/press)
  - [ ] smooth transitions between tabs

## Step 4: Wire functionality
- [ ] Keep existing Firestore listeners & actions:
  - [ ] users count
  - [ ] issues list
  - [ ] PDF count
  - [ ] add/delete issue
  - [ ] admin members add/remove

## Step 5: Verify
- [ ] Run `npm test` or `npm run build`
- [ ] Manually smoke test admin panel navigation

