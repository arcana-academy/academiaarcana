import { setupHoneybadger } from "@honeybadger-io/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default setupHoneybadger(nextConfig);
