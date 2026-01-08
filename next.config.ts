import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server-side (fixes Prisma + Turbopack issue)
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
  // Turbopack configuration
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
};

export default nextConfig;
