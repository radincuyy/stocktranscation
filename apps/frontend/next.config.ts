import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // monorepo: kunci root app agar Next tidak memakai lockfile parent
    root: path.join(__dirname),
  },
};

export default nextConfig;
