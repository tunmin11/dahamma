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

        // Explicitly set persistence to LOCAL
        // Note: This is usually default, but good to ensure.
        import("firebase/auth").then(({ setPersistence, browserLocalPersistence }) => {
            setPersistence(auth, browserLocalPersistence)
                .then(() => console.log("🔐 Auth Persistence set to LOCAL"))
                .catch((e) => console.error("Could not set auth persistence:", e));
        });

        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    console.log("✅ Redirect Sign-In Detected:", result.user.email);
                }
            })
            .catch((error) => console.error("Redirect sign-in failed:", error));

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
