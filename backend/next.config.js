/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Enable CORS headers for API routes so Angular frontend can easily communicate
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Range, Authorization" },
          { key: "Access-Control-Expose-Headers", value: "Content-Disposition, Content-Length, Content-Range" }
        ]
      }
    ];
  }
};

module.exports = nextConfig;

