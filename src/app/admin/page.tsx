import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, users } from "@/db/schema";
import { AdminHeader, BarChart, Panel, StatCard } from "@/components/admin/AdminUi";
import { StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { weakStaffEmails } from "@/lib/demo";
import { revenueSeries, todayStats } from "@/lib/analytics";
import { dateTime, naira } from "@/lib/format";
import { can } from "@/lib/permissions";
import { getAllProducts, stockState } from "@/lib/store";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireAdmin();
  const { denied } = await searchParams;
  const weak = user.role === "super_admin" ? await weakStaffEmails() : [];
  const [today, series, prods] = await Promise.all([todayStats(), revenueSeries("daily"), getAllProducts()]);
  const customers = (await db.select({ n: sql<number>`count(*)::int` }).from(users).where(eq(users.role, "customer")))[0].n;
  const productCount = (await db.select({ n: sql<number>`count(*)::int` }).from(products))[0].n;
  const recent = can(user.role, "orders") ? await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8) : [];
  const pending = (await db.select({ n: sql<number>`count(*)::int` }).from(orders).where(sql`${orders.status} in ('pending','confirmed','preparing')`))[0].n;
  const review = (await db.select({ n: sql<number>`count(*)::int` }).from(orders).where(sql`${orders.needsReview} = true and ${orders.status} <> 'cancelled'`))[0].n;
  const low = prods.filter((p) => ["low", "out"].includes(stockState(p)));
  const hour = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" })).getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <div>
      {denied && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">Your role doesn&apos;t have access to that section.</p>}
      {weak.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Security: {weak.length} staff account{weak.length === 1 ? "" : "s"} still use the default demo password.</p>
          <p className="mt-1">{weak.join(", ")} — <Link href="/admin/settings" className="font-semibold underline">reset passwords in Settings &amp; Staff</Link> before going live. The demo login hint on the public login page disappears once the admin password is changed.</p>
        </div>
      )}
      <AdminHeader title={`${greet}, ${user.name.split(" ")[0]}`} sub="Here's how Tabis Pork Palace is doing today." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's sales" value={naira(today.sales)} hint="Paid orders, Lagos time" />
        <StatCard label="Orders today" value={today.orders} hint={`${pending} in progress overall`} />
        <StatCard label="Customers" value={customers} />
        <StatCard label="Products" value={productCount} hint={`${low.length} low or out of stock`} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Sales overview" actions={<Link href="/admin/reports" className="text-sm font-semibold text-forest hover:underline">Full reports →</Link>}>
          <div className="p-5"><BarChart data={series.map((s) => ({ label: s.label, value: s.revenue }))} /></div>
        </Panel>
        <Panel title="Needs attention">
          <ul className="divide-y divide-forest/10 text-sm">
            <li className="flex items-center justify-between px-5 py-3"><span>Orders awaiting weight / fee confirmation</span><Link href="/admin/orders?filter=review" className="badge bg-gold-3 text-[#7a5d22]">{review}</Link></li>
            {low.slice(0, 5).map((p) => (<li key={p.id} className="flex items-center justify-between px-5 py-3"><span>{p.name}</span><span className={`badge ${stockState(p) === "out" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{p.stock}{p.unit === "kg" ? "kg" : ""} · {stockState(p) === "out" ? "out" : "low"}</span></li>))}
            {low.length === 0 && <li className="px-5 py-3 text-charcoal/55">Stock levels look healthy.</li>}
          </ul>
        </Panel>
      </div>
      {recent.length > 0 && (
        <Panel title="Recent orders" className="mt-6" actions={<Link href="/admin/orders" className="text-sm font-semibold text-forest hover:underline">All orders →</Link>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-forest-3"><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Status</th><th className="th">Placed</th></tr></thead>
              <tbody className="divide-y divide-forest/10">
                {recent.map((o) => (
                  <tr key={o.id} className="hover:bg-forest/5"><td className="td font-semibold"><Link href={`/admin/orders/${o.id}`} className="text-forest hover:underline">#{o.code}</Link></td><td className="td">{o.customerName}</td><td className="td font-semibold">{naira(o.total)}</td><td className="td"><StatusBadge status={o.paymentStatus} /></td><td className="td"><StatusBadge status={o.status} /></td><td className="td text-charcoal/60">{dateTime(o.createdAt)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
