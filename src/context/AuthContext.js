import { createContext, useContext, useState, useEffect } from "react";
import { auth, provider, db } from "../firebase"; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState(localStorage.getItem("theme") || "DeepSpace");

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure user document exists in Firestore to prevent Chat.js from crashing
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "Scholar",
            theme: "DeepSpace",
            xp: 0,
            dailyXp: 0,
            board: "CBSE",
            class: "10"
          }, { merge: true });
        }
      }
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async (email, password, name) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: name });
      return res.user;
    } catch (err) {
      console.error("Register Error:", err.code);
      throw err;
    }
  };

  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error("Login Error:", err.code);
      throw err;
    }
  };

  const googleLogin = async () => {
    try {
      // Use Popup as it's more reliable for Web than Redirect
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (err) {
      console.error("Google Login Error:", err.message);
      throw err;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ currentUser, register, login, logout, googleLogin, theme, setTheme }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
