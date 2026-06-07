/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly disabled static export to allow API routes and dynamic features
  // output: 'export', // DO NOT ENABLE - This app requires server-side features
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build (Vercel will still show them)
    ignoreBuildErrors: false,
  },
  images: {
    // Enable image optimization with WebP/AVIF support
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // Optimize images for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Enable font optimization
  optimizeFonts: true,
  // Compress responses
  compress: true,
  // Enable SWC minification
  swcMinify: true,
  // Performance optimizations
  experimental: {
    optimizeCss: true, // Now enabled with critters installed
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    // Enable webpack caching for faster builds
    if (!isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    // Handle PhonePe SDK module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;