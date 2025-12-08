// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
let auth: Auth;
let db: Firestore;

try {
    if (getApps().length > 0) {
        app = getApp();
    } else if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        app = initializeApp(firebaseConfig);
    }
} catch (error) {
    console.error("Firebase initialization error", error);
}

if (app) {
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    // Mock auth for build time or when keys are missing
    // This prevents build failures effectively
    auth = {} as Auth;
    db = {} as Firestore;
}

export { auth, db };
