import test from "node:test";
import assert from "node:assert/strict";
import { searchProducts } from "@/lib/search";
import type { ProductView } from "@/lib/store";

const mk = (o: Record<string, unknown>) =>
  ({ description: "", bestFor: [], categoryName: "Fresh Pork", soldCount: 0, pigRange: null, productType: "weight_based", ...o }) as unknown as ProductView;

const catalogue = [
  mk({ id: 1, name: "Premium Pork Belly", slug: "pork-belly", bestFor: ["Roasting"], soldCount: 300 }),
  mk({ id: 2, name: "Pork Ribs", slug: "pork-ribs", bestFor: ["BBQ"], soldCount: 200 }),
  mk({ id: 3, name: "Whole Pig — 40–50kg", slug: "whole-pig-40-50kg", productType: "whole_pig", pigRange: "40-50" }),
  mk({ id: 4, name: "Whole Pig — 60–80kg", slug: "whole-pig-60-80kg", productType: "whole_pig", pigRange: "60-80" }),
  mk({ id: 5, name: "Bulk Pork Belly (20kg carton)", slug: "bulk-pork-belly", productType: "bulk" }),
];

test("finds products by name", () => {
  assert.match(searchProducts("pork belly", catalogue)[0].name, /Belly/);
  assert.equal(searchProducts("pork ribs", catalogue)[0].slug, "pork-ribs");
});

test("'50kg pig' resolves to the matching weight range", () => {
  const top = searchProducts("50kg pig", catalogue)[0];
  assert.equal(top.productType, "whole_pig");
  assert.equal(top.pigRange, "40-50");
});

test("'whole pig' prefers pigs over cuts", () => {
  assert.equal(searchProducts("whole pig", catalogue)[0].productType, "whole_pig");
});

test("'bulk pork' prefers bulk products", () => {
  assert.equal(searchProducts("bulk pork", catalogue)[0].productType, "bulk");
});

test("empty and nonsense queries return nothing", () => {
  assert.equal(searchProducts("", catalogue).length, 0);
  assert.equal(searchProducts("zzzzqq", catalogue).length, 0);
});
