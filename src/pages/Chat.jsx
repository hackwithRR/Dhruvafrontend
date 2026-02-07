import { createContext, useContext, useState, useEffect } from "react";
import { auth, db, provider } from "../firebase"; // Ensure db is imported
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut, 
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  // Update theme globally
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let unsubFirestore = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // --- REAL-TIME FIRESTORE SYNC ---
        // This ensures Board/Class/PFP are always in sync across the app
        unsubFirestore = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          const firestoreData = docSnap.exists() ? docSnap.data() : {};
          setCurrentUser({
            ...user,
            ...firestoreData, // Merges Board, Class, Gender, etc.
            displayName: firestoreData.displayName || user.displayName,
            photoURL: firestoreData.photoURL || user.photoURL
          });
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubFirestore();
    };
  }, []);

  const register = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { displayName: name });
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const googleLogin = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      register, 
      login, 
      logout, 
      googleLogin,
      theme,
      setTheme
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
        </div>
    );
}
