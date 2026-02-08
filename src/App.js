function AppContent() {
  const location = useLocation();
  const { currentUser, loading } = useAuth();
  
  // 1. Standardize the default theme name to match your Navbar/Chat configs
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "DeepSpace");

  // 2. Sync local state with Cloud preference on login
  // This ensures that if the DB says 'Cyberpunk', the App switches to it immediately
  useEffect(() => {
    if (currentUser) {
      const { doc, onSnapshot } = require("firebase/firestore");
      const { db } = require("./firebase");
      
      const unsub = onSnapshot(doc(db, "users", currentUser.uid), (docSnap) => {
        if (docSnap.exists() && docSnap.data().theme) {
          const cloudTheme = docSnap.data().theme;
          setTheme(cloudTheme);
          localStorage.setItem("theme", cloudTheme);
        }
      });
      return () => unsub();
    }
  }, [currentUser]);

  // 3. Keep localStorage updated for guest sessions/initial loads
  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <>
      {/* Backgrounds now stay in sync with the current theme state */}
      <AnimatePresence mode="wait">
        {location.pathname === "/register" ? (
          <motion.div key="bg2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Background2 theme={theme} />
          </motion.div>
        ) : (
          <motion.div key="bg1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Background theme={theme} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route 
            path="/" 
            element={
              loading ? <LoadingScreen /> : 
              currentUser ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />
            } 
          />

          <Route path="/login" element={<AuthRedirect><PageTransition><LoginPage /></PageTransition></AuthRedirect>} />
          <Route path="/register" element={<AuthRedirect><PageTransition><Register /></PageTransition></AuthRedirect>} />
          
          <Route path="/chat" element={
            <ProtectedRoute>
              <PageTransition>
                {/* Prop injection: setTheme allows the Navbar inside Chat to update App.js */}
                <Chat theme={theme} setTheme={setTheme} />
              </PageTransition>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <PageTransition>
                <Profile theme={theme} setTheme={setTheme} />
              </PageTransition>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
