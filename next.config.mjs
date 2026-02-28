/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.auth0.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 's.gravatar.com' },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'amqplib'],
    instrumentationHook: true,
  },
};

export default nextConfig;
