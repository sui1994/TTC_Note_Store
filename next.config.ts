import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.microcms-assets.io",
        port: "",
        pathname: "**",
      },
    ],
  },
  env: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  },
};

export default nextConfig;
