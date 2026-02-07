import { createContext, useContext, useState, useEffect } from "react";
import { auth, provider, db } from "../utils/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"; 
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

  // --- HELPER: FETCH OR CREATE FIRESTORE USER ---
  // This ensures Google users and Email users stay synced
  const syncUserWithFirestore = async (user) => {
    if (!user) return null;
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return { ...user, ...userDoc.data() };
    } else {
      // If it's a new Google user, create a basic doc so the app doesn't crash
      const basicData = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL, // Restore Google PFP
        createdAt: serverTimestamp(),
        board: "",
        classLevel: "",
        gender: ""
      };
      await setDoc(userRef, basicData);
      return { ...user, ...basicData };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const fullUser = await syncUserWithFirestore(user);
        setCurrentUser(fullUser);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const register = async (email, password, name, avatarUrl, gender) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { 
      displayName: name,
      photoURL: avatarUrl 
    });
    
    // Create Firestore doc immediately for manual registration
    const userData = {
      uid: res.user.uid,
      displayName: name,
      email: email,
      photoURL: avatarUrl,
      gender: gender,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, "users", res.user.uid), userData);

    setCurrentUser({ ...res.user, ...userData });
    return res;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // --- FIXED GOOGLE LOGIN ---
  const googleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, provider);
      const fullUser = await syncUserWithFirestore(res.user);
      setCurrentUser(fullUser);
      return res;
    } catch (error) {
      console.error("Google Login Error:", error);
      throw error;
    }
  };

  const logout = () => signOut(auth);

  const reloadUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const fullUser = await syncUserWithFirestore(auth.currentUser);
      setCurrentUser(fullUser);
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
