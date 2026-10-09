import { sql } from "drizzle-orm";
import { db } from "@/db";
import * as s from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { effectiveUnitPrice, lineTotal, deliveryQuote, type Tier, type DeliveryZone } from "@/lib/pricing";

const px = (id: number, w = 800, h = 600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=${h}&w=${w}`;

export const IMG = {
  belly: 8915004,
  boardCuts: 5774154,
  ribs: 8250702,
  ribs2: 13203940,
  grill: 8250685,
  chopsA: 5500663,
  chopsB: 7333262,
  chopsC: 7333266,
  chopsD: 7333259,
  pigRoast: 29841945,
  pigRoast2: 29841944,
  piglets: 27167732,
  pigsSleep: 13590647,
  butcher: 31647676,
  butcher2: 7163990,
  butcher3: 7163985,
  sausage: 929137,
  sausageGrill: 38339991,
  sausageHang: 30557313,
  mince: 7225581,
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PIG_RANGES = [
  { range: "20-30", label: "20–30kg", price: 145000, img: IMG.piglets },
  { range: "30-40", label: "30–40kg", price: 210000, img: IMG.pigsSleep },
  { range: "40-50", label: "40–50kg", price: 285000, img: IMG.pigRoast },
  { range: "50-60", label: "50–60kg", price: 350000, img: IMG.pigRoast2 },
  { range: "60-80", label: "60–80kg", price: 450000, img: IMG.pigRoast },
  { range: "80-100", label: "80–100kg", price: 575000, img: IMG.pigRoast2 },
];

export async function resetDatabase() {
  await db.execute(sql`TRUNCATE TABLE audit_logs, subscribers, settings, blog_posts, notifications, quotes, addresses, wishlists, reviews, coupons, payments, order_events, order_items, orders, delivery_zones, pigs, bulk_tiers, products, categories, sessions, users RESTART IDENTITY CASCADE`);
}

export async function seedDatabase(opts: { reset?: boolean } = {}) {
  if (opts.reset) await resetDatabase();
  const existing = await db.select({ n: sql<number>`count(*)::int` }).from(s.products);
  if (existing[0].n > 0) return false;

  const rnd = mulberry32(2026);

  // ---------- Settings ----------
  const settingsRows: Record<string, string> = {
    whatsapp: "2348000000000",
    phone: "+234 800 000 0000",
    email: "hello@tabispork.com",
    address: "Tabis Pork Palace, Lagos, Nigeria",
    hours: "Mon–Sat 7:00am – 7:00pm · Sun 10:00am – 4:00pm",
    bank_name: "Zenith Bank",
    bank_account_name: "Tabis Pork Palace Ltd",
    bank_account_number: "1012345678",
    pod_states: "Lagos",
    low_stock_alerts: "on",
  };
  await db.insert(s.settings).values(Object.entries(settingsRows).map(([key, value]) => ({ key, value })));

  // ---------- Users ----------
  const adminPw = hashPassword("Admin@123");
  const custPw = hashPassword("Customer@123");
  await db.insert(s.users).values([
    { name: "Tabis Admin", email: "admin@tabispork.com", phone: "08000000001", passwordHash: adminPw, role: "super_admin" },
    { name: "Ngozi Operations", email: "ops@tabispork.com", phone: "08000000002", passwordHash: adminPw, role: "operations" },
    { name: "Kunle Sales", email: "sales@tabispork.com", phone: "08000000003", passwordHash: adminPw, role: "sales" },
    { name: "Amaka Content", email: "content@tabispork.com", phone: "08000000004", passwordHash: adminPw, role: "content" },
    { name: "Femi Finance", email: "finance@tabispork.com", phone: "08000000005", passwordHash: adminPw, role: "finance" },
  ]);
  const custNames = [
    ["Samuel Ajike", "samuel@example.com", "08031234567", "Lagos", "Lekki"],
    ["Chioma Okafor", "chioma@example.com", "08052345678", "Lagos", "Ikeja"],
    ["Tunde Bakare", "tunde@example.com", "08093456789", "Oyo", "Ibadan"],
    ["Aisha Bello", "aisha@example.com", "07034567890", "Abuja (FCT)", "Wuse 2"],
    ["Emeka Obi", "emeka@example.com", "08145678901", "Lagos", "Surulere"],
    ["Funke Adeyemi", "funke@example.com", "09056789012", "Ogun", "Abeokuta"],
    ["Ibrahim Musa", "ibrahim@example.com", "08067890123", "Lagos", "Yaba"],
    ["Blessing Eze", "blessing@example.com", "08178901234", "Lagos", "Victoria Island"],
    ["Segun Williams", "segun@example.com", "07089012345", "Oyo", "Ibadan"],
    ["Ada Nwosu", "ada@example.com", "08090123456", "Lagos", "Ajah"],
  ];
  const custRows = await db
    .insert(s.users)
    .values(
      custNames.map((c, i) => ({
        name: c[0],
        email: c[1],
        phone: c[2],
        passwordHash: custPw,
        role: "customer",
        createdAt: new Date(Date.now() - (60 - i * 5) * 86400000),
      })),
    )
    .returning();
  await db.insert(s.addresses).values(
    custRows.slice(0, 5).map((u, i) => ({
      userId: u.id,
      label: "Home",
      address: `${12 + i} Admiralty Way`,
      city: custNames[i][4],
      state: custNames[i][3],
      phone: custNames[i][2],
      isDefault: true,
    })),
  );

  // ---------- Categories ----------
  const cats = await db
    .insert(s.categories)
    .values([
      { slug: "fresh-pork", name: "Fresh Pork", description: "Prime fresh cuts, handled cold and weighed to the gram.", image: px(IMG.belly, 900, 700), sortOrder: 1 },
      { slug: "pork-cuts", name: "Pork Cuts", description: "Heads, trotters, offal, skin, sausages and mince.", image: px(IMG.butcher, 900, 700), sortOrder: 2 },
      { slug: "pork-packages", name: "Pork Packages", description: "Curated family, party and weekend bundles.", image: px(IMG.sausageGrill, 900, 700), sortOrder: 3 },
      { slug: "whole-pigs", name: "Whole Pigs", description: "Whole pigs by weight range, prepared your way.", image: px(IMG.pigRoast, 900, 700), sortOrder: 4 },
      { slug: "bulk-orders", name: "Bulk Orders", description: "Carton quantities with business pricing.", image: px(IMG.boardCuts, 900, 700), sortOrder: 5 },
    ])
    .returning();
  const cat = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  // ---------- Bulk tiers ----------
  const tierRows: Tier[] = [
    { label: "Retail", minQty: 0, discountPercent: 0 },
    { label: "Bulk", minQty: 6, discountPercent: 5 },
    { label: "Wholesale", minQty: 21, discountPercent: 10 },
    { label: "Business", minQty: 51, discountPercent: 15 },
  ];
  await db.insert(s.bulkTiers).values(tierRows);

  // ---------- Delivery zones ----------
  const zoneRows = [
    { name: "Zone A — Lagos", states: ["Lagos"], fee: 2000, contactOnly: false, note: "Same-day or next-day delivery within Lagos.", sortOrder: 1 },
    { name: "Zone B — Ibadan & Ogun", states: ["Oyo", "Ogun"], fee: 3500, contactOnly: false, note: "Next-day delivery on chilled routes.", sortOrder: 2 },
    { name: "Zone C — Abuja & South-West", states: ["Abuja (FCT)", "Osun", "Ondo", "Ekiti", "Kwara"], fee: 5000, contactOnly: false, note: "1–2 day delivery in insulated cold boxes.", sortOrder: 3 },
    { name: "Zone D — Other states", states: [], fee: 0, contactOnly: true, note: "Contact us — we arrange delivery case by case.", sortOrder: 4 },
  ];
  const zones = await db.insert(s.deliveryZones).values(zoneRows).returning();
  const zoneList: DeliveryZone[] = zones.map((z) => ({ id: z.id, name: z.name, states: z.states, fee: z.fee, contactOnly: z.contactOnly, note: z.note }));

  // ---------- Products ----------
  type P = typeof s.products.$inferInsert;
  const W = (o: Partial<P> & Pick<P, "slug" | "sku" | "name" | "categoryId" | "price">): P => ({
    unit: "kg", productType: "weight_based", storage: "fresh", stock: 30, lowStockThreshold: 15, minOrder: 0.5, available: true, description: "", image: "", ...o,
  });
  const productRows: P[] = [
    W({ slug: "pork-belly", sku: "TP-FP-001", name: "Premium Pork Belly", categoryId: cat["fresh-pork"], price: 8500, stock: 48, featured: true, soldCount: 340, image: px(IMG.belly), description: "Skin-on, well-marbled pork belly with the ideal layer of fat to meat. Trimmed and weighed fresh to order — the star of crispy roasts, BBQ and slow braises.", bestFor: ["Roasting", "BBQ", "Crispy pork", "Braising"] }),
    W({ slug: "pork-shoulder", sku: "TP-FP-002", name: "Pork Shoulder", categoryId: cat["fresh-pork"], price: 6800, stock: 21, lowStockThreshold: 25, soldCount: 210, image: px(IMG.chopsD), description: "Rich, forgiving and full of flavour. Bone-in or boneless on request — perfect for pulled pork, stews and low-and-slow cooking.", bestFor: ["Roasting", "Stews", "Pulled pork", "Grilling"] }),
    W({ slug: "pork-leg", sku: "TP-FP-003", name: "Pork Leg", categoryId: cat["fresh-pork"], price: 7200, stock: 60, soldCount: 150, image: px(IMG.boardCuts), description: "Lean, generous joints from the hind leg. Ideal for family roasts and festive tables.", bestFor: ["Roasting", "Slow cooking", "Family meals"] }),
    W({ slug: "pork-loin", sku: "TP-FP-004", name: "Pork Loin", categoryId: cat["fresh-pork"], price: 8200, stock: 35, soldCount: 120, image: px(IMG.chopsB), description: "Tender, lean and quick to cook. Roast it whole or slice into medallions.", bestFor: ["Roasting", "Medallions", "Pan-searing"] }),
    W({ slug: "pork-ribs", sku: "TP-FP-005", name: "Pork Ribs", categoryId: cat["fresh-pork"], price: 9000, salePrice: 8200, stock: 40, featured: true, soldCount: 290, image: px(IMG.ribs), description: "Meaty spare ribs, cut clean and ready for your marinade. A weekend favourite.", bestFor: ["BBQ", "Grilling", "Smoking", "Oven-baking"] }),
    W({ slug: "pork-chops", sku: "TP-FP-006", name: "Pork Chops", categoryId: cat["fresh-pork"], price: 8800, stock: 30, featured: true, soldCount: 180, image: px(IMG.chopsA), description: "Thick-cut loin chops, bone-in, perfect for the pan or grill.", bestFor: ["Pan-frying", "Grilling", "Quick dinners"] }),
    W({ slug: "pork-tenderloin", sku: "TP-FP-007", name: "Pork Tenderloin", categoryId: cat["fresh-pork"], price: 10500, stock: 12, lowStockThreshold: 10, soldCount: 70, image: px(IMG.chopsC), description: "The most tender cut — lean, elegant and fast to cook.", bestFor: ["Quick roasts", "Stuffed pork", "Stir-fry"] }),

    W({ slug: "pork-head", sku: "TP-PC-001", name: "Pork Head (Cleaned)", categoryId: cat["pork-cuts"], price: 3500, stock: 25, soldCount: 60, image: px(IMG.butcher3), description: "Thoroughly cleaned and singed. A must for pepper soup and traditional dishes.", bestFor: ["Pepper soup", "Brawn", "Stews"] }),
    W({ slug: "pork-feet", sku: "TP-PC-002", name: "Pork Feet (Trotters)", categoryId: cat["pork-cuts"], price: 3200, stock: 30, soldCount: 95, image: px(IMG.butcher2), description: "Cleaned and split trotters, rich in natural collagen for silky soups and stews.", bestFor: ["Pepper soup", "Stews", "Braising"] }),
    W({ slug: "pork-offal", sku: "TP-PC-003", name: "Pork Offal Mix", categoryId: cat["pork-cuts"], price: 3000, stock: 18, soldCount: 40, image: px(IMG.butcher), description: "A freshly prepared assortment of pork offal, cleaned and chilled.", bestFor: ["Peppered offal", "Stews", "Grills"] }),
    W({ slug: "pork-skin", sku: "TP-PC-004", name: "Pork Skin", categoryId: cat["pork-cuts"], price: 2800, stock: 22, soldCount: 35, image: px(IMG.butcher3), description: "Clean pork skin for crackling, stews and traditional recipes.", bestFor: ["Crackling", "Stews", "Soups"] }),
    W({ slug: "pork-sausage", sku: "TP-PC-005", name: "Tabis Pork Sausage (500g pack)", categoryId: cat["pork-cuts"], price: 4500, salePrice: 4000, unit: "pack", productType: "standard", storage: "frozen", stock: 80, minOrder: 1, maxOrder: 20, soldCount: 260, packSize: "500g", image: px(IMG.sausage), description: "Seasoned pork sausages made in small batches. Grill, pan-fry or add to breakfast.", bestFor: ["Breakfast", "Grilling", "Party platters"] }),
    W({ slug: "minced-pork", sku: "TP-PC-006", name: "Minced Pork", categoryId: cat["pork-cuts"], price: 7500, stock: 35, soldCount: 110, image: px(IMG.mince), description: "Freshly ground from lean shoulder — for burgers, meatballs, sauces and stuffing.", bestFor: ["Burgers", "Meatballs", "Bolognese", "Stuffing"] }),

    W({ slug: "family-pack", sku: "TP-PK-001", name: "Family Pack (≈5kg)", categoryId: cat["pork-packages"], price: 38500, unit: "pack", productType: "standard", stock: 15, lowStockThreshold: 5, minOrder: 1, maxOrder: 10, soldCount: 130, packSize: "≈5kg", featured: true, image: px(IMG.boardCuts), description: "A well-balanced mix of belly, shoulder, chops and ribs — enough for the week.", bestFor: ["Weekly family meals"] }),
    W({ slug: "weekend-bbq-pack", sku: "TP-PK-002", name: "Weekend BBQ Pack (≈3kg)", categoryId: cat["pork-packages"], price: 29500, salePrice: 26500, unit: "pack", productType: "standard", stock: 20, lowStockThreshold: 5, minOrder: 1, maxOrder: 10, soldCount: 98, packSize: "≈3kg", image: px(IMG.sausageGrill), description: "Ribs, chops and sausages — everything you need for a proper cookout.", bestFor: ["BBQ", "Weekend gatherings"] }),
    W({ slug: "soup-stew-pack", sku: "TP-PK-003", name: "Soup & Stew Pack (≈4kg)", categoryId: cat["pork-packages"], price: 18500, unit: "pack", productType: "standard", stock: 14, lowStockThreshold: 5, minOrder: 1, maxOrder: 10, soldCount: 72, packSize: "≈4kg", image: px(IMG.butcher2), description: "Pork head, trotters, offal and shoulder cubes for rich soups and stews.", bestFor: ["Pepper soup", "Stews"] }),
    W({ slug: "party-pack", sku: "TP-PK-004", name: "Party Pack (≈10kg)", categoryId: cat["pork-packages"], price: 78000, unit: "pack", productType: "standard", stock: 8, lowStockThreshold: 3, minOrder: 1, maxOrder: 5, soldCount: 54, packSize: "≈10kg", image: px(IMG.grill), description: "Feeds 20+ guests: ribs, belly, shoulder, chops and sausages, portioned and labelled.", bestFor: ["Events", "Celebrations"] }),

    ...PIG_RANGES.map((r, i) =>
      W({
        slug: `whole-pig-${r.range}kg`, sku: `TP-WP-0${i + 1}`, name: `Whole Pig — ${r.label}`, categoryId: cat["whole-pigs"], price: r.price, unit: "pig", productType: "whole_pig", pigRange: r.range, stock: 0, lowStockThreshold: 2, minOrder: 1, maxOrder: 5, soldCount: 20 - i * 3, featured: i === 2, image: px(r.img),
        description: `A whole pig with an estimated live-to-dressed weight of ${r.label}. Final weight and price are confirmed by our team before fulfilment — you only pay for what you receive.`,
        bestFor: ["Events", "Weddings", "Restaurants", "Festive roasts"],
      }),
    ),
    W({ slug: "whole-pig-100kg-plus", sku: "TP-WP-07", name: "Whole Pig — 100kg+", categoryId: cat["whole-pigs"], price: 0, unit: "pig", productType: "quote_required", pigRange: "100+", stock: 0, minOrder: 1, image: px(IMG.pigRoast2), description: "Extra-large pigs are priced individually. Tell us what you need and we'll send a quote.", bestFor: ["Large events", "Processors"] }),

    W({ slug: "bulk-pork-belly", sku: "TP-BK-001", name: "Bulk Pork Belly (20kg carton)", categoryId: cat["bulk-orders"], price: 8500, productType: "bulk", storage: "frozen", stock: 400, lowStockThreshold: 60, minOrder: 20, soldCount: 80, image: px(IMG.belly), description: "Restaurant-grade pork belly packed in cartons. Tiered pricing applies automatically.", bestFor: ["Restaurants", "Caterers"] }),
    W({ slug: "bulk-pork-ribs", sku: "TP-BK-002", name: "Bulk Pork Ribs (20kg carton)", categoryId: cat["bulk-orders"], price: 9000, productType: "bulk", storage: "frozen", stock: 300, lowStockThreshold: 60, minOrder: 20, soldCount: 66, image: px(IMG.ribs2), description: "Consistent, meaty ribs by the carton for grills and event vendors.", bestFor: ["Grill houses", "Event vendors"] }),
    W({ slug: "bulk-pork-shoulder", sku: "TP-BK-003", name: "Bulk Pork Shoulder (20kg carton)", categoryId: cat["bulk-orders"], price: 6800, productType: "bulk", storage: "frozen", stock: 350, lowStockThreshold: 60, minOrder: 20, soldCount: 52, image: px(IMG.chopsD), description: "Boneless shoulder in cartons — ideal for processors and caterers.", bestFor: ["Processors", "Caterers"] }),
    W({ slug: "bulk-minced-pork", sku: "TP-BK-004", name: "Bulk Minced Pork (20kg carton)", categoryId: cat["bulk-orders"], price: 7500, productType: "bulk", storage: "frozen", stock: 40, lowStockThreshold: 60, minOrder: 20, soldCount: 30, image: px(IMG.mince), description: "Lean ground pork in 20kg cartons for burgers, sausages and fillings.", bestFor: ["Supermarkets", "Processors"] }),
  ];
  const prods = await db.insert(s.products).values(productRows).returning();
  const bySlug = Object.fromEntries(prods.map((p) => [p.slug, p]));

  // ---------- Whole-pig inventory ----------
  const pigSeed: { range: string; est: number; actual?: number; status?: string; processing?: string; location?: string }[] = [
    { range: "20-30", est: 24 }, { range: "20-30", est: 27 }, { range: "20-30", est: 29 }, { range: "20-30", est: 22, actual: 23.4 }, { range: "20-30", est: 26, status: "sold" },
    { range: "30-40", est: 34 }, { range: "30-40", est: 36 }, { range: "30-40", est: 38, processing: "cleaned", location: "Cold room 1" }, { range: "30-40", est: 33, status: "sold" },
    { range: "40-50", est: 42 }, { range: "40-50", est: 44 }, { range: "40-50", est: 46 }, { range: "40-50", est: 47, actual: 48.2 }, { range: "40-50", est: 45, processing: "dressed", location: "Cold room 1" }, { range: "40-50", est: 49 }, { range: "40-50", est: 41, status: "sold" },
    { range: "50-60", est: 53 }, { range: "50-60", est: 56 }, { range: "50-60", est: 58, status: "reserved" },
    { range: "60-80", est: 72, actual: 74.6 }, { range: "60-80", est: 65 }, { range: "60-80", est: 70 }, { range: "60-80", est: 78, status: "reserved" },
    { range: "80-100", est: 88 }, { range: "80-100", est: 95, actual: 96.1, processing: "cleaned" },
  ];
  const priceOf = (range: string) => PIG_RANGES.find((r) => r.range === range)!.price;
  await db.insert(s.pigs).values(
    pigSeed.map((p, i) => ({
      tag: `TP-PIG-${String(i + 9).padStart(4, "0")}`,
      estWeight: p.est,
      actualWeight: p.actual ?? null,
      category: p.range,
      status: p.status ?? "available",
      processing: p.processing ?? "not_processed",
      location: p.location ?? "Farm / Facility",
      price: priceOf(p.range),
    })),
  );

  // ---------- Coupons ----------
  await db.insert(s.coupons).values([
    { code: "WELCOME10", description: "10% off your first order", type: "percent", value: 10, minOrder: 10000, maxDiscount: 15000, newCustomersOnly: true, usageLimit: 500 },
    { code: "TABIS1000", description: "₦1,000 off any order above ₦15,000", type: "fixed", value: 1000, minOrder: 15000 },
    { code: "WHOLESALE5", description: "5% off bulk orders above ₦100,000", type: "percent", value: 5, minOrder: 100000, maxDiscount: 50000 },
    { code: "RIBSFEST", description: "₦500 off pork ribs", type: "fixed", value: 500, minOrder: 5000, productId: bySlug["pork-ribs"].id, expiresAt: new Date(Date.now() + 30 * 86400000) },
  ]);

  // ---------- Orders ----------
  const sellable = prods.filter((p) => p.productType !== "quote_required" && p.productType !== "bulk");
  const weightProducts = sellable.filter((p) => p.productType === "weight_based");
  const standardProducts = sellable.filter((p) => p.productType === "standard");
  const pigProducts = sellable.filter((p) => p.productType === "whole_pig");
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const methods = ["paystack", "paystack", "flutterwave", "bank_transfer", "bank_transfer", "pay_on_delivery"];
  const flow = ["pending", "confirmed", "preparing", "ready", "dispatched", "delivered"];
  const tiers = tierRows;

  for (let i = 0; i < 52; i++) {
    const u = custRows[Math.floor(rnd() * custRows.length)];
    const ci = custRows.indexOf(u);
    const daysAgo = i < 7 ? 0 : Math.floor(rnd() * 58) + (i < 14 ? 1 : 0);
    const created = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rnd() * (daysAgo === 0 ? 7 : 20)) * 3600000);
    const itemCount = 1 + Math.floor(rnd() * 3);
    const lines: { p: (typeof prods)[number]; qty: number; options: Record<string, string> }[] = [];
    for (let k = 0; k < itemCount; k++) {
      const r = rnd();
      if (r < 0.1) lines.push({ p: pick(pigProducts), qty: 1, options: { prep: pick(["whole", "cleaned", "dressed"]), delivery: "local" } });
      else if (r < 0.35) lines.push({ p: pick(standardProducts), qty: 1 + Math.floor(rnd() * 3), options: {} });
      else lines.push({ p: pick(weightProducts), qty: pick([1, 2, 2, 3, 5, 5, 10, 25]), options: {} });
    }
    const uniq = lines.filter((l, idx) => lines.findIndex((x) => x.p.id === l.p.id) === idx);
    const items = uniq.map((l) => ({
      productId: l.p.id,
      name: l.p.name,
      productType: l.p.productType,
      unit: l.p.unit,
      qty: l.qty,
      unitPrice: effectiveUnitPrice(l.p, l.qty, tiers, l.options),
      lineTotal: lineTotal(l.p, l.qty, tiers, l.options),
      options: l.options,
    }));
    const subtotal = items.reduce((a, b) => a + b.lineTotal, 0);
    const method = rnd() < 0.15 ? "pickup" : "standard";
    const dq = deliveryQuote(method, custNames[ci][3], zoneList);
    const total = subtotal + dq.fee;
    const age = daysAgo;
    let status: string;
    if (rnd() < 0.04) status = "cancelled";
    else if (age > 3) status = "delivered";
    else status = pick(age === 0 ? ["pending", "pending", "confirmed", "preparing"] : ["confirmed", "preparing", "ready", "dispatched", "delivered"]);
    const payMethod = pick(methods);
    let paymentStatus = "paid";
    if (status === "cancelled") paymentStatus = "failed";
    else if ((payMethod === "bank_transfer" || payMethod === "pay_on_delivery") && (status === "pending" || age === 0) && rnd() < 0.6) paymentStatus = "pending";
    if (status === "delivered") paymentStatus = "paid";

    const [o] = await db
      .insert(s.orders)
      .values({
        code: `tmp-${i}`,
        userId: u.id,
        customerName: u.name,
        phone: u.phone ?? "",
        email: u.email,
        address: `${10 + i} Admiralty Way`,
        state: custNames[ci][3],
        city: custNames[ci][4],
        deliveryMethod: method,
        deliveryFee: dq.fee,
        deliveryFeeTbc: dq.tbc,
        subtotal,
        total,
        paymentMethod: payMethod,
        paymentStatus,
        status,
        needsReview: items.some((it) => it.productType === "whole_pig") && status !== "delivered",
        createdAt: created,
      })
      .returning();
    await db.update(s.orders).set({ code: `TP-${10000 + o.id}` }).where(sql`id = ${o.id}`);
    await db.insert(s.orderItems).values(items.map((it) => ({ ...it, orderId: o.id })));
    const upto = status === "cancelled" ? 0 : flow.indexOf(status);
    const evs = [{ orderId: o.id, status: "pending", note: "Order placed", createdAt: created }];
    for (let k = 1; k <= upto; k++) evs.push({ orderId: o.id, status: flow[k], note: "", createdAt: new Date(created.getTime() + k * 3 * 3600000) });
    if (status === "cancelled") evs.push({ orderId: o.id, status: "cancelled", note: "Cancelled by customer", createdAt: new Date(created.getTime() + 3600000) });
    await db.insert(s.orderEvents).values(evs);
    await db.insert(s.payments).values({
      orderId: o.id, method: payMethod, amount: total, status: paymentStatus,
      reference: `${payMethod.slice(0, 3).toUpperCase()}-${100000 + Math.floor(rnd() * 900000)}`, createdAt: created,
    });
  }

  // ---------- Quotes ----------
  await db.insert(s.quotes).values([
    { code: "TP-Q-10481", businessName: "Palm Grove Hotel", contactPerson: "Mrs. Folake Daniel", phone: "08033311122", email: "purchasing@palmgrove.example", businessType: "Hotel", productsRequired: "Pork belly, pork ribs, sausages", quantity: "120kg / week", deliveryDate: "Weekly from next Monday", location: "Victoria Island, Lagos", notes: "Need consistent portion sizes and invoice billing.", status: "new" },
    { code: "TP-Q-10482", businessName: "Mama Cass Catering", contactPerson: "Cassandra Ojo", phone: "08055522233", email: "cass@mamacass.example", businessType: "Caterer", productsRequired: "3 whole pigs (60–80kg), dressed", quantity: "3 pigs", deliveryDate: "Saturday after next", location: "Ikeja, Lagos", notes: "Wedding for 400 guests.", status: "quoted", quoteAmount: 1280000, quoteNote: "3 × whole pigs (60–80kg) dressed, delivered chilled to Ikeja. Valid for 7 days.", quotedAt: new Date(Date.now() - 86400000) },
    { code: "TP-Q-10483", businessName: "FreshMart Supermarkets", contactPerson: "Yusuf Lawal", phone: "08077788899", email: "yusuf@freshmart.example", businessType: "Supermarket", productsRequired: "Minced pork, sausages, chops (frozen)", quantity: "300kg / month", deliveryDate: "1st of every month", location: "Abuja", notes: "Branded packs preferred.", status: "new" },
  ]);

  // ---------- Reviews ----------
  const rv = (slug: string, name: string, rating: number, comment: string, status = "approved", verified = true) => ({
    productId: bySlug[slug].id, name, rating, comment, status, verified,
  });
  await db.insert(s.reviews).values([
    rv("pork-belly", "Samuel A.", 5, "Very fresh and well packaged. The skin crackled beautifully."),
    rv("pork-belly", "Chioma O.", 5, "Best pork belly I've bought online in Lagos. Weighed exactly as promised."),
    rv("pork-ribs", "Tunde B.", 5, "Meaty ribs, delivered cold and on time. Weekend BBQ was a hit."),
    rv("pork-ribs", "Ada N.", 4, "Great quality, slightly more fat than I expected but delicious."),
    rv("pork-chops", "Emeka O.", 5, "Thick, juicy chops. Will order again."),
    rv("pork-shoulder", "Funke A.", 4, "Perfect for pulled pork. Packaging was neat."),
    rv("pork-sausage", "Blessing E.", 5, "The sausages are seasoned perfectly — my kids love them."),
    rv("whole-pig-40-50kg", "Mama Cass Catering", 5, "Ordered for a wedding. Professional prep and delivered on schedule."),
    rv("minced-pork", "Aisha B.", 5, "Clean, lean mince. Meatballs came out perfect."),
    rv("pork-feet", "Segun W.", 4, "Cleaned well and very fresh.", "approved", false),
    rv("pork-leg", "Ibrahim M.", 5, "Great family roast, tender and flavourful.", "pending"),
    rv("family-pack", "Ngozi P.", 5, "Great value, everything was labelled and portioned.", "pending", false),
  ]);

  // ---------- Notifications ----------
  await db.insert(s.notifications).values([
    { userId: null, title: "Low stock: Pork Shoulder", body: "Only 21kg remaining (threshold 25kg).", link: "/admin/inventory" },
    { userId: null, title: "New wholesale request TP-Q-10481", body: "Palm Grove Hotel requested a weekly supply quote.", link: "/admin/quotes" },
    { userId: null, title: "New wholesale request TP-Q-10483", body: "FreshMart Supermarkets requested a monthly quote.", link: "/admin/quotes" },
    { userId: custRows[0].id, title: "Welcome to Tabis Pork Palace", body: "Thanks for joining us. Use WELCOME10 on your next order.", link: "/shop" },
  ]);

  // ---------- Blog ----------
  const longText = (title: string) =>
    `Pork is one of the most versatile proteins you can put on your table, and getting the best from it starts with choosing the right cut for the job.\n\n## Start with the cut\nMatch the cut to the cooking method. Fatty, collagen-rich cuts reward slow heat. Lean cuts reward speed and a hot pan.\n\n## Don't skip the rest\nAlways rest cooked pork for 5–10 minutes before slicing so the juices redistribute. Use a thermometer — pork is safe and at its juiciest at 63°C (145°F) with a short rest.\n\n## Buy fresh, store cold\nKeep pork between 0°C and 4°C and cook within two days of delivery, or freeze it promptly in portions. That's why every Tabis order is chilled from our facility to your door.\n\nThat's the short version of "${title}" — browse our shop to put it into practice.`;
  await db.insert(s.blogPosts).values([
    { slug: "how-to-roast-crispy-pork-belly", title: "How to Roast Crispy Pork Belly at Home", category: "Recipes", image: px(IMG.belly, 1000, 640), excerpt: "Dry the skin, score it, salt it, and let the oven do the work. A foolproof method for glass-like crackling.", content: longText("How to Roast Crispy Pork Belly at Home"), publishedAt: new Date(Date.now() - 3 * 86400000) },
    { slug: "pork-cuts-guide-for-beginners", title: "Pork Cuts 101: What to Buy and How to Cook It", category: "Pork Cuts Guide", image: px(IMG.butcher, 1000, 640), excerpt: "Shoulder, belly, loin, ribs — a quick guide to the cuts every home cook should know.", content: longText("Pork Cuts 101"), publishedAt: new Date(Date.now() - 10 * 86400000) },
    { slug: "choosing-the-right-whole-pig-for-your-event", title: "Choosing the Right Whole Pig for Your Event", category: "Cooking Tips", image: px(IMG.pigRoast, 1000, 640), excerpt: "How many guests does a 40–50kg pig feed? We break down sizes, preparation options and timing.", content: longText("Choosing the Right Whole Pig"), publishedAt: new Date(Date.now() - 17 * 86400000) },
    { slug: "weekend-bbq-ribs-recipe", title: "Sticky Weekend BBQ Ribs", category: "Recipes", image: px(IMG.ribs, 1000, 640), excerpt: "Low-and-slow in the oven, then a fast finish on the grill. Fall-off-the-bone ribs with a sticky glaze.", content: longText("Sticky Weekend BBQ Ribs"), publishedAt: new Date(Date.now() - 24 * 86400000) },
    { slug: "how-we-keep-pork-fresh-from-farm-to-door", title: "How We Keep Pork Fresh From Farm to Door", category: "Farm Updates", image: px(IMG.piglets, 1000, 640), excerpt: "A look inside our handling process — inspection, chilling, packaging and insulated delivery.", content: longText("How We Keep Pork Fresh"), publishedAt: new Date(Date.now() - 31 * 86400000) },
    { slug: "storing-and-freezing-pork-safely", title: "Storing and Freezing Pork Safely", category: "Cooking Tips", image: px(IMG.boardCuts, 1000, 640), excerpt: "Fridge, freezer, thaw — simple rules to keep your pork safe and delicious.", content: longText("Storing and Freezing Pork Safely"), publishedAt: new Date(Date.now() - 40 * 86400000) },
  ]);

  await db.insert(s.auditLogs).values({ actor: "system", action: "seed", entity: "database", detail: "Initial Tabis demo data loaded" });
  return true;
}
