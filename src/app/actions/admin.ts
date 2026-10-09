"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import * as s from "@/db/schema";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { bool, num, str } from "@/lib/form";
import { slugify } from "@/lib/format";
import { markOrderPaid, notifyAdmins, setOrderStatus } from "@/lib/orders";
import { can, ADMIN_ROLES, type Section } from "@/lib/permissions";
import { resetDemoCache } from "@/lib/demo";

async function guard(section: Section) {
  return requireAdmin(section);
}
async function audit(actor: { id: number; name: string }, action: string, entity: string, detail = "") {
  await db.insert(s.auditLogs).values({ userId: actor.id, actor: actor.name, action, entity, detail });
}
const opt = (v: string) => (v === "" ? null : v);
const optNum = (fd: FormData, k: string) => (str(fd, k) === "" ? null : num(fd, k));

/* ---------- Orders ---------- */
export async function updateOrderStatus(fd: FormData) {
  const u = await requireAdmin();
  if (!can(u.role, "orders")) redirect("/admin?denied=1");
  const id = num(fd, "orderId");
  const status = str(fd, "status");
  if (!["pending", "confirmed", "preparing", "ready", "dispatched", "delivered", "cancelled"].includes(status)) return;
  await setOrderStatus(id, status, str(fd, "note"), u.name);
  await audit(u, "order.status", `order:${id}`, status);
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function updatePaymentStatus(fd: FormData) {
  const u = await requireAdmin();
  if (!can(u.role, "orders") && !can(u.role, "payments")) redirect("/admin?denied=1");
  const id = num(fd, "orderId");
  const status = str(fd, "paymentStatus");
  if (status === "paid") await markOrderPaid(id, `MANUAL-${Date.now().toString().slice(-8)}`, `Payment confirmed by ${u.name}`);
  else if (["pending", "failed", "refunded"].includes(status)) {
    await db.update(s.orders).set({ paymentStatus: status }).where(eq(s.orders.id, id));
    await db.update(s.payments).set({ status }).where(eq(s.payments.orderId, id));
    await db.insert(s.orderEvents).values({ orderId: id, status: "payment-note", note: `Payment marked ${status} by ${u.name}` });
  }
  await audit(u, "payment.status", `order:${id}`, status);
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/payments");
}
export async function adjustOrderItem(fd: FormData) {
  const u = await guard("orders");
  const itemId = num(fd, "itemId");
  const it = (await db.select().from(s.orderItems).where(eq(s.orderItems.id, itemId)).limit(1))[0];
  if (!it) return;
  const finalWeight = optNum(fd, "finalWeight");
  const lineTotal = Math.max(0, Math.round(num(fd, "lineTotal", it.lineTotal)));
  await db.update(s.orderItems).set({ finalWeight, lineTotal }).where(eq(s.orderItems.id, itemId));
  await recalcOrder(it.orderId);
  await db.insert(s.orderEvents).values({ orderId: it.orderId, status: "adjusted", note: `${it.name}: final weight ${finalWeight ?? "—"}kg, price confirmed ₦${lineTotal.toLocaleString("en-NG")}` });
  await audit(u, "order.item.adjust", `order:${it.orderId}`, `${it.name} → ₦${lineTotal}`);
  revalidatePath(`/admin/orders/${it.orderId}`);
}

export async function confirmDeliveryFee(fd: FormData) {
  const u = await guard("orders");
  const id = num(fd, "orderId");
  await db.update(s.orders).set({ deliveryFee: Math.max(0, num(fd, "deliveryFee")), deliveryFeeTbc: false }).where(eq(s.orders.id, id));
  await recalcOrder(id);
  await audit(u, "order.delivery", `order:${id}`, str(fd, "deliveryFee"));
  revalidatePath(`/admin/orders/${id}`);
}

export async function markReviewed(fd: FormData) {
  await guard("orders");
  const id = num(fd, "orderId");
  await db.update(s.orders).set({ needsReview: false }).where(eq(s.orders.id, id));
  revalidatePath(`/admin/orders/${id}`);
}

async function recalcOrder(orderIdValue: number) {
  const its = await db.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderIdValue));
  const o = (await db.select().from(s.orders).where(eq(s.orders.id, orderIdValue)).limit(1))[0];
  if (!o) return;
  const subtotal = its.reduce((a, b) => a + b.lineTotal, 0);
  const total = Math.max(0, subtotal - o.discount + o.deliveryFee);
  await db.update(s.orders).set({ subtotal, total }).where(eq(s.orders.id, orderIdValue));
  await db.update(s.payments).set({ amount: total }).where(and(eq(s.payments.orderId, orderIdValue), eq(s.payments.status, "pending")));
}

