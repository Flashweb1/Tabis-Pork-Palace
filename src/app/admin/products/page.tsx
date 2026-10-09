import type { Metadata } from "next";
import Link from "next/link";
import { Img } from "@/components/Img";
import { AdminHeader, Panel } from "@/components/admin/AdminUi";
import { StockBadge } from "@/components/ui";
import { deleteProduct } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_TYPE_LABEL, naira } from "@/lib/format";
import { getAllProducts, stockState } from "@/lib/store";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  await requireAdmin("products");
  const sp = await searchParams;
  let list = await getAllProducts();
  if (sp.q) list = list.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(sp.q!.toLowerCase()));
  if (sp.type) list = list.filter((p) => p.productType === sp.type);
  return (
    <div>
      <AdminHeader title="Products" sub={`${list.length} products`} actions={<Link href="/admin/products/new" className="btn-primary btn-sm">Add product</Link>} />
      <form className="card mb-5 grid gap-3 p-4 sm:grid-cols-[2fr_1fr_auto_auto]">
        <input name="q" defaultValue={sp.q} placeholder="Search name or SKU" className="input !py-2" aria-label="Search" />
        <select name="type" defaultValue={sp.type ?? ""} className="input !py-2" aria-label="Type"><option value="">All types</option>{Object.entries(PRODUCT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="btn-primary btn-sm">Filter</button><Link href="/admin/products" className="btn-outline btn-sm">Reset</Link>
      </form>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-forest-3"><tr><th className="th">Product</th><th className="th">Category</th><th className="th">Type</th><th className="th">Price</th><th className="th">Stock</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-forest/5">
                  <td className="td"><div className="flex items-center gap-3"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-forest-3"><Img src={p.image} alt="" className="h-full w-full object-cover" /></div><div><Link href={`/admin/products/${p.id}`} className="font-semibold text-forest hover:underline">{p.name}</Link><p className="text-xs text-charcoal/50">{p.sku}{!p.available && " · hidden"}</p></div></div></td>
                  <td className="td">{p.categoryName}</td>
                  <td className="td text-charcoal/70">{PRODUCT_TYPE_LABEL[p.productType]}</td>
                  <td className="td font-semibold">{p.productType === "quote_required" ? "Quote" : naira(p.salePrice ?? p.price)}{p.salePrice && <span className="ml-1 text-xs text-charcoal/40 line-through">{naira(p.price)}</span>}</td>
                  <td className="td"><StockBadge state={stockState(p)} stock={p.stock} unit={p.unit} /><p className="mt-1 text-xs text-charcoal/50">{p.productType === "quote_required" ? "" : `${p.stock}${p.unit === "kg" ? "kg" : ""}`}</p></td>
                  <td className="td text-right"><div className="flex justify-end gap-3 text-sm font-semibold"><Link href={`/admin/products/${p.id}`} className="text-forest hover:underline">Edit</Link><form action={deleteProduct}><input type="hidden" name="id" value={p.id} /><button className="text-red-600 hover:underline">Delete</button></form></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
