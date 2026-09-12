import type { NextConfig } from "next";

// Vercel serves exported HTML; the default build retains the existing Sites worker.
const nextConfig: NextConfig =
  process.env.BERA_BUILD_TARGET === "vercel" ? { output: "export" } : {};

export default nextConfig;
