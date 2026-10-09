import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { AdminHeader, F, Panel } from "@/components/admin/AdminUi";
import { deleteCoupon, saveCoupon } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { naira } from "@/lib/format";
import { getAllProducts, getCategories } from "@/lib/store";

export const metadata: Metadata = { title: "Discounts" };

export default async function AdminCoupons({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin("coupons");
  const { edit } = await searchParams;
  const [list, cats, prods] = await Promise.all([db.select().from(coupons).orderBy(desc(coupons.id)), getCategories(), getAllProducts()]);
  const c = edit ? list.find((x) => x.id === Number(edit)) : undefined;
  const i = "input !py-2";
  const catName = (id: number | null) => cats.find((x) => x.id === id)?.name;
  const prodName = (id: number | null) => prods.find((x) => x.id === id)?.name;
  return (
    <div>
      <AdminHeader title="Coupons & promotions" sub="Percent or fixed discounts with minimum order, caps, product/category targeting, new-customer-only, expiry and usage limits." />
      <Panel title={c ? `Edit ${c.code}` : "Create coupon"} className="mb-6">
        <form action={saveCoupon} key={c?.id ?? "new"} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {c && <input type="hidden" name="id" value={c.id} />}
          <F label="Code"><input name="code" required defaultValue={c?.code} placeholder="WELCOME10" className={`${i} uppercase`} /></F>
          <F label="Type"><select name="type" defaultValue={c?.type ?? "percent"} className={i}><option value="percent">Percent (%)</option><option value="fixed">Fixed (₦)</option></select></F>
          <F label="Value"><input name="value" type="number" required defaultValue={c?.value} className={i} /></F>
          <F label="Minimum order (₦)"><input name="minOrder" type="number" defaultValue={c?.minOrder ?? 0} className={i} /></F>
          <F label="Maximum discount (₦)"><input name="maxDiscount" type="number" defaultValue={c?.maxDiscount ?? ""} className={i} /></F>
          <F label="Specific category"><select name="categoryId" defaultValue={c?.categoryId ?? ""} className={i}><option value="">Any</option>{cats.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></F>
          <F label="Specific product"><select name="productId" defaultValue={c?.productId ?? ""} className={i}><option value="">Any</option>{prods.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></F>
          <F label="Usage limit"><input name="usageLimit" type="number" defaultValue={c?.usageLimit ?? ""} className={i} /></F>
          <F label="Expires"><input name="expiresAt" type="date" defaultValue={c?.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : ""} className={i} /></F>
          <F label="Description" className="lg:col-span-2"><input name="description" defaultValue={c?.description} className={i} /></F>
          <div className="flex items-end gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="newCustomersOnly" defaultChecked={c?.newCustomersOnly} className="h-4 w-4 accent-[#123D27]" /> New customers only</label>{c && <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={c.active} className="h-4 w-4 accent-[#123D27]" /> Active</label>}</div>
          <div className="flex items-end lg:col-span-4"><button className="btn-primary btn-sm">{c ? "Save coupon" : "Create coupon"}</button></div>
        </form>
      </Panel>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-forest-3"><tr><th className="th">Code</th><th className="th">Discount</th><th className="th">Conditions</th><th className="th">Used</th><th className="th">Status</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {list.map((x) => (
                <tr key={x.id}>
                  <td className="td"><p className="font-mono font-semibold text-forest">{x.code}</p><p className="text-xs text-charcoal/50">{x.description}</p></td>
                  <td className="td font-semibold">{x.type === "percent" ? `${x.value}% off` : `${naira(x.value)} off`}{x.maxDiscount ? <span className="block text-xs font-normal text-charcoal/50">max {naira(x.maxDiscount)}</span> : null}</td>
                  <td className="td text-xs text-charcoal/65">{x.minOrder > 0 && <p>Min {naira(x.minOrder)}</p>}{x.newCustomersOnly && <p>New customers</p>}{catName(x.categoryId) && <p>Category: {catName(x.categoryId)}</p>}{prodName(x.productId) && <p>Product: {prodName(x.productId)}</p>}{x.expiresAt && <p>Expires {x.expiresAt.toISOString().slice(0, 10)}</p>}</td>
                  <td className="td">{x.usedCount}{x.usageLimit ? ` / ${x.usageLimit}` : ""}</td>
                  <td className="td"><span className={`badge ${x.active && (!x.expiresAt || x.expiresAt > new Date()) ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{!x.active ? "Disabled" : x.expiresAt && x.expiresAt < new Date() ? "Expired" : "Active"}</span></td>
                  <td className="td text-right"><div className="flex justify-end gap-3 text-sm font-semibold"><a href={`/admin/coupons?edit=${x.id}`} className="text-forest hover:underline">Edit</a><form action={deleteCoupon}><input type="hidden" name="id" value={x.id} /><button className="text-red-600 hover:underline">Delete</button></form></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
