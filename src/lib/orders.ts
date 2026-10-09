import { and, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { getAllProducts, getSettings, getTiers, getZones, pigRangeLabel, type ProductView } from "@/lib/store";
import {
  PIG_DELIVERY,
  PREP_OPTIONS,
  deliveryQuote,
  effectiveUnitPrice,
  isWeightType,
  lineTotal,
} from "@/lib/pricing";
import { STATUS_LABEL } from "@/lib/format";
import { emailOrderEvent } from "@/lib/notify";

const STATUS_EMAIL: Record<string, { h: string; m: string }> = {
  confirmed: { h: "Your order is confirmed", m: "Good news — we have confirmed your order and will start preparing it shortly." },
  preparing: { h: "We are preparing your order", m: "Our team is cutting, weighing and packing your order." },
  ready: { h: "Your order is packed and ready", m: "Your order is packed and ready for dispatch or collection." },
  dispatched: { h: "Your order is on its way", m: "Your order has left our facility and is on its way to you, chilled. Please be available to receive it." },
  delivered: { h: "Your order has been delivered", m: "Enjoy! If anything is not right, contact us within 24 hours and we will make it right." },
  cancelled: { h: "Your order was cancelled", m: "Your order has been cancelled. If you paid, we will arrange a refund. Contact us if this is unexpected." },
};

export type CartLineInput = { productId: number; qty: number; options?: Record<string, string> };

export type PricedItem = {
  productId: number | null;
  name: string;
  productType: string;
  unit: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  options: Record<string, string>;
};

export async function priceLines(lines: CartLineInput[]): Promise<{ items: PricedItem[]; error?: string }> {
  if (!Array.isArray(lines) || lines.length === 0) return { items: [], error: "Your cart is empty." };
  const [all, tiers] = await Promise.all([getAllProducts(), getTiers()]);
  const map = new Map(all.map((p) => [p.id, p]));
  const items: PricedItem[] = [];
  for (const l of lines) {
    const p = map.get(Number(l.productId));
    if (!p) return { items: [], error: "One of the items in your cart is no longer available." };
    if (p.productType === "quote_required") return { items: [], error: `${p.name} requires a quote.` };
    if (!p.available) return { items: [], error: `${p.name} is currently unavailable.` };
    let qty = Number(l.qty);
    if (!Number.isFinite(qty) || qty <= 0) return { items: [], error: `Invalid quantity for ${p.name}.` };
    qty = Math.round(qty * 100) / 100;
    if (!isWeightType(p.productType)) qty = Math.round(qty);
    if (qty < p.minOrder) return { items: [], error: `Minimum order for ${p.name} is ${p.minOrder}${p.unit === "kg" ? "kg" : ""}.` };
    if (p.maxOrder && qty > p.maxOrder) return { items: [], error: `Maximum order for ${p.name} is ${p.maxOrder}${p.unit === "kg" ? "kg" : ""}. Please request a quote for larger quantities.` };
    if (qty > p.stock) return { items: [], error: `Only ${p.stock}${p.unit === "kg" ? "kg" : ""} of ${p.name} available right now.` };

    const options: Record<string, string> = {};
    if (p.productType === "whole_pig") {
      const prep = PREP_OPTIONS.find((o) => o.value === l.options?.prep)?.value ?? "whole";
      const delivery = PIG_DELIVERY.find((o) => o.value === l.options?.delivery)?.value ?? "local";
      options.prep = prep;
      options.delivery = delivery;
      options.estimatedWeight = pigRangeLabel(p.pigRange);
      const notes = (l.options?.notes ?? "").toString().trim().slice(0, 300);
      if (notes) options.notes = notes;
    }
    items.push({
      productId: p.id,
      name: p.name,
      productType: p.productType,
      unit: p.unit,
      qty,
      unitPrice: effectiveUnitPrice(p, qty, tiers, options),
      lineTotal: lineTotal(p, qty, tiers, options),
      options,
    });
  }
  return { items };
}

export type CouponResult = { ok: true; code: string; discount: number; message: string } | { ok: false; error: string };

export async function evaluateCoupon(
  code: string,
  items: PricedItem[],
  who: { userId: number | null; email: string },
): Promise<CouponResult> {
  const c = (await db.select().from(s.coupons).where(sql`upper(${s.coupons.code}) = ${code.trim().toUpperCase()}`).limit(1))[0];
  if (!c || !c.active) return { ok: false, error: "That coupon code isn't valid." };
  if (c.expiresAt && c.expiresAt < new Date()) return { ok: false, error: "This coupon has expired." };
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return { ok: false, error: "This coupon has reached its usage limit." };
  const subtotal = items.reduce((a, b) => a + b.lineTotal, 0);
  if (subtotal < c.minOrder) return { ok: false, error: `Minimum order for this coupon is ₦${c.minOrder.toLocaleString("en-NG")}.` };

  if (c.newCustomersOnly) {
    const conds = [sql`lower(${s.orders.email}) = ${who.email.trim().toLowerCase()}`];
    if (who.userId) conds.push(eq(s.orders.userId, who.userId));
    const prior = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(s.orders)
      .where(and(or(...conds), ne(s.orders.status, "cancelled")));
    if (prior[0].n > 0) return { ok: false, error: "This coupon is for new customers only." };
  }

  let eligible = subtotal;
  if (c.productId || c.categoryId) {
    const all = await getAllProducts();
    const map = new Map(all.map((p) => [p.id, p]));
    eligible = items
      .filter((i) => {
        const p = i.productId ? map.get(i.productId) : undefined;
        if (!p) return false;
        return (c.productId ? p.id === c.productId : true) && (c.categoryId ? p.categoryId === c.categoryId : true);
      })
      .reduce((a, b) => a + b.lineTotal, 0);
    if (eligible <= 0) return { ok: false, error: "This coupon doesn't apply to the items in your cart." };
  }
  let discount = c.type === "percent" ? Math.floor((eligible * c.value) / 100) : Math.min(c.value, eligible);
  if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
  return { ok: true, code: c.code, discount, message: c.description || "Coupon applied" };
}

export type NewOrderInput = {
  userId: number | null;
  customer: { name: string; phone: string; email: string };
  delivery: { address: string; state: string; city: string; instructions: string; method: string; date: string };
  paymentMethod: string;
  couponCode?: string;
  lines: CartLineInput[];
};

export type CreatedOrder = { id: number; code: string; total: number; email: string; customerName: string; phone: string; userId: number | null };

export async function notifyAdmins(title: string, body: string, link?: string) {
  await db.insert(s.notifications).values({ userId: null, title, body, link: link ?? null });
}

export async function createOrder(input: NewOrderInput): Promise<{ ok: true; order: CreatedOrder } | { ok: false; error: string }> {
  try {
    const priced = await priceLines(input.lines);
    if (priced.error) return { ok: false, error: priced.error };
    const items = priced.items;
    const settings = await getSettings();
    const zones = await getZones();
    const method = ["standard", "scheduled", "pickup"].includes(input.delivery.method) ? input.delivery.method : "standard";
    if (method !== "pickup" && (!input.delivery.address.trim() || !input.delivery.state.trim())) return { ok: false, error: "Please enter your delivery address and state." };
    if (method === "scheduled" && !input.delivery.date) return { ok: false, error: "Please choose a delivery date." };

    if (input.paymentMethod === "pay_on_delivery") {
      const allowed = settings.pod_states.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
      if (method === "pickup" || !allowed.includes(input.delivery.state.trim().toLowerCase())) return { ok: false, error: "Pay on delivery isn't available for this location." };
    }
    if (!["paystack", "flutterwave", "bank_transfer", "pay_on_delivery"].includes(input.paymentMethod)) return { ok: false, error: "Please choose a payment method." };

    const subtotal = items.reduce((a, b) => a + b.lineTotal, 0);
    const dq = deliveryQuote(method, input.delivery.state, zones);
    let discount = 0;
    let couponCode: string | null = null;
    if (input.couponCode?.trim()) {
      const cr = await evaluateCoupon(input.couponCode, items, { userId: input.userId, email: input.customer.email });
      if (!cr.ok) return { ok: false, error: cr.error };
      discount = cr.discount;
      couponCode = cr.code;
    }
    const total = Math.max(0, subtotal - discount + dq.fee);
    const all = await getAllProducts();
    const pmap = new Map(all.map((p) => [p.id, p]));
    const needsReview = items.some((i) => i.productType === "whole_pig") || dq.tbc;
    const lowStock: string[] = [];

    const order = await db.transaction(async (tx) => {
      const reservations: number[] = [];
      for (const it of items) {
        const p = pmap.get(it.productId!) as ProductView;
        if (p.productType === "whole_pig") {
          const free = await tx
            .select({ id: s.pigs.id })
            .from(s.pigs)
            .where(and(eq(s.pigs.category, p.pigRange ?? ""), eq(s.pigs.status, "available")))
            .orderBy(s.pigs.id)
            .limit(it.qty)
            .for("update");
          if (free.length < it.qty) throw new Error(`Not enough ${p.name} available right now.`);
          reservations.push(...free.map((f) => f.id));
          await tx.update(s.products).set({ soldCount: sql`${s.products.soldCount} + ${it.qty}` }).where(eq(s.products.id, p.id));
          if (p.stock - it.qty <= p.lowStockThreshold) lowStock.push(`${p.name}: ${p.stock - it.qty} available`);
        } else {
          const upd = await tx
            .update(s.products)
            .set({ stock: sql`${s.products.stock} - ${it.qty}`, soldCount: sql`${s.products.soldCount} + ${it.qty}` })
            .where(and(eq(s.products.id, p.id), sql`${s.products.stock} >= ${it.qty}`))
            .returning({ stock: s.products.stock });
          if (!upd.length) throw new Error(`${p.name} just sold out. Please update your cart.`);
          if (upd[0].stock <= p.lowStockThreshold) lowStock.push(`${p.name}: ${upd[0].stock}${p.unit === "kg" ? "kg" : ""} left`);
        }
      }
      const [o] = await tx
        .insert(s.orders)
        .values({
          code: `TMP-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
          userId: input.userId,
          customerName: input.customer.name.trim(),
          phone: input.customer.phone.trim(),
          email: input.customer.email.trim().toLowerCase(),
          address: input.delivery.address.trim(),
          state: input.delivery.state.trim(),
          city: input.delivery.city.trim(),
          instructions: input.delivery.instructions.trim().slice(0, 500),
          deliveryMethod: method,
          deliveryDate: method === "scheduled" ? input.delivery.date : null,
          deliveryFee: dq.fee,
          deliveryFeeTbc: dq.tbc,
          subtotal,
          discount,
          total,
          couponCode,
          paymentMethod: input.paymentMethod,
          paymentStatus: "pending",
          status: "pending",
          needsReview,
        })
        .returning();
      const code = `TP-${10000 + o.id}`;
      await tx.update(s.orders).set({ code }).where(eq(s.orders.id, o.id));
      await tx.insert(s.orderItems).values(items.map((it) => ({ ...it, orderId: o.id })));
      await tx.insert(s.orderEvents).values({ orderId: o.id, status: "pending", note: "Order placed" });
      if (reservations.length) {
        for (const id of reservations) await tx.update(s.pigs).set({ status: "reserved", orderId: o.id }).where(eq(s.pigs.id, id));
      }
      if (couponCode) await tx.update(s.coupons).set({ usedCount: sql`${s.coupons.usedCount} + 1` }).where(eq(s.coupons.code, couponCode));
      await tx.insert(s.notifications).values({ userId: null, title: `New order ${code}`, body: `${o.customerName} · ₦${total.toLocaleString("en-NG")}${needsReview ? " · needs weight/delivery confirmation" : ""}`, link: `/admin/orders/${o.id}` });
      if (input.userId) await tx.insert(s.notifications).values({ userId: input.userId, title: `Order ${code} received`, body: "We've received your order and will confirm shortly.", link: `/order/${code}` });
      return { id: o.id, code, total, email: o.email, customerName: o.customerName, phone: o.phone, userId: input.userId };
    });

    if (settings.low_stock_alerts === "on") for (const msg of lowStock) await notifyAdmins("Low stock alert", msg, "/admin/inventory");
    void emailOrderEvent({
      to: order.email, name: order.customerName, code: order.code, total: order.total,
      headline: "We have received your order",
      message: input.paymentMethod === "bank_transfer"
        ? `Please transfer the total to ${settings.bank_name}, account ${settings.bank_account_number} (${settings.bank_account_name}) using ${order.code} as the reference. We confirm your order once payment arrives.`
        : "We will confirm it shortly and keep you updated at every step.",
    });
    return { ok: true, order };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "We couldn't place your order. Please try again." };
  }
}

export async function addOrderEvent(orderId: number, status: string, note = "") {
  await db.insert(s.orderEvents).values({ orderId, status, note });
}

/** Mark an order paid (idempotent) and log the event. */
export async function markOrderPaid(orderId: number, reference: string, note = "Payment confirmed") {
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId)).limit(1);
  if (!o || o.paymentStatus === "paid") return;
  await db.update(s.orders).set({ paymentStatus: "paid" }).where(eq(s.orders.id, orderId));
  const upd = await db.update(s.payments).set({ status: "paid", reference }).where(and(eq(s.payments.orderId, orderId), ne(s.payments.status, "paid"))).returning();
  if (!upd.length) await db.insert(s.payments).values({ orderId, method: o.paymentMethod, amount: o.total, status: "paid", reference });
  await addOrderEvent(orderId, "payment", note);
  void emailOrderEvent({ to: o.email, name: o.customerName, code: o.code, total: o.total, headline: "Payment received", message: "Thank you — we have received your payment and will confirm your order shortly." });
  if (o.userId) await db.insert(s.notifications).values({ userId: o.userId, title: `Payment confirmed for ${o.code}`, body: "Thank you — we've received your payment.", link: `/order/${o.code}` });
  await notifyAdmins(`Payment received — ${o.code}`, `₦${o.total.toLocaleString("en-NG")} via ${o.paymentMethod.replace("_", " ")}`, `/admin/orders/${o.id}`);
}

export async function setOrderStatus(orderId: number, status: string, note: string, actor: string) {
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, orderId)).limit(1);
  if (!o || o.status === status) return;
  await db.transaction(async (tx) => {
    await tx.update(s.orders).set({ status, needsReview: status === "cancelled" ? false : o.needsReview }).where(eq(s.orders.id, orderId));
    await tx.insert(s.orderEvents).values({ orderId, status, note: note || `Status changed by ${actor}` });
    if (status === "cancelled" && o.status !== "cancelled") {
      const its = await tx.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
      for (const it of its) {
        if (it.productId && it.productType !== "whole_pig") await tx.update(s.products).set({ stock: sql`${s.products.stock} + ${it.qty}` }).where(eq(s.products.id, it.productId));
      }
      await tx.update(s.pigs).set({ status: "available", orderId: null }).where(eq(s.pigs.orderId, orderId));
    }
    if (status === "delivered") {
      await tx.update(s.pigs).set({ status: "sold" }).where(eq(s.pigs.orderId, orderId));
      if (o.paymentMethod === "pay_on_delivery") {
        await tx.update(s.orders).set({ paymentStatus: "paid" }).where(eq(s.orders.id, orderId));
        await tx.update(s.payments).set({ status: "paid" }).where(eq(s.payments.orderId, orderId));
      }
    }
    if (o.userId) {
      await tx.insert(s.notifications).values({
        userId: o.userId,
        title: `Order ${o.code}: ${STATUS_LABEL[status] ?? status}`,
        body: status === "dispatched" ? "Your order is out for delivery." : status === "delivered" ? "Your order has been delivered. Enjoy!" : `Your order is now ${STATUS_LABEL[status]?.toLowerCase() ?? status}.`,
        link: `/order/${o.code}`,
      });
    }
  });
  const em = STATUS_EMAIL[status];
  if (em) void emailOrderEvent({ to: o.email, name: o.customerName, code: o.code, headline: em.h, message: em.m });
}

export function confirmationUrl(o: { code: string; email: string; userId: number | null }, viewerId: number | null): string {
  if (viewerId && o.userId === viewerId) return `/order/${o.code}?placed=1`;
  return `/track?code=${encodeURIComponent(o.code)}&contact=${encodeURIComponent(o.email)}&placed=1`;
}

export type TrackStep = { key: string; label: string; done: boolean; current: boolean; time?: Date };

export function trackingSteps(
  o: { status: string; paymentStatus: string; deliveryMethod: string },
  events: { status: string; createdAt: Date }[],
): TrackStep[] {
  const order = ["pending", "confirmed", "preparing", "ready", "dispatched", "delivered"];
  const idx = order.indexOf(o.status);
  const t = (st: string) => events.find((e) => e.status === st)?.createdAt;
  const steps: Omit<TrackStep, "current">[] = [
    { key: "placed", label: "Order Placed", done: true, time: t("pending") },
    { key: "payment", label: "Payment Confirmed", done: o.paymentStatus === "paid", time: t("payment") },
    { key: "confirmed", label: "Order Confirmed", done: idx >= 1, time: t("confirmed") },
    { key: "preparing", label: "Preparing Your Order", done: idx >= 2, time: t("preparing") },
    { key: "ready", label: o.deliveryMethod === "pickup" ? "Ready for Pickup" : "Packed & Ready", done: idx >= 3, time: t("ready") },
    ...(o.deliveryMethod === "pickup" ? [] : [{ key: "dispatched", label: "Out for Delivery", done: idx >= 4, time: t("dispatched") }]),
    { key: "delivered", label: o.deliveryMethod === "pickup" ? "Collected" : "Delivered", done: idx >= 5, time: t("delivered") },
  ];
  let currentSet = false;
  return steps.map((st) => {
    const current = !st.done && !currentSet;
    if (current) currentSet = true;
    return { ...st, current };
  });
}
