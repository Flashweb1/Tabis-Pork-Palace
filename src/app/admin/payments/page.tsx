import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { AdminHeader, Panel, StatCard } from "@/components/admin/AdminUi";
import { StatusBadge } from "@/components/ui";
import { updatePaymentStatus } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { PAYMENT_LABEL, dateTime, naira } from "@/lib/format";

export const metadata: Metadata = { title: "Payments" };

export default async function AdminPayments({ searchParams }: { searchParams: Promise<{ status?: string; method?: string }> }) {
  await requireAdmin("payments");
  const sp = await searchParams;
  const conds: SQL[] = [];
  if (sp.status) conds.push(eq(payments.status, sp.status));
  if (sp.method) conds.push(eq(payments.method, sp.method));
  const [list, allPays] = await Promise.all([
    db.select({ p: payments, code: orders.code, customer: orders.customerName, orderStatus: orders.status, orderId: orders.id }).from(payments).innerJoin(orders, eq(orders.id, payments.orderId)).where(conds.length ? and(...conds) : undefined).orderBy(desc(payments.createdAt)).limit(200),
    db.select({ amount: payments.amount, status: payments.status }).from(payments),
  ]);
  const sum = (st: string) => allPays.filter((p) => p.status === st).reduce((a, b) => a + b.amount, 0);
  return (
    <div>
      <AdminHeader title="Payments" sub="Gateway payments confirm automatically. Bank transfers and pay-on-delivery are confirmed here." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3"><StatCard label="Received" value={naira(sum("paid"))} /><StatCard label="Awaiting confirmation" value={naira(sum("pending"))} /><StatCard label="Failed / refunded" value={naira(sum("failed") + sum("refunded"))} /></div>
      <form className="card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
        <select name="status" defaultValue={sp.status ?? ""} className="input !py-2" aria-label="Status"><option value="">All statuses</option>{["paid", "pending", "failed", "refunded"].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
        <select name="method" defaultValue={sp.method ?? ""} className="input !py-2" aria-label="Method"><option value="">All methods</option>{Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <button className="btn-primary btn-sm">Filter</button><Link href="/admin/payments" className="btn-outline btn-sm">Reset</Link>
      </form>
      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-forest-3"><tr><th className="th">Order</th><th className="th">Customer</th><th className="th">Method</th><th className="th">Reference</th><th className="th">Amount</th><th className="th">Status</th><th className="th">Date</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {list.map(({ p, code, customer, orderId }) => (
                <tr key={p.id} className="hover:bg-forest/5">
                  <td className="td font-semibold"><Link href={`/admin/orders/${orderId}`} className="text-forest hover:underline">#{code}</Link></td>
                  <td className="td">{customer}</td><td className="td">{PAYMENT_LABEL[p.method] ?? p.method}</td><td className="td font-mono text-xs text-charcoal/60">{p.reference || "—"}</td>
                  <td className="td font-semibold">{naira(p.amount)}</td><td className="td"><StatusBadge status={p.status} /></td><td className="td text-charcoal/60">{dateTime(p.createdAt)}</td>
                  <td className="td text-right">{p.status === "pending" && <form action={updatePaymentStatus}><input type="hidden" name="orderId" value={orderId} /><input type="hidden" name="paymentStatus" value="paid" /><button className="btn-outline btn-sm">Mark paid</button></form>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
