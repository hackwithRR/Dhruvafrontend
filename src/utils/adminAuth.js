// src/utils/adminAuth.js
// Admin authentication and Firebase utilities for PDF management

import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ADMIN CREDENTIALS (Hardcoded - Change after production)
// ═══════════════════════════════════════════════════════════════════════════════
export const ADMIN_CREDENTIALS = {
  email: 'admin@dhruva.ai',
  password: 'Padh0Yaar2024!Admin',
  displayName: 'Syllabus Admin'
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Validate admin login credentials
 * @param {string} email - Admin email
 * @param {string} password - Admin password  
 * @returns {boolean} - Valid credentials
 */
export const validateAdminCredentials = (email, password) => {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
};

/**
 * Check if user has admin privileges (Firebase claims + email)
 * @param {object} userData - Current user data from AuthContext
 * @returns {boolean} - Is admin
 */
export const isAdminUser = (userData) => {
  return userData?.email === ADMIN_CREDENTIALS.email || 
         userData?.isAdmin === true ||
         userData?.role === 'admin';
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. FIREBASE ADMIN OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Set admin claims for current user (call once after first successful login)
 */
export const grantAdminPrivileges = async (userId) => {
  try {
    // This requires Firebase Admin SDK on backend - for now, store in Firestore
    await setDoc(doc(db, 'adminUsers', userId), {
      email: ADMIN_CREDENTIALS.email,
      isAdmin: true,
      grantedAt: Date.now(),
      lastLogin: Date.now()
    }, { merge: true });
    
    console.log('✅ Admin privileges granted');
    return true;
  } catch (error) {
    console.error('Admin grant failed:', error);
    return false;
  }
};

/**
 * Get admin status from Firestore
 */
export const getAdminStatus = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'adminUsers', userId));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Admin status check failed:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SYLLABUS PDF STORAGE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Generate Firebase Storage path for syllabus PDF
 * @param {string} board - CBSE/ICSE/State
 * @param {string} classLevel - 8, 9, 10, 11, 12
 * @param {string} subject - MATHEMATICS/SCIENCE
 * @param {string} chapter - Chapter name (normalized)
 * @returns {string} - Storage path
 */
export const getSyllabusPDFPath = (board, classLevel, subject, chapter) => {
  const normalizedChapter = chapter
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 50); // Max 50 chars for filename

  return `syllabus-pdfs/${board.toUpperCase()}/${classLevel}/${subject.toUpperCase()}/${normalizedChapter}/notes.pdf`;
};

/**
 * Upload syllabus PDF to Firebase Storage
 * @param {File} file - PDF file
 * @param {string} board 
 * @param {string} classLevel
 * @param {string} subject
 * @param {string} chapter
 * @returns {Promise<string>} - Download URL
 */
export const uploadSyllabusPDF = async (file, board, classLevel, subject, chapter) => {
  try {
    const storage = getStorage();
    const path = getSyllabusPDFPath(board, classLevel, subject, chapter);
    const storageRef = ref(storage, path);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

console.log(`✅ PDF uploaded: ${path} → ${downloadURL}`);
    return downloadURL;
  } catch (error) {
    console.error('PDF upload failed:', error);
    throw new Error('Failed to upload PDF. Check file size and format.');
  }
};

/**
 * Get syllabus PDF download URL (user-side)
 * @param {string} board 
 * @param {string} classLevel
 * @param {string} subject 
 * @param {string} chapter
 * @returns {Promise<string|null>} - PDF URL or null
 */
export const getSyllabusPDFUrl = async (board, classLevel, subject, chapter) => {
  try {
    const storage = getStorage();
    const path = getSyllabusPDFPath(board, classLevel, subject, chapter);
    const storageRef = ref(storage, path);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    // PDF doesn't exist yet - return null (not error)
    console.log(`📄 No PDF found: ${getSyllabusPDFPath(board, classLevel, subject, chapter)}`);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SYLLABUS DATA (From Chat.jsx - reused for dropdowns)
// ═══════════════════════════════════════════════════════════════════════════════
export const syllabusData = {
  CBSE: {
    "8": {
      "MATHEMATICS": ["Rational Numbers", "Linear Equations in One Variable", "Understanding Quadrilaterals"],
      "SCIENCE": ["Crop Production and Management", "Microorganisms: Friend and Foe", "Synthetic Fibres and Plastics"]
    },
    "9": {
      "MATHEMATICS": ["Number Systems", "Polynomials", "Coordinate Geometry"],
      "SCIENCE": ["Matter in Our Surroundings", "Is Matter Around Us Pure", "Atoms and Molecules"]
    },
    "10": {
      "MATHEMATICS": ["Real Numbers", "Polynomials", "Pair of Linear Equations in Two Variables"],
      "SCIENCE": ["Chemical Reactions and Equations", "Acids, Bases and Salts", "Metals and Non-metals"]
    }
    // ... full syllabusData from Chat.jsx
  },
  ICSE: {
    "8": {
      "MATHEMATICS": ["Rational Numbers", "Exponents", "Squares and Square Roots"],
      "PHYSICS": ["Matter", "Physical Quantities and Measurement"]
    }
    // ... ICSE data
  }
};

// Export for dropdown population
export const getBoards = () => Object.keys(syllabusData);
export const getClasses = (board) => Object.keys(syllabusData[board] || {});
export const getSubjects = (board, classLevel) => Object.keys(syllabusData[board]?.[classLevel] || {});
export const getChapters = (board, classLevel, subject) => syllabusData[board]?.[classLevel]?.[subject] || [];

// ═══════════════════════════════════════════════════════════════════════════════
// USAGE EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════════
/*
AdminLogin.jsx:
if (validateAdminCredentials(email, password)) {
  navigate('/admin');
}

AdminPanel.jsx:
const pdfUrl = await getSyllabusPDFUrl('CBSE', '10', 'MATHS', 'Real Numbers');

User Chat.jsx:
if (pyqMode && pdfUrl) {
  "Would you like AI-generated PYQs or download PDF notes?"
}
*/

