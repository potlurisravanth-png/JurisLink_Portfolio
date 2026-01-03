import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Chat from './pages/Chat';
import LoginModal from './components/LoginModal';
import { AnimatePresence } from 'framer-motion';


// Helper to access Auth Context for the Modal
const AuthWrapper = () => {
  const { currentUser } = useAuth();
  return (
    <AnimatePresence>
      {!currentUser && <LoginModal />}
    </AnimatePresence>
  );
};

// Main App Shell
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="relative flex h-screen w-screen bg-bg-app text-text-primary isolation-auto overflow-hidden font-sans">
          {/* GLOBAL DECORATIVE BACKGROUND */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-bg-subtle/40 via-bg-app to-bg-app -z-10 pointer-events-none"></div>

          {/* ROUTING - Chat.jsx handles its own layout (Sidebars + Content) */}
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/case/:id" element={<Chat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* GLOBAL MODALS */}
          <AuthWrapper />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
