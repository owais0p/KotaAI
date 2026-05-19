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
    'preview-chat-335d8d86-291e-4275-a0d0-1b001c43aa04.space-z.ai',
  ],
};

export default nextConfig;
