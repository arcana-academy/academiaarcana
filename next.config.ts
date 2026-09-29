import { setupHoneybadger } from "@honeybadger-io/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: wss:",
              "frame-src 'self' https:",
              "media-src 'self' data: blob: https:",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

const honeybadgerConfig = {
  disableSourceMapUpload: false,
  webpackPluginOptions: {
    apiKey: String(process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY ?? ""),
    assetsUrl: String(process.env.NEXT_PUBLIC_HONEYBADGER_ASSETS_URL ?? ""),
    revision: process.env.NEXT_PUBLIC_HONEYBADGER_REVISION,
  },
};

const honeybadgerArgs =
  process.env.NODE_ENV === "test"
    ? [nextConfig]
    : [nextConfig, honeybadgerConfig];

export default setupHoneybadger(...(honeybadgerArgs as [NextConfig]));
