import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if API key is present
const hasFirebaseConfig = !!import.meta.env.VITE_FIREBASE_API_KEY;
const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;

if (!app) {
    console.warn('Firebase configuration missing. Authentication features will be disabled.');
}

// Initialize Analytics (only in browser)
let analytics = null;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}
export { analytics };
