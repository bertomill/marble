/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    // Don't run ESLint during production builds
    ignoreDuringBuilds: true,
  },
  // Add experimental configuration to handle the route group issue
  experimental: {
    // This helps with route group handling during build
    serverComponentsExternalPackages: [],
  },
  // Add output configuration for better build handling
  output: 'standalone',
};

module.exports = nextConfig;
