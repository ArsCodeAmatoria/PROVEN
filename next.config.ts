import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Ensure the official BCCSA .xlsm ships with serverless export routes.
  outputFileTracingIncludes: {
    "/api/compliance/audits/[sessionId]/export/bccsa-xlsx": [
      "./templates/bccsa-cor/**/*",
    ],
  },
};

export default nextConfig;
