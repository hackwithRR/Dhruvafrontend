import { createContext, useContext, useState, useEffect } from "react";
import { auth, provider, db } from "../utils/firebase"; // Added db
import { doc, getDoc } from "firebase/firestore"; // Added Firestore methods
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
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark"); // Added for Profile.jsx

  // Sync theme with localStorage
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // --- THE FIX: Fetch Firestore data when the user logs in ---
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            // Merge Auth data with Firestore custom data (gender, etc.)
            setCurrentUser({ ...user, ...userDoc.data() });
          } else {
            setCurrentUser(user);
          }
        } catch (error) {
          console.error("Error fetching user metadata:", error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Updated to accept avatarUrl and gender for initial state
  const register = async (email, password, name, avatarUrl, gender) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(res.user, { 
      displayName: name,
      photoURL: avatarUrl 
    });
    
    // Set current user locally with the gender so it shows up immediately
    setCurrentUser({ 
      ...res.user, 
      displayName: name, 
      photoURL: avatarUrl,
      gender: gender 
    });
    return res; // Return response so Register.jsx can handle Firestore save
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const googleLogin = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const reloadUser = async () => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
        // Fetch the latest Firestore data during reload
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        const firestoreData = userDoc.exists() ? userDoc.data() : {};
        
        setCurrentUser({ ...auth.currentUser, ...firestoreData });
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
      theme,      // Added for Profile.jsx
      setTheme    // Added for Profile.jsx
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
