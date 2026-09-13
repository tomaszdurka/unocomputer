import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Self-contained production server (used by scripts/deploy-local.sh).
  output: 'standalone',

  // The monorepo root, so tracing and the dev server agree on where the workspace
  // starts instead of inferring it.
  outputFileTracingRoot: path.join(__dirname, '../..'),

  // Compile source-only workspace packages (libs/*) - no build step needed for them.
  transpilePackages: ['@app/ui'],

  // Default is bottom-left, where it sits on top of the sidebar's pinned Settings item.
  devIndicators: { position: 'bottom-right' }
};

export default nextConfig;
