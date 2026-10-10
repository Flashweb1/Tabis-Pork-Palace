import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ReorderButton } from "@/components/ReorderButton";
import { StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { cancelOwnOrder } from "@/app/actions/shop";
import { dateShort, naira } from "@/lib/format";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const mine = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
  return (
    <div>
      <h1 className="font-display text-5xl font-semibold text-forest">Orders</h1>
      <div className="card mt-6 overflow-x-auto">
        {mine.length === 0 ? <p className="p-8 text-charcoal/60">You haven&apos;t placed any orders yet. <Link href="/shop" className="font-semibold text-forest underline">Shop pork</Link></p> : (
          <table className="w-full min-w-[560px]">
            <thead className="bg-forest-3"><tr><th className="th">Order</th><th className="th">Date</th><th className="th">Total</th><th className="th">Payment</th><th className="th">Status</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-forest/10">
              {mine.map((o) => (
                <tr key={o.id} className="hover:bg-forest/5"><td className="td font-semibold text-forest">#{o.code}</td><td className="td">{dateShort(o.createdAt)}</td><td className="td font-semibold">{naira(o.total)}</td><td className="td"><StatusBadge status={o.paymentStatus} /></td><td className="td"><StatusBadge status={o.status} /></td><td className="td text-right"><span className="inline-flex items-center gap-3"><Link href={`/order/${o.code}`} className="text-sm font-semibold text-forest hover:underline">Track</Link><ReorderButton orderId={o.id} />{o.status === "pending" && o.paymentStatus !== "paid" && <form action={cancelOwnOrder}><input type="hidden" name="orderId" value={o.id} /><button className="text-sm font-semibold text-red-600 hover:underline">Cancel</button></form>}</span></td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
