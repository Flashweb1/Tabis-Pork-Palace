import test from "node:test";
import assert from "node:assert/strict";
import { deliveryQuote, effectiveUnitPrice, lineTotal, tierFor, unitPrice, type DeliveryZone, type Tier } from "@/lib/pricing";

const tiers: Tier[] = [
  { label: "Retail", minQty: 0, discountPercent: 0 },
  { label: "Bulk", minQty: 6, discountPercent: 5 },
  { label: "Wholesale", minQty: 21, discountPercent: 10 },
  { label: "Business", minQty: 51, discountPercent: 15 },
];
const belly = { price: 8500, salePrice: null, productType: "weight_based" };
const pig = { price: 285000, salePrice: null, productType: "whole_pig" };
const zones: DeliveryZone[] = [
  { id: 1, name: "Zone A", states: ["Lagos"], fee: 2000, contactOnly: false, note: "" },
  { id: 2, name: "Zone D", states: ["Borno"], fee: 0, contactOnly: true, note: "" },
];

test("tier boundaries", () => {
  assert.equal(tierFor(5, tiers)?.label, "Retail");
  assert.equal(tierFor(6, tiers)?.label, "Bulk");
  assert.equal(tierFor(20.5, tiers)?.label, "Bulk");
  assert.equal(tierFor(21, tiers)?.label, "Wholesale");
  assert.equal(tierFor(51, tiers)?.label, "Business");
});

test("weight-based products get tier discounts", () => {
  assert.equal(unitPrice(belly, 1, tiers), 8500);
  assert.equal(unitPrice(belly, 25, tiers), 7650);
  assert.equal(lineTotal(belly, 25, tiers), 191250);
});

test("sale price is used as the base price", () => {
  assert.equal(unitPrice({ ...belly, salePrice: 8200 }, 1, tiers), 8200);
});

test("standard products ignore weight tiers", () => {
  assert.equal(unitPrice({ price: 4500, salePrice: null, productType: "standard" }, 30, tiers), 4500);
});

test("whole pig preparation adds a per-pig fee", () => {
  assert.equal(effectiveUnitPrice(pig, 1, tiers, { prep: "whole" }), 285000);
  assert.equal(effectiveUnitPrice(pig, 1, tiers, { prep: "dressed" }), 293000);
  assert.equal(lineTotal(pig, 2, tiers, { prep: "cleaned" }), 2 * 290000);
});

test("delivery quotes", () => {
  assert.deepEqual({ fee: deliveryQuote("standard", "Lagos", zones).fee, tbc: deliveryQuote("standard", "Lagos", zones).tbc }, { fee: 2000, tbc: false });
  assert.equal(deliveryQuote("standard", "lagos", zones).fee, 2000, "state match is case-insensitive");
  assert.equal(deliveryQuote("pickup", "Kano", zones).fee, 0);
  assert.equal(deliveryQuote("pickup", "Kano", zones).tbc, false);
  assert.equal(deliveryQuote("standard", "Kano", zones).tbc, true, "unmatched state needs confirmation");
  assert.equal(deliveryQuote("standard", "Borno", zones).tbc, true, "contact-only zone needs confirmation");
});
