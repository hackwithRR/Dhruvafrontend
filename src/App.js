import React, { useState, useEffect } from "react";
import { useLocation, Routes, Route, Navigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore"; // Proper imports
import { db } from "./firebase"; // Proper imports
import { useAuth } from "./context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

// Import your components...
import Background from "./components/Background";
import Background2 from "./components/Background2";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";

function AppContent() {
    const location = useLocation();
    const { currentUser, loading } = useAuth();
    
    // Initial state from localStorage
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || "DeepSpace";
    });

    // 1. Sync local theme with Firebase Cloud preference
    useEffect(() => {
        if (!currentUser) return;

        const userRef = doc(db, "users", currentUser.uid);
        
        // This listener ensures that if you change theme in the Navbar, 
        // the App.js state updates, which then updates the Background.js
        const unsub = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const cloudTheme = docSnap.data().theme;
                if (cloudTheme && cloudTheme !== theme) {
                    setTheme(cloudTheme);
                    localStorage.setItem("theme", cloudTheme);
                }
            }
        });

        return () => unsub();
    }, [currentUser, theme]);

    // 2. Fallback: Save theme to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("theme", theme);
    }, [theme]);

    return (
        <>
            <AnimatePresence mode="wait">
                <motion.div 
                    key={location.pathname === "/register" ? "bg2" : "bg1"}
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {location.pathname === "/register" ? (
                        <Background2 theme={theme} />
                    ) : (
                        <Background theme={theme} />
                    )}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route path="/chat" element={
                        <Chat theme={theme} setTheme={setTheme} />
                    } />
                    
                    <Route path="/profile" element={
                        <Profile theme={theme} setTheme={setTheme} />
                    } />
                    
                    <Route path="*" element={<Navigate to="/chat" replace />} />
                </Routes>
            </AnimatePresence>
        </>
    );
}

// IMPORTANT: Ensure you have "export default AppContent;" or that this is 
// wrapped by the "App" component which is exported as default.
export default AppContent;
