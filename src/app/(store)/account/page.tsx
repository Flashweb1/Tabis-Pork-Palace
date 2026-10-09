import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { dateShort, naira } from "@/lib/format";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const mine = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));
  const pending = mine.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const done = mine.filter((o) => o.status === "delivered").length;
  return (
    <div>
      <p className="eyebrow">Dashboard</p>
      <h1 className="font-display text-5xl font-semibold text-forest">Welcome, {user.name.split(" ")[0]}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Total orders", mine.length], ["Pending orders", pending], ["Completed orders", done]].map(([l, v]) => (
          <div key={l} className="card p-5"><p className="text-sm text-charcoal/60">{l}</p><p className="font-display text-5xl font-semibold text-forest">{v}</p></div>
        ))}
      </div>
      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-forest/10 px-5 py-4"><h2 className="font-display text-2xl font-semibold text-forest">Recent orders</h2><Link href="/account/orders" className="text-sm font-semibold text-forest hover:underline">View all</Link></div>
        {mine.length === 0 ? <p className="p-6 text-charcoal/60">No orders yet. <Link href="/shop" className="font-semibold text-forest underline">Start shopping</Link></p> : (
          <ul className="divide-y divide-forest/10">
            {mine.slice(0, 5).map((o) => (
              <li key={o.id}><Link href={`/order/${o.code}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-forest/5"><span><span className="font-semibold text-forest">#{o.code}</span><span className="ml-3 text-sm text-charcoal/55">{dateShort(o.createdAt)}</span></span><span className="flex items-center gap-4"><span className="text-sm font-semibold">{naira(o.total)}</span><StatusBadge status={o.status} /></span></Link></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
