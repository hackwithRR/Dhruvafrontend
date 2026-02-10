import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../firebase"; // Added googleProvider import
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    signOut 
} from "firebase/auth"; // Added missing Firebase methods
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // --- NEW: Added these without changing your existing state logic ---
    const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
    const logout = () => signOut(auth);
    const googleLogin = async () => {
        try {
            const res = await signInWithPopup(auth, googleProvider);
            const userDocRef = doc(db, "users", res.user.uid);
            await setDoc(userDocRef, {
                uid: res.user.uid,
                name: res.user.displayName,
                email: res.user.email,
                pfp: res.user.photoURL,
                theme: "DeepSpace",
                createdAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Google login failed", error);
        }
    };

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
            
            if (unsubscribeData) {
                unsubscribeData();
                unsubscribeData = null;
            }

            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                
                // --- YOUR ORIGINAL SNAPSHOT LOGIC ---
                unsubscribeData = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    } else {
                        setUserData({ 
                            theme: "DeepSpace", 
                            displayName: user.displayName || "Scholar",
                            streak: 0 
                        });
                    }
                    setLoading(false);
                }, (err) => {
                    console.error("Firestore error:", err);
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
        register,    // Added
        logout,      // Added
        googleLogin, // Added
        setTheme: updateTheme
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

