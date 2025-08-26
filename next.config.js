/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Disabled to allow API routes and dynamic features
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  optimizeFonts: false,
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;