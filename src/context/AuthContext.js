import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../firebase"; 
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    signOut 
} from "firebase/auth"; 
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- LOGIN (Email/Password) ---
    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    // --- REGISTER (Email/Password) ---
    // UPDATED: Now accepts gender and avatarUrl to prevent blank profile fields
    const register = async (email, password, name, gender, avatarUrl) => {
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, "users", res.user.uid);
            
            // CRITICAL: We await this write so the profile exists before navigation
            await setDoc(userDocRef, {
                uid: res.user.uid,
                name: name,                // For Dhruva AI Backend
                displayName: name,         // For Firebase Auth UI
                email: res.user.email,
                pfp: avatarUrl,            // Selected Avatar from Register.jsx
                gender: gender,            // Selected Gender
                theme: "dark",             // Default Theme
                classLevel: "8",           // Default
                board: "ICSE",             // Default
                language: "English",       // Default
                createdAt: serverTimestamp()
            });
            
            return res;
        } catch (error) {
            throw error; 
        }
    };

    // --- GOOGLE LOGIN ---
    const googleLogin = async () => {
        try {
            const res = await signInWithPopup(auth, googleProvider);
            const userDocRef = doc(db, "users", res.user.uid);
            
            // merge: true ensures we don't overwrite existing data on returning users
            await setDoc(userDocRef, {
                uid: res.user.uid,
                displayName: res.user.displayName,
                name: res.user.displayName,
                email: res.user.email,
                pfp: res.user.photoURL,
                createdAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Google login failed", error);
        }
    };

    // --- LOGOUT ---
    const logout = () => signOut(auth);

    // --- THEME UPDATE ---
    const updateTheme = async (newTheme) => {
        if (!currentUser) return;
        try {
            const userRef = doc(db, "users", currentUser.uid);
            await updateDoc(userRef, { theme: newTheme });
        } catch (error) {
            console.error("Error updating theme:", error);
        }
    };

    useEffect(() => {
        let unsubscribeData = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            
            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                
                // Real-time listener: This automatically updates userData across the app
                unsubscribeData = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    }
                    setLoading(false);
                }, (err) => {
                    console.error("Firestore snapshot error:", err);
                    setLoading(false);
                });
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeData) unsubscribeData();
        };
    }, []);

    const value = {
        currentUser,
        userData,
        loading,
        register,
        login,
        logout,
        googleLogin,
        setTheme: updateTheme
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
