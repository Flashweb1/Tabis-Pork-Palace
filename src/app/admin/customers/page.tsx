import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { AdminHeader, Panel } from "@/components/admin/AdminUi";
import { requireAdmin } from "@/lib/auth";
import { dateShort, naira } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin("customers");
  const { q = "" } = await searchParams;
  const like = `%${q.toLowerCase()}%`;
  const res = await db.execute(sql`
    select u.id, u.name, u.email, u.phone, u.created_at,
      count(o.id)::int as orders,
      coalesce(sum(case when o.payment_status = 'paid' and o.status <> 'cancelled' then o.total end),0)::int as spent,
      max(o.created_at) as last_order
    from users u left join orders o on o.user_id = u.id
    where u.role = 'customer' and (${q} = '' or lower(u.name) like ${like} or lower(u.email) like ${like} or u.phone like ${like})
    group by u.id order by spent desc, u.created_at desc limit 200`);
  const rows = res.rows as { id: number; name: string; email: string; phone: string | null; created_at: string; orders: number; spent: number; last_order: string | null }[];
  return (
    <div>
      <AdminHeader title="Customers" sub={`${rows.length} customers`} />
      <form className="card mb-5 flex gap-3 p-4"><input name="q" defaultValue={q} placeholder="Search name, email or phone" className="input !py-2" aria-label="Search" /><button className="btn-primary btn-sm">Search</button></form>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-forest-3"><tr><th className="th">Customer</th><th className="th">Phone</th><th className="th">Orders</th><th className="th">Lifetime value</th><th className="th">Last order</th><th className="th">Joined</th></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-forest/5"><td className="td"><p className="font-semibold text-forest">{c.name}</p><p className="text-xs text-charcoal/50">{c.email}</p></td><td className="td">{c.phone || "—"}</td><td className="td">{c.orders}</td><td className="td font-semibold">{naira(Number(c.spent))}</td><td className="td text-charcoal/60">{dateShort(c.last_order)}</td><td className="td text-charcoal/60">{dateShort(c.created_at)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
