/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545',
    NEXT_PUBLIC_DISPATCHER_URL: process.env.NEXT_PUBLIC_DISPATCHER_URL || 'http://localhost:3001',
  },
  // Add webpack config to handle node modules that aren't browser compatible
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "bufferutil": false,
      "utf-8-validate": false,
    };
    return config;
  },
}

module.exports = nextConfig