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
  
  // Add security headers configuration
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.marble.dev https://*.googleapis.com https://*.googletagmanager.com https://*.google.com https://vercel.live https://*.vercel.app; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.googleapis.com; media-src 'self' data: blob:; connect-src 'self' https://www.marble.dev https://*.googleapis.com https://*.google.com https://*.firebaseio.com https://*.cloudfunctions.net; font-src 'self' data:; frame-src 'self' https://*.firebaseapp.com;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
