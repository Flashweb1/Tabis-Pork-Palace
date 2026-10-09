import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { deliveryZones } from "@/db/schema";
import { AdminHeader, F, Panel } from "@/components/admin/AdminUi";
import { deleteZone, saveZone } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Delivery" };

export default async function AdminDelivery() {
  await requireAdmin("delivery");
  const zones = await db.select().from(deliveryZones).orderBy(asc(deliveryZones.sortOrder));
  const i = "input !py-2";
  return (
    <div>
      <AdminHeader title="Delivery zones" sub="Zone-based pricing by state. Pickup is always free. Unmatched states or “contact us” zones mark the order's fee as to-be-confirmed." />
      <div className="space-y-4">
        {zones.map((z) => (
          <Panel key={z.id}>
            <form action={saveZone} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <input type="hidden" name="id" value={z.id} />
              <F label="Zone name"><input name="name" defaultValue={z.name} className={i} /></F>
              <F label="States (comma separated)" className="lg:col-span-2"><input name="states" defaultValue={z.states.join(", ")} className={i} /></F>
              <F label="Fee (₦)"><input name="fee" type="number" defaultValue={z.fee} className={i} /></F>
              <F label="Note" className="lg:col-span-2"><input name="note" defaultValue={z.note} className={i} /></F>
              <F label="Sort order"><input name="sortOrder" type="number" defaultValue={z.sortOrder} className={i} /></F>
              <div className="flex items-end gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="contactOnly" defaultChecked={z.contactOnly} className="h-4 w-4 accent-[#123D27]" /> Contact us</label><label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={z.active} className="h-4 w-4 accent-[#123D27]" /> Active</label></div>
              <div className="flex items-end gap-3 lg:col-span-4"><button className="btn-primary btn-sm">Save zone</button></div>
            </form>
            <form action={deleteZone} className="border-t border-forest/10 px-5 py-2 text-right"><input type="hidden" name="id" value={z.id} /><button className="text-xs font-semibold text-red-600 hover:underline">Delete zone</button></form>
          </Panel>
        ))}
        <Panel title="Add zone">
          <form action={saveZone} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <F label="Zone name"><input name="name" required className={i} placeholder="Zone E — Port Harcourt" /></F>
            <F label="States" className="lg:col-span-2"><input name="states" className={i} placeholder="Rivers, Bayelsa" /></F>
            <F label="Fee (₦)"><input name="fee" type="number" defaultValue={0} className={i} /></F>
            <F label="Note" className="lg:col-span-3"><input name="note" className={i} /></F>
            <F label="Sort order"><input name="sortOrder" type="number" defaultValue={zones.length + 1} className={i} /></F>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="contactOnly" className="h-4 w-4 accent-[#123D27]" /> Contact us</label>
            <div className="flex items-end"><button className="btn-gold btn-sm">Add zone</button></div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
