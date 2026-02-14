import React, { Suspense, useMemo } from "react";
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
import LiveMode from "./pages/LiveMode";

const GlobalLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-[#05000a]">
    <FaBrain className="text-fuchsia-500 animate-pulse mb-4" size={40}/>
    <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
      <div className="h-full bg-fuchsia-500 animate-[loading_2s_ease-in-out_infinite]" />
    </div>
    <style>{`@keyframes loading { 0% { width: 0; } 50% { width: 100%; } 100% { width: 0; } }`}</style>
  </div>
);

function AppContent() {
  const location = useLocation();
  const { currentUser, userData, loading } = useAuth();
  
  // Guard theme against null userData
  const theme = useMemo(() => userData?.theme || "DeepSpace", [userData]);

  // If AuthContext is still initializing, show Loader
  if (loading) return <GlobalLoader />;

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div 
            key={location.pathname === "/register" ? "bg2" : "bg1"}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-full w-full"
          >
            {location.pathname === "/register" ? <Background2 theme={theme} /> : <Background theme={theme} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10">
        <Suspense fallback={<GlobalLoader />}>
          <Routes location={location}>
            {/* PUBLIC ROUTES */}
            <Route 
              path="/login" 
              element={!currentUser ? <LoginPage /> : <Navigate to="/chat" replace />} 
            />
            <Route 
              path="/register" 
              element={!currentUser ? <Register /> : <Navigate to="/chat" replace />} 
            />
            
            {/* PROTECTED ROUTES - The "Double Guard" Fix */}
            <Route 
              path="/chat" 
              element={
                currentUser ? (
                  userData ? <Chat /> : <GlobalLoader />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/profile" 
              element={
                currentUser ? (
                  userData ? <Profile /> : <GlobalLoader />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/live" 
              element={
                currentUser ? (
                  userData ? <LiveMode /> : <GlobalLoader />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            <Route 
              path="/livemode" 
              element={
                currentUser ? (
                  userData ? <LiveMode /> : <GlobalLoader />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            
            {/* FALLBACK */}
            <Route path="*" element={<Navigate to={currentUser ? "/chat" : "/login"} replace />} />
          </Routes>
        </Suspense>
      </div>
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
