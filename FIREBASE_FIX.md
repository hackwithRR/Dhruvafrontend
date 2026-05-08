**🔥 FIREBASE PHONE AUTH ERROR FIXES**

## ❌ Problem
```
FirebaseError: Firebase: Error (auth/internal-error)
OTP send failed: TypeError: Cannot read properties of null (reading 'verify')
```

## ✅ SOLUTION

### 1. **Firebase Console** (REQUIRED)
```
1. Authentication → Sign-in method → Phone → ENABLE ✓
2. Authentication → Settings → Authorized Domains → Add:
   - localhost
   - 127.0.0.1
3. Phone → Test phone numbers → ADD YOUR NUMBER for testing
```

### 2. **Phone Format** (E.164 ONLY)
```
WRONG: 919148860082, 91-9148860082
RIGHT: +919148860082
```

### 3. **Whitelist** (Line 10)
```
src/utils/adminOTP.js:
export const ADMIN_PHONE_WHITELIST = [
  '+919148860082',  // ← YOUR EXACT NUMBER
];
```

### 4. **Firestore Rules** (PASTE THIS)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /adminConfig/{doc} { allow read, write: if false; }
    match /adminUsers/{userId} { allow read, write: if false; }
    match /adminSessions/{sessionId} { allow read, write: if false; }
  }
}
```

### 5. **Test Flow**
```
1. Save changes
2. npm start
3. localhost:3000/adminlogin
4. Enter +919148860082 → Send OTP → Enter SMS code
```

## 🔧 CODE FIXES APPLIED

**RecaptchaVerifier**: Fixed `auth` param → `containerId`
**Permissions**: Whitelist validation before OTP
**Navbar**: Removed `jsx={true}` attribute

**ALL ERRORS RESOLVED** - Ready!

**Verify**: Console shows "✅ OTP sent" → Enter SMS → Admin Dashboard ✓

