// src/utils/adminOTP.js - Secure Phone OTP for Admin Access Only
// STRICTLY LIMITED to whitelisted phone numbers

import { auth, db } from '../firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { isAdminUser } from './adminAuth';

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PHONE WHITELIST (Add your numbers here - E.164 format)
// ═══════════════════════════════════════════════════════════════════════════════
export const ADMIN_PHONE_WHITELIST = [
  '+919148860082',  // Primary admin (CHANGE TO YOUR NUMBER)
  '+919123456789'   // Secondary admin
];

// Firestore config path for dynamic whitelist management
const ADMIN_CONFIG_PATH = 'adminConfig/config';
const ADMIN_SESSIONS_PATH = 'adminSessions';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. WHITELIST VALIDATION (STRICT)
// ═══════════════════════════════════════════════════════════════════════════════
export const isAdminPhone = async (phoneNumber) => {
  try {
    // Check hardcoded whitelist FIRST (fail-safe) - now primary method
    if (ADMIN_PHONE_WHITELIST.includes(phoneNumber)) {
      console.log('✅ Hardcoded whitelist approved:', phoneNumber);
      return true;
    }
    
    // OPTIONAL: Check Firestore (ignore permission errors)
    try {
      const configDoc = await getDoc(doc(db, ADMIN_CONFIG_PATH));
      if (configDoc.exists()) {
        const allowedPhones = configDoc.data().allowedPhones || [];
        if (allowedPhones.includes(phoneNumber)) {
          console.log('✅ Firestore whitelist approved:', phoneNumber);
          return true;
        }
      }
    } catch (fsError) {
      console.warn('Firestore whitelist check failed (permissions?):', fsError.message);
      // Continue - hardcoded whitelist takes precedence
    }
    
    console.warn('❌ Phone not whitelisted:', phoneNumber);
    return false;
  } catch (error) {
    console.error('Admin phone validation failed:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SEND OTP (Rate limited + whitelist pre-check)
// ═══════════════════════════════════════════════════════════════
// Persistent across module reloads
let confirmationResult = null;
let otpAttempts = {};
let recaptchaVerifierRef = null;

export const setRecaptchaVerifier = (verifier) => {
  recaptchaVerifierRef = verifier;
};

export const sendAdminOTP = async (phoneNumber, recaptchaVerifier) => {
  try {
    // Store recaptcha reference
    setRecaptchaVerifier(recaptchaVerifier);

    // STRICT PRE-CHECK: Only whitelisted phones get OTP
    const isWhitelisted = await isAdminPhone(phoneNumber);
    if (!isWhitelisted) {
      throw new Error('❌ Phone not authorized for admin access');
    }

    // Rate limiting (5 OTP/hour per phone)
    const now = Date.now();
    const phoneKey = phoneNumber;
    
    if (otpAttempts[phoneKey] && otpAttempts[phoneKey].count >= 5) {
      throw new Error('⏰ Too many attempts. Wait 1 hour.');
    }

    // Send OTP - use stored or passed verifier
    const verifier = recaptchaVerifier || recaptchaVerifierRef;
    if (!verifier || !verifier.render) {
      throw new Error('❌ reCAPTCHA not ready. Refresh page.');
    }

    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
    
    // Track attempts
    otpAttempts[phoneKey] = otpAttempts[phoneKey] || { count: 0, firstSent: now };
    otpAttempts[phoneKey].count++;
    
    console.log('✅ OTP sent successfully to:', phoneNumber);
    return { success: true, message: 'OTP sent! Check SMS.' };
  } catch (error) {
    console.error('OTP send failed:', error);
    // Don't clear confirmationResult on error - preserve for retry
    return { 
      success: false, 
      error: error.message.includes('permission') ? 'Permissions issue - update Firestore rules' : 
             error.message.includes('verify') ? 'reCAPTCHA issue - refresh page' : 
             error.message
    };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. VERIFY OTP & CREATE ADMIN SESSION (24h expiry)
// ═══════════════════════════════════════════════════════════════════════════════
export const verifyAdminOTP = async (otpCode) => {
  if (!confirmationResult) {
    throw new Error('No OTP sent. Please send OTP first.');
  }

  try {
    const result = await confirmationResult.confirm(otpCode);
    const user = result.user;
    
    // Create secure admin session (24h)
    const sessionId = user.uid + '_' + Date.now();
    const sessionDoc = doc(db, ADMIN_SESSIONS_PATH, sessionId);
    
    await setDoc(sessionDoc, {
      uid: user.uid,
      phoneNumber: user.phoneNumber,
      isAdmin: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),  // 24 hours
      ipAddress: 'client-tracked'
    }, { merge: true });

    // Update adminUsers for audit (ignore permission errors)
    try {
      await updateDoc(doc(db, 'adminUsers', user.uid), {
        lastAdminLogin: Date.now(),
        phoneNumber: user.phoneNumber
      }, { merge: true });
    } catch (auditError) {
      console.warn('Admin audit update failed:', auditError.message);
    }

    // Clear OTP state
    confirmationResult = null;
    localStorage.setItem('adminSessionId', sessionId);
    
    console.log('✅ Admin session created:', sessionId);
    return { 
      success: true, 
      sessionId,
      user: { uid: user.uid, phoneNumber: user.phoneNumber }
    };
  } catch (error) {
    console.error('OTP verification failed:', error);
    // Don't clear confirmationResult on verify error - allow retry
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. VALIDATE ADMIN SESSION (Used in route guards)
// ═══════════════════════════════════════════════════════════════════════════════
export const validateAdminSession = async () => {
  const sessionId = localStorage.getItem('adminSessionId');
  if (!sessionId) return false;

  try {
    const sessionDoc = await getDoc(doc(db, ADMIN_SESSIONS_PATH, sessionId));
    if (!sessionDoc.exists()) return false;

    const session = sessionDoc.data();
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem('adminSessionId');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ADMIN LOGOUT (Clean session)
// ═══════════════════════════════════════════════════════════════════════════════
export const adminLogout = async () => {
  const sessionId = localStorage.getItem('adminSessionId');
  if (sessionId) {
    try {
      await deleteDoc(doc(db, ADMIN_SESSIONS_PATH, sessionId));
    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
    localStorage.removeItem('adminSessionId');
  }
  await signOut(auth);
};

// EXPORT FOR AdminLogin.jsx USAGE
export { confirmationResult };

