import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config, { dev }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic",
        minimize: true,
      };
    }
    return config;
  },
};

export default nextConfig;
