import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at").defaultNow().notNull();

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  // customer | super_admin | operations | sales | content | finance
  role: text("role").notNull().default("customer"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  image: text("image").notNull().default(""),
  price: integer("price").notNull(),
  salePrice: integer("sale_price"),
  unit: text("unit").notNull().default("kg"), // kg | pack | pig
  // standard | weight_based | whole_pig | bulk | quote_required
  productType: text("product_type").notNull().default("weight_based"),
  storage: text("storage").notNull().default("fresh"), // fresh | frozen
  stock: doublePrecision("stock").notNull().default(0),
  lowStockThreshold: doublePrecision("low_stock_threshold").notNull().default(10),
  minOrder: doublePrecision("min_order").notNull().default(0.5),
  maxOrder: doublePrecision("max_order"),
  available: boolean("available").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  soldCount: doublePrecision("sold_count").notNull().default(0),
  pigRange: text("pig_range"), // e.g. "40-50"
  packSize: text("pack_size"),
  bestFor: jsonb("best_for").$type<string[]>().notNull().default([]),
  createdAt: createdAt(),
});

export const bulkTiers = pgTable("bulk_tiers", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  minQty: doublePrecision("min_qty").notNull(),
  discountPercent: doublePrecision("discount_percent").notNull().default(0),
});

export const pigs = pgTable("pigs", {
  id: serial("id").primaryKey(),
  tag: text("tag").notNull().unique(),
  estWeight: doublePrecision("est_weight").notNull(),
  actualWeight: doublePrecision("actual_weight"),
  category: text("category").notNull(), // range slug e.g. "60-80"
  status: text("status").notNull().default("available"), // available | reserved | sold
  processing: text("processing").notNull().default("not_processed"),
  location: text("location").notNull().default("Farm / Facility"),
  price: integer("price").notNull().default(0),
  orderId: integer("order_id"),
  createdAt: createdAt(),
});

export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  states: jsonb("states").$type<string[]>().notNull().default([]),
  fee: integer("fee").notNull().default(0),
  contactOnly: boolean("contact_only").notNull().default(false),
  note: text("note").notNull().default(""),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull().default(""),
  state: text("state").notNull().default(""),
  city: text("city").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  deliveryMethod: text("delivery_method").notNull().default("standard"),
  deliveryDate: text("delivery_date"),
  deliveryFee: integer("delivery_fee").notNull().default(0),
  deliveryFeeTbc: boolean("delivery_fee_tbc").notNull().default(false),
  subtotal: integer("subtotal").notNull().default(0),
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull().default(0),
  couponCode: text("coupon_code"),
  paymentMethod: text("payment_method").notNull().default("bank_transfer"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  status: text("status").notNull().default("pending"),
  needsReview: boolean("needs_review").notNull().default(false),
  quoteId: integer("quote_id"),
  createdAt: createdAt(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id"),
  name: text("name").notNull(),
  productType: text("product_type").notNull().default("standard"),
  unit: text("unit").notNull().default("kg"),
  qty: doublePrecision("qty").notNull(),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total").notNull(),
  options: jsonb("options").$type<Record<string, string>>().notNull().default({}),
  finalWeight: doublePrecision("final_weight"),
});

export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  note: text("note").notNull().default(""),
  createdAt: createdAt(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  method: text("method").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"),
  reference: text("reference").notNull().default(""),
  createdAt: createdAt(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull().default(""),
  type: text("type").notNull().default("percent"), // percent | fixed
  value: integer("value").notNull(),
  minOrder: integer("min_order").notNull().default(0),
  maxDiscount: integer("max_discount"),
  categoryId: integer("category_id"),
  productId: integer("product_id"),
  newCustomersOnly: boolean("new_customers_only").notNull().default(false),
  expiresAt: timestamp("expires_at"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: integer("user_id"),
  name: text("name").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  verified: boolean("verified").notNull().default(false),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  createdAt: createdAt(),
});

export const wishlists = pgTable(
  "wishlists",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] })],
);

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("Home"),
  address: text("address").notNull(),
  city: text("city").notNull().default(""),
  state: text("state").notNull().default(""),
  phone: text("phone").notNull().default(""),
  isDefault: boolean("is_default").notNull().default(false),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  userId: integer("user_id"),
  businessName: text("business_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  businessType: text("business_type").notNull().default(""),
  productsRequired: text("products_required").notNull().default(""),
  quantity: text("quantity").notNull().default(""),
  deliveryDate: text("delivery_date").notNull().default(""),
  location: text("location").notNull().default(""),
  notes: text("notes").notNull().default(""),
  // new | quoted | accepted | declined
  status: text("status").notNull().default("new"),
  quoteAmount: integer("quote_amount"),
  quoteNote: text("quote_note").notNull().default(""),
  orderId: integer("order_id"),
  createdAt: createdAt(),
  quotedAt: timestamp("quoted_at"),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"), // null = admin team
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  link: text("link"),
  read: boolean("read").notNull().default(false),
  createdAt: createdAt(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  category: text("category").notNull().default("Cooking Tips"),
  image: text("image").notNull().default(""),
  published: boolean("published").notNull().default(true),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  actor: text("actor").notNull().default("system"),
  action: text("action").notNull(),
  entity: text("entity").notNull().default(""),
  detail: text("detail").notNull().default(""),
  createdAt: createdAt(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: createdAt(),
});
