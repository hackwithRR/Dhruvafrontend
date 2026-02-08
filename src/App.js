import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

import Background from "./components/Background";
import Background2 from "./components/Background2";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";

// This component lives INSIDE AuthProvider
function AppContent() {
    const location = useLocation();
    const { currentUser } = useAuth();
    
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem("theme") || "DeepSpace";
    });

    useEffect(() => {
        if (!currentUser) return;

        const userRef = doc(db, "users", currentUser.uid);
        const unsub = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const cloudTheme = docSnap.data().theme;
                if (cloudTheme && cloudTheme !== theme) {
                    setTheme(cloudTheme);
                    localStorage.setItem("theme", cloudTheme);
                }
            }
        }, (error) => {
            console.error("Firestore Theme Sync Error:", error);
        });

        return () => unsub();
    }, [currentUser, theme]);

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
                    <Route path="/chat" element={<Chat theme={theme} setTheme={setTheme} />} />
                    <Route path="/profile" element={<Profile theme={theme} setTheme={setTheme} />} />
                    <Route path="*" element={<Navigate to="/chat" replace />} />
                </Routes>
            </AnimatePresence>
        </>
    );
}

// THIS IS THE DEFAULT EXPORT THAT INDEX.JS NEEDS
export default function App() {
    return <AppContent />;
}
