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

  // --- IMPROVED SYNC FUNCTION ---
  const getFullUserData = async (user) => {
    if (!user) return null;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const firestoreData = userDoc.exists() ? userDoc.data() : {};
      
      // We create a fresh object to force React to re-render everything
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || firestoreData.displayName,
        // PRIORITY: Google Photo -> Firestore Photo -> Fallback UI Avatar
        photoURL: user.photoURL || firestoreData.photoURL || `https://ui-avatars.com/api/?name=${user.email}`,
        ...firestoreData // This brings in gender, board, classLevel
      };
    } catch (e) {
      console.error("Sync error:", e);
      return user;
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
    // Manually reload to ensure Auth has the new info
    await res.user.reload();
    const merged = await getFullUserData(auth.currentUser);
    setCurrentUser(merged);
    return res;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // --- GOOGLE LOGIN (FIXED FOR PFP & NAME) ---
  const googleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, provider);
      // Immediately fetch data to prevent "Alphabet PFP" flicker
      const merged = await getFullUserData(res.user);
      setCurrentUser({ ...merged }); 
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
        setCurrentUser({ ...merged });
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
