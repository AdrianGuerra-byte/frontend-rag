import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The TypeScript API avoids a CLI showConfig issue in the build environment.
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
