/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545',
    NEXT_PUBLIC_DISPATCHER_URL: process.env.NEXT_PUBLIC_DISPATCHER_URL || 'http://localhost:3001',
  },
}

module.exports = nextConfig