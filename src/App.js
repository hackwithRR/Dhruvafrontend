import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

import Background from "./components/Background";
import Background2 from "./components/Background2";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";

function AppContent() {
  const location = useLocation();
  const { theme, setTheme } = useAuth();

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

      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<Chat theme={theme} setTheme={setTheme} />} />
        <Route path="/profile" element={<Profile theme={theme} setTheme={setTheme} />} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </>
  );
}

// THIS IS THE ONLY ROUTER IN THE ENTIRE APP
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
