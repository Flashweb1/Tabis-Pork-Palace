import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { ActionForm } from "@/components/ActionForm";
import { AddToCart } from "@/components/AddToCart";
import { Icon } from "@/components/Icon";
import { Img } from "@/components/Img";
import { ProductCard } from "@/components/ProductCard";
import { Stars, StockBadge } from "@/components/ui";
import { WholePigBuilder, type PigProduct } from "@/components/WholePigBuilder";
import { WishlistButton } from "@/components/WishlistButton";
import { submitReview } from "@/app/actions/shop";
import { getSession } from "@/lib/auth";
import { dateShort, naira } from "@/lib/format";
import { isWeightType, tierRangeLabel } from "@/lib/pricing";
import { getAllProducts, getProductBySlug, getSettings, getTiers, pigRangeLabel, stockState } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  return { title: `${p.name} — Buy Online`, description: p.description.slice(0, 160), openGraph: { images: p.image ? [p.image] : [] } };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const [all, tiers, settings, user] = await Promise.all([getAllProducts(), getTiers(), getSettings(), getSession()]);
  const revs = await db.select().from(reviews).where(and(eq(reviews.productId, p.id), eq(reviews.status, "approved"))).orderBy(desc(reviews.createdAt));
  const related = all.filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 4);
  const state = stockState(p);
  const isPig = p.productType === "whole_pig" || (p.productType === "quote_required" && p.categorySlug === "whole-pigs");
  const unitText = p.productType === "whole_pig" ? "per pig" : p.unit === "kg" ? "per kg" : p.unit === "pack" ? "per pack" : "";
  const pigs: PigProduct[] = isPig
    ? all.filter((x) => x.productType === "whole_pig" || (x.categorySlug === "whole-pigs" && x.productType === "quote_required"))
        .sort((a, b) => parseInt(a.pigRange ?? "0") - parseInt(b.pigRange ?? "0"))
        .map((x) => ({ id: x.id, slug: x.slug, name: x.name, image: x.image, price: x.price, salePrice: x.salePrice, range: x.pigRange ?? "", label: pigRangeLabel(x.pigRange), stock: x.stock, available: x.available, minOrder: x.minOrder, maxOrder: x.maxOrder, quote: x.productType === "quote_required" }))
    : [];
  const waText = encodeURIComponent(`Hello Tabis, I have a question about ${p.name}.`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    image: p.image,
    description: p.description,
    brand: { "@type": "Brand", name: "Tabis Pork Palace" },
    ...(p.productType !== "quote_required" && { offers: { "@type": "Offer", priceCurrency: "NGN", price: p.salePrice ?? p.price, availability: state === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock" } }),
    ...(p.reviewCount > 0 && { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviewCount } }),
  };

  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-charcoal/60" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-forest">Home</Link> / <Link href="/shop" className="hover:text-forest">Shop</Link> /{" "}
        <Link href={p.categorySlug === "whole-pigs" ? "/whole-pigs" : `/category/${p.categorySlug}`} className="hover:text-forest">{p.categoryName}</Link> / <span className="text-forest">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-forest/10 bg-forest-3 lg:aspect-square">
          <Img src={p.image.replace("h=600&w=800", "h=1000&w=1000")} alt={p.name} className="h-full w-full object-cover" />
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="badge bg-white/95 capitalize text-forest shadow">{p.storage}</span>
            {p.salePrice && <span className="badge bg-gold text-white shadow">Sale</span>}
          </div>
        </div>

        <div>
          <p className="eyebrow">{p.categoryName}</p>
          <h1 className="mt-2 font-display text-5xl font-semibold leading-[1.02] text-forest">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {p.reviewCount > 0 ? (<><Stars rating={p.rating} /><span className="text-sm text-charcoal/60">{p.rating} · {p.reviewCount} review{p.reviewCount === 1 ? "" : "s"}</span></>) : <span className="text-sm text-charcoal/50">No reviews yet</span>}
            <StockBadge state={state} stock={p.stock} unit={p.unit} />
          </div>
          <div className="mt-5 flex items-baseline gap-3">
            {p.productType === "quote_required" ? (
              <span className="font-display text-4xl font-semibold text-forest">Request a quote</span>
            ) : (
              <>
                <span className="font-display text-5xl font-semibold text-forest">{naira(p.salePrice ?? p.price)}</span>
                <span className="text-charcoal/60">{unitText}</span>
                {p.salePrice && <span className="text-lg text-charcoal/40 line-through">{naira(p.price)}</span>}
              </>
            )}
          </div>
          {p.productType === "whole_pig" && <p className="mt-1 text-sm font-semibold text-gold">Estimated weight: {pigRangeLabel(p.pigRange)}</p>}
          <p className="mt-5 leading-relaxed text-charcoal/80">{p.description}</p>
          {p.bestFor.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">Best for</p>
              <ul className="mt-2 flex flex-wrap gap-2">{p.bestFor.map((b) => <li key={b} className="rounded-full bg-forest-3 px-3 py-1 text-sm font-medium text-forest">{b}</li>)}</ul>
            </div>
          )}

          {!isPig && (
            <div className="card mt-7 p-5">
              <AddToCart variant="page" product={{ id: p.id, slug: p.slug, name: p.name, image: p.image, unit: p.unit, productType: p.productType, price: p.price, salePrice: p.salePrice, minOrder: p.minOrder, maxOrder: p.maxOrder, stock: p.stock, available: p.available }} />
            </div>
          )}
          {p.productType === "quote_required" && isPig && (
            <Link href={`/quote?product=${p.slug}`} className="btn-gold mt-7 w-full">Request Quote</Link>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <WishlistButton productId={p.id} label />
            <a href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-forest/20 px-4 py-3 text-sm font-semibold text-forest hover:border-forest">
              <Icon name="chat" className="h-4 w-4" /> Ask on WhatsApp
            </a>
          </div>

          <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-forest/10 pt-6 text-sm">
            <div><dt className="text-charcoal/55">SKU</dt><dd className="font-semibold">{p.sku}</dd></div>
            <div><dt className="text-charcoal/55">Storage</dt><dd className="font-semibold capitalize">{p.storage}</dd></div>
            {p.packSize && <div><dt className="text-charcoal/55">Pack size</dt><dd className="font-semibold">{p.packSize}</dd></div>}
            {p.minOrder > 1 && <div><dt className="text-charcoal/55">Minimum order</dt><dd className="font-semibold">{p.minOrder}{p.unit === "kg" ? "kg" : ""}</dd></div>}
          </dl>
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-forest-3 p-3 text-xs text-forest"><Icon name="truck" className="mt-0.5 h-4 w-4 shrink-0" /> Delivery availability may vary by location and product type. Chilled delivery with insulated packaging.</p>
        </div>
      </div>

      {isPig && pigs.length > 0 && (
        <section className="mt-14">
          <h2 className="h-section mb-6">Configure your whole pig</h2>
          <WholePigBuilder pigs={pigs} initialSlug={p.slug} />
        </section>
      )}

      {isWeightType(p.productType) && (
        <section className="mt-14">
          <h2 className="h-section mb-2">Bulk pricing</h2>
          <p className="mb-5 text-charcoal/70">The more you buy, the less you pay per kg — applied automatically in your cart.</p>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead className="bg-forest-3"><tr><th className="th">Quantity</th><th className="th">Tier</th><th className="th text-right">Price per kg</th></tr></thead>
              <tbody className="divide-y divide-forest/10">
                {tiers.map((t, i) => (
                  <tr key={t.label}><td className="td font-semibold">{tierRangeLabel(tiers, i)}</td><td className="td">{t.label}</td><td className="td text-right font-semibold text-forest">{naira(Math.round((p.salePrice ?? p.price) * (1 - t.discountPercent / 100)))}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-14 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="h-section mb-6">Customer reviews</h2>
          {revs.length === 0 ? <p className="text-charcoal/60">Be the first to review this product.</p> : (
            <ul className="space-y-4">
              {revs.map((r) => (
                <li key={r.id} className="card p-5">
                  <div className="flex items-center justify-between"><Stars rating={r.rating} /><span className="text-xs text-charcoal/50">{dateShort(r.createdAt)}</span></div>
                  <p className="mt-3 font-display text-xl text-forest">“{r.comment}”</p>
                  <p className="mt-2 text-sm"><span className="font-semibold">{r.name}</span>{r.verified && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-forest-2"><Icon name="check" className="h-3.5 w-3.5" /> Verified Purchase</span>}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card h-fit p-5">
          <h3 className="font-display text-2xl font-semibold text-forest">Write a review</h3>
          {user ? (
            <ActionForm action={submitReview} submit="Submit review" className="mt-4 space-y-3" resetOnSuccess>
              <input type="hidden" name="productId" value={p.id} />
              <div><label className="label" htmlFor="rating">Rating</label><select id="rating" name="rating" defaultValue="5" className="input">{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select></div>
              <div><label className="label" htmlFor="comment">Your review</label><textarea id="comment" name="comment" rows={4} required className="input" placeholder="How was the quality, packaging and delivery?" /></div>
            </ActionForm>
          ) : (
            <p className="mt-3 text-sm text-charcoal/70"><Link href={`/login?next=/product/${p.slug}`} className="font-semibold text-forest underline">Sign in</Link> to leave a review. Reviews from past buyers are marked Verified Purchase.</p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="h-section mb-6">You may also like</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
