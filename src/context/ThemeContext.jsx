import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [theme, setThemeState] = useState(localStorage.getItem("theme") || "DeepSpace");

    // Function to update theme locally and in Firebase
    const setTheme = async (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
        if (currentUser) {
            try {
                await updateDoc(doc(db, "users", currentUser.uid), { theme: newTheme });
            } catch (err) {
                console.error("Theme Sync Error:", err);
            }
        }
    };

    // Listen for changes from other devices/sessions
    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
            if (docSnap.exists() && docSnap.data().theme) {
                const cloudTheme = docSnap.data().theme;
                setThemeState(cloudTheme);
                localStorage.setItem("theme", cloudTheme);
            }
        });
        return () => unsub();
    }, [currentUser]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
