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
  
  // Add webpack configuration for video files
  webpack(config) {
    // Method 1: Using file-loader (traditional approach)
    config.module.rules.push({
      test: /\.(mp4|webm)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media/',
          outputPath: 'static/media/',
          name: '[name].[hash].[ext]',
        },
      },
    });

    // Method 2: Using asset modules (newer webpack approach)
    config.module.rules.push({
      test: /\.(mp4|webm|ogg)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/media/[name].[hash][ext]',
      },
    });

    return config;
  },
  
  // Add security headers configuration
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'self' data: blob: filesystem: about: ws: wss: 'unsafe-inline' 'unsafe-eval' 'unsafe-dynamic'; script-src * 'self' data: blob: 'unsafe-inline' 'unsafe-eval' 'unsafe-dynamic'; connect-src * 'self' data: blob: http: https:; img-src * 'self' data: blob: http: https:; frame-src * 'self' data: blob: http: https:; style-src * 'self' 'unsafe-inline' http: https: data:; font-src * 'self' data: http: https:; media-src * 'self' data: blob: http: https:;",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
