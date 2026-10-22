/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['172.24.83.72', 'localhost'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
