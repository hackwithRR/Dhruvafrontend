import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

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
        let unsubscribeData = null; // Track the firestore listener separately

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            
            // Clean up existing firestore listener if auth state changes
            if (unsubscribeData) unsubscribeData();

            if (user) {
                const userDocRef = doc(db, "users", user.uid);
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
