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
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem("theme") || "DeepSpace";
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync Theme from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().theme) {
        const cloudTheme = docSnap.data().theme;
        if (cloudTheme !== theme) {
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

  return (
    <AuthContext.Provider value={{ 
      currentUser, register, login, logout, googleLogin, 
      theme, setTheme, loading 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
