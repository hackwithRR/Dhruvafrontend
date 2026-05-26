import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // Assuming AuthContext provides loading state
import ThemeAwareLoader from './components/ThemeAwareLoader';

// Import your page components
import HomePage from './pages/HomePage'; // Example: Replace with your actual home page
import Profile from './pages/Profile';
import BannedPage from './pages/BannedPage';
// ... import other pages as needed

function App() {
  const { loading: authLoading, userData } = useAuth(); // Get loading state from AuthContext
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    // Simulate any other initial app-wide data fetching or setup that needs to complete
    // before the main app content is rendered.
    const initTimer = setTimeout(() => {
      setAppInitialized(true);
    }, 500); // Adjust this duration if your app has more initialization tasks
    return () => clearTimeout(initTimer);
  }, []);

  // Determine dark mode state. If userData has a theme config, use it.
  // Otherwise, ThemeAwareLoader will auto-detect from document.documentElement.
  const isDarkMode = userData?.themeConfig?.isDark; 

  // Display the ThemeAwareLoader if authentication is loading or the app is still initializing
  if (authLoading || !appInitialized) {
    return <ThemeAwareLoader isDarkMode={isDarkMode} />;
  }

  return (
    <Router>
      {/* Your main application layout and routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/banned" element={<BannedPage />} />
        {/* Add all your other routes here */}
      </Routes>
    </Router>
  );
}

export default App;