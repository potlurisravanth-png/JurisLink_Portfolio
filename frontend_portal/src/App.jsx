import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Chat from './pages/Chat';
import LoginModal from './components/LoginModal';
import ProfileMenu from './components/ProfileMenu';
import { AnimatePresence } from 'framer-motion';
import { FolderOpen, Download } from 'lucide-react';
import './App.css';

// Main Layout with Auth Overlay & Sidebar
const AppLayout = () => {
  const { currentUser, loading } = useAuth();
  // In a real app, this state would track selected cases
  const [cases] = useState([
    { id: '1', title: 'Smith vs. Daily Corp', date: '2 hrs ago' },
    { id: '2', title: 'Estate Review 2024', date: '1 day ago' },
  ]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden">
      {/* 1. Sidebar (Case Files) - Hidden on mobile, fixed left on desktop */}
      <aside className="hidden md:flex w-64 lg:w-72 border-r border-white/5 bg-slate-900/30 backdrop-blur-sm flex-col z-20">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">J</span>
            JurisLink
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2">Recent Cases</div>
          <div className="space-y-1">
            {cases.map((c) => (
              <button key={c.id} className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 text-left transition-colors group">
                <FolderOpen size={16} className="text-slate-400 group-hover:text-blue-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-slate-300 group-hover:text-white">{c.title}</div>
                  <div className="text-xs text-slate-500">{c.date}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <button className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-900/20 active:scale-95">
            <Download size={16} />
            Download Portfolio
          </button>
        </div>
      </aside>

      {/* 2. Main Chat Area */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header: Profile Menu (Top Right) */}
        <header className="absolute top-4 right-4 z-30">
          <ProfileMenu />
        </header>

        {/* Routes/Content */}
        <div className="flex-1 relative h-full">
          {/* Pass down props if needed to Chat */}
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/case/:id" element={<Chat />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>

      {/* 3. Login Modal (Conditionally Rendered) - Higher Z-Index */}
      <AnimatePresence>
        {!currentUser && <LoginModal />}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
