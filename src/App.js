import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { FaBrain } from "react-icons/fa";

import Background from "./components/Background";
import Background2 from "./components/Background2";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";

function AppContent() {
  const location = useLocation();
  // Ensure loading state is extracted from context
  const { currentUser, userData, loading } = useAuth();

  // FIX: If the app is still fetching the user, show a loader instead of a white screen
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] space-y-4">
        <FaBrain className="text-indigo-500 animate-pulse" size={40}/>
        <h2 className="text-white text-xs font-black uppercase tracking-[0.5em]">Initializing Dhruva OS...</h2>
      </div>
    );
  }

  const currentTheme = userData?.theme || "DeepSpace";

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
            <Background2 theme={currentTheme} />
          ) : (
            <Background theme={currentTheme} />
          )}
        </motion.div>
      </AnimatePresence>

      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/chat" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/chat" />} />
        
        {/* Protected Routes */}
        <Route path="/chat" element={currentUser ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/profile" element={currentUser ? <Profile /> : <Navigate to="/login" />} />
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
