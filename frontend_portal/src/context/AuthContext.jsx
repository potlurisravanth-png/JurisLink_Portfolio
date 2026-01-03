import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    auth,
    isFirebaseConfigured,
    googleProvider,
    microsoftProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
    onAuthStateChanged
} from '../lib/firebase';

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

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine if we're in demo mode (Firebase not configured)
    const demoMode = !isFirebaseConfigured();

    // Listen to Firebase auth state changes
    useEffect(() => {
        if (demoMode) {
            // Demo mode: Check localStorage
            const storedUser = localStorage.getItem('jurislink_user');
            if (storedUser) {
                try {
                    setCurrentUser(JSON.parse(storedUser));
                } catch {
                    setCurrentUser(null);
                }
            }
            setLoading(false);
            return;
        }

        // Real Firebase auth listener
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get ID token for API calls
                const idToken = await user.getIdToken();
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0],
                    photoURL: user.photoURL,
                    provider: user.providerData[0]?.providerId || 'unknown',
                    idToken: idToken
                };
                setCurrentUser(userData);
                localStorage.setItem('jurislink_user', JSON.stringify(userData));
            } else {
                setCurrentUser(null);
                localStorage.removeItem('jurislink_user');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [demoMode]);

    // Get fresh ID token (for API calls)
    const getIdToken = async () => {
        if (demoMode) {
            return 'demo-token';
        }
        if (auth.currentUser) {
            return await auth.currentUser.getIdToken(true);
        }
        return null;
    };

    // Demo login function (fallback when Firebase not configured)
    const loginWithDemo = async (email, provider = 'demo') => {
        const demoUser = {
            uid: 'demo-' + Date.now(),
            email: email || 'demo@jurislink.ai',
            displayName: email?.split('@')[0]?.replace(/[.-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Demo User',
            photoURL: null,
            provider: provider,
            idToken: 'demo-token-' + Date.now()
        };

        localStorage.setItem('jurislink_user', JSON.stringify(demoUser));
        setCurrentUser(demoUser);
        return demoUser;
    };

    // Login with Google
    const loginWithGoogle = async () => {
        setError(null);
        if (demoMode) {
            return loginWithDemo('user@gmail.com', 'google');
        }

        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (err) {
            console.error('Google Auth Error:', err);
            setError(getAuthErrorMessage(err.code));
            throw err;
        }
    };

    // Login with Microsoft
    const loginWithMicrosoft = async () => {
        setError(null);
        if (demoMode) {
            return loginWithDemo('user@outlook.com', 'microsoft');
        }

        try {
            const result = await signInWithPopup(auth, microsoftProvider);
            return result.user;
        } catch (err) {
            console.error('Microsoft Auth Error:', err);
            setError(getAuthErrorMessage(err.code));
            throw err;
        }
    };

    // Login with Email/Password
    const loginWithEmail = async (email, password) => {
        setError(null);
        if (demoMode) {
            return loginWithDemo(email, 'email');
        }

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (err) {
            console.error('Email Auth Error:', err);
            setError(getAuthErrorMessage(err.code));
            throw err;
        }
    };

    // Sign up with Email/Password
    const signUpWithEmail = async (email, password, displayName) => {
        setError(null);
        if (demoMode) {
            return loginWithDemo(email, 'email');
        }

        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Update display name
            if (displayName) {
                await updateProfile(result.user, { displayName });
            }
            return result.user;
        } catch (err) {
            console.error('SignUp Error:', err);
            setError(getAuthErrorMessage(err.code));
            throw err;
        }
    };

    // Logout
    const logout = async () => {
        setError(null);
        localStorage.removeItem('jurislink_user');
        localStorage.removeItem('jurislink_auth_token');

        if (!demoMode && auth) {
            await signOut(auth);
        }
        setCurrentUser(null);
    };

    // Helper to convert Firebase error codes to user-friendly messages
    const getAuthErrorMessage = (code) => {
        const messages = {
            'auth/invalid-email': 'Invalid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password must be at least 6 characters.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
            'auth/cancelled-popup-request': 'Sign-in was cancelled.',
            'auth/popup-blocked': 'Sign-in popup was blocked by your browser.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
        };
        return messages[code] || 'Authentication failed. Please try again.';
    };

    const value = {
        currentUser,
        loading,
        error,
        demoMode,
        getIdToken,
        loginWithGoogle,
        loginWithMicrosoft,
        loginWithEmail,
        signUpWithEmail,
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
