# Tabis Pork Palace — premium pork commerce platform

Next.js (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL via Drizzle ORM.

## What's inside

**Storefront** — home, shop (filters + sort), categories, product pages (weight-based pricing, bulk tiers, reviews, wishlist),
**Whole Pigs** builder (estimated weight → preparation → delivery → quantity), Tabis Business (wholesale), request-a-quote,
cart, checkout (Paystack / Flutterwave / bank transfer / pay on delivery), order tracking, customer account
(dashboard, orders, wishlist, addresses, notifications, wholesale requests, profile), pork guide, blog, FAQ, legal pages, WhatsApp button, mobile bottom-nav.

**Admin (`/admin`)** — dashboard & revenue chart, orders (status flow, payment, confirm final pig weight/price, delivery fee), products,
categories, inventory (auto low-stock alerts), whole-pig inventory (per-pig tag, estimated vs actual weight, processing, status),
customers, wholesale tier pricing, quotes (respond → customer accepts & pays → order created), payments, delivery zones,
coupons, reviews moderation, blog CMS, notifications, reports (daily/weekly/monthly/yearly, channel split, best sellers, AOV/LTV),
settings, staff & role-based access, audit log.

## Demo accounts (seeded)

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | admin@tabispork.com | Admin@123 |
| Operations / Sales / Content / Finance | ops@ · sales@ · content@ · finance@tabispork.com | Admin@123 |
| Customer | samuel@example.com | Customer@123 |

Change these before going live (Admin → Settings & Staff).

## Payments

Paystack and Flutterwave run in **demo mode** (payment auto-confirmed) until keys are provided:

- `PAYSTACK_SECRET_KEY` — enables live Paystack checkout + server-side verification
- `FLW_SECRET_KEY` — enables live Flutterwave checkout + server-side verification
- `COOKIE_SECURE=true` — set when serving over HTTPS

Gateway callbacks return to `/api/payments/callback`. Prices are always recomputed on the server at checkout.

## Data

- Schema: `src/db/schema.ts` (`npx drizzle-kit push`)
- Seed: `npx tsx --env-file=.env src/db/seed.ts [--reset]` (also auto-runs once if the catalogue is empty)

## Notes

- The logo is recreated as an SVG in `src/components/Logo.tsx`; swap in the official artwork there.
- Product images are stock photography URLs — replace with real Tabis photography (admin product form accepts any image URL, e.g. Cloudinary).
- Email/SMS/WhatsApp order updates are in-app notifications today; connect a provider in `src/lib/orders.ts` (`setOrderStatus`).

## Production checklist

1. **Change the demo passwords** — Admin → Settings & Staff → *Reset password* (and Account → Profile for your own). The admin dashboard warns while any staff account still uses `Admin@123`, and the public login page hides its "Demo access" hint automatically once the admin password has changed.
2. Set `NEXT_PUBLIC_SITE_URL` (used by `sitemap.xml`, `robots.txt`, canonical metadata and email links).
3. Set `PAYSTACK_SECRET_KEY` / `FLW_SECRET_KEY` for live card payments, and `COOKIE_SECURE=true` when serving over HTTPS.
4. Set `RESEND_API_KEY` (+ `EMAIL_FROM`, a verified sender) to send customer emails: order received, payment received, confirmed / preparing / ready / dispatched / delivered / cancelled. Without a key this is a silent no-op.
5. Replace the stock photography and the recreated SVG logo (`src/components/Logo.tsx`) with real Tabis assets.
6. Rate limiting is in-memory (per server process) — move it to Redis/Upstash if you run multiple instances.

## Also included

- **Cart re-validation** — when the cart or checkout opens, prices/stock are re-checked against the live catalogue; unavailable items are removed, quantities clamped, price changes explained.
- **Invoices** — `/invoice/TP-xxxxx` printable invoice / receipt / packing slip (owner or staff only).
- **Buy again** — one-click reorder from any past order.
- **CSV export** — Admin → Orders → *Export CSV* (respects the active filters; formula-injection safe).
- **Brute-force & spam protection** — login, registration, orders, reviews, contact, quote and newsletter forms are rate-limited.
- **SEO** — `sitemap.xml` (products, categories, blog), `robots.txt`, `metadataBase`, Store JSON-LD, product/FAQ JSON-LD.

## Tests

Pure-logic unit tests (pricing tiers, delivery quotes, product search, cart reconciliation):

```bash
npx tsx --test src/lib/pricing.test.ts src/lib/search.test.ts src/lib/cart.test.ts
```
