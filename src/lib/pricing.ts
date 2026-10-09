// Pure pricing helpers shared by the client cart and the server checkout.
// The server always recomputes prices from the database; never trust the client.

export type Tier = { label: string; minQty: number; discountPercent: number };

export type PriceableProduct = {
  price: number;
  salePrice: number | null;
  productType: string;
};

export type ItemOptions = Record<string, string>;

export const PREP_OPTIONS = [
  { value: "whole", label: "Whole", fee: 0, desc: "As processed, ready for collection" },
  { value: "cleaned", label: "Cleaned", fee: 5000, desc: "Scalded, scraped & gutted" },
  { value: "dressed", label: "Dressed", fee: 8000, desc: "Cleaned, head & trotters trimmed" },
  { value: "custom", label: "Custom Cut", fee: 12000, desc: "Cut to your instructions" },
] as const;

export const PIG_DELIVERY = [
  { value: "pickup", label: "Pickup", desc: "Collect from our facility", method: "pickup" },
  { value: "local", label: "Local Delivery", desc: "Delivered to your address", method: "standard" },
  { value: "scheduled", label: "Scheduled Delivery", desc: "Pick a date that suits you", method: "scheduled" },
] as const;

export const WEIGHT_PRESETS = [0.5, 1, 2, 5, 10];

export function isWeightType(type: string): boolean {
  return type === "weight_based" || type === "bulk";
}

export function prepFee(prep?: string): number {
  return PREP_OPTIONS.find((p) => p.value === prep)?.fee ?? 0;
}

export function basePrice(p: PriceableProduct): number {
  return p.salePrice ?? p.price;
}

export function sortTiers(tiers: Tier[]): Tier[] {
  return [...tiers].sort((a, b) => a.minQty - b.minQty);
}

export function tierFor(qty: number, tiers: Tier[]): Tier | null {
  const sorted = sortTiers(tiers);
  let match: Tier | null = null;
  for (const t of sorted) if (qty >= t.minQty) match = t;
  return match;
}

export function tierRangeLabel(tiers: Tier[], index: number, unit = "kg"): string {
  const sorted = sortTiers(tiers);
  const t = sorted[index];
  const next = sorted[index + 1];
  const min = index === 0 ? 1 : t.minQty;
  if (!next) return `${min}${unit}+`;
  const max = next.minQty - 1;
  return `${min}–${max}${unit}`;
}

/** Effective unit price (per kg / per pack / per pig, excluding pig prep fee). */
export function unitPrice(p: PriceableProduct, qty: number, tiers: Tier[]): number {
  const base = basePrice(p);
  if (isWeightType(p.productType)) {
    const t = tierFor(qty, tiers);
    const disc = t?.discountPercent ?? 0;
    return Math.round(base * (1 - disc / 100));
  }
  return base;
}

/** Price per billable unit including any per-item add-ons (whole pig preparation). */
export function effectiveUnitPrice(p: PriceableProduct, qty: number, tiers: Tier[], options?: ItemOptions): number {
  const up = unitPrice(p, qty, tiers);
  if (p.productType === "whole_pig") return up + prepFee(options?.prep);
  return up;
}

export function lineTotal(p: PriceableProduct, qty: number, tiers: Tier[], options?: ItemOptions): number {
  return Math.round(effectiveUnitPrice(p, qty, tiers, options) * qty);
}

export type DeliveryZone = {
  id: number;
  name: string;
  states: string[];
  fee: number;
  contactOnly: boolean;
  note: string;
};

export function zoneForState(state: string, zones: DeliveryZone[]): DeliveryZone | null {
  const s = state.trim().toLowerCase();
  if (!s) return null;
  return zones.find((z) => z.states.some((x) => x.toLowerCase() === s)) ?? null;
}

export function deliveryQuote(
  method: string,
  state: string,
  zones: DeliveryZone[],
): { fee: number; tbc: boolean; zone: DeliveryZone | null } {
  if (method === "pickup") return { fee: 0, tbc: false, zone: null };
  const zone = zoneForState(state, zones);
  if (!zone || zone.contactOnly) return { fee: 0, tbc: true, zone };
  return { fee: zone.fee, tbc: false, zone };
}
