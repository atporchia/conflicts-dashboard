/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is default in Next.js 16
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;