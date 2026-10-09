import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/cart", "/checkout", "/order", "/invoice", "/track", "/api"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
