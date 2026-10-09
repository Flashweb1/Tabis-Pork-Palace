import type { Metadata } from "next";
import { ShopView, filterProducts, type SP } from "@/components/ShopView";
import { getAllProducts, getCategories } from "@/lib/store";

export const metadata: Metadata = {
  title: "Shop Fresh Pork Online in Nigeria",
  description: "Shop fresh pork cuts, packages, whole pigs and bulk orders. Weight-based pricing, chilled delivery and secure payment.",
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [all, cats] = await Promise.all([getAllProducts(), getCategories()]);
  const deals = sp.deals ? "Special Offers" : "All Pork";
  return (
    <ShopView
      products={filterProducts(all, sp)}
      allInScope={all}
      categories={cats}
      sp={sp}
      basePath="/shop"
      title={deals}
      intro="Premium cuts, family packs, whole pigs and bulk supply — weighed fresh and delivered chilled."
    />
  );
}
