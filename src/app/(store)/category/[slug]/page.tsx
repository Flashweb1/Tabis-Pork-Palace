import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ShopView, filterProducts, type SP } from "@/components/ShopView";
import { getAllProducts, getCategories } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  return cat ? { title: `${cat.name} — Buy Online`, description: cat.description } : {};
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const sp = await searchParams;
  if (slug === "whole-pigs") redirect("/whole-pigs");
  const [all, cats] = await Promise.all([getAllProducts(), getCategories()]);
  const cat = cats.find((c) => c.slug === slug);
  if (!cat) notFound();
  const scoped = all.filter((p) => p.categorySlug === slug);
  return (
    <ShopView
      products={filterProducts(scoped, sp)}
      allInScope={scoped}
      categories={cats}
      sp={sp}
      basePath={`/category/${slug}`}
      activeCategory={slug}
      title={cat.name}
      intro={cat.description}
    />
  );
}
