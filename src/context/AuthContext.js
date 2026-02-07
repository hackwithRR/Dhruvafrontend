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

  // Sync theme with localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // --- CORE AUTH LOGIC (BASED ON YOUR WORKING VERSION) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 1. Set the user immediately (just like your old version)
        setCurrentUser(user);
        
        // 2. Try to get extra info (gender, board) from Firestore in the background
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            // Merge the data so Chat.jsx can see data.gender/data.board
            setCurrentUser({ ...user, ...userDoc.data() });
          }
        } catch (err) {
          console.error("Firestore background fetch failed:", err);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- REGISTER (ENHANCED WITH PHOTOURL) ---
  const register = async (email, password, name, avatarUrl) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    // Update Auth Profile
    await updateProfile(res.user, { 
        displayName: name, 
        photoURL: avatarUrl || `https://ui-avatars.com/api/?name=${name}` 
    });
    // Update local state immediately
    setCurrentUser({ ...res.user, displayName: name, photoURL: avatarUrl });
    return res;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // --- GOOGLE LOGIN (CLEAN VERSION) ---
  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Firebase automatically handles PFP for Google. 
      // We set local state so it reflects immediately.
      setCurrentUser(result.user);
      return result;
    } catch (error) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const logout = () => signOut(auth);

  // --- RELOAD USER (FOR PROFILE UPDATES) ---
  const reloadUser = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const extraData = userDoc.exists() ? userDoc.data() : {};
        
        // Spread both to ensure Navbar (Auth data) and Chat (Firestore data) stay in sync
        setCurrentUser({ ...auth.currentUser, ...extraData });
      } catch (error) {
        console.error("Failed to refresh user session:", error);
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
