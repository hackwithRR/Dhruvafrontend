import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBOFHLJwdanETImp6TlPT8U7GdouprQfnc",
  authDomain: "ai-tutor-b89dd.firebaseapp.com",
  projectId: "ai-tutor-b89dd",
  storageBucket: "ai-tutor-b89dd.firebasestorage.app",
  messagingSenderId: "764592312268",
  appId: "1:764592312268:web:9f011cb05ebaa984575769"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// EXPORTS - Using multiple names to ensure untouched files don't break
export { 
  auth, 
  db, 
  storage, 
  googleProvider, 
  googleProvider as provider,      // Fixes files looking for 'provider'
  googleProvider as GoogleProvider // Fixes files looking for 'GoogleProvider'
};

export default app;
