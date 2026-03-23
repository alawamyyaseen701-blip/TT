import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["firebase-admin", "bcryptjs"],
};

export default nextConfig;
