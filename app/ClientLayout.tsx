"use client";

import { AuthContextProvider } from "./context/AuthContext";
import TopNav from "./components/TopNav";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthContextProvider>
            <TopNav />
            {children}
        </AuthContextProvider>
    );
}
