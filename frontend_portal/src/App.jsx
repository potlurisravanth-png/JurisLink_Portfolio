import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Chat from './pages/Chat';
import LandingPage from './pages/LandingPage';
import NDAGenerator from './pages/NDAGenerator';
import TenantNotice from './pages/TenantNotice';
import DocumentReview from './pages/DocumentReview';
import LoginModal from './components/LoginModal';
import { AnimatePresence } from 'framer-motion';


// Helper to access Auth Context for the Modal (only shown on protected routes)
const AuthWrapper = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Don't require login on landing page or tool pages
  const publicPaths = ['/', '/tool/nda', '/tool/tenant', '/tool/document'];
  const isPublicPage = publicPaths.includes(location.pathname);

  return (
    <AnimatePresence>
      {!currentUser && !isPublicPage && <LoginModal />}
    </AnimatePresence>
  );
};

// Main App Shell
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <div className="relative flex h-screen w-screen bg-bg-app text-text-primary isolation-auto overflow-hidden font-sans">
            {/* GLOBAL DECORATIVE BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-bg-subtle/40 via-bg-app to-bg-app -z-10 pointer-events-none"></div>

            {/* ROUTING */}
            <Routes>
              {/* Landing Page - Tool Grid (No login required) */}
              <Route path="/" element={<LandingPage />} />

              {/* Tool Routes */}
              <Route path="/tool/chat" element={<Chat />} />
              <Route path="/tool/chat/:id" element={<Chat />} />
              <Route path="/tool/nda" element={<NDAGenerator />} />
              <Route path="/tool/tenant" element={<TenantNotice />} />
              <Route path="/tool/document" element={<DocumentReview />} />

              {/* Legacy route support */}
              <Route path="/case/:id" element={<Chat />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* GLOBAL MODALS */}
            <AuthWrapper />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

