"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import * as s from "@/db/schema";
import { createSession, getSession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { bool, num, str, type FormState } from "@/lib/form";
import { createOrder, evaluateCoupon, notifyAdmins, priceLines, setOrderStatus, confirmationUrl, type CartLineInput } from "@/lib/orders";
import { startPayment } from "@/lib/payments";
import { TOO_MANY, allow } from "@/lib/ratelimit";
import { resetDemoCache } from "@/lib/demo";
import { getAllProducts, type ProductView } from "@/lib/store";

export type PlaceOrderPayload = {
  customer: { name: string; phone: string; email: string };
  delivery: { address: string; state: string; city: string; instructions: string; method: string; date: string };
  paymentMethod: string;
  couponCode?: string;
  createPassword?: string;
  lines: CartLineInput[];
};

async function originOf() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function placeOrder(p: PlaceOrderPayload): Promise<{ ok: true; redirect: string } | { ok: false; error: string }> {
  if (!(await allow("order", 20, 10 * 60_000))) return { ok: false, error: "Too many orders from this device. Please wait a few minutes and try again." };
  const name = (p.customer?.name ?? "").trim();
  const email = (p.customer?.email ?? "").trim().toLowerCase();
  const phone = (p.customer?.phone ?? "").trim();
  if (name.length < 2) return { ok: false, error: "Please enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (phone.replace(/\D/g, "").length < 10) return { ok: false, error: "Please enter a valid phone number." };

  let user = await getSession();
  if (!user && p.createPassword) {
    if (p.createPassword.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
    const exists = await db.select({ n: sql<number>`count(*)::int` }).from(s.users).where(eq(s.users.email, email));
    if (exists[0].n === 0) {
      const [u] = await db.insert(s.users).values({ name, email, phone, passwordHash: hashPassword(p.createPassword), role: "customer" }).returning();
      await createSession(u.id);
      user = { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role };
    }
  }
  const res = await createOrder({
    userId: user?.id ?? null,
    customer: { name, email, phone },
    delivery: p.delivery,
    paymentMethod: p.paymentMethod,
    couponCode: p.couponCode,
    lines: p.lines,
  });
  if (!res.ok) return res;
  const pay = await startPayment(res.order, p.paymentMethod, await originOf(), user?.id ?? null);
  return { ok: true, redirect: pay.redirect };
}

export async function checkCoupon(code: string, lines: CartLineInput[], email: string) {
  const user = await getSession();
  const priced = await priceLines(lines);
  if (priced.error) return { ok: false as const, error: priced.error };
  return evaluateCoupon(code, priced.items, { userId: user?.id ?? null, email: email || user?.email || "" });
}

export async function toggleWishlist(productId: number): Promise<{ ok: boolean; added?: boolean; login?: boolean }> {
  const user = await getSession();
  if (!user) return { ok: false, login: true };
  const existing = await db.select().from(s.wishlists).where(and(eq(s.wishlists.userId, user.id), eq(s.wishlists.productId, productId)));
  if (existing.length) {
    await db.delete(s.wishlists).where(and(eq(s.wishlists.userId, user.id), eq(s.wishlists.productId, productId)));
    revalidatePath("/account/wishlist");
    return { ok: true, added: false };
  }
  await db.insert(s.wishlists).values({ userId: user.id, productId });
  revalidatePath("/account/wishlist");
  return { ok: true, added: true };
}

export async function submitReview(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getSession();
  if (!user) return { ok: false, message: "Please sign in to leave a review." };
  if (!(await allow("review", 8, 10 * 60_000))) return { ok: false, message: TOO_MANY };
  const productId = num(fd, "productId");
  const rating = Math.min(5, Math.max(1, num(fd, "rating", 5)));
  const comment = str(fd, "comment").slice(0, 600);
  if (comment.length < 5) return { ok: false, message: "Please write a short review." };
  const bought = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(s.orderItems)
    .innerJoin(s.orders, eq(s.orders.id, s.orderItems.orderId))
    .where(and(eq(s.orders.userId, user.id), eq(s.orderItems.productId, productId), ne(s.orders.status, "cancelled")));
  await db.insert(s.reviews).values({ productId, userId: user.id, name: user.name, rating, comment, verified: bought[0].n > 0, status: "pending" });
  await notifyAdmins("New review awaiting approval", `${user.name} left a ${rating}★ review.`, "/admin/reviews");
  return { ok: true, message: "Thank you! Your review will appear once approved." };
}

export async function subscribeNewsletter(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Please enter a valid email." };
  if (!(await allow("newsletter", 8, 10 * 60_000))) return { ok: false, message: TOO_MANY };
  await db.insert(s.subscribers).values({ email }).onConflictDoNothing();
  return { ok: true, message: "You're in! Look out for offers and recipes." };
}

export async function submitContact(_prev: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name");
  const contact = str(fd, "contact");
  const message = str(fd, "message");
  if (!name || !contact || message.length < 5) return { ok: false, message: "Please complete all fields." };
  if (!(await allow("contact", 8, 10 * 60_000))) return { ok: false, message: TOO_MANY };
  await notifyAdmins(`Message from ${name}`, `${contact} — ${message.slice(0, 400)}`, "/admin/notifications");
  return { ok: true, message: "Thanks — we'll get back to you shortly. For urgent requests, use WhatsApp." };
}

export async function submitQuoteRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getSession();
  const businessName = str(fd, "businessName");
  const contactPerson = str(fd, "contactPerson");
  const phone = str(fd, "phone");
  const email = str(fd, "email").toLowerCase();
  if (!businessName || !contactPerson || phone.replace(/\D/g, "").length < 10 || !/^\S+@\S+\.\S+$/.test(email))
    return { ok: false, message: "Please complete business name, contact person, phone and a valid email." };
  if (!(await allow("quote", 8, 10 * 60_000))) return { ok: false, message: TOO_MANY };
  const [q] = await db
    .insert(s.quotes)
    .values({
      code: `TMP-${Date.now()}`,
      userId: user?.id ?? null,
      businessName,
      contactPerson,
      phone,
      email,
      businessType: str(fd, "businessType"),
      productsRequired: str(fd, "productsRequired"),
      quantity: str(fd, "quantity"),
      deliveryDate: str(fd, "deliveryDate"),
      location: str(fd, "location"),
      notes: str(fd, "notes").slice(0, 1000),
    })
    .returning();
  const code = `TP-Q-${10480 + q.id}`;
  await db.update(s.quotes).set({ code }).where(eq(s.quotes.id, q.id));
  await notifyAdmins(`New wholesale request ${code}`, `${businessName} — ${str(fd, "quantity") || "quantity not specified"}`, `/admin/quotes/${q.id}`);
  return { ok: true, message: `Request ${code} received. Our sales team will send your quote shortly${user ? " — track it in your account." : "."}` };
}

export async function acceptQuote(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/account/quotes");
  const id = num(fd, "quoteId");
  const method = str(fd, "paymentMethod") || "bank_transfer";
  const q = (await db.select().from(s.quotes).where(eq(s.quotes.id, id)).limit(1))[0];
  if (!q || (q.userId !== user.id && q.email.toLowerCase() !== user.email.toLowerCase())) return { ok: false, message: "Quote not found." };
  if (q.status !== "quoted" || !q.quoteAmount) return { ok: false, message: "This quote can't be accepted." };
  if (!["paystack", "flutterwave", "bank_transfer"].includes(method)) return { ok: false, message: "Choose a payment method." };
  const [o] = await db
    .insert(s.orders)
    .values({
      code: `TMP-${Date.now()}`, userId: user.id, customerName: q.contactPerson, phone: q.phone, email: q.email,
      address: q.location, state: "", city: "", instructions: `Wholesale quote ${q.code}. ${q.notes}`.slice(0, 500),
      deliveryMethod: "scheduled", deliveryDate: q.deliveryDate || null, subtotal: q.quoteAmount, total: q.quoteAmount,
      paymentMethod: method, status: "pending", paymentStatus: "pending", needsReview: true, quoteId: q.id,
    })
    .returning();
  const code = `TP-${10000 + o.id}`;
  await db.update(s.orders).set({ code }).where(eq(s.orders.id, o.id));
  await db.insert(s.orderItems).values({ orderId: o.id, name: `Wholesale quote ${q.code}`, productType: "quote_required", unit: "order", qty: 1, unitPrice: q.quoteAmount, lineTotal: q.quoteAmount, options: { details: q.productsRequired.slice(0, 200) } });
  await db.insert(s.orderEvents).values({ orderId: o.id, status: "pending", note: `Order created from quote ${q.code}` });
  await db.update(s.quotes).set({ status: "accepted", orderId: o.id }).where(eq(s.quotes.id, q.id));
  await notifyAdmins(`Quote ${q.code} accepted`, `${q.businessName} accepted — order ${code} created.`, `/admin/orders/${o.id}`);
  const pay = await startPayment({ id: o.id, code, total: q.quoteAmount, email: q.email, customerName: q.contactPerson, phone: q.phone, userId: user.id }, method, await originOf(), user.id);
  return { ok: true, message: "Quote accepted — order created.", redirect: pay.redirect };
}

export async function declineQuote(fd: FormData) {
  const user = await requireUser("/account/quotes");
  const id = num(fd, "quoteId");
  const q = (await db.select().from(s.quotes).where(eq(s.quotes.id, id)).limit(1))[0];
  if (q && q.status === "quoted" && (q.userId === user.id || q.email.toLowerCase() === user.email.toLowerCase())) {
    await db.update(s.quotes).set({ status: "declined" }).where(eq(s.quotes.id, id));
    await notifyAdmins(`Quote ${q.code} declined`, q.businessName, `/admin/quotes/${q.id}`);
  }
  revalidatePath("/account/quotes");
}

export async function saveAddress(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/account/addresses");
  const address = str(fd, "address");
  if (!address) return { ok: false, message: "Please enter the address." };
  const makeDefault = bool(fd, "isDefault");
  if (makeDefault) await db.update(s.addresses).set({ isDefault: false }).where(eq(s.addresses.userId, user.id));
  const values = { label: str(fd, "label") || "Home", address, city: str(fd, "city"), state: str(fd, "state"), phone: str(fd, "phone"), isDefault: makeDefault };
  const id = num(fd, "id");
  if (id > 0) {
    const updated = await db.update(s.addresses).set(values).where(and(eq(s.addresses.id, id), eq(s.addresses.userId, user.id))).returning({ id: s.addresses.id });
    if (!updated.length) return { ok: false, message: "Address not found." };
  } else {
    await db.insert(s.addresses).values({ userId: user.id, ...values });
  }
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved.", redirect: "/account/addresses" };
}

export async function setDefaultAddress(fd: FormData) {
  const user = await requireUser("/account/addresses");
  const id = num(fd, "id");
  await db.update(s.addresses).set({ isDefault: false }).where(eq(s.addresses.userId, user.id));
  await db.update(s.addresses).set({ isDefault: true }).where(and(eq(s.addresses.id, id), eq(s.addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

export async function deleteAddress(fd: FormData) {
  const user = await requireUser("/account/addresses");
  await db.delete(s.addresses).where(and(eq(s.addresses.id, num(fd, "id")), eq(s.addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const name = str(fd, "name");
  if (name.length < 2) return { ok: false, message: "Please enter your name." };
  await db.update(s.users).set({ name, phone: str(fd, "phone") }).where(eq(s.users.id, user.id));
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/account/profile");
  const current = str(fd, "current");
  const next = str(fd, "next");
  const row = (await db.select().from(s.users).where(eq(s.users.id, user.id)).limit(1))[0];
  if (!row || !verifyPassword(current, row.passwordHash)) return { ok: false, message: "Current password is incorrect." };
  if (next.length < 8) return { ok: false, message: "New password must be at least 8 characters." };
  await db.update(s.users).set({ passwordHash: hashPassword(next) }).where(eq(s.users.id, user.id));
  resetDemoCache();
  return { ok: true, message: "Password changed." };
}

export async function markNotificationsRead() {
  const user = await requireUser("/account/notifications");
  await db.update(s.notifications).set({ read: true }).where(eq(s.notifications.userId, user.id));
  revalidatePath("/account/notifications");
}

export async function markNotificationRead(fd: FormData) {
  const user = await requireUser("/account/notifications");
  await db.update(s.notifications).set({ read: true }).where(and(eq(s.notifications.id, num(fd, "id")), eq(s.notifications.userId, user.id)));
  revalidatePath("/account/notifications");
}

export async function cancelOwnOrder(fd: FormData) {
  const user = await requireUser("/account/orders");
  const id = num(fd, "orderId");
  const o = (await db.select().from(s.orders).where(and(eq(s.orders.id, id), eq(s.orders.userId, user.id))).limit(1))[0];
  if (o && o.status === "pending" && o.paymentStatus !== "paid") {
    await setOrderStatus(id, "cancelled", "Cancelled by customer", user.name);
    await notifyAdmins(`Order ${o.code} cancelled by customer`, o.customerName, `/admin/orders/${o.id}`);
  }
  redirect(confirmationUrl(o ?? { code: "", email: "", userId: user.id }, user.id).split("?")[0]);
}

/* ---------- Cart re-validation & reorder ---------- */
export type CartSnapshot = {
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

const snapshotOf = (p: ProductView): CartSnapshot => ({
  id: p.id, slug: p.slug, name: p.name, image: p.image, unit: p.unit, productType: p.productType, price: p.price,
  salePrice: p.salePrice, minOrder: p.minOrder, maxOrder: p.maxOrder, stock: p.stock, available: p.available,
});

/** Live price/stock for the items in a browser cart, so the cart never shows stale numbers. */
export async function getCartSnapshot(ids: number[]): Promise<CartSnapshot[]> {
  const wanted = new Set((Array.isArray(ids) ? ids : []).map(Number).filter(Number.isFinite).slice(0, 100));
  return (await getAllProducts()).filter((p) => wanted.has(p.id)).map(snapshotOf);
}

export type ReorderItem = CartSnapshot & { qty: number; options: Record<string, string> };

/** Items from one of the customer's own past orders, ready to drop back into the cart. */
export async function getReorderItems(orderId: number): Promise<{ items: ReorderItem[]; skipped: string[] }> {
  const user = await requireUser("/account/orders");
  const o = (await db.select().from(s.orders).where(and(eq(s.orders.id, Number(orderId)), eq(s.orders.userId, user.id))).limit(1))[0];
  if (!o) return { items: [], skipped: [] };
  const rows = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, o.id));
  const map = new Map((await getAllProducts()).map((p) => [p.id, p]));
  const items: ReorderItem[] = [];
  const skipped: string[] = [];
  for (const it of rows) {
    const p = it.productId ? map.get(it.productId) : undefined;
    const min = p && p.minOrder > 0 ? p.minOrder : 1;
    if (!p || !p.available || p.productType === "quote_required" || p.stock < min) {
      skipped.push(it.name);
      continue;
    }
    let qty = Math.min(it.qty, p.maxOrder ?? Infinity, p.stock);
    if (qty < min) qty = min;
    const options: Record<string, string> = {};
    if (p.productType === "whole_pig") for (const k of ["prep", "delivery", "estimatedWeight", "notes"]) if (it.options[k]) options[k] = it.options[k];
    items.push({ ...snapshotOf(p), qty, options });
  }
  return { items, skipped };
}
