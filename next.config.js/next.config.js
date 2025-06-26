/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true 
  },
  // Removed output: 'export' to enable dynamic pages
  experimental: {
    esmExternals: false,
  },
};

module.exports = nextConfig;