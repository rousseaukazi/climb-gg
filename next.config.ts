import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/climb-gg",
  assetPrefix: "/climb-gg/",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
