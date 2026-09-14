import { setupHoneybadger } from "@honeybadger-io/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
