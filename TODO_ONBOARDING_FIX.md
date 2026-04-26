# Onboarding Bug Fix Plan

## Issues Identified:

### Issue 1: Race Condition in Registration (Main Bug)
- **Location**: Dhruvafrontend/src/pages/Register.jsx
- **Problem**: After registration, the code does multiple Firestore writes and immediately navigates to "/chat" without waiting for the data to be ready. The userData might not be set yet, causing the GlobalLoader to show indefinitely.
- **Fix**: 
  1. Remove the redundant setDoc in Register.jsx (AuthContext already creates the user document)
  2. Add a small delay or await the user data to be ready before navigating
  3. Change redirect from "/chat" to "/profile" for first-time users

### Issue 2: Navbar in Profile.jsx Missing userData
- **Location**: Dhruvafrontend/src/pages/Profile.jsx
- **Problem**: Navbar component expects `userData` prop but Profile.jsx passes different props
- **Fix**: Pass `userData` prop to Navbar in Profile.jsx

## Implementation Steps:

- [ ] 1. Fix Register.jsx:
  - [ ] Remove redundant setDoc call (AuthContext.register already creates user document)
  - [ ] Change redirect from "/chat" to "/profile" for onboarding
  - [ ] Add proper waiting/loading state before navigating

- [ ] 2. Fix Profile.jsx:
  - [ ] Pass `userData` prop to Navbar component

- [ ] 3. Test the flow:
  - [ ] Register new user
  - [ ] Should redirect to /profile for onboarding
  - [ ] After profile is saved, should redirect to /chat
