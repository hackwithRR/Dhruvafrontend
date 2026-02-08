import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Function to update theme in Firestore
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
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            
            if (user) {
                // Real-time listener for user profile/theme
                const userDocRef = doc(db, "users", user.uid);
                const unsubscribeData = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    } else {
                        // Fallback if user doc doesn't exist yet
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

                return () => unsubscribeData();
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const value = {
        currentUser,
        userData,
        loading,
        setTheme: updateTheme // Ensure this is named consistently with your App.js usage
    };

    return (
        <AuthContext.Provider value={value}>
            {/* CRITICAL: We only render children when loading is false 
               to prevent App.js from trying to read userData.theme 
               while it is still null.
            */}
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
