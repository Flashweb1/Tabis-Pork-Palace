import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";
import { requireUser } from "@/lib/auth";
import { PAYMENT_LABEL, dateShort, naira, qtyLabel } from "@/lib/format";
import { isAdminRole } from "@/lib/permissions";
import { PIG_DELIVERY, PREP_OPTIONS } from "@/lib/pricing";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = { title: "Invoice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser(`/invoice/${code}`);
  const o = (await db.select().from(orders).where(eq(orders.code, code)).limit(1))[0];
  if (!o || (o.userId !== user.id && !isAdminRole(user.role))) notFound();
  const [items, settings] = await Promise.all([db.select().from(orderItems).where(eq(orderItems.orderId, o.id)), getSettings()]);
  const paid = o.paymentStatus === "paid";
  const back = isAdminRole(user.role) && o.userId !== user.id ? `/admin/orders/${o.id}` : `/order/${o.code}`;
  const unpaidTransfer = !paid && o.paymentMethod === "bank_transfer" && o.status !== "cancelled";

  return (
    <div className="min-h-screen bg-ivory-2 px-4 py-8 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl items-center justify-between">
        <Link href={back} className="text-sm font-semibold text-forest hover:underline">← Back to order</Link>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl bg-white p-8 shadow-sm print:shadow-none sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-gold pb-6">
          <Logo />
          <div className="text-right">
            <p className="font-display text-4xl font-semibold text-forest">Invoice</p>
            <p className="text-sm text-charcoal/70">INV-{o.code}</p>
            <p className="text-sm text-charcoal/70">Date: {dateShort(o.createdAt)}</p>
            <p className={`mt-2 inline-block rounded border-2 px-3 py-0.5 text-xs font-bold uppercase tracking-widest ${paid ? "border-emerald-600 text-emerald-700" : "border-amber-600 text-amber-700"}`}>
              {paid ? "Paid" : o.paymentStatus === "pending" ? "Payment pending" : o.paymentStatus}
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">Billed to</p>
            <p className="mt-1 font-semibold text-charcoal">{o.customerName}</p>
            <p>{o.email}</p>
            <p>{o.phone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">{o.deliveryMethod === "pickup" ? "Pickup" : "Deliver to"}</p>
            <p className="mt-1">{o.deliveryMethod === "pickup" ? "Collect from our facility" : [o.address, o.city, o.state].filter(Boolean).join(", ")}</p>
            <p className="capitalize text-charcoal/70">{o.deliveryMethod}{o.deliveryDate ? ` · ${o.deliveryDate}` : ""}</p>
            <p className="text-charcoal/70">Payment: {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}</p>
          </div>
        </section>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-forest/20 text-left text-xs uppercase tracking-wider text-forest/70">
              <th className="py-2 pr-2">Item</th><th className="py-2 pr-2 text-right">Qty</th><th className="py-2 pr-2 text-right">Unit price</th><th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest/10">
            {items.map((i) => (
              <tr key={i.id} className="align-top">
                <td className="py-3 pr-2">
                  <p className="font-semibold text-charcoal">{i.name}</p>
                  {i.productType === "whole_pig" && (
                    <p className="text-xs text-charcoal/60">
                      Est. {i.options.estimatedWeight} · {PREP_OPTIONS.find((p) => p.value === i.options.prep)?.label} · {PIG_DELIVERY.find((p) => p.value === i.options.delivery)?.label}
                      {i.finalWeight ? ` · Final weight ${i.finalWeight}kg` : ""}
                    </p>
                  )}
                  {i.options.notes && <p className="text-xs text-charcoal/60">Notes: {i.options.notes}</p>}
                </td>
                <td className="py-3 pr-2 text-right">{qtyLabel(i.qty, i.unit)}</td>
                <td className="py-3 pr-2 text-right">{naira(i.unitPrice)}</td>
                <td className="py-3 text-right font-semibold">{naira(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{o.deliveryMethod === "pickup" ? "FREE" : o.deliveryFeeTbc ? "To be confirmed" : naira(o.deliveryFee)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between"><dt>Discount{o.couponCode ? ` (${o.couponCode})` : ""}</dt><dd>−{naira(o.discount)}</dd></div>}
          <div className="flex justify-between border-t-2 border-forest pt-2 text-base font-bold text-forest"><dt>Total</dt><dd className="font-display text-2xl">{naira(o.total)}</dd></div>
        </dl>

        {unpaidTransfer && (
          <section className="mt-8 rounded-lg border border-gold/50 bg-gold-3/60 p-4 text-sm">
            <p className="font-semibold text-forest">Pay by bank transfer</p>
            <p className="mt-1">{settings.bank_name} · {settings.bank_account_name} · <strong className="tracking-wider">{settings.bank_account_number}</strong></p>
            <p className="text-charcoal/70">Use <strong>{o.code}</strong> as your payment reference.</p>
          </section>
        )}
        {o.needsReview && (
          <p className="mt-6 text-xs text-charcoal/60">Whole-pig and estimated-weight items are billed on estimated weight. Final weight and price are confirmed by Tabis before fulfilment and any difference is adjusted.</p>
        )}

        <footer className="mt-10 border-t border-forest/15 pt-5 text-center text-xs text-charcoal/60">
          <p className="font-semibold text-forest">Thank you for choosing Tabis Pork Palace.</p>
          <p>{settings.address} · {settings.phone} · {settings.email}</p>
        </footer>
      </article>
    </div>
  );
}
