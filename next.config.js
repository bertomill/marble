/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    // Don't run ESLint during production builds
    ignoreDuringBuilds: true,
  },
  // Add output configuration for better build handling
  output: 'standalone',
  
  // Updated from experimental.serverComponentsExternalPackages to root level serverExternalPackages
  serverExternalPackages: [
    'firebase-admin',
    'jsdom',
    'puppeteer',
    'puppeteer-core',
    'sharp'
  ],
};

module.exports = nextConfig;
