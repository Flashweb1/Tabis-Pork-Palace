import type { NextConfig } from "next";

// SEO-friendly aliases for the main storefront pages + baseline security headers.
// (X-Frame-Options is intentionally omitted so the app can still be embedded in preview tools.)
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/pork-cuts", destination: "/category/pork-cuts", permanent: true },
      { source: "/fresh-pork", destination: "/category/fresh-pork", permanent: true },
      { source: "/pork-packages", destination: "/category/pork-packages", permanent: true },
      { source: "/bulk-orders", destination: "/category/bulk-orders", permanent: true },
      { source: "/wholesale-pork", destination: "/wholesale", permanent: true },
      { source: "/pork-belly", destination: "/product/pork-belly", permanent: true },
      { source: "/pork-ribs", destination: "/product/pork-ribs", permanent: true },
      { source: "/pork-shoulder", destination: "/product/pork-shoulder", permanent: true },
      { source: "/pork-chops", destination: "/product/pork-chops", permanent: true },
      { source: "/whole-pig", destination: "/whole-pigs", permanent: true },
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/terms", destination: "/legal/terms", permanent: true },
    ];
  },
};

export default nextConfig;
