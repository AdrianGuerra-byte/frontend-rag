import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The TypeScript API keeps production builds compatible with the
  // project's supported TypeScript versions.
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
