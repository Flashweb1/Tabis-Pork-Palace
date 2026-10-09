"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { useApp } from "@/components/AppProvider";
import { WEIGHT_PRESETS, isWeightType, lineTotal, tierFor } from "@/lib/pricing";
import { naira } from "@/lib/format";

export type AddProduct = {
  id: number;
  slug: string;
  name: string;
  image: string;
  unit: string;
  productType: string;
  price: number;
  salePrice: number | null;
  minOrder: number;
  maxOrder: number | null;
  stock: number;
  available: boolean;
};

const round = (n: number) => Math.round(n * 100) / 100;

export function AddToCart({ product: p, variant = "card" }: { product: AddProduct; variant?: "card" | "page" }) {
  const app = useApp();
  const weight = isWeightType(p.productType);
  const min = p.minOrder > 0 ? p.minOrder : weight ? 0.5 : 1;
  const step = weight ? (min >= 5 ? 1 : 0.5) : 1;
  const cap = Math.min(p.maxOrder ?? Infinity, p.stock);
  const orderable = p.available && p.stock >= min;
  const [qty, setQty] = useState(Math.max(min, weight ? Math.min(1, cap) : 1));
  const [custom, setCustom] = useState(false);

  if (p.productType === "quote_required")
    return (
      <Link href={`/quote?product=${p.slug}`} className="btn-gold w-full">
        Request Quote
      </Link>
    );
  if (p.productType === "whole_pig" && variant === "card")
    return (
      <Link href={`/product/${p.slug}`} className={orderable ? "btn-primary w-full" : "btn-outline w-full"}>
        {orderable ? "Choose prep & buy" : "View details"}
      </Link>
    );
  if (!orderable)
    return (
      <button disabled className="btn-outline w-full">
        Out of stock
      </button>
    );

  const clamp = (n: number) => Math.min(cap, Math.max(min, round(n)));
  const total = lineTotal(p, qty, app.tiers);
  const tier = weight ? tierFor(qty, app.tiers) : null;
  const unitLabel = p.unit === "kg" ? "kg" : "";

  function addToCart() {
    app.add({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.image,
      unit: p.unit,
      productType: p.productType,
      price: p.price,
      salePrice: p.salePrice,
      minOrder: min,
      maxOrder: p.maxOrder,
      qty,
      options: {},
    });
  }

  return (
    <div className="space-y-3">
      {variant === "page" && weight && (
        <div>
          <span className="label">Weight</span>
          <div className="flex flex-wrap gap-2">
            {WEIGHT_PRESETS.filter((w) => w >= min && w <= cap).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setQty(w);
                  setCustom(false);
                }}
                className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${!custom && qty === w ? "border-forest bg-forest text-ivory" : "border-forest/20 bg-white text-forest hover:border-forest"}`}
              >
                {w} kg
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustom(true)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${custom ? "border-forest bg-forest text-ivory" : "border-forest/20 bg-white text-forest hover:border-forest"}`}
            >
              Custom
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-lg border border-forest/20 bg-white">
          <button type="button" aria-label="Decrease quantity" onClick={() => setQty(clamp(qty - step))} className="grid h-10 w-10 place-items-center text-forest hover:bg-forest/5">
            <Icon name="minus" className="h-4 w-4" />
          </button>
          {custom || (variant === "page" && !weight) ? (
            <input
              type="number"
              inputMode="decimal"
              min={min}
              max={cap}
              step={weight ? 0.1 : 1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              onBlur={() => setQty(clamp(qty || min))}
              className="h-10 w-16 border-x border-forest/10 bg-transparent text-center text-sm font-semibold outline-none"
              aria-label="Quantity"
            />
          ) : (
            <span className="min-w-[4.25rem] border-x border-forest/10 px-2 text-center text-sm font-semibold leading-10">
              {qty}
              {unitLabel}
            </span>
          )}
          <button type="button" aria-label="Increase quantity" onClick={() => setQty(clamp(qty + step))} className="grid h-10 w-10 place-items-center text-forest hover:bg-forest/5">
            <Icon name="plus" className="h-4 w-4" />
          </button>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold leading-none text-forest">{naira(total)}</div>
          {tier && tier.discountPercent > 0 && (
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gold">
              {tier.label} price · {tier.discountPercent}% off
            </div>
          )}
        </div>
      </div>

      {weight && min > 1 && <p className="text-xs text-charcoal/60">Minimum order {min}kg</p>}
      <button type="button" onClick={addToCart} className="btn-primary w-full">
        <Icon name="cart" className="h-4 w-4" /> Add to Cart
      </button>
    </div>
  );
}
