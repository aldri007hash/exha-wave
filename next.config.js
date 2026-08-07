const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", port: "", pathname: "/**" },
    ],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async redirects() {
    return [
      { source: '/about', destination: '/#tentang', permanent: false },
      { source: '/faq', destination: '/#faq', permanent: false },
      { source: '/contact', destination: '/', permanent: false },
    ]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
