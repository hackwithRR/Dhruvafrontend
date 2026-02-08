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

const app = initializeApp(firebaseConfig);

// Main Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Configuration
// Exporting as both 'provider' and 'googleProvider' to ensure compatibility 
// with whatever your untouched components are expecting.
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { googleProvider, googleProvider as provider };

export default app;
