import { createContext, useContext, useState, useEffect } from "react";
import { auth, provider } from "../firebase"; // Adjusted path
import { db } from "../firebase"; // Ensure db is exported from your firebase.js
import { doc, onSnapshot } from "firebase/firestore";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  updateProfile 
} from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- UNIFIED THEME STATE ---
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("theme") || "DeepSpace";
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- NEW: Real-time Cloud Theme Sync ---
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, "users", currentUser.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudTheme = docSnap.data().theme;
        if (cloudTheme && cloudTheme !== theme) {
          setThemeState(cloudTheme);
          localStorage.setItem("theme", cloudTheme);
        }
      }
    });
    return () => unsub();
  }, [currentUser, theme]);

  const register = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: name });
    setCurrentUser({ ...res.user, displayName: name });
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const googleLogin = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setCurrentUser({ ...auth.currentUser });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, register, login, logout, googleLogin, reloadUser, 
      theme, setTheme, loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
