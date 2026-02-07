import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";
import { useEffect } from "react";
import { HelmetProvider } from 'react-helmet-async';

import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Background from "./components/Background";
import Background2 from "./components/Background2";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingScreen />; 
  return currentUser ? children : <Navigate to="/login" replace />;
};

const AuthRedirect = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return currentUser ? <Navigate to="/chat" replace /> : children;
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#05000a] flex flex-col items-center justify-center">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full mb-4"
    />
    <p className="text-purple-400 text-[10px] font-black tracking-widest animate-pulse uppercase">Initializing Dhruva...</p>
  </div>
);

const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
  >
    {children}
  </motion.div>
);

function AppContent() {
  const location = useLocation();
  const { currentUser, loading } = useAuth(); // Access auth state for root logic

  return (
    <>
      <AnimatePresence mode="wait">
        {location.pathname === "/register" ? (
          <motion.div key="bg2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Background2 />
          </motion.div>
        ) : (
          <motion.div key="bg1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Background />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* THE SMART ROOT: Decisions happen here */}
          <Route 
            path="/" 
            element={
              loading ? <LoadingScreen /> : 
              currentUser ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />
            } 
          />

          <Route path="/login" element={<AuthRedirect><PageTransition><LoginPage /></PageTransition></AuthRedirect>} />
          <Route path="/register" element={<AuthRedirect><PageTransition><Register /></PageTransition></AuthRedirect>} />
          
          <Route path="/chat" element={<ProtectedRoute><PageTransition><Chat /></PageTransition></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
          
          {/* Fallback for broken URLs */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
      <ToastContainer position="top-center" autoClose={2000} theme="dark" />
      </AuthProvider>
      </HelmetProvider>
  );
}

