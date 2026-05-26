// src/utils/adminAuth.js
// Unified Admin Authentication and Syllabus Material Management

import { db, auth } from '../firebase';
import { syllabusData } from './syllabusData';
import { 
  doc, setDoc, getDoc, collection, query, where, 
  getDocs, deleteDoc, serverTimestamp 
} from 'firebase/firestore';

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

// Hardcoded for dev - Move to environment variables in production
export const ADMIN_CREDENTIALS = {
  email: 'admin@dhruva.ai',
  password: 'Padh0Yaar2024!Admin',
  displayName: 'Syllabus Admin'
};

const COLLECTIONS = {
  METADATA: 'syllabus_metadata',
  ADMINS: 'adminUsers'
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. AUTHENTICATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate admin login credentials
 */
export const validateAdminCredentials = (email, password) => {
  return email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password;
};

/**
 * Check if user has admin privileges (Firebase claims + email)
 * @param {object} userData - Current user data from AuthContext
 */
export const isAdminUser = (userData) => {
  if (!userData) return false;
  return (
    userData.email === ADMIN_CREDENTIALS.email || 
    userData.isAdmin === true ||
    userData.role === 'admin'
  );
};

/**
 * Grants admin privileges in Firestore
 */
export const grantAdminPrivileges = async (userId) => {
  try {
    await setDoc(doc(db, COLLECTIONS.ADMINS, userId), {
      email: ADMIN_CREDENTIALS.email,
      isAdmin: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Admin grant failed:', error);
    return false;
  }
};

/**
 * Get admin status from Firestore
 * @param {string} userId - The ID of the user to check.
 * @returns {object|null} - Admin data if exists, otherwise null.
 */
export const getAdminStatus = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, COLLECTIONS.ADMINS, userId));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Admin status check failed:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SYLLABUS MATERIAL MANAGEMENT (CRUD)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Converts a file to a Base64 Data URL string.
 * @param {File} file 
 * @returns {Promise<string>}
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Generates a consistent ID for materials to prevent duplicates.
 * @param {string} board - The board (e.g., 'CBSE').
 * @param {string} classLevel - The class level (e.g., '10').
 * @param {string} subject - The subject (e.g., 'MATHS').
 * @param {string} chapter - The chapter name.
 * @param {string} type - The material type (e.g., 'notes', 'pyqs').
 * @returns {string} A normalized, unique ID for the material.
 */
const generateMaterialId = (board, classLevel, subject, chapter, type) => {
  const rawId = `${board}_${classLevel}_${subject}_${chapter}_${type}`;
  return rawId.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

/**
 * Converts a file to Base64 and saves it to Firestore.
 * This is the primary function for adding new materials.
 * @param {File} file - The file to process (e.g., PDF).
 * @param {object} options - Object containing material details.
 * @param {string} options.board - The board (e.g., 'CBSE').
 * @param {string} options.classLevel - The class level (e.g., '10').
 * @param {string} options.subject - The subject (e.g., 'MATHS').
 * @param {string} options.chapter - The chapter name.
 * @param {string} [options.type='notes'] - The material type (e.g., 'notes', 'pyqs').
 * @returns {Promise<string>} The Base64 string of the file.
 * @throws {Error} If the upload or metadata saving fails.
 */
export const uploadSyllabusMaterial = async (file, { board, classLevel, subject, chapter, type = 'notes' }) => {
  try {
    const now = serverTimestamp();
    const materialId = generateMaterialId(board, classLevel, subject, chapter, type);
    const base64Data = await fileToBase64(file);

    // Save Metadata and Content to Firestore
    const metadata = {
      id: materialId,
      board: board.toUpperCase(),
      classLevel: String(classLevel),
      subject: subject.toUpperCase(),
      chapter: chapter.trim(),
      type,
      content: base64Data, // Storing Base64 directly
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      updatedAt: now,
      version: 1 // Default to version 1
    };

    const materialRef = doc(db, COLLECTIONS.METADATA, materialId);
    const existingDoc = await getDoc(materialRef);

    if (existingDoc.exists()) {
      const existingData = existingDoc.data();
      const newVersion = (existingData.version || 1) + 1;
      metadata.version = newVersion;

      // Archive the previous version to a subcollection
      await setDoc(doc(db, COLLECTIONS.METADATA, materialId, 'history', `v${existingData.version || 1}-${existingData.updatedAt?.toMillis() || Date.now()}`), {
        ...existingData,
        archivedAt: now,
      });
    }

    await setDoc(materialRef, metadata, { merge: true });

    console.log(`✅ Material Saved: ${materialId}`);
    return base64Data;
  } catch (error) {
    console.error('Save failed:', error);
    throw new Error(`Failed to save: ${error.message}`);
  }
};

/**
 * Deletes a syllabus material record from Firestore.
 * @param {string} materialId - The unique ID of the material to delete.
 * @returns {Promise<boolean>} True if deletion was successful, false otherwise.
 * @throws {Error} If the material record is not found or deletion fails.
 */
export const deleteSyllabusMaterial = async (materialId) => {
  try {
    const docRef = doc(db, COLLECTIONS.METADATA, materialId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) throw new Error('Material record not found');

    // Delete the main document
    await deleteDoc(docRef); 

    // Delete all historical versions in the subcollection
    const historyDocs = await getDocs(collection(db, COLLECTIONS.METADATA, materialId, 'history'));
    const deletePromises = historyDocs.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);

    console.log(`✅ Material Deleted: ${materialId}`);
    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    throw new Error(`Failed to delete: ${error.message}`);
  }
};

/**
 * Fetches a list of syllabus materials from Firestore based on provided filters.
 * @param {object} [filters={}] - Optional filters (board, classLevel, subject, type).
 * @returns {Promise<Array<object>>} An array of material metadata objects.
 */
export const getMaterials = async (filters = {}) => {
  try {
    if (!auth.currentUser) {
      console.warn('getMaterials: No authenticated user found. Skipping query.');
      return [];
    }

    const constraints = [];
    if (filters.board) constraints.push(where('board', '==', filters.board.toUpperCase()));
    if (filters.classLevel) constraints.push(where('classLevel', '==', String(filters.classLevel)));
    if (filters.subject) constraints.push(where('subject', '==', filters.subject.toUpperCase()));
    if (filters.type) constraints.push(where('type', '==', filters.type));

    const q = query(collection(db, COLLECTIONS.METADATA), ...constraints);
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('getMaterials: No matching documents found.');
      return [];
    }

    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error fetching materials from Firestore (Check Rules or Composite Indexes):', error);
    return [];
  }
};

