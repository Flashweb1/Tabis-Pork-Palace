"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { CartNotices } from "@/components/CartNotices";
import { Img } from "@/components/Img";
import { useApp, type CartItem } from "@/components/AppProvider";
import { PIG_DELIVERY, PREP_OPTIONS, isWeightType, tierFor } from "@/lib/pricing";
import { naira, qtyLabel } from "@/lib/format";

export function optionSummary(i: CartItem): string[] {
  if (i.productType !== "whole_pig") return [];
  const out: string[] = [];
  if (i.options.estimatedWeight) out.push(`Estimated weight: ${i.options.estimatedWeight}`);
  const prep = PREP_OPTIONS.find((o) => o.value === i.options.prep)?.label;
  if (prep) out.push(`Preparation: ${prep}`);
  const del = PIG_DELIVERY.find((o) => o.value === i.options.delivery)?.label;
  if (del) out.push(`Delivery: ${del}`);
  if (i.options.notes) out.push(`Notes: ${i.options.notes}`);
  return out;
}

function CartBody() {
  const { items, ready, subtotal, setQty, remove, lineOf, tiers } = useApp();
  if (!ready) return <div className="mt-8 h-48 animate-pulse rounded-xl bg-forest/5" />;
  if (items.length === 0)
    return (
      <div className="card mx-auto mt-10 max-w-lg p-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-forest-3 text-forest"><Icon name="cart" className="h-7 w-7" /></span>
        <h2 className="mt-4 font-display text-3xl font-semibold text-forest">Your cart is empty</h2>
        <p className="mt-2 text-charcoal/70">Fresh cuts, family packs and whole pigs are waiting.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/shop" className="btn-primary">Shop pork</Link><Link href="/whole-pigs" className="btn-outline">Whole pigs</Link></div>
      </div>
    );
  const hasPig = items.some((i) => i.productType === "whole_pig");
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-4">
        {items.map((i) => {
          const weight = isWeightType(i.productType);
          const step = weight ? (i.minOrder >= 5 ? 1 : 0.5) : 1;
          const tier = weight ? tierFor(i.qty, tiers) : null;
          return (
            <li key={i.key} className="card flex gap-4 p-4">
              <Link href={`/product/${i.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-forest-3 sm:h-28 sm:w-28">
                <Img src={i.image} alt={i.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/product/${i.slug}`} className="font-display text-2xl font-semibold leading-tight text-forest hover:underline">{i.name}</Link>
                    <p className="text-sm text-charcoal/60">{qtyLabel(i.qty, i.unit)}{tier && tier.discountPercent > 0 ? ` · ${tier.label} price (−${tier.discountPercent}%)` : ""}</p>
                    {optionSummary(i).map((o) => <p key={o} className="text-xs text-charcoal/60">{o}</p>)}
                  </div>
                  <button onClick={() => remove(i.key)} aria-label={`Remove ${i.name}`} className="rounded-full p-1.5 text-charcoal/50 hover:bg-red-50 hover:text-red-600"><Icon name="x" className="h-5 w-5" /></button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-lg border border-forest/20 bg-white">
                    <button aria-label="Decrease" onClick={() => setQty(i.key, Math.max(i.minOrder || step, i.qty - step))} className="grid h-9 w-9 place-items-center text-forest hover:bg-forest/5"><Icon name="minus" className="h-4 w-4" /></button>
                    <span className="min-w-14 border-x border-forest/10 px-2 text-center text-sm font-semibold leading-9">{i.qty}{i.unit === "kg" ? "kg" : ""}</span>
                    <button aria-label="Increase" onClick={() => setQty(i.key, Math.min(i.maxOrder ?? Infinity, i.qty + step))} className="grid h-9 w-9 place-items-center text-forest hover:bg-forest/5"><Icon name="plus" className="h-4 w-4" /></button>
                  </div>
                  <span className="font-display text-2xl font-semibold text-forest">{naira(lineOf(i))}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card p-6">
          <h2 className="font-display text-3xl font-semibold text-forest">Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-charcoal/65">Subtotal</dt><dd className="font-semibold">{naira(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/65">Delivery</dt><dd className="text-charcoal/60">Calculated at checkout</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/65">Discount</dt><dd className="text-charcoal/60">Add a coupon at checkout</dd></div>
            <div className="flex items-end justify-between border-t border-forest/10 pt-4"><dt className="font-semibold text-forest">Total</dt><dd className="font-display text-3xl font-semibold text-forest">{naira(subtotal)}</dd></div>
          </dl>
          {hasPig && <p className="mt-4 rounded-lg bg-gold-3 p-3 text-xs text-[#6b5120]">Whole pigs are priced on estimated weight. Final weight and price are confirmed before fulfilment.</p>}
          <Link href="/checkout" className="btn-primary mt-5 w-full">Proceed to checkout</Link>
          <Link href="/shop" className="mt-3 block text-center text-sm font-semibold text-forest hover:underline">Continue shopping</Link>
        </div>
      </aside>
    </div>
  );
}

export function CartView() {
  return (
    <>
      <CartNotices className="mt-6" />
      <CartBody />
    </>
  );
}
