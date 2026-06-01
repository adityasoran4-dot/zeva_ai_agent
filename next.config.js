/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "localhost",             // for local development
      "zeva360.com",     // for production
      "images.unsplash.com",   // for Unsplash images
    ],
  },
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true, // ✅ Build won't fail because of ESLint warnings/errors
  },
  // Fix for Windows symlink issues
  webpack: (config, { isServer }) => {
    // Handle Windows file system issues
    if (process.platform === 'win32') {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.next'],
      };
      // Disable symlink following on Windows to avoid EINVAL errors
      config.resolve = {
        ...config.resolve,
        symlinks: false,
      };
    }
    return config;
  },
  // Ensure proper file handling on Windows
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
