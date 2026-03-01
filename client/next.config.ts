import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Optimised for containerised / serverless deployments
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Avatar CDN
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost", // Local dev
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.up.railway.app", // Railway backend assets
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
