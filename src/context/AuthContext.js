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
import { doc, onSnapshot, setDoc } from "firebase/firestore";

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
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      // Update Auth Profile
      await updateProfile(res.user, { displayName: name });
      
      // Initialize User Doc in Firestore (Crucial for first login)
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email: email,
        displayName: name,
        theme: "DeepSpace",
        xp: 0,
        dailyXp: 0,
        streak: 0,
        board: "CBSE",
        class: "10"
      }, { merge: true });

      return res.user;
    } catch (error) {
      throw error;
    }
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const googleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Create user doc if it doesn't exist on Google Sign-in
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        lastLogin: Date.now()
      }, { merge: true });
      return result;
    } catch (error) {
      console.error("Google Auth Error:", error);
      throw error;
    }
  };

  const logout = () => signOut(auth);

  const value = {
    currentUser,
    register,
    login,
    logout,
    googleLogin,
    theme,
    setTheme,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
