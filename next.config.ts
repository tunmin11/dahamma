import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // disableSwcMinify: true,  // Remove swcMinify as it's not a valid option
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // Proxy Firebase Auth's OAuth handler pages through our own domain so the
  // whole signInWithRedirect flow stays same-origin (only the necessary hop
  // to accounts.google.com leaves it). Without this, authDomain points at
  // <project>.firebaseapp.com, a different origin than the app — on iOS
  // "Add to Home Screen" PWAs that cross-origin hop drops the app out of
  // its standalone storage container, so getRedirectResult() never sees the
  // signed-in user after the redirect returns.
  // Requires NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=9nawin.vercel.app and a custom
  // OAuth client authorizing https://9nawin.vercel.app/__/auth/handler —
  // Google's auto-managed OAuth client only syncs redirect URIs for
  // *.firebaseapp.com/*.web.app, not custom domains.
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://dhamma-universe.firebaseapp.com/__/auth/:path*",
      },
      {
        source: "/__/firebase/:path*",
        destination: "https://dhamma-universe.firebaseapp.com/__/firebase/:path*",
      },
    ];
  },
};

export default withPWA(nextConfig);
