"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useApp } from "@/components/AppProvider";
import { PIG_DELIVERY, PREP_OPTIONS } from "@/lib/pricing";
import { naira } from "@/lib/format";

export type PigProduct = {
  id: number;
  slug: string;
  name: string;
  image: string;
  price: number;
  salePrice: number | null;
  range: string;
  label: string;
  stock: number;
  available: boolean;
  minOrder: number;
  maxOrder: number | null;
  quote: boolean;
};

const basePrice = (p: { price: number; salePrice: number | null }) => p.salePrice ?? p.price;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h3 className="mb-4 flex items-center gap-3 font-display text-2xl font-semibold text-forest">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-sm font-sans text-gold-2">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function WholePigBuilder({ pigs, initialSlug }: { pigs: PigProduct[]; initialSlug?: string }) {
  const app = useApp();
  const router = useRouter();
  const firstAvail = pigs.find((p) => !p.quote && p.available && p.stock > 0) ?? pigs.find((p) => !p.quote) ?? pigs[0];
  const [slug, setSlug] = useState(pigs.find((p) => p.slug === initialSlug && !p.quote)?.slug ?? firstAvail.slug);
  const [prep, setPrep] = useState<string>("whole");
  const [delivery, setDelivery] = useState<string>("local");
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const pig = pigs.find((p) => p.slug === slug) ?? firstAvail;
  const prepFee = PREP_OPTIONS.find((o) => o.value === prep)?.fee ?? 0;
  const unit = basePrice(pig) + prepFee;
  const cap = Math.max(0, Math.min(pig.maxOrder ?? 5, pig.stock));
  const orderable = pig.available && cap >= 1;

  function addItem(goToCart: boolean) {
    app.add({
      productId: pig.id, slug: pig.slug, name: pig.name, image: pig.image, unit: "pig", productType: "whole_pig",
      price: pig.price, salePrice: pig.salePrice, minOrder: 1, maxOrder: pig.maxOrder, qty,
      options: { prep, delivery, estimatedWeight: pig.label, ...(prep === "custom" && notes.trim() ? { notes: notes.trim().slice(0, 300) } : {}) },
    });
    if (goToCart) router.push("/cart");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Step n={1} title="Estimated weight">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {pigs.map((p) => {
              const sel = p.slug === slug;
              if (p.quote)
                return (
                  <Link key={p.slug} href="/quote?product=whole-pig-100kg-plus" className="flex flex-col justify-between rounded-xl border border-dashed border-gold bg-gold-3/50 p-4 text-left transition hover:bg-gold-3">
                    <span className="font-display text-2xl font-semibold text-forest">{p.label}</span>
                    <span className="mt-3 text-sm font-semibold text-[#7a5d22]">Request Quote →</span>
                  </Link>
                );
              const out = !p.available || p.stock < 1;
              return (
                <button
                  key={p.slug}
                  type="button"
                  disabled={out}
                  onClick={() => {
                    setSlug(p.slug);
                    setQty(1);
                  }}
                  aria-pressed={sel}
                  className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${sel ? "border-forest bg-forest text-ivory shadow-lg" : "border-forest/15 bg-white hover:border-forest"}`}
                >
                  <span className="block font-display text-2xl font-semibold">{p.label}</span>
                  <span className={`mt-1 block text-sm font-semibold ${sel ? "text-gold-2" : "text-forest"}`}>{naira(basePrice(p))}</span>
                  <span className={`mt-2 block text-xs ${sel ? "text-ivory/70" : "text-charcoal/55"}`}>{out ? "Unavailable" : p.stock <= 2 ? `Only ${p.stock} left` : `${p.stock} available`}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-charcoal/65">Estimated weight, not exact. Our team confirms the final weight and price before fulfilment where necessary.</p>
        </Step>

        <Step n={2} title="Preparation">
          <div className="grid gap-3 sm:grid-cols-2">
            {PREP_OPTIONS.map((o) => (
              <button key={o.value} type="button" onClick={() => setPrep(o.value)} aria-pressed={prep === o.value} className={`rounded-xl border p-4 text-left transition ${prep === o.value ? "border-forest bg-forest-3 ring-2 ring-forest" : "border-forest/15 bg-white hover:border-forest"}`}>
                <span className="flex items-center justify-between font-semibold text-forest">{o.label}<span className="text-sm text-gold">{o.fee ? `+${naira(o.fee)}` : "Included"}</span></span>
                <span className="mt-1 block text-sm text-charcoal/65">{o.desc}</span>
              </button>
            ))}
          </div>
          {prep === "custom" && (
            <div className="mt-4">
              <label className="label" htmlFor="pig-notes">Cutting instructions</label>
              <textarea id="pig-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={300} placeholder="e.g. Quarter the pig, chop belly into 2-inch cubes, keep the head…" className="input" />
            </div>
          )}
        </Step>

        <Step n={3} title="Delivery">
          <div className="grid gap-3 sm:grid-cols-3">
            {PIG_DELIVERY.map((o) => (
              <button key={o.value} type="button" onClick={() => setDelivery(o.value)} aria-pressed={delivery === o.value} className={`rounded-xl border p-4 text-left transition ${delivery === o.value ? "border-forest bg-forest-3 ring-2 ring-forest" : "border-forest/15 bg-white hover:border-forest"}`}>
                <span className="block font-semibold text-forest">{o.label}</span>
                <span className="mt-1 block text-sm text-charcoal/65">{o.desc}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-charcoal/60">Delivery fees are calculated at checkout by location. Delivery availability may vary by location and product type.</p>
        </Step>

        <Step n={4} title="Quantity">
          <div className="inline-flex items-center rounded-lg border border-forest/20 bg-white">
            <button type="button" aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center text-forest hover:bg-forest/5"><Icon name="minus" className="h-4 w-4" /></button>
            <span className="min-w-14 border-x border-forest/10 text-center font-semibold leading-[44px]">{qty}</span>
            <button type="button" aria-label="Increase" onClick={() => setQty((q) => Math.min(Math.max(1, cap), q + 1))} className="grid h-11 w-11 place-items-center text-forest hover:bg-forest/5"><Icon name="plus" className="h-4 w-4" /></button>
          </div>
          <span className="ml-4 text-sm text-charcoal/60">Max {Math.max(cap, 0)} per order · need more? <Link href="/quote" className="font-semibold text-forest underline">Request a quote</Link></span>
        </Step>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card overflow-hidden">
          <div className="bg-forest p-5 text-ivory">
            <p className="eyebrow !text-gold-2">Your whole pig</p>
            <h3 className="mt-1 font-display text-3xl font-semibold">{pig.label}</h3>
            <p className="text-sm text-ivory/75">Estimated weight: {pig.label}</p>
          </div>
          <dl className="space-y-3 p-5 text-sm">
            <div className="flex justify-between"><dt className="text-charcoal/65">Pig ({pig.label})</dt><dd className="font-semibold">{naira(basePrice(pig))}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/65">Preparation · {PREP_OPTIONS.find((o) => o.value === prep)?.label}</dt><dd className="font-semibold">{prepFee ? naira(prepFee) : "Included"}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/65">Delivery</dt><dd className="font-semibold">{PIG_DELIVERY.find((o) => o.value === delivery)?.label}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/65">Quantity</dt><dd className="font-semibold">× {qty}</dd></div>
            <div className="flex items-end justify-between border-t border-forest/10 pt-4"><dt className="font-semibold text-forest">Estimated total</dt><dd className="font-display text-3xl font-semibold text-forest">{naira(unit * qty)}</dd></div>
            <p className="rounded-lg bg-gold-3 p-3 text-xs leading-relaxed text-[#6b5120]">Final weight &amp; price are confirmed by Tabis before fulfilment. You only pay for what you receive.</p>
            <button type="button" disabled={!orderable} onClick={() => addItem(true)} className="btn-gold w-full">Buy Whole Pig</button>
            <button type="button" disabled={!orderable} onClick={() => addItem(false)} className="btn-outline w-full"><Icon name="cart" className="h-4 w-4" /> Add to Cart</button>
          </dl>
        </div>
      </aside>
    </div>
  );
}
