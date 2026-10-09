import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/AdminUi";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/lib/store";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProduct() {
  await requireAdmin("products");
  const cats = await getCategories();
  return (
    <div>
      <AdminHeader title="Add product" />
      <ProductForm categories={cats} />
    </div>
  );
}
