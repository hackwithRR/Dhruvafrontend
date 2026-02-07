import { createContext, useContext, useState, useEffect } from "react";
import { auth, provider, db } from "../utils/firebase";
import { doc, getDoc } from "firebase/firestore";
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
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // --- REUSABLE SYNC FUNCTION ---
  const getFullUserData = async (user) => {
    if (!user) return null;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      // Prioritize Auth photoURL (Google PFP) but merge Firestore data (gender/board)
      return { 
        ...user, 
        ...(userDoc.exists() ? userDoc.data() : {}),
        // Force the PFP to be the Auth one if the Firestore one is missing
        photoURL: user.photoURL || (userDoc.exists() ? userDoc.data().photoURL : null)
      };
    } catch (e) {
      return user; // Fallback to just Auth user if Firestore fails
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const mergedUser = await getFullUserData(user);
        setCurrentUser(mergedUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async (email, password, name, avatarUrl) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { 
      displayName: name, 
      photoURL: avatarUrl 
    });
    const merged = await getFullUserData(res.user);
    setCurrentUser(merged);
    return res;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // --- GOOGLE LOGIN (SIMPLE & STABLE) ---
  const googleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, provider);
      const merged = await getFullUserData(res.user);
      setCurrentUser(merged);
      return res;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const logout = () => signOut(auth);

  const reloadUser = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        const merged = await getFullUserData(auth.currentUser);
        setCurrentUser(merged);
      } catch (error) {
        console.error("Reload failed:", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      register, 
      login, 
      logout, 
      googleLogin, 
      reloadUser,
      theme,
      setTheme
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
