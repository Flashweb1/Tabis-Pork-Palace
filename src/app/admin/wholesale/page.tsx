import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { bulkTiers } from "@/db/schema";
import { AdminHeader, F, Panel } from "@/components/admin/AdminUi";
import { deleteTier, saveTier } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { tierRangeLabel } from "@/lib/pricing";

export const metadata: Metadata = { title: "Wholesale pricing" };

export default async function AdminWholesale() {
  await requireAdmin("wholesale");
  const tiers = await db.select().from(bulkTiers).orderBy(asc(bulkTiers.minQty));
  const ui = tiers.map((t) => ({ label: t.label, minQty: t.minQty, discountPercent: t.discountPercent }));
  return (
    <div>
      <AdminHeader title="Wholesale & bulk pricing" sub="Tier discounts apply automatically to weight-based and bulk products, by total kg in the line." actions={<Link href="/admin/quotes" className="btn-outline btn-sm">View quote requests</Link>} />
      <div className="space-y-4">
        {tiers.map((t, idx) => (
          <Panel key={t.id}>
            <form action={saveTier} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto]">
              <input type="hidden" name="id" value={t.id} />
              <F label={`Tier · ${tierRangeLabel(ui, idx)}`}><input name="label" defaultValue={t.label} className="input !py-2" /></F>
              <F label="From quantity (kg)"><input name="minQty" type="number" step="0.5" defaultValue={t.minQty} className="input !py-2" /></F>
              <F label="Discount (%)"><input name="discountPercent" type="number" step="0.5" defaultValue={t.discountPercent} className="input !py-2" /></F>
              <div className="flex items-end"><button className="btn-primary btn-sm">Save</button></div>
            </form>
            <form action={deleteTier} className="border-t border-forest/10 px-5 py-2 text-right"><input type="hidden" name="id" value={t.id} /><button className="text-xs font-semibold text-red-600 hover:underline">Delete tier</button></form>
          </Panel>
        ))}
        <Panel title="Add tier">
          <form action={saveTier} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto]">
            <F label="Label"><input name="label" required placeholder="e.g. Distributor" className="input !py-2" /></F>
            <F label="From quantity (kg)"><input name="minQty" type="number" step="0.5" required className="input !py-2" /></F>
            <F label="Discount (%)"><input name="discountPercent" type="number" step="0.5" required className="input !py-2" /></F>
            <div className="flex items-end"><button className="btn-gold btn-sm">Add tier</button></div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
