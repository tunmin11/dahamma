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
  // Proxy Firebase Auth's OAuth handler pages through our own domain so we
  // can use authDomain=9nawin.vercel.app instead of the default
  // <project>.firebaseapp.com, which has no Firebase Hosting site deployed
  // behind it (that domain 404s on /__/firebase/init.json).
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
