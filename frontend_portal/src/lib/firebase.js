// Firebase configuration for JurisLink
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    OAuthProvider,
    connectAuthEmulator
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Load Configuration from Environment Variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// 2. Validate Configuration
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId;

let auth = null;
let db = null;
const googleProvider = new GoogleAuthProvider();
// Microsoft Provider configuration
const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
    // Force re-consent to ensure permissions are granted
    prompt: 'consent',
    // Legal-specific tenant if needed, otherwise common
    tenant: 'common'
});

const githubProvider = new OAuthProvider('github.com');
let firebaseInitialized = false;

if (isConfigValid) {
    try {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        firebaseInitialized = true;
        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
    }
} else {
    console.warn('⚠️ Firebase Config Missing. Check .env file. App running in Demo Mode.');
    // In demo mode, auth and db remain null, consistent with AuthContext fallback
}

export {
    auth,
    db,
    googleProvider,
    microsoftProvider,
    githubProvider,
    firebaseInitialized
};
