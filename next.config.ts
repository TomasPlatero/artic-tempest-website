import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.google.com",
      },
      {
        protocol: "https",
        hostname: "vrniyndhfaawwqzcrqng.supabase.co",
      },
      {
        protocol: "https",
        hostname: "render.worldofwarcraft.com",
      },
    ],
  },
};

export default nextConfig;
