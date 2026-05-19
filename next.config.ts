import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'space-z.ai',
    '.space-z.ai',
    'localhost',
    'preview-chat-dc1248b8-2343-4da0-9185-bf7eefae5e01.space-z.ai',
  ],
};

export default nextConfig;
