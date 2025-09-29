import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/portfolio",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
