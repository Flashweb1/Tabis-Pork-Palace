import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderEvents, orderItems, orders, payments, pigs } from "@/db/schema";
import { AdminHeader, F, Panel } from "@/components/admin/AdminUi";
import { StatusBadge } from "@/components/ui";
import { adjustOrderItem, confirmDeliveryFee, markReviewed, updateOrderStatus, updatePaymentStatus } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES, PAYMENT_LABEL, STATUS_LABEL, dateTime, naira, qtyLabel } from "@/lib/format";
import { PIG_DELIVERY, PREP_OPTIONS } from "@/lib/pricing";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("orders");
  const { id } = await params;
  const oid = Number(id);
  if (!Number.isFinite(oid)) notFound();
  const o = (await db.select().from(orders).where(eq(orders.id, oid)).limit(1))[0];
  if (!o) notFound();
  const [items, events, pays, reserved] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, oid)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, oid)).orderBy(asc(orderEvents.createdAt)),
    db.select().from(payments).where(eq(payments.orderId, oid)),
    db.select().from(pigs).where(eq(pigs.orderId, oid)),
  ]);
  const idx = ORDER_STATUSES.indexOf(o.status as (typeof ORDER_STATUSES)[number]);
  const next = idx >= 0 && idx < ORDER_STATUSES.length - 1 ? ORDER_STATUSES[idx + 1] : null;
  const wa = `https://wa.me/${o.phone.replace(/\D/g, "").replace(/^0/, "234")}?text=${encodeURIComponent(`Hello ${o.customerName}, this is Tabis Pork Palace about your order ${o.code}.`)}`;
  return (
    <div>
      <Link href="/admin/orders" className="text-sm font-semibold text-forest hover:underline">← Orders</Link>
      <AdminHeader title={`Order #${o.code}`} sub={`Placed ${dateTime(o.createdAt)}`} actions={<><StatusBadge status={o.status} /><StatusBadge status={o.paymentStatus} /><Link href={`/invoice/${o.code}`} target="_blank" className="btn-outline btn-sm">Invoice / packing slip</Link></>} />
      {(o.needsReview || o.deliveryFeeTbc) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/50 bg-gold-3 p-4 text-sm text-[#6b5120]">
          <span>{o.needsReview && "Contains estimated-weight items — confirm final weights & prices. "}{o.deliveryFeeTbc && "Delivery fee needs confirmation."}</span>
          {o.needsReview && <form action={markReviewed}><input type="hidden" name="orderId" value={o.id} /><button className="btn-outline btn-sm">Mark reviewed</button></form>}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-forest/10">
              {items.map((i) => (
                <li key={i.id} className="p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-semibold text-charcoal">{i.name}</p>
                      <p className="text-sm text-charcoal/60">{qtyLabel(i.qty, i.unit)} × {naira(i.unitPrice)}</p>
                      {i.productType === "whole_pig" && <p className="text-xs text-charcoal/60">Est. {i.options.estimatedWeight} · {PREP_OPTIONS.find((p) => p.value === i.options.prep)?.label} · {PIG_DELIVERY.find((p) => p.value === i.options.delivery)?.label}</p>}
                      {i.options.notes && <p className="text-xs text-charcoal/60">Notes: {i.options.notes}</p>}
                    </div>
                    <p className="font-semibold">{naira(i.lineTotal)}</p>
                  </div>
                  {(i.productType === "whole_pig" || i.unit === "kg") && (
                    <form action={adjustOrderItem} className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-forest-3/60 p-3">
                      <input type="hidden" name="itemId" value={i.id} />
                      <F label="Final weight (kg)" className="w-36"><input name="finalWeight" type="number" step="0.1" defaultValue={i.finalWeight ?? ""} className="input !py-1.5" /></F>
                      <F label="Confirmed line total (₦)" className="w-48"><input name="lineTotal" type="number" defaultValue={i.lineTotal} className="input !py-1.5" /></F>
                      <button className="btn-outline btn-sm">Confirm weight &amp; price</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <dl className="space-y-2 bg-ivory-2/50 px-5 py-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(o.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery {o.deliveryFeeTbc && <span className="badge ml-1 bg-gold-3 text-[#7a5d22]">TBC</span>}</dt><dd>{naira(o.deliveryFee)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between"><dt>Discount {o.couponCode && `(${o.couponCode})`}</dt><dd>−{naira(o.discount)}</dd></div>}
              <div className="flex justify-between border-t border-forest/10 pt-2 text-base font-semibold text-forest"><dt>Total</dt><dd className="font-display text-2xl">{naira(o.total)}</dd></div>
            </dl>
            {o.deliveryMethod !== "pickup" && (
              <form action={confirmDeliveryFee} className="flex flex-wrap items-end gap-2 border-t border-forest/10 p-4">
                <input type="hidden" name="orderId" value={o.id} />
                <F label="Set delivery fee (₦)" className="w-48"><input name="deliveryFee" type="number" defaultValue={o.deliveryFee} className="input !py-1.5" /></F>
                <button className="btn-outline btn-sm">Update fee</button>
              </form>
            )}
          </Panel>
          <Panel title="Timeline">
            <ul className="divide-y divide-forest/10 text-sm">
              {events.map((e) => (<li key={e.id} className="flex justify-between gap-3 px-5 py-3"><span><span className="font-semibold capitalize text-forest">{STATUS_LABEL[e.status] ?? e.status.replace("-", " ")}</span>{e.note && <span className="ml-2 text-charcoal/65">— {e.note}</span>}</span><span className="shrink-0 text-xs text-charcoal/50">{dateTime(e.createdAt)}</span></li>))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Fulfilment">
            <div className="space-y-4 p-5">
              {next && o.status !== "cancelled" && (
                <form action={updateOrderStatus}><input type="hidden" name="orderId" value={o.id} /><input type="hidden" name="status" value={next} /><button className="btn-primary w-full">Mark as {STATUS_LABEL[next]}</button></form>
              )}
              <form action={updateOrderStatus} className="space-y-3">
                <input type="hidden" name="orderId" value={o.id} />
                <F label="Set status"><select name="status" defaultValue={o.status} className="input !py-2">{[...ORDER_STATUSES, "cancelled"].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></F>
                <F label="Note (shown in timeline)"><input name="note" className="input !py-2" /></F>
                <button className="btn-outline w-full btn-sm">Update status</button>
              </form>
              <p className="text-xs text-charcoal/55">Pending → Confirmed → Preparing → Ready → Dispatched → Delivered. Customers are notified in-app on every change. Cancelling restocks items and releases reserved pigs.</p>
            </div>
          </Panel>
          <Panel title="Payment">
            <div className="space-y-3 p-5 text-sm">
              <p>{PAYMENT_LABEL[o.paymentMethod]} · <StatusBadge status={o.paymentStatus} /></p>
              {pays.map((p) => <p key={p.id} className="text-xs text-charcoal/55">Ref {p.reference || "—"} · {naira(p.amount)} · {p.status}</p>)}
              <form action={updatePaymentStatus} className="flex gap-2">
                <input type="hidden" name="orderId" value={o.id} />
                <select name="paymentStatus" defaultValue={o.paymentStatus} className="input !py-2" aria-label="Payment status">{["pending", "paid", "failed", "refunded"].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select>
                <button className="btn-outline btn-sm">Save</button>
              </form>
            </div>
          </Panel>
          <Panel title="Customer">
            <div className="space-y-1 p-5 text-sm">
              <p className="font-semibold text-forest">{o.customerName}</p>
              <p>{o.phone} · {o.email}</p>
              <p className="pt-2 text-charcoal/60">{o.deliveryMethod === "pickup" ? "Pickup" : `${o.address}, ${o.city} ${o.state}`}</p>
              <p className="capitalize text-charcoal/60">{o.deliveryMethod} delivery{o.deliveryDate ? ` · ${o.deliveryDate}` : ""}</p>
              {o.instructions && <p className="text-charcoal/60">Note: {o.instructions}</p>}
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm mt-3">Message on WhatsApp</a>
            </div>
          </Panel>
          {reserved.length > 0 && (
            <Panel title="Reserved pigs">
              <ul className="divide-y divide-forest/10 text-sm">{reserved.map((p) => <li key={p.id} className="flex justify-between px-5 py-3"><span className="font-semibold">{p.tag}</span><span>{p.actualWeight ?? p.estWeight}kg · <StatusBadge status={p.status} /></span></li>)}</ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
