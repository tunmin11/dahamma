"use client";

import Login from "./Login";

export default function TopNav() {
    return (
        <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
            <Login />
        </div>
    );
}
