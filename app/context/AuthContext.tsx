"use client";

import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, User } from "firebase/auth";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
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

        // Installed PWAs (manifest "display": "standalone") have no browser
        // chrome to host a popup window, so signInWithPopup reliably fails
        // there with auth/popup-blocked. Go straight to redirect in that case.
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
        if (isStandalone) {
            signInWithRedirect(auth, provider);
            return;
        }

        signInWithPopup(auth, provider).catch((error: FirebaseError) => {
            if (error.code === "auth/popup-blocked" || error.code === "auth/operation-not-supported-in-this-environment") {
                signInWithRedirect(auth, provider);
                return;
            }
            if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
                console.error("Google sign-in failed:", error);
            }
        });
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

        getRedirectResult(auth).catch((error) => console.error("Redirect sign-in failed:", error));

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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
