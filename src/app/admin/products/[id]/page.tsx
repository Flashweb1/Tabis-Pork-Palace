import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { AdminHeader } from "@/components/admin/AdminUi";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/store";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("products");
  const { id } = await params;
  const p = (await db.select().from(products).where(eq(products.id, Number(id))).limit(1))[0];
  if (!p) notFound();
  const cats = await getCategories();
  return (
    <div>
      <AdminHeader title={`Edit: ${p.name}`} sub={p.sku} />
      <ProductForm product={p} categories={cats} />
    </div>
  );
}
