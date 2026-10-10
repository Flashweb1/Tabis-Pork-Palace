import { cache } from "react";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bulkTiers, categories, deliveryZones, pigs, products, reviews, settings } from "@/db/schema";
import type { DeliveryZone, Tier } from "@/lib/pricing";

export type ProductView = typeof products.$inferSelect & {
  categorySlug: string;
  categoryName: string;
  rating: number;
  reviewCount: number;
};

const DEFAULT_SETTINGS: Record<string, string> = {
  whatsapp: "2348130666158",
  phone: "+234 813 066 6158",
  email: "hello@tabispork.com",
  address: "House 5, Diamond Estate, Esheri-Igando Road Lagos",
  hours: "Mon–Sat 7:00am – 7:00pm",
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  pod_states: "Lagos",
  low_stock_alerts: "on",
};

export const getSettings = cache(async (): Promise<Record<string, string>> => {
  try {
    const rows = await db.select().from(settings);
    return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
  } catch {
    return DEFAULT_SETTINGS;
  }
});

export const getCategories = cache(async () => db.select().from(categories).orderBy(asc(categories.sortOrder)));

export const getTiers = cache(async (): Promise<Tier[]> => {
  const rows = await db.select().from(bulkTiers).orderBy(asc(bulkTiers.minQty));
  return rows.map((r) => ({ label: r.label, minQty: r.minQty, discountPercent: r.discountPercent }));
});

export const getZones = cache(async (): Promise<DeliveryZone[]> => {
  const rows = await db.select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder));
  return rows
    .filter((z) => z.active)
    .map((z) => ({ id: z.id, name: z.name, states: z.states, fee: z.fee, contactOnly: z.contactOnly, note: z.note }));
});

export const getAllProducts = cache(async (): Promise<ProductView[]> => {
  const rows = await db
    .select({ p: products, categorySlug: categories.slug, categoryName: categories.name })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .orderBy(asc(products.id));
  const rr = await db
    .select({
      productId: reviews.productId,
      avg: sql<number>`avg(${reviews.rating})::float`,
      n: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .groupBy(reviews.productId);
  const pg = await db
    .select({ category: pigs.category, n: sql<number>`count(*)::int` })
    .from(pigs)
    .where(eq(pigs.status, "available"))
    .groupBy(pigs.category);
  const ratingMap = new Map(rr.map((r) => [r.productId, r]));
  const pigMap = new Map(pg.map((r) => [r.category, r.n]));
  return rows.map(({ p, categorySlug, categoryName }) => {
    const r = ratingMap.get(p.id);
    const stock = p.productType === "whole_pig" ? pigMap.get(p.pigRange ?? "") ?? 0 : p.stock;
    return {
      ...p,
      stock,
      categorySlug,
      categoryName,
      rating: r ? Math.round(r.avg * 10) / 10 : 0,
      reviewCount: r?.n ?? 0,
    };
  });
});

export async function getProductBySlug(slug: string): Promise<ProductView | undefined> {
  return (await getAllProducts()).find((p) => p.slug === slug);
}

export type StockState = "in" | "low" | "out" | "quote";

export function stockState(p: Pick<ProductView, "stock" | "available" | "lowStockThreshold" | "productType">): StockState {
  if (p.productType === "quote_required") return "quote";
  if (!p.available || p.stock <= 0) return "out";
  if (p.stock <= p.lowStockThreshold) return "low";
  return "in";
}

export function pigRangeLabel(range: string | null | undefined): string {
  if (!range) return "";
  if (range.endsWith("+")) return `${range.slice(0, -1)}kg+`;
  return `${range.replace("-", "–")}kg`;
}
