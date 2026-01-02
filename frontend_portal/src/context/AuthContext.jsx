import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the Auth Context
const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth Provider Component (Demo Mode - Works without Firebase)
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('jurislink_user');
        const token = localStorage.getItem('jurislink_auth_token');

        if (storedUser && token) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch {
                setCurrentUser(null);
            }
        }
        setLoading(false);
    }, []);

    // Demo login function
    const loginWithDemo = async (email, provider = 'demo') => {
        const demoUser = {
            uid: 'demo-' + Date.now(),
            email: email || 'demo@jurislink.ai',
            displayName: email?.split('@')[0]?.replace(/[.-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Demo User',
            photoURL: null,
            provider: provider
        };

        localStorage.setItem('jurislink_auth_token', 'demo-token-' + Date.now());
        localStorage.setItem('jurislink_user', JSON.stringify(demoUser));
        setCurrentUser(demoUser);
        return demoUser;
    };

    // Login with Google (demo mode)
    const loginWithGoogle = async () => {
        setError(null);
        return loginWithDemo('user@gmail.com', 'google');
    };

    // Login with Microsoft (demo mode)
    const loginWithMicrosoft = async () => {
        setError(null);
        return loginWithDemo('user@outlook.com', 'microsoft');
    };

    // Login with GitHub (demo mode)
    const loginWithGitHub = async () => {
        setError(null);
        return loginWithDemo('user@github.com', 'github');
    };

    // Logout
    const logout = async () => {
        setError(null);
        localStorage.removeItem('jurislink_user');
        localStorage.removeItem('jurislink_auth_token');
        setCurrentUser(null);
    };

    const value = {
        currentUser,
        loading,
        error,
        demoMode: true, // Always in demo mode for now
        loginWithGoogle,
        loginWithMicrosoft,
        loginWithGitHub,
        loginWithDemo,
        logout,
        isAuthenticated: !!currentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
