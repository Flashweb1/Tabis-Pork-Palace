import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, BarChart, Panel, StatCard } from "@/components/admin/AdminUi";
import { requireAdmin } from "@/lib/auth";
import { customerStats, parseRange, rangeTitle, revenueSeries, salesByChannel, topProducts } from "@/lib/analytics";
import { naira } from "@/lib/format";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReports({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireAdmin("reports");
  const range = parseRange((await searchParams).range);
  const [series, channels, top, cust] = await Promise.all([revenueSeries(range), salesByChannel(), topProducts(8), customerStats()]);
  const total = series.reduce((a, b) => a + b.revenue, 0);
  const orderCount = series.reduce((a, b) => a + b.orders, 0);
  const chTotal = Math.max(1, channels.reduce((a, b) => a + b.revenue, 0));
  return (
    <div>
      <AdminHeader title="Reports & analytics" sub="Based on paid, non-cancelled orders (Lagos time)." actions={<div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">{(["daily", "weekly", "monthly", "yearly"] as const).map((r) => <Link key={r} href={`/admin/reports?range=${r}`} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${range === r ? "bg-forest text-ivory" : "text-forest hover:bg-forest/5"}`}>{r}</Link>)}</div>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Revenue · ${rangeTitle(range)}`} value={naira(total)} />
        <StatCard label="Paid orders in period" value={orderCount} />
        <StatCard label="Average order value" value={naira(cust.aov)} />
        <StatCard label="Customer lifetime value" value={naira(cust.ltv)} hint="Average paid revenue per customer" />
      </div>
      <Panel title={`Revenue · ${rangeTitle(range)}`} className="mt-6"><div className="p-5"><BarChart data={series.map((s) => ({ label: s.label, value: s.revenue }))} /></div></Panel>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Sales by channel">
          <ul className="space-y-4 p-5">
            {channels.map((c) => (
              <li key={c.channel}><div className="flex justify-between text-sm"><span className="font-semibold text-forest">{c.channel}</span><span>{naira(c.revenue)} · {Math.round((c.revenue / chTotal) * 100)}%</span></div><div className="mt-1.5 h-2.5 rounded-full bg-forest/10"><div className="h-2.5 rounded-full bg-gold" style={{ width: `${(c.revenue / chTotal) * 100}%` }} /></div><p className="mt-1 text-xs text-charcoal/50">{c.orders} orders</p></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Best-selling products">
          <ol className="divide-y divide-forest/10">
            {top.map((t, i) => (<li key={t.name} className="flex items-center justify-between gap-3 px-5 py-3 text-sm"><span><span className="mr-3 font-display text-xl text-gold">{i + 1}</span><span className="font-semibold text-forest">{t.name}</span></span><span className="text-right"><span className="font-semibold">{naira(t.revenue)}</span><span className="block text-xs text-charcoal/50">{Math.round(t.qty * 10) / 10}{t.unit === "kg" ? "kg" : ` ${t.unit}`} sold</span></span></li>))}
          </ol>
        </Panel>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total customers" value={cust.customers} />
        <StatCard label="New customers (30 days)" value={cust.newCustomers} />
        <StatCard label="Returning customers" value={cust.returning} hint="2+ paid orders" />
      </div>
    </div>
  );
}
