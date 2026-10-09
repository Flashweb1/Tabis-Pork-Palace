import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { siteUrl } from "@/lib/site";
import { getAllProducts, getCategories } from "@/lib/store";

export const dynamic = "force-dynamic";

type Item = MetadataRoute.Sitemap[number];
const item = (url: string, priority: number, changeFrequency: Item["changeFrequency"], lastModified: Date = new Date()): Item => ({ url, lastModified, changeFrequency, priority });

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [prods, cats, posts] = await Promise.all([
    getAllProducts(),
    getCategories(),
    db.select({ slug: blogPosts.slug, at: blogPosts.publishedAt }).from(blogPosts).where(eq(blogPosts.published, true)),
  ]);
  const fixed = ["/shop", "/whole-pigs", "/wholesale", "/quote", "/pork-guide", "/blog", "/about", "/farm", "/quality", "/delivery", "/how-it-works", "/contact", "/faq", "/legal/privacy", "/legal/terms", "/legal/refunds", "/legal/delivery-policy"];
  return [
    item(base, 1, "daily"),
    ...fixed.map((p) => item(base + p, 0.7, "weekly")),
    ...cats.filter((c) => c.slug !== "whole-pigs").map((c) => item(`${base}/category/${c.slug}`, 0.8, "daily")),
    ...prods.map((p) => item(`${base}/product/${p.slug}`, 0.9, "daily")),
    ...posts.map((p) => item(`${base}/blog/${p.slug}`, 0.6, "monthly", p.at)),
  ];
}
