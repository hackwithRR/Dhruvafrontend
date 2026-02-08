import React, { Suspense, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { FaBrain } from "react-icons/fa";

// Standardizing imports - ensure folder names (pages/components) match exactly in Git
import Background from "./components/Background";
import Background2 from "./components/Background2";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";

// Simple fallback to prevent white screen during internal transitions
const GlobalLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#050505] space-y-4">
    <FaBrain className="text-indigo-500 animate-pulse" size={40}/>
    <h2 className="text-white text-[10px] font-black uppercase tracking-[0.5em] opacity-50">
      Initializing Dhruva OS...
    </h2>
  </div>
);

function AppContent() {
  const location = useLocation();
  const { currentUser, userData, loading } = useAuth();

  // Guard against undefined context which triggers Error #130
  const theme = useMemo(() => userData?.theme || "DeepSpace", [userData]);

  if (loading) return <GlobalLoader />;

  return (
    <>
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname === "/register" ? "bg2" : "bg1"}
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="h-full w-full"
          >
            {location.pathname === "/register" ? (
              <Background2 theme={theme} />
            ) : (
              <Background theme={theme} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Routing Layer */}
      <div className="relative z-10">
        <Suspense fallback={<GlobalLoader />}>
          <Routes location={location} key={location.pathname}>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={!currentUser ? <LoginPage /> : <Navigate to="/chat" replace />} 
            />
            <Route 
              path="/register" 
              element={!currentUser ? <Register /> : <Navigate to="/chat" replace />} 
            />
            
            {/* Protected Routes */}
            <Route 
              path="/chat" 
              element={currentUser ? <Chat /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/profile" 
              element={currentUser ? <Profile /> : <Navigate to="/login" replace />} 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

// Main App Wrapper
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
