import type { Metadata } from "next";
import { AdminHeader, F, Panel } from "@/components/admin/AdminUi";
import { deleteCategory, saveCategory } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getAllProducts, getCategories } from "@/lib/store";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategories() {
  await requireAdmin("categories");
  const [cats, prods] = await Promise.all([getCategories(), getAllProducts()]);
  const count = (id: number) => prods.filter((p) => p.categoryId === id).length;
  return (
    <div>
      <AdminHeader title="Categories" sub="New categories (smoked, sausages, frozen, farm products…) appear in the shop menu automatically." />
      <div className="space-y-4">
        {cats.map((c) => (
          <Panel key={c.id}>
            <form action={saveCategory} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_2fr_80px_auto]">
              <input type="hidden" name="id" value={c.id} />
              <F label="Name"><input name="name" defaultValue={c.name} className="input !py-2" /></F>
              <F label="Slug"><input name="slug" defaultValue={c.slug} className="input !py-2" /></F>
              <F label="Description"><input name="description" defaultValue={c.description} className="input !py-2" /></F>
              <F label="Order"><input name="sortOrder" type="number" defaultValue={c.sortOrder} className="input !py-2" /></F>
              <input type="hidden" name="image" value={c.image} />
              <div className="flex items-end gap-2"><button className="btn-primary btn-sm">Save</button></div>
            </form>
            <div className="flex items-center justify-between border-t border-forest/10 px-5 py-2 text-xs text-charcoal/55"><span>{count(c.id)} products</span>{count(c.id) === 0 && <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><button className="font-semibold text-red-600 hover:underline">Delete</button></form>}</div>
          </Panel>
        ))}
        <Panel title="Add category">
          <form action={saveCategory} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-[1.2fr_2fr_2fr_80px_auto]">
            <F label="Name"><input name="name" required className="input !py-2" /></F>
            <F label="Image URL"><input name="image" className="input !py-2" /></F>
            <F label="Description"><input name="description" className="input !py-2" /></F>
            <F label="Order"><input name="sortOrder" type="number" defaultValue={cats.length + 1} className="input !py-2" /></F>
            <div className="flex items-end"><button className="btn-gold btn-sm">Add</button></div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
