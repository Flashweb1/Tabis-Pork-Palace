import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orderItems, orders } from "@/db/schema";
import { OrderView } from "@/components/OrderView";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = { title: "Track your order" };

const digits = (s: string) => s.replace(/\D/g, "");

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string; contact?: string; placed?: string }> }) {
  const { code = "", contact = "", placed } = await searchParams;
  let found = null as null | { o: typeof orders.$inferSelect };
  let tried = false;
  if (code && contact) {
    tried = true;
    const o = (await db.select().from(orders).where(eq(orders.code, code.trim().toUpperCase())).limit(1))[0];
    const c = contact.trim().toLowerCase();
    if (o && (o.email.toLowerCase() === c || (digits(c).length >= 7 && digits(o.phone).endsWith(digits(c).slice(-9))))) found = { o };
  }
  const [items, events, settings] = found
    ? await Promise.all([
        db.select().from(orderItems).where(eq(orderItems.orderId, found.o.id)),
        db.select().from(orderEvents).where(eq(orderEvents.orderId, found.o.id)).orderBy(asc(orderEvents.createdAt)),
        getSettings(),
      ])
    : [[], [], null];
  return (
    <div className="container-x py-10">
      {!found && (
        <div className="mx-auto max-w-xl">
          <p className="eyebrow">Order tracking</p>
          <h1 className="mt-2 font-display text-5xl font-semibold text-forest">Track your order</h1>
          <p className="mt-3 text-charcoal/70">Enter your order number and the email or phone number you used at checkout.</p>
          <form className="card mt-6 space-y-4 p-6" method="get">
            <div><label className="label" htmlFor="code">Order number</label><input id="code" name="code" defaultValue={code} placeholder="TP-10482" required className="input" /></div>
            <div><label className="label" htmlFor="contact">Email or phone</label><input id="contact" name="contact" defaultValue={contact} required className="input" /></div>
            <button className="btn-primary w-full">Track order</button>
            {tried && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">We couldn&apos;t find an order matching those details.</p>}
          </form>
        </div>
      )}
      {found && settings && <OrderView order={found.o} items={items} events={events} settings={settings} showAddress={false} placed={!!placed} />}
    </div>
  );
}
