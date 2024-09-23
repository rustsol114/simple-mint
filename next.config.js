/** @type {import('next').NextConfig} */
// const nextConfig = {
// eslint: {
//     ignoreDuringBuilds: true,
//   },
// }

const nextConfig = {
    reactStrictMode: false,
    eslint: {
      ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        // Mock the 'fs' module on the client side
        config.resolve = config.resolve || {};
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
        };
      }
      return config;
    },
  };

module.exports = nextConfig
