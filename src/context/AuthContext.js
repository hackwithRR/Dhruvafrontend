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
        let unsubscribeData = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            // Immediately update the user state so App.js knows if someone is there
            setCurrentUser(user);
            
            // Clean up previous Firestore listener to prevent memory leaks
            if (unsubscribeData) {
                unsubscribeData();
                unsubscribeData = null;
            }

            if (user) {
                const userDocRef = doc(db, "users", user.uid);
                
                // Start listening to the specific user document
                unsubscribeData = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    } else {
                        // Keep your original UI fallback logic
                        setUserData({ 
                            theme: "DeepSpace", 
                            displayName: user.displayName || "Scholar",
                            streak: 0 
                        });
                    }
                    // Stop the white screen/loader
                    setLoading(false);
                }, (err) => {
                    console.error("Firestore error:", err);
                    // Critical: if Firestore fails, we still need to let the user in
                    setLoading(false);
                });
            } else {
                // Clear data and stop loading for guests/logged-out users
                setUserData(null);
                setLoading(false);
            }
        });

        // Combined cleanup
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
            {/* children only render when loading is false to prevent undefined crashes */}
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