/* ---------- Products ---------- */
export async function saveProduct(fd: FormData) {
  const u = await guard("products");
  const id = num(fd, "id");
  const name = str(fd, "name");
  const type = str(fd, "productType") || "weight_based";
  const values = {
    name,
    slug: slugify(str(fd, "slug") || name),
    sku: str(fd, "sku") || `TP-${Date.now().toString().slice(-6)}`,
    categoryId: num(fd, "categoryId"),
    description: str(fd, "description"),
    image: str(fd, "image"),
    price: Math.round(num(fd, "price")),
    salePrice: optNum(fd, "salePrice"),
    unit: str(fd, "unit") || (type === "whole_pig" ? "pig" : "kg"),
    productType: type,
    storage: str(fd, "storage") || "fresh",
    stock: num(fd, "stock"),
    lowStockThreshold: num(fd, "lowStockThreshold", 10),
    minOrder: num(fd, "minOrder", 1),
    maxOrder: optNum(fd, "maxOrder"),
    available: bool(fd, "available"),
    featured: bool(fd, "featured"),
    pigRange: opt(str(fd, "pigRange")),
    packSize: opt(str(fd, "packSize")),
    bestFor: str(fd, "bestFor").split(",").map((x) => x.trim()).filter(Boolean),
  };
  if (!name || !values.categoryId) return;
  if (id) await db.update(s.products).set(values).where(eq(s.products.id, id));
  else await db.insert(s.products).values(values);
  await audit(u, id ? "product.update" : "product.create", `product:${values.slug}`);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function deleteProduct(fd: FormData) {
  const u = await guard("products");
  const id = num(fd, "id");
  await db.delete(s.products).where(eq(s.products.id, id));
  await audit(u, "product.delete", `product:${id}`);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function updateStock(fd: FormData) {
  const u = await guard("inventory");
  const id = num(fd, "id");
  await db.update(s.products).set({ stock: Math.max(0, num(fd, "stock")), lowStockThreshold: num(fd, "threshold", 10) }).where(eq(s.products.id, id));
  await audit(u, "inventory.update", `product:${id}`, `stock=${str(fd, "stock")}`);
  revalidatePath("/admin/inventory");
}

/* ---------- Categories ---------- */
export async function saveCategory(fd: FormData) {
  const u = await guard("categories");
  const id = num(fd, "id");
  const name = str(fd, "name");
  if (!name) return;
  const values = { name, slug: slugify(str(fd, "slug") || name), description: str(fd, "description"), image: str(fd, "image"), sortOrder: num(fd, "sortOrder") };
  if (id) await db.update(s.categories).set(values).where(eq(s.categories.id, id));
  else await db.insert(s.categories).values(values);
  await audit(u, "category.save", `category:${values.slug}`);
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
export async function deleteCategory(fd: FormData) {
  await guard("categories");
  const id = num(fd, "id");
  const n = await db.select({ n: sql<number>`count(*)::int` }).from(s.products).where(eq(s.products.categoryId, id));
  if (n[0].n === 0) await db.delete(s.categories).where(eq(s.categories.id, id));
  revalidatePath("/admin/categories");
}

/* ---------- Whole pigs ---------- */
export async function savePig(fd: FormData) {
  const u = await guard("pigs");
  const id = num(fd, "id");
  const est = num(fd, "estWeight");
  const values = {
    tag: str(fd, "tag"),
    estWeight: est,
    actualWeight: optNum(fd, "actualWeight"),
    category: str(fd, "category"),
    status: str(fd, "status") || "available",
    processing: str(fd, "processing") || "not_processed",
    location: str(fd, "location") || "Farm / Facility",
    price: Math.round(num(fd, "price")),
  };
  if (!values.tag || !values.category) return;
  if (id) await db.update(s.pigs).set(values).where(eq(s.pigs.id, id));
  else await db.insert(s.pigs).values(values).onConflictDoNothing();
  await audit(u, id ? "pig.update" : "pig.create", `pig:${values.tag}`);
  revalidatePath("/admin/pigs");
  revalidatePath("/whole-pigs");
}
export async function deletePig(fd: FormData) {
  await guard("pigs");
  await db.delete(s.pigs).where(eq(s.pigs.id, num(fd, "id")));
  revalidatePath("/admin/pigs");
}

/* ---------- Wholesale tiers ---------- */
export async function saveTier(fd: FormData) {
  const u = await guard("wholesale");
  const id = num(fd, "id");
  const values = { label: str(fd, "label"), minQty: num(fd, "minQty"), discountPercent: num(fd, "discountPercent") };
  if (!values.label) return;
  if (id) await db.update(s.bulkTiers).set(values).where(eq(s.bulkTiers.id, id));
  else await db.insert(s.bulkTiers).values(values);
  await audit(u, "tier.save", `tier:${values.label}`);
  revalidatePath("/admin/wholesale");
  revalidatePath("/wholesale");
}
export async function deleteTier(fd: FormData) {
  await guard("wholesale");
  await db.delete(s.bulkTiers).where(eq(s.bulkTiers.id, num(fd, "id")));
  revalidatePath("/admin/wholesale");
}

/* ---------- Quotes ---------- */
export async function sendQuote(fd: FormData) {
  const u = await guard("quotes");
  const id = num(fd, "quoteId");
  const amount = Math.round(num(fd, "amount"));
  const q = (await db.select().from(s.quotes).where(eq(s.quotes.id, id)).limit(1))[0];
  if (!q || amount <= 0) return;
  await db.update(s.quotes).set({ status: "quoted", quoteAmount: amount, quoteNote: str(fd, "note"), quotedAt: new Date() }).where(eq(s.quotes.id, id));
  const target = q.userId ?? (await db.select({ id: s.users.id }).from(s.users).where(sql`lower(${s.users.email}) = ${q.email.toLowerCase()}`).limit(1))[0]?.id ?? null;
  if (target) await db.insert(s.notifications).values({ userId: target, title: `Your quote ${q.code} is ready`, body: `Quote amount ₦${amount.toLocaleString("en-NG")}. Review, accept and pay online.`, link: "/account/quotes" });
  await audit(u, "quote.send", `quote:${q.code}`, `₦${amount}`);
  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/admin/quotes");
}
export async function declineQuoteAdmin(fd: FormData) {
  const u = await guard("quotes");
  const id = num(fd, "quoteId");
  await db.update(s.quotes).set({ status: "declined" }).where(eq(s.quotes.id, id));
  await audit(u, "quote.decline", `quote:${id}`);
  revalidatePath(`/admin/quotes/${id}`);
  revalidatePath("/admin/quotes");
}

/* ---------- Delivery zones ---------- */
export async function saveZone(fd: FormData) {
  const u = await guard("delivery");
  const id = num(fd, "id");
  const values = {
    name: str(fd, "name"),
    states: str(fd, "states").split(",").map((x) => x.trim()).filter(Boolean),
    fee: Math.round(num(fd, "fee")),
    contactOnly: bool(fd, "contactOnly"),
    note: str(fd, "note"),
    active: bool(fd, "active"),
    sortOrder: num(fd, "sortOrder"),
  };
  if (!values.name) return;
  if (id) await db.update(s.deliveryZones).set(values).where(eq(s.deliveryZones.id, id));
  else await db.insert(s.deliveryZones).values({ ...values, active: true });
  await audit(u, "zone.save", `zone:${values.name}`);
  revalidatePath("/admin/delivery");
  revalidatePath("/delivery");
}
export async function deleteZone(fd: FormData) {
  await guard("delivery");
  await db.delete(s.deliveryZones).where(eq(s.deliveryZones.id, num(fd, "id")));
  revalidatePath("/admin/delivery");
}

/* ---------- Coupons ---------- */
export async function saveCoupon(fd: FormData) {
  const u = await guard("coupons");
  const id = num(fd, "id");
  const exp = str(fd, "expiresAt");
  const values = {
    code: str(fd, "code").toUpperCase().replace(/\s+/g, ""),
    description: str(fd, "description"),
    type: str(fd, "type") === "fixed" ? "fixed" : "percent",
    value: Math.round(num(fd, "value")),
    minOrder: Math.round(num(fd, "minOrder")),
    maxDiscount: optNum(fd, "maxDiscount"),
    categoryId: optNum(fd, "categoryId"),
    productId: optNum(fd, "productId"),
    newCustomersOnly: bool(fd, "newCustomersOnly"),
    expiresAt: exp ? new Date(exp) : null,
    usageLimit: optNum(fd, "usageLimit"),
    active: id ? bool(fd, "active") : true,
  };
  if (!values.code || values.value <= 0) return;
  if (id) await db.update(s.coupons).set(values).where(eq(s.coupons.id, id));
  else await db.insert(s.coupons).values(values).onConflictDoNothing();
  await audit(u, "coupon.save", `coupon:${values.code}`);
  revalidatePath("/admin/coupons");
}
export async function deleteCoupon(fd: FormData) {
  await guard("coupons");
  await db.delete(s.coupons).where(eq(s.coupons.id, num(fd, "id")));
  revalidatePath("/admin/coupons");
}

/* ---------- Reviews ---------- */
export async function moderateReview(fd: FormData) {
  const u = await guard("reviews");
  const id = num(fd, "id");
  const status = str(fd, "status");
  if (status === "delete") await db.delete(s.reviews).where(eq(s.reviews.id, id));
  else if (["approved", "rejected", "pending"].includes(status)) await db.update(s.reviews).set({ status }).where(eq(s.reviews.id, id));
  await audit(u, "review.moderate", `review:${id}`, status);
  revalidatePath("/admin/reviews");
}

/* ---------- Blog ---------- */
export async function saveBlogPost(fd: FormData) {
  const u = await guard("blog");
  const id = num(fd, "id");
  const title = str(fd, "title");
  if (!title) return;
  const values = {
    title,
    slug: slugify(str(fd, "slug") || title),
    excerpt: str(fd, "excerpt"),
    content: (fd.get("content") ?? "").toString(),
    category: str(fd, "category") || "Cooking Tips",
    image: str(fd, "image"),
    published: bool(fd, "published"),
  };
  if (id) await db.update(s.blogPosts).set(values).where(eq(s.blogPosts.id, id));
  else await db.insert(s.blogPosts).values(values);
  await audit(u, "blog.save", `post:${values.slug}`);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}
export async function deleteBlogPost(fd: FormData) {
  await guard("blog");
  await db.delete(s.blogPosts).where(eq(s.blogPosts.id, num(fd, "id")));
  revalidatePath("/admin/blog");
}

/* ---------- Notifications ---------- */
export async function markAdminNotificationsRead() {
  await requireAdmin();
  await db.update(s.notifications).set({ read: true }).where(sql`${s.notifications.userId} is null`);
  revalidatePath("/admin", "layout");
}

/* ---------- Settings & staff ---------- */
export async function saveSettings(fd: FormData) {
  const u = await guard("settings");
  const keys = ["whatsapp", "phone", "email", "address", "hours", "bank_name", "bank_account_name", "bank_account_number", "pod_states"];
  for (const key of keys) {
    const value = str(fd, key);
    await db.insert(s.settings).values({ key, value }).onConflictDoUpdate({ target: s.settings.key, set: { value } });
  }
  await db.insert(s.settings).values({ key: "low_stock_alerts", value: bool(fd, "low_stock_alerts") ? "on" : "off" }).onConflictDoUpdate({ target: s.settings.key, set: { value: bool(fd, "low_stock_alerts") ? "on" : "off" } });
  await audit(u, "settings.save", "settings");
  revalidatePath("/", "layout");
}

export async function createStaff(fd: FormData) {
  const u = await guard("settings");
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role");
  const password = str(fd, "password");
  if (!ADMIN_ROLES.includes(role as never) || !email || password.length < 8) return;
  await db.insert(s.users).values({ name: str(fd, "name") || email, email, phone: str(fd, "phone"), passwordHash: hashPassword(password), role }).onConflictDoNothing();
  await audit(u, "staff.create", `user:${email}`, role);
  revalidatePath("/admin/settings");
}
export async function updateStaff(fd: FormData) {
  const u = await guard("settings");
  const id = num(fd, "id");
  if (id === u.id) return; // never lock yourself out
  const role = str(fd, "role");
  if (!["customer", ...ADMIN_ROLES].includes(role)) return;
  await db.update(s.users).set({ role, active: bool(fd, "active") }).where(eq(s.users.id, id));
  await audit(u, "staff.update", `user:${id}`, `${role} active=${bool(fd, "active")}`);
  revalidatePath("/admin/settings");
}

export async function notifyLowStockNow() {
  const u = await guard("inventory");
  const rows = await db.select().from(s.products).where(sql`${s.products.stock} <= ${s.products.lowStockThreshold} and ${s.products.productType} <> 'whole_pig' and ${s.products.productType} <> 'quote_required'`);
  for (const p of rows) await notifyAdmins("Low stock alert", `${p.name}: ${p.stock}${p.unit === "kg" ? "kg" : ""} left (threshold ${p.lowStockThreshold})`, "/admin/inventory");
  await audit(u, "inventory.alerts", "inventory", `${rows.length} alerts`);
  revalidatePath("/admin", "layout");
}

export async function resetStaffPassword(fd: FormData) {
  const u = await guard("settings");
  const id = num(fd, "id");
  const password = str(fd, "password");
  if (id === u.id || password.length < 8) return; // staff change their own password under Account → Profile
  await db.update(s.users).set({ passwordHash: hashPassword(password) }).where(eq(s.users.id, id));
  await db.delete(s.sessions).where(eq(s.sessions.userId, id)); // sign the person out everywhere
  await audit(u, "staff.password_reset", `user:${id}`);
  resetDemoCache();
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}
