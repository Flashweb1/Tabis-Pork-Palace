import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { AdminHeader, Panel } from "@/components/admin/AdminUi";
import { StatusBadge } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, STATUS_LABEL, PAYMENT_LABEL, dateTime, naira } from "@/lib/format";
import { orderConds } from "@/lib/order-filters";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; payment?: string; q?: string; filter?: string }> }) {
  await requireAdmin("orders");
  const sp = await searchParams;
  const list = await db.select().from(orders).where(orderConds(sp)).orderBy(desc(orders.createdAt)).limit(200);
  const exportQs = new URLSearchParams(Object.entries(sp).filter(([, v]) => !!v) as [string, string][]).toString();
  return (
    <div>
      <AdminHeader
        title="Orders"
        sub={`${list.length} order${list.length === 1 ? "" : "s"} shown${list.length === 200 ? " (latest 200 — export for the full list)" : ""}`}
        actions={<a href={`/api/admin/orders/export${exportQs ? `?${exportQs}` : ""}`} className="btn-outline btn-sm">Export CSV</a>}
      />
      <form className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto_auto]">
        <input name="q" defaultValue={sp.q} placeholder="Search order #, name, phone, email" className="input !py-2" aria-label="Search" />
        <select name="status" defaultValue={sp.status ?? ""} className="input !py-2" aria-label="Status"><option value="">All statuses</option>{[...ORDER_STATUSES, "cancelled"].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
        <select name="payment" defaultValue={sp.payment ?? ""} className="input !py-2" aria-label="Payment"><option value="">All payments</option>{["paid", "pending", "failed", "refunded"].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
        <button className="btn-primary btn-sm">Filter</button>
        <Link href="/admin/orders" className="btn-outline btn-sm">Reset</Link>
      </form>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-forest-3"><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Total</th><th className="th">Method</th><th className="th">Payment</th><th className="th">Status</th><th className="th">Placed</th></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {list.map((o) => (
                <tr key={o.id} className="hover:bg-forest/5">
                  <td className="td font-semibold"><Link href={`/admin/orders/${o.id}`} className="text-forest hover:underline">#{o.code}</Link>{o.needsReview && <span className="badge ml-2 bg-gold-3 text-[#7a5d22]">Review</span>}</td>
                  <td className="td">{o.customerName}<p className="text-xs text-charcoal/50">{o.phone}</p></td>
                  <td className="td font-semibold">{naira(o.total)}</td>
                  <td className="td text-charcoal/70">{PAYMENT_LABEL[o.paymentMethod]}</td>
                  <td className="td"><StatusBadge status={o.paymentStatus} /></td>
                  <td className="td"><StatusBadge status={o.status} /></td>
                  <td className="td text-charcoal/60">{dateTime(o.createdAt)}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} className="td py-10 text-center text-charcoal/55">No orders match.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
