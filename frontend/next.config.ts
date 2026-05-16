import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8081";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

export default config;
