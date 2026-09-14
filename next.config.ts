import { setupHoneybadger } from "@honeybadger-io/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default setupHoneybadger(nextConfig, {
  disableSourceMapUpload: false,
  webpackPluginOptions: {
    apiKey: String(process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY ?? ""),
    assetsUrl: String(process.env.NEXT_PUBLIC_HONEYBADGER_ASSETS_URL ?? ""),
    revision: process.env.NEXT_PUBLIC_HONEYBADGER_REVISION,
  },
});
