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

  // Determine if the current user is a whitelisted admin
  const isAdmin = useMemo(() => {
    const phone = currentUser?.phoneNumber;
    return phone && ['+919148860082', '+919123456789', '+919876543210'].includes(phone);
  }, [currentUser]);

  // Robust ban check: Sync with firestore.rules logic.
  const isBanned = useMemo(() => {
    if (!userData) return false;
    return Boolean(
      userData.isBanned === true ||
      userData.is_banned === true ||
      userData.banReason ||
      userData.ban_reason ||
      userData.banned_at ||
      (userData.ban && userData.ban.reason)
    );
  }, [userData]);

  // Define paths that are always allowed for ANY user (banned or not)
  // These are the ban page itself, the appeal page, and login/register.
  const alwaysAllowedPaths = ["/banned", "/cimplaint", "/login", "/register"];

  // Define paths that are allowed ONLY for admins (even if they are personally banned)
  const adminOnlyAllowedPaths = ["/admin", "/adminlogin"];

  // Determine if the current path is one of the globally allowed paths
  const currentPath = location.pathname.toLowerCase();
  const isCurrentPathGloballyAllowed = alwaysAllowedPaths.includes(currentPath);
  const isCurrentPathAdminOnlyAllowed = adminOnlyAllowedPaths.some(path => currentPath.startsWith(path));

  // A user should be locked down if they are banned AND
  // - the current path is NOT globally allowed
  // - the current path is NOT an admin-only path OR they are NOT an admin
  const shouldLockdown = isBanned && !(isCurrentPathGloballyAllowed || (isAdmin && isCurrentPathAdminOnlyAllowed));

  const [showLoader, setShowLoader] = useState(true);
  
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

  // GLOBAL GUARD: Intercept before Routes are even evaluated
  if (shouldLockdown) {
    return <Navigate to="/banned" replace />;
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
              element={!currentUser ? <LoginPage /> : <Navigate to={isBanned ? "/banned" : "/chat"} replace />} 
            />
            <Route 
              path="/register" 
              element={!currentUser ? <Register /> : <Navigate to={isBanned ? "/banned" : "/chat"} replace />} 
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
                // If the user is not banned (isBanned is false) AND they are not an admin reviewing a user (targetUid is null),
                // then they should not be on /banned. Redirect them to /chat.
                // If they are banned, or an admin reviewing, render BannedPage.
                (isBanned || (isAdmin && location.search.includes('uid='))) ? (
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
                currentUser ? (
                  userData ? <Chat /> : <LoadingOverlay duration={1500} theme={theme} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/"
              element={<Navigate to={isBanned ? "/banned" : currentUser ? "/chat" : "/login"} replace />}
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
            <Route path="*" element={<Navigate to={isBanned ? "/banned" : currentUser ? "/chat" : "/login"} replace />} />
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
