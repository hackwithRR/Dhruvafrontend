import React, { Suspense, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Background from "./components/Background";
import Background2 from "./components/Background2";
import LoadingOverlay from "./components/LoadingOverlay";
import ClickSpark from "./components/ClickSpark";
import { useAuth } from "./context/AuthContext";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Statistics from "./pages/Statistics";
import LoginPage from "./pages/LoginPage";
import Register from "./pages/Register";
import LiveMode from "./pages/LiveMode";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import PYQPage from "./pages/PYQPage";
import ComplaintMail from "./pages/ComplaintMail";
import BanComplaintMail from "./pages/BanComplaintMail";

import AdminProtectedRoute from "./components/AdminProtectedRoute";

import BanEnforcement from "./components/BanEnforcement";
import BannedPage from "./pages/BannedPage";
import DebugBanBanner from "./components/DebugBanBanner";
// Removed unused Admin imports

function AppContent() {
  const location = useLocation();
  const { currentUser, userData, loading } = useAuth();
  const isBanned =
    userData?.isBanned === true ||
    userData?.ban_reason != null ||
    userData?.banReason != null ||
    userData?.banned_at != null ||
    userData?.ban?.reason != null ||
    userData?.ban?.at != null;
  const [showLoader, setShowLoader] = useState(true);

  // Check if current user is an admin based on the whitelist in firestore.rules
  const isAdmin = useMemo(() => {
    const phone = currentUser?.phoneNumber;
    return phone && ['+919148860082', '+919123456789'].includes(phone);
  }, [currentUser]);
  
  // Guard theme against null userData - use default theme during initial load
  const theme = useMemo(() => userData?.theme || "DeepSpace", [userData]);

  // Handle initial page load with 2-second minimum loader
  const handleLoadingComplete = () => {
    setShowLoader(false);
  };

  // Show the loading overlay during initial page load (minimum 2 seconds)
  if (showLoader) {
    return (
      <LoadingOverlay 
        duration={2000} 
        onComplete={handleLoadingComplete}
        theme={theme}
      />
    );
  }

  // If AuthContext is still initializing after our loader, show loader again
  if (loading) {
    return (
      <LoadingOverlay 
        duration={1500} 
        onComplete={() => {}}
        theme={theme}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
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
        <Suspense fallback={<LoadingOverlay duration={1500} theme={theme} />}>
          <DebugBanBanner />
          <Routes location={location}>
            {/* Debug: ensure auth/userData is populating */}
            {/* PUBLIC ROUTES */}



            <Route 
              path="/login" 
              element={!currentUser ? <LoginPage /> : <Navigate to="/chat" replace />} 
            />
            <Route 
              path="/register" 
              element={!currentUser ? <Register /> : <Navigate to="/chat" replace />} 
            />
            
            {/* ADMIN ROUTES */}
            <Route 
              path="/adminlogin" 
              element={<AdminLogin />} 
            />
            <Route 
              path="/admin" 
              element={
                <AdminProtectedRoute>
                  <AdminPanel />
                </AdminProtectedRoute>
              } 
            />
            
            {/* Ban enforced route */}
            <Route
              path="/banned"
              element={
                // Allow access if the user is banned OR if they are an admin reviewing a case
                isBanned || isAdmin ? (
                  <BannedPage />
                ) : (
                  // If unbanned, immediately move them back to app
                  <Navigate to="/chat" replace />
                )
              }
            />


            {/* Ban appeal route */}
            <Route
              path="/cimplaint"
              element={
                currentUser ? (
                  userData ? <BanComplaintMail /> : <LoadingOverlay duration={1500} theme={theme} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* PROTECTED ROUTES */}
            <Route
              path="/chat"

              element={
                isBanned ? (
                  <Navigate to="/banned" replace />
                ) : currentUser ? (
                  userData ? <Chat /> : <LoadingOverlay duration={1500} theme={theme} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/"
              element={<Navigate to={currentUser ? "/chat" : "/login"} replace />}
            />

            <Route
              path="/profile"
              element={
                currentUser ? (
                  userData ? <Profile /> : <LoadingOverlay duration={1500} theme={theme} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/live"
              element={
                currentUser ? (
                  userData ? <LiveMode /> : <LoadingOverlay duration={1500} theme={theme} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/livemode"
              element={
                currentUser ? (
                  userData ? <LiveMode /> : <LoadingOverlay duration={1500} theme={theme} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/pyq"
              element={
                currentUser ? (
                  userData ? <PYQPage /> : <LoadingOverlay duration={1500} theme={theme} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/statistics"
              element={
                currentUser ? (
                  userData ? <Statistics /> : <LoadingOverlay duration={1500} theme={theme} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* COMPLAINT (mail template) */}
            <Route
              path="/complaint"
              element={
                currentUser ? (
                  userData ? <ComplaintMail /> : <LoadingOverlay duration={1500} theme={theme} />
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

const themes = {
  DeepSpace: { primaryHex: "#4f46e5" },
  Light: { primaryHex: "#4f46e5" },
  Sakura: { primaryHex: "#ec4899" },
  Cyberpunk: { primaryHex: "#06b6d4" },
  RoyalParchment: { primaryHex: "#b45309" },
  MidnightAurora: { primaryHex: "#10b981" },
  SunsetDrift: { primaryHex: "#f97316" },
  Phantom: { primaryHex: "#ffffff" },
  Solaris: { primaryHex: "#facc15" },
  Aero: { primaryHex: "#94a3b8" },
  Toxic: { primaryHex: "#a3e635" },
  Synthwave: { primaryHex: "#22d3ee" },
  Coffee: { primaryHex: "#d6c5bb" },
  RetroTerminal: { primaryHex: "#22c55e" },
  Blueprint: { primaryHex: "#ffffff" },
  Clay: { primaryHex: "#57534e" },
  Radioactive: { primaryHex: "#000000" },
  Amethyst: { primaryHex: "#c084fc" },
  CrimsonOLED: { primaryHex: "#dc2626" },
  Industrial: { primaryHex: "#f97316" },
  MidnightSun: { primaryHex: "#fbbf24" }
};

function AppWithSparks({ children }) {
  const { userData } = useAuth();
  const themeKey = userData?.theme || "DeepSpace";
  const sparkColor = themes[themeKey]?.primaryHex || "#60a5fa";

  return (
    <ClickSpark 
      sparkColor={sparkColor} 
      sparkSize={8} 
      sparkRadius={12} 
      sparkCount={6} 
      duration={300}
      global={true}
    >
      {children}
    </ClickSpark>
  );
}

export default function App() {
  return (
    <Router>
      <AppWithSparks>
        <AppContent />
      </AppWithSparks>
    </Router>
  );
}
