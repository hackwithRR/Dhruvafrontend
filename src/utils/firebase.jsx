import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Using process.env ensures these keys are pulled from your .env file
const firebaseConfig = {
    apiKey: "AIzaSyBOFHLJwdanETImp6TlPT8U7GdouprQfnc",
    authDomain: "ai-tutor-b89dd.firebaseapp.com",
    projectId: "ai-tutor-b89dd",
    storageBucket: "ai-tutor-b89dd.firebasestorage.app",
    messagingSenderId: "764592312268",
    appId: "1:764592312268:web:9f011cb05ebaa984575769"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, provider, db };