import test from "node:test";
import assert from "node:assert/strict";
import { reconcileCart, type SnapshotLike } from "@/lib/cart";

const line = (o: Partial<{ productId: number; name: string; qty: number; price: number; salePrice: number | null }> = {}) => ({
  productId: 1, name: "Pork Belly", image: "", unit: "kg", productType: "weight_based", price: 8500, salePrice: null as number | null, minOrder: 0.5, maxOrder: null as number | null, qty: 2, ...o,
});
const snap = (o: Partial<SnapshotLike> = {}): SnapshotLike => ({
  id: 1, name: "Pork Belly", image: "", unit: "kg", productType: "weight_based", price: 8500, salePrice: null, minOrder: 0.5, maxOrder: null, stock: 40, available: true, ...o,
});
const run = (items: ReturnType<typeof line>[], snaps: SnapshotLike[]) => reconcileCart(items, new Map(snaps.map((s) => [s.id, s])));

test("unchanged cart passes through untouched", () => {
  const r = run([line()], [snap()]);
  assert.equal(r.notices.length, 0);
  assert.equal(r.items[0].qty, 2);
});

test("removes unavailable and deleted products", () => {
  assert.equal(run([line()], [snap({ available: false })]).items.length, 0);
  assert.equal(run([line()], []).items.length, 0);
  assert.equal(run([line()], [snap({ stock: 0 })]).notices.length, 1);
});

test("clamps quantity to stock and max order", () => {
  assert.equal(run([line({ qty: 30 })], [snap({ stock: 12 })]).items[0].qty, 12);
  assert.equal(run([line({ qty: 9 })], [snap({ maxOrder: 5 })]).items[0].qty, 5);
});

test("refreshes changed prices and says so", () => {
  const r = run([line()], [snap({ salePrice: 7900 })]);
  assert.equal(r.items[0].salePrice, 7900);
  assert.match(r.notices[0], /changed from ₦8,500 to ₦7,900/);
});
