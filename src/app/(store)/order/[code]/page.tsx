import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orderItems, orders } from "@/db/schema";
import { OrderView } from "@/components/OrderView";
import { requireUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ placed?: string }> }) {
  const { code } = await params;
  const { placed } = await searchParams;
  const user = await requireUser(`/order/${code}`);
  const o = (await db.select().from(orders).where(eq(orders.code, code)).limit(1))[0];
  if (!o || (o.userId !== user.id && !isAdminRole(user.role))) notFound();
  const [items, events, settings] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, o.id)).orderBy(asc(orderEvents.createdAt)),
    getSettings(),
  ]);
  return (
    <div className="container-x py-10">
      <OrderView order={o} items={items} events={events} settings={settings} showAddress placed={!!placed} canCancel={o.userId === user.id} canReorder={o.userId === user.id} invoiceHref={`/invoice/${o.code}`} />
    </div>
  );
}
