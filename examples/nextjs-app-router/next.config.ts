import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The repo root has its own lockfile; without this Next would take it as the workspace root.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
