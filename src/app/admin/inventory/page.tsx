import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, Panel, StatCard } from "@/components/admin/AdminUi";
import { StockBadge } from "@/components/ui";
import { notifyLowStockNow, updateStock } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getAllProducts, pigRangeLabel, stockState } from "@/lib/store";

export const metadata: Metadata = { title: "Inventory" };

export default async function AdminInventory({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await requireAdmin("inventory");
  const { view } = await searchParams;
  const all = (await getAllProducts()).filter((p) => p.productType !== "quote_required");
  const list = view === "alerts" ? all.filter((p) => ["low", "out"].includes(stockState(p))) : all;
  const low = all.filter((p) => stockState(p) === "low").length;
  const out = all.filter((p) => stockState(p) === "out").length;
  return (
    <div>
      <AdminHeader title="Inventory" sub="Live stock levels. Orders deduct stock automatically; cancellations restore it." actions={<form action={notifyLowStockNow}><button className="btn-outline btn-sm">Send low-stock alerts</button></form>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><StatCard label="Tracked products" value={all.length} /><StatCard label="Low stock" value={low} /><StatCard label="Out of stock" value={out} /></div>
      <div className="mb-4 flex gap-2"><Link href="/admin/inventory" className={`btn-sm rounded-full border px-4 py-2 text-xs font-semibold ${!view ? "border-forest bg-forest text-ivory" : "border-forest/20 text-forest"}`}>All</Link><Link href="/admin/inventory?view=alerts" className={`btn-sm rounded-full border px-4 py-2 text-xs font-semibold ${view === "alerts" ? "border-forest bg-forest text-ivory" : "border-forest/20 text-forest"}`}>Low / out of stock</Link></div>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-forest-3"><tr><th className="th">Product</th><th className="th">Level</th><th className="th">Status</th><th className="th">Update</th></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {list.map((p) => {
                const st = stockState(p);
                const pig = p.productType === "whole_pig";
                return (
                  <tr key={p.id}>
                    <td className="td"><p className="font-semibold text-forest">{p.name}</p><p className="text-xs text-charcoal/50">{p.sku}{pig ? ` · ${pigRangeLabel(p.pigRange)}` : ""}</p></td>
                    <td className="td font-semibold">{pig ? `${p.stock} available` : `${p.stock} ${p.unit === "kg" ? "KG" : p.unit}`}</td>
                    <td className="td"><span className="mr-2">{st === "in" ? "🟢" : st === "low" ? "🟡" : "🔴"}</span><StockBadge state={st} stock={p.stock} unit={p.unit} /></td>
                    <td className="td">
                      {pig ? <Link href="/admin/pigs" className="text-sm font-semibold text-forest underline">Manage pigs</Link> : (
                        <form action={updateStock} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={p.id} />
                          <input name="stock" type="number" step="0.1" min={0} defaultValue={p.stock} className="input !w-24 !py-1.5" aria-label="Stock" />
                          <input name="threshold" type="number" step="0.1" min={0} defaultValue={p.lowStockThreshold} className="input !w-24 !py-1.5" aria-label="Low-stock threshold" title="Low-stock threshold" />
                          <button className="btn-outline btn-sm">Save</button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-forest/10 px-5 py-3 text-xs text-charcoal/55">Second field is the low-stock alert threshold. Admins are notified automatically when an order drops an item below its threshold.</p>
      </Panel>
    </div>
  );
}
