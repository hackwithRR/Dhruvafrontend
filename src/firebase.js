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

// Initialize Firebase once
const app = initializeApp(firebaseConfig);

// Initialize and export services directly
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Setup Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Alias 'provider' for backward compatibility with your existing components
export const provider = googleProvider;

export default app;
