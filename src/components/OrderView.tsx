import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/ui";
import { ReorderButton } from "@/components/ReorderButton";
import { cancelOwnOrder } from "@/app/actions/shop";
import { PAYMENT_LABEL, dateTime, naira, qtyLabel } from "@/lib/format";
import { PIG_DELIVERY, PREP_OPTIONS } from "@/lib/pricing";
import { trackingSteps } from "@/lib/orders";
import type { orderEvents, orderItems, orders } from "@/db/schema";

type Order = typeof orders.$inferSelect;
type Item = typeof orderItems.$inferSelect;
type Event = typeof orderEvents.$inferSelect;

export function Timeline({ order, events }: { order: Order; events: Event[] }) {
  if (order.status === "cancelled")
    return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">This order was cancelled.</p>;
  const steps = trackingSteps(order, events);
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 ${s.done ? "bg-forest" : "bg-forest/15"}`} />}
          <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${s.done ? "border-forest bg-forest text-ivory" : s.current ? "border-gold bg-gold-3 text-gold" : "border-forest/20 bg-white text-forest/30"}`}>
            {s.done ? <Icon name="check" className="h-4 w-4" /> : s.current ? <span className="h-2.5 w-2.5 rounded-full bg-gold" /> : <span className="h-2 w-2 rounded-full bg-forest/20" />}
          </span>
          <div className="pt-1">
            <p className={`font-semibold ${s.done || s.current ? "text-forest" : "text-charcoal/40"}`}>{s.label}</p>
            {s.time && s.done && <p className="text-xs text-charcoal/50">{dateTime(s.time)}</p>}
            {s.current && <p className="text-xs font-semibold text-gold">In progress</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function OrderView({
  order, items, events, settings, showAddress, placed, canCancel, canReorder, invoiceHref,
}: {
  order: Order; items: Item[]; events: Event[]; settings: Record<string, string>; showAddress: boolean; placed?: boolean; canCancel?: boolean; canReorder?: boolean; invoiceHref?: string;
}) {
  const pendingTransfer = order.paymentMethod === "bank_transfer" && order.paymentStatus === "pending" && order.status !== "cancelled";
  return (
    <div className="space-y-6">
      {placed && (
        <div className="rounded-2xl bg-forest p-6 text-ivory sm:p-8">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-gold text-white"><Icon name="check" className="h-6 w-6" /></span>
          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">Thank you — your order is in!</h1>
          <p className="mt-2 text-ivory/80">Order <strong className="text-gold-2">{order.code}</strong> has been placed. We&apos;ll keep you updated as it moves through each stage.</p>
        </div>
      )}
      {pendingTransfer && (
        <div className="rounded-xl border border-gold/50 bg-gold-3 p-5">
          <h2 className="font-display text-2xl font-semibold text-forest">Complete your bank transfer</h2>
          <p className="mt-1 text-sm text-charcoal/75">Transfer exactly <strong>{naira(order.total)}</strong> and use <strong>{order.code}</strong> as the payment reference. We confirm your order once payment is received.</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-charcoal/55">Bank</dt><dd className="font-semibold">{settings.bank_name}</dd></div>
            <div><dt className="text-charcoal/55">Account name</dt><dd className="font-semibold">{settings.bank_account_name}</dd></div>
            <div><dt className="text-charcoal/55">Account number</dt><dd className="font-semibold tracking-wider">{settings.bank_account_number}</dd></div>
          </dl>
        </div>
      )}
      {order.paymentMethod === "pay_on_delivery" && order.paymentStatus === "pending" && order.status !== "cancelled" && (
        <p className="rounded-xl border border-gold/50 bg-gold-3 p-4 text-sm text-charcoal/80">Pay <strong>{naira(order.total)}</strong> to our rider when your order arrives.</p>
      )}
      {(order.needsReview || order.deliveryFeeTbc) && order.status !== "cancelled" && (
        <p className="rounded-xl border border-forest/15 bg-forest-3 p-4 text-sm text-forest">
          {order.deliveryFeeTbc && "Our team will confirm your delivery fee for this location. "}
          {order.needsReview && "Final weight and price of estimated-weight items will be confirmed before fulfilment."}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <section className="card p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div><p className="eyebrow">Order</p><h2 className="font-display text-4xl font-semibold text-forest">{order.code}</h2><p className="text-xs text-charcoal/55">{dateTime(order.createdAt)}</p></div>
            <StatusBadge status={order.status} />
          </div>
          <Timeline order={order} events={events} />
          {(canReorder || invoiceHref) && (
            <div className="no-print mt-6 flex flex-wrap items-start gap-2 border-t border-forest/10 pt-4">
              {canReorder && items.some((i) => i.productId) && <ReorderButton orderId={order.id} />}
              {invoiceHref && <Link href={invoiceHref} className="btn-outline btn-sm">Invoice / receipt</Link>}
            </div>
          )}
          {canCancel && order.status === "pending" && order.paymentStatus !== "paid" && (
            <form action={cancelOwnOrder} className="mt-6 border-t border-forest/10 pt-4"><input type="hidden" name="orderId" value={order.id} /><button className="text-sm font-semibold text-red-600 hover:underline">Cancel this order</button></form>
          )}
        </section>

        <section className="space-y-6">
          <div className="card overflow-hidden">
            <h3 className="border-b border-forest/10 px-6 py-4 font-display text-2xl font-semibold text-forest">Items</h3>
            <ul className="divide-y divide-forest/10">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 px-6 py-4 text-sm">
                  <div>
                    <p className="font-semibold text-charcoal">{i.name}</p>
                    <p className="text-charcoal/60">{qtyLabel(i.qty, i.unit)} × {naira(i.unitPrice)}</p>
                    {i.productType === "whole_pig" && (
                      <p className="text-xs text-charcoal/55">
                        {i.options.estimatedWeight && `Est. ${i.options.estimatedWeight} · `}{PREP_OPTIONS.find((o) => o.value === i.options.prep)?.label} · {PIG_DELIVERY.find((o) => o.value === i.options.delivery)?.label}
                        {i.finalWeight ? ` · Final weight ${i.finalWeight}kg` : ""}
                      </p>
                    )}
                    {i.options.notes && <p className="text-xs text-charcoal/55">Notes: {i.options.notes}</p>}
                  </div>
                  <span className="font-semibold">{naira(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 bg-ivory-2/50 px-6 py-4 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{order.deliveryMethod === "pickup" ? "FREE (pickup)" : order.deliveryFeeTbc ? "To be confirmed" : naira(order.deliveryFee)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-forest-2"><dt>Discount {order.couponCode && `(${order.couponCode})`}</dt><dd>−{naira(order.discount)}</dd></div>}
              <div className="flex justify-between border-t border-forest/10 pt-3 text-base font-semibold text-forest"><dt>Total</dt><dd className="font-display text-2xl">{naira(order.total)}</dd></div>
            </dl>
          </div>
          <div className="card grid gap-4 p-6 text-sm sm:grid-cols-2">
            <div><p className="text-charcoal/55">Payment</p><p className="font-semibold">{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} · <StatusBadge status={order.paymentStatus} /></p></div>
            <div><p className="text-charcoal/55">Delivery method</p><p className="font-semibold capitalize">{order.deliveryMethod}{order.deliveryDate ? ` · ${order.deliveryDate}` : ""}</p></div>
            {showAddress && (
              <div className="sm:col-span-2"><p className="text-charcoal/55">Deliver to</p><p className="font-semibold">{order.customerName} · {order.phone}</p><p>{order.deliveryMethod === "pickup" ? "Pickup from our facility" : `${order.address}, ${order.city} ${order.state}`}</p>{order.instructions && <p className="text-charcoal/60">Note: {order.instructions}</p>}</div>
            )}
          </div>
          <p className="text-sm text-charcoal/60">Questions about this order? <Link href="/contact" className="font-semibold text-forest underline">Contact us</Link> or message us on WhatsApp.</p>
        </section>
      </div>
    </div>
  );
}
