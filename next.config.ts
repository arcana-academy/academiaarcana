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
