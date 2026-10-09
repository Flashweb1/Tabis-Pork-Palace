import { naira } from "@/lib/format";

export type SnapshotLike = {
  id: number;
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

type CartLike = {
  productId: number;
  name: string;
  image: string;
  unit: string;
  productType: string;
  price: number;
  salePrice: number | null;
  minOrder: number;
  maxOrder: number | null;
  qty: number;
};

const label = (n: number, unit: string) => `${n}${unit === "kg" ? "kg" : ""}`;

/**
 * Bring a browser-stored cart back in line with the live catalogue:
 * drops unavailable items, clamps quantities to stock/limits, refreshes prices — and explains every change.
 */
export function reconcileCart<T extends CartLike>(items: T[], snaps: Map<number, SnapshotLike>): { items: T[]; notices: string[] } {
  const notices: string[] = [];
  const out: T[] = [];
  for (const i of items) {
    const s = snaps.get(i.productId);
    if (!s || !s.available || s.productType === "quote_required") {
      notices.push(`${i.name} is no longer available and was removed from your cart.`);
      continue;
    }
    const min = s.minOrder > 0 ? s.minOrder : 1;
    if (s.stock < min) {
      notices.push(`${s.name} is out of stock and was removed from your cart.`);
      continue;
    }
    const cap = Math.min(s.maxOrder ?? Infinity, s.stock);
    let qty = i.qty;
    if (qty > cap) {
      qty = cap;
      notices.push(`${s.name} was reduced to ${label(cap, s.unit)} — the most we can supply right now.`);
    }
    if (qty < min) qty = min;
    const was = i.salePrice ?? i.price;
    const now = s.salePrice ?? s.price;
    if (was !== now) notices.push(`The price of ${s.name} changed from ${naira(was)} to ${naira(now)}.`);
    out.push({
      ...i,
      name: s.name,
      image: s.image,
      unit: s.unit,
      productType: s.productType,
      price: s.price,
      salePrice: s.salePrice,
      minOrder: min,
      maxOrder: s.maxOrder,
      qty: Math.round(qty * 100) / 100,
    });
  }
  return { items: out, notices };
}
