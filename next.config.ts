import { setupHoneybadger } from "@honeybadger-io/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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

const honeybadgerApiKey = process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY;
const honeybadgerAssetsUrl = process.env.NEXT_PUBLIC_HONEYBADGER_ASSETS_URL;
const honeybadgerConfigured = Boolean(honeybadgerApiKey && honeybadgerAssetsUrl);

const honeybadgerConfig = {
  disableSourceMapUpload: !honeybadgerConfigured,
  webpackPluginOptions: {
    ...(honeybadgerConfigured
      ? {
          apiKey: honeybadgerApiKey,
          assetsUrl: honeybadgerAssetsUrl,
          revision: process.env.NEXT_PUBLIC_HONEYBADGER_REVISION,
        }
      : {}),
  },
};

const honeybadgerArgs =
  process.env.NODE_ENV === "test" || !honeybadgerConfigured
    ? [nextConfig]
    : [nextConfig, honeybadgerConfig];

export default setupHoneybadger(...(honeybadgerArgs as [NextConfig]));
