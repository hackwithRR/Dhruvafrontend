# Firebase Admin Login Fix Tracker
## Status: 🔄 In Progress

### ✅ Completed
- [x] Create TODO.md tracker

### ✅ Completed
- [x] Update src/utils/adminOTP.js  
- [x] Update src/pages/AdminLogin.jsx

### 🔄 Pending (User Actions)
### 🚨 **NEW CRITICAL ISSUE: Phone Auth Not Enabled**

**SMS Error Fixed**: `auth/operation-not-allowed` = Phone Auth disabled in project.

**Firebase Console Steps (10 mins):**

1. **Authentication → Sign-in method**
   - Enable **Phone** 
   - Add test phone: `+919148860082`
   - Select region: **India (+91)**
   - Save

2. **Firestore → Rules** (still needed for sessions):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /adminConfig/config { allow read, write: if request.auth != null; }
       match /adminSessions/{document=**} { allow read, write: if request.auth != null; }
       match /adminUsers/{document=**} { allow read, write: if request.auth != null; }
     }
   }
   ```
   **Publish**

3. **Phone Auth → Quota** (if limited):
   - Request test quota increase (free)

**After Console Updates:**
- Restart: `Ctrl+C` → `npm run dev` 
- Test: `/admin-login` → `+919148860082` → Receive SMS OTP

### ✅ Code Fixes Complete
- adminOTP.js: ✅ Permission-safe whitelist
- AdminLogin.jsx: ✅ Async reCAPTCHA

### 📱 Test Phone Ready
`+919148860082` (India region)

### 🔄 Pending (User Actions)
- [ ] **CRITICAL**: Update Firebase Console Firestore Security Rules:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /adminConfig/config { allow read, write: if request.auth != null; }
      match /adminSessions/{document=**} { allow read, write: if request.auth != null; }
      match /adminUsers/{document=**} { allow read, write: if request.auth != null; }
    }
  }
  ```
- [ ] Restart dev server: `npm run dev`
- [ ] Test OTP flow with `+919148860082`

### 🧪 Testing
1. Go to `/admin-login`
2. Enter `+919148860082`
3. Send OTP → Should succeed without permission errors
4. Enter 6-digit SMS OTP
5. Redirect to `/admin`

### Known Issues
- Navbar `jsx` warning: Likely bundle cache, clears on restart

**Next Step**: Edit adminOTP.js → Confirm → Edit AdminLogin.jsx → Test