/**
 * Retrieves the download URL for a specific syllabus material.
 * This function is intended for user-facing retrieval.
 * @param {string} board - The board (e.g., 'CBSE').
 * @param {string} classLevel - The class level (e.g., '10').
 * @param {string} subject - The subject (e.g., 'MATHS').
 * @param {string} chapter - The chapter name.
 * @param {string} [type='notes'] - The material type (e.g., 'notes', 'pyqs').
 * @returns {Promise<string|null>} The download URL if found, otherwise null.
 */
export const getMaterialUrl = async (board, classLevel, subject, chapter, type = 'notes') => {
  try {
    const materialId = generateMaterialId(board, classLevel, subject, chapter, type);
    const docSnap = await getDoc(doc(db, COLLECTIONS.METADATA, materialId));

    if (docSnap.exists()) {
      return docSnap.data().content;
    }
  } catch (error) {
    console.error('Error getting material URL:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. DROPDOWN HELPERS (For Admin UI)
// ═══════════════════════════════════════════════════════════════════════════════
export const getBoards = () => Object.keys(syllabusData);
export const getClasses = (board) => Object.keys(syllabusData[board] || {});
export const getSubjects = (board, classLevel) => Object.keys(syllabusData?.[board]?.[classLevel] || {});
export const getChapters = (board, classLevel, subject) => syllabusData[board]?.[classLevel]?.[subject] || [];
