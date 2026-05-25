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
  experimental: {
    optimizePackageImports: ["ethers", "viem", "@tanstack/react-query"],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/:path*.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic",
        chunkIds: "deterministic",
        minimize: true,
      };

      if (!isServer) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const WebpackObfuscator = require("webpack-obfuscator");
          config.plugins.push(
            new WebpackObfuscator(
              {
                compact: true,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                debugProtection: false,
                disableConsoleOutput: true,
                identifierNamesGenerator: "hexadecimal",
                renameGlobals: false,
                rotateStringArray: true,
                selfDefending: false,
                stringArray: true,
                stringArrayThreshold: 0.4,
                transformObjectKeys: false,
                unicodeEscapeSequence: false,
              },
              ["**/node_modules/**", "**/webpack/**", "**/framework/**"]
            )
          );
        } catch {
          /* webpack-obfuscator optional at build time */
        }
      }
    }
    return config;
  },
};

export default nextConfig;
