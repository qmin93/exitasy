import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server-side (fixes Prisma + Turbopack issue)
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
  // Turbopack configuration
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  // Skip ESLint during production builds (run separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
