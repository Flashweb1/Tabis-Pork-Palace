import Link from "next/link";
import { F, Panel } from "@/components/admin/AdminUi";
import { saveProduct } from "@/app/actions/admin";
import { PRODUCT_TYPE_LABEL } from "@/lib/format";
import type { products } from "@/db/schema";

type Product = typeof products.$inferSelect;

export function ProductForm({ product, categories }: { product?: Product; categories: { id: number; name: string }[] }) {
  const p = product;
  const i = "input !py-2";
  return (
    <form action={saveProduct} className="space-y-6">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Panel title="Basics">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <F label="Product name"><input name="name" required defaultValue={p?.name} className={i} /></F>
          <F label="SKU"><input name="sku" defaultValue={p?.sku} placeholder="TP-FP-008" className={i} /></F>
          <F label="URL slug"><input name="slug" defaultValue={p?.slug} placeholder="auto from name" className={i} /></F>
          <F label="Category"><select name="categoryId" required defaultValue={p?.categoryId} className={i}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></F>
          <F label="Product type"><select name="productType" defaultValue={p?.productType ?? "weight_based"} className={i}>{Object.entries(PRODUCT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></F>
          <F label="Fresh / Frozen"><select name="storage" defaultValue={p?.storage ?? "fresh"} className={i}><option value="fresh">Fresh</option><option value="frozen">Frozen</option></select></F>
          <F label="Description" className="sm:col-span-2"><textarea name="description" rows={4} defaultValue={p?.description} className={i} /></F>
          <F label="Image URL (Cloudinary or any HTTPS image)" className="sm:col-span-2"><input name="image" defaultValue={p?.image} placeholder="https://…" className={i} /></F>
          <F label="Best for (comma separated)" className="sm:col-span-2"><input name="bestFor" defaultValue={p?.bestFor.join(", ")} placeholder="Roasting, BBQ, Stews" className={i} /></F>
        </div>
      </Panel>
      <Panel title="Pricing & quantity">
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <F label="Price (₦)"><input name="price" type="number" min={0} required defaultValue={p?.price} className={i} /></F>
          <F label="Sale price (₦)"><input name="salePrice" type="number" min={0} defaultValue={p?.salePrice ?? ""} className={i} /></F>
          <F label="Unit"><select name="unit" defaultValue={p?.unit ?? "kg"} className={i}><option value="kg">kg</option><option value="pack">pack</option><option value="pig">pig</option></select></F>
          <F label="Stock (kg / units)"><input name="stock" type="number" step="0.1" min={0} defaultValue={p?.stock ?? 0} className={i} /></F>
          <F label="Low-stock threshold"><input name="lowStockThreshold" type="number" step="0.1" min={0} defaultValue={p?.lowStockThreshold ?? 10} className={i} /></F>
          <F label="Pack size / weight label"><input name="packSize" defaultValue={p?.packSize ?? ""} placeholder="500g, ≈5kg" className={i} /></F>
          <F label="Minimum order"><input name="minOrder" type="number" step="0.1" min={0} defaultValue={p?.minOrder ?? 1} className={i} /></F>
          <F label="Maximum order"><input name="maxOrder" type="number" step="0.1" min={0} defaultValue={p?.maxOrder ?? ""} className={i} /></F>
          <F label="Whole-pig range (e.g. 40-50)"><input name="pigRange" defaultValue={p?.pigRange ?? ""} className={i} /></F>
        </div>
        <p className="px-5 pb-4 text-xs text-charcoal/55">Whole-pig stock is calculated from the Whole Pig Inventory (available pigs in the matching range), not from the stock field.</p>
      </Panel>
      <Panel title="Visibility">
        <div className="flex flex-wrap gap-6 p-5 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="available" defaultChecked={p?.available ?? true} className="h-4 w-4 accent-[#123D27]" /> Available for sale</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={p?.featured ?? false} className="h-4 w-4 accent-[#123D27]" /> Featured</label>
        </div>
      </Panel>
      <div className="flex gap-3"><button className="btn-primary">{p ? "Save product" : "Create product"}</button><Link href="/admin/products" className="btn-outline">Cancel</Link></div>
    </form>
  );
}
