"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut, Auth } from "firebase/auth";
import { auth } from "../firebase/config";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    googleSignIn: () => void;
    logOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    googleSignIn: () => { },
    logOut: () => { },
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const googleSignIn = () => {
        // Check if auth is a valid instance (has currentUser property or similar internal struct)
        // or just check if our config initialization succeeded.
        if (!auth || !auth.app) {
            console.warn("Firebase Auth not initialized. Check your environment variables.");
            return;
        }
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider);
    };

    const logOut = () => {
        if (!auth || !auth.app) return;
        signOut(auth);
    };

    useEffect(() => {
        if (!auth || !auth.app) {
            console.warn("Auth not initialized for context.");
            setLoading(false);
            return;
        }

        // Explicitly set persistence to LOCAL
        // Note: This is usually default, but good to ensure.
        import("firebase/auth").then(({ setPersistence, browserLocalPersistence }) => {
            setPersistence(auth, browserLocalPersistence)
                .then(() => console.log("🔐 Auth Persistence set to LOCAL"))
                .catch((e) => console.error("Could not set auth persistence:", e));
        });

        console.log("👀 Auth Context: Listening for state changes...");
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            // Log the user state change
            if (currentUser) {
                console.log("✅ User Sign-In Detected:", currentUser.email, currentUser.uid);
            } else {
                console.log("👋 User is currently signed out.");
            }
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, googleSignIn, logOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
