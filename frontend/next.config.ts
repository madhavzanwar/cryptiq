import type { NextConfig } from "next";

/**
 * Same-origin API: the browser calls `/api/*` on the frontend origin and Next.js forwards it to the
 * backend (BACKEND_URL). That keeps the `cryptiq_sid` session cookie first-party, which the payments
 * flow needs (see backend/DEPLOY.md). In mock mode (NEXT_PUBLIC_USE_MOCKS=true) no request leaves the
 * browser, so there is nothing to proxy.
 */
const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const nextConfig: NextConfig = {
  // Each dev server / Playwright run may use its own build dir (NEXT_DIST_DIR=.next-e2e).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Cache Components is off on purpose: every page is client-side data from the backend (DECISIONS.md).
  cacheComponents: false,
  // Server-sent events must not be buffered by the proxy.
  compress: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    if (useMocks) return [];
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
