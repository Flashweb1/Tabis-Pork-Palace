import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pigs } from "@/db/schema";
import { AdminHeader, F, Panel } from "@/components/admin/AdminUi";
import { StatusBadge } from "@/components/ui";
import { deletePig, savePig } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { naira } from "@/lib/format";

export const metadata: Metadata = { title: "Whole pig inventory" };

const RANGES = ["20-30", "30-40", "40-50", "50-60", "60-80", "80-100", "100+"];
const PROC = [["not_processed", "Not processed"], ["cleaned", "Cleaned"], ["dressed", "Dressed"], ["custom_cut", "Custom cut"]];

export default async function AdminPigs({ searchParams }: { searchParams: Promise<{ edit?: string; range?: string }> }) {
  await requireAdmin("pigs");
  const sp = await searchParams;
  const all = await db.select().from(pigs).orderBy(asc(pigs.category), asc(pigs.id));
  const list = sp.range ? all.filter((p) => p.category === sp.range) : all;
  const editing = sp.edit ? (await db.select().from(pigs).where(eq(pigs.id, Number(sp.edit))).limit(1))[0] : undefined;
  const nextTag = `TP-PIG-${String(all.reduce((m, p) => Math.max(m, Number(p.tag.replace(/\D/g, "")) || 0), 0) + 1).padStart(4, "0")}`;
  const i = "input !py-2";
  return (
    <div>
      <AdminHeader title="Whole Pig Inventory" sub="Track each pig from estimate to actual weight, processing and sale. Available pigs drive storefront availability." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {RANGES.map((r) => {
          const inR = all.filter((p) => p.category === r);
          return (
            <Link key={r} href={`/admin/pigs?range=${r}`} className={`card p-4 transition hover:-translate-y-0.5 ${sp.range === r ? "ring-2 ring-forest" : ""}`}>
              <p className="font-display text-2xl font-semibold text-forest">{r.endsWith("+") ? `${r.slice(0, -1)}kg+` : `${r.replace("-", "–")}kg`}</p>
              <p className="mt-1 text-xs text-charcoal/60">{inR.filter((p) => p.status === "available").length} available · {inR.filter((p) => p.status === "reserved").length} reserved</p>
            </Link>
          );
        })}
      </div>
      <Panel title={editing ? `Edit ${editing.tag}` : "Add a pig"} className="mb-6">
        <form action={savePig} className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <F label="Pig ID"><input name="tag" required defaultValue={editing?.tag ?? nextTag} className={i} /></F>
          <F label="Estimated weight (kg)"><input name="estWeight" type="number" step="0.1" required defaultValue={editing?.estWeight} className={i} /></F>
          <F label="Actual weight (kg)"><input name="actualWeight" type="number" step="0.1" defaultValue={editing?.actualWeight ?? ""} className={i} /></F>
          <F label="Category"><select name="category" defaultValue={editing?.category ?? "40-50"} className={i}>{RANGES.map((r) => <option key={r} value={r}>{r}kg</option>)}</select></F>
          <F label="Status"><select name="status" defaultValue={editing?.status ?? "available"} className={i}><option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option></select></F>
          <F label="Processing"><select name="processing" defaultValue={editing?.processing ?? "not_processed"} className={i}>{PROC.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></F>
          <F label="Location"><input name="location" defaultValue={editing?.location ?? "Farm / Facility"} className={i} /></F>
          <F label="Price (₦)"><input name="price" type="number" defaultValue={editing?.price ?? 0} className={i} /></F>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4"><button className="btn-primary btn-sm">{editing ? "Save pig" : "Add pig"}</button>{editing && <Link href="/admin/pigs" className="btn-outline btn-sm">Cancel</Link>}</div>
        </form>
      </Panel>
      <Panel title={sp.range ? `Pigs · ${sp.range}kg` : "All pigs"} actions={sp.range ? <Link href="/admin/pigs" className="text-sm font-semibold text-forest hover:underline">Show all</Link> : undefined}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-forest-3"><tr><th className="th">Pig ID</th><th className="th">Est. / Actual</th><th className="th">Category</th><th className="th">Status</th><th className="th">Processing</th><th className="th">Location</th><th className="th">Price</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-forest/5">
                  <td className="td font-semibold text-forest">{p.tag}</td>
                  <td className="td">{p.estWeight}kg / {p.actualWeight ? `${p.actualWeight}kg` : "—"}</td>
                  <td className="td">{p.category}kg</td>
                  <td className="td"><StatusBadge status={p.status} /></td>
                  <td className="td capitalize">{p.processing.replace("_", " ")}</td>
                  <td className="td">{p.location}</td>
                  <td className="td font-semibold">{naira(p.price)}</td>
                  <td className="td text-right"><div className="flex justify-end gap-3 text-sm font-semibold"><Link href={`/admin/pigs?edit=${p.id}`} className="text-forest hover:underline">Edit</Link><form action={deletePig}><input type="hidden" name="id" value={p.id} /><button className="text-red-600 hover:underline">Delete</button></form></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
