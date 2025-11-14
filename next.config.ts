import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Enable strict mode for better error catching
  reactStrictMode: true,
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
