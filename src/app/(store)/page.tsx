import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts, reviews, products } from "@/db/schema";
import { Icon } from "@/components/Icon";
import { Img } from "@/components/Img";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading, Stars } from "@/components/ui";
import { CUTS } from "@/lib/guide";
import { dateShort, naira } from "@/lib/format";
import { getAllProducts, getCategories, getTiers, pigRangeLabel } from "@/lib/store";
import { tierRangeLabel } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";

export default async function HomePage() {
  const [all, cats, tiers] = await Promise.all([getAllProducts(), getCategories(), getTiers()]);
  const posts = await db.select().from(blogPosts).where(eq(blogPosts.published, true)).orderBy(desc(blogPosts.publishedAt)).limit(3);
  const revs = await db
    .select({ r: reviews, productName: products.name })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.rating), desc(reviews.createdAt))
    .limit(3);
  const best = all.filter((p) => p.productType !== "bulk" && p.productType !== "quote_required").sort((a, b) => b.soldCount - a.soldCount).slice(0, 8);
  const pigs = all.filter((p) => p.productType === "whole_pig");
  const minPig = Math.min(...pigs.map((p) => p.price));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name: "Tabis Pork Palace",
            url: siteUrl(),
            description: "Premium pork cuts, family packs, whole pigs and wholesale pork supply in Nigeria.",
            slogan: "Premium Pork. Exceptional Quality. Delivered Fresh.",
            priceRange: "₦₦",
            areaServed: ["Lagos", "Ibadan", "Abuja"],
          }),
        }}
      />
      {/* HERO */}
      <section className="relative overflow-hidden bg-forest text-ivory">
        <Img src="https://images.pexels.com/photos/5774154/pexels-photo-5774154.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1800" alt="Fresh premium pork cuts" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/85 to-forest/30" />
        <div className="container-x relative grid min-h-[560px] items-center py-16 sm:py-24 lg:min-h-[640px]">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5 !text-gold-2">Tabis Pork Palace</p>
            <h1 className="font-display text-[3.4rem] font-semibold leading-[0.98] sm:text-7xl">
              Premium Pork.
              <br />
              <span className="text-gold-2">Fresh From Source to Table.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivory/85">
              Shop quality pork cuts, family packs, bulk orders and whole pigs — carefully sourced, professionally handled and delivered to your doorstep.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn-gold !px-8 !py-4">Shop Pork</Link>
              <Link href="/whole-pigs" className="btn-light !px-8 !py-4">Buy Whole Pig</Link>
            </div>
            <Link href="/wholesale" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-2 hover:text-white">
              Wholesale &amp; bulk orders <Icon name="right" className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="relative border-t border-ivory/15 bg-forest/80 backdrop-blur">
          <ul className="container-x grid grid-cols-2 gap-4 py-5 text-sm md:grid-cols-4">
            {[["scale", "Accurate weights"], ["snow", "Chilled handling"], ["truck", "Reliable delivery"], ["shield", "Secure payments"]].map(([i, t]) => (
              <li key={t} className="flex items-center gap-3 text-ivory/90"><Icon name={i} className="h-5 w-5 text-gold-2" />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-x pt-20">
        <SectionHeading eyebrow="Shop by category" title="Everything pork, beautifully organised" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
          {cats.map((c) => (
            <Link key={c.slug} href={c.slug === "whole-pigs" ? "/whole-pigs" : `/category/${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-forest">
              <Img src={c.image} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-ivory">
                <h3 className="font-display text-2xl font-semibold leading-tight">{c.name}</h3>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-gold-2">Explore <Icon name="right" className="h-3.5 w-3.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="container-x pt-20">
        <SectionHeading eyebrow="Best sellers" title="Loved by Tabis customers" action={<Link href="/shop" className="btn-outline btn-sm">View all products</Link>} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {best.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* WHOLE PIGS */}
      <section className="mt-20 bg-forest text-ivory">
        <div className="container-x grid items-center gap-10 py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 !text-gold-2">Whole pigs</p>
            <h2 className="font-display text-5xl font-semibold leading-[1.02] sm:text-6xl">Need more pork? <span className="text-gold-2">Go whole.</span></h2>
            <div className="gold-rule mt-5" />
            <p className="mt-5 max-w-lg text-lg text-ivory/80">Buying for a family, event or business? Choose an estimated weight, how it&apos;s prepared and how it&apos;s delivered. We confirm the final weight before fulfilment.</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {pigs.map((p) => (
                <li key={p.id}><Link href={`/product/${p.slug}`} className="rounded-full border border-ivory/25 px-3.5 py-1.5 text-sm font-semibold hover:border-gold-2 hover:text-gold-2">{pigRangeLabel(p.pigRange)}</Link></li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-ivory/70">From {naira(minPig)} per pig</p>
            <Link href="/whole-pigs" className="btn-gold mt-6 !px-8 !py-4">Explore Whole Pigs</Link>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gold/40">
            <Img src="https://images.pexels.com/photos/29841945/pexels-photo-29841945.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200" alt="Whole roasted pig" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>

      {/* WHY TABIS */}
      <section className="container-x pt-20">
        <SectionHeading eyebrow="Why Tabis?" title="Quality you can trust" center />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["shield", "Quality Pork", "Carefully sourced, inspected pork from healthy, well-raised animals."],
            ["snow", "Fresh Handling", "Proper cold-chain handling from processing to your doorstep."],
            ["scale", "Accurate Weights", "Transparent weight and pricing — you pay for what you receive."],
            ["truck", "Reliable Delivery", "Your order arrives safely, chilled and on schedule."],
          ].map(([i, t, d]) => (
            <div key={t} className="card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-forest text-gold-2"><Icon name={i} className="h-6 w-6" /></span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-forest">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FARM TO TABLE */}
      <section className="container-x pt-20">
        <SectionHeading eyebrow="From farm to table" title="Source → Quality → Selection → Order → Delivery" sub="Every Tabis order follows the same careful journey, so quality is something you can see and freshness is something you can trust." />
        <ol className="grid gap-4 md:grid-cols-4">
          {[["Sourcing", "Healthy pigs from trusted farms."], ["Processing", "Hygienic, inspected processing."], ["Packaging", "Weighed, sealed & labelled cold."], ["Delivery", "Chilled to your door."]].map(([t, d], i) => (
            <li key={t} className="relative rounded-xl border border-forest/10 bg-white p-6">
              <span className="font-display text-5xl font-semibold text-gold/50">0{i + 1}</span>
              <h3 className="mt-1 font-display text-2xl font-semibold text-forest">{t}</h3>
              <p className="mt-1 text-sm text-charcoal/70">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6"><Link href="/farm" className="text-sm font-semibold uppercase tracking-wider text-forest hover:text-gold">See our full process →</Link></div>
      </section>

      {/* BUSINESS */}
      <section className="container-x pt-20">
        <div className="overflow-hidden rounded-2xl bg-forest text-ivory">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow mb-3 !text-gold-2">Tabis Business</p>
              <h2 className="font-display text-5xl font-semibold leading-[1.02]">Pork supply built for your business</h2>
              <p className="mt-4 max-w-xl text-ivory/80">Restaurants, hotels, caterers, supermarkets, butchers, event companies and processors — enjoy tiered pricing, consistent quality and a proper quote-to-order workflow.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/quote" className="btn-gold">Request a Quote</Link>
                <Link href="/wholesale" className="btn-ghost-light">Learn more</Link>
              </div>
            </div>
            <div className="rounded-xl border border-ivory/15 bg-white/5 p-5">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-gold-2"><th className="pb-3">Quantity</th><th className="pb-3 text-right">Pricing</th></tr></thead>
                <tbody>
                  {tiers.map((t, i) => (
                    <tr key={t.label} className="border-t border-ivory/10"><td className="py-2.5">{tierRangeLabel(tiers, i)}</td><td className="py-2.5 text-right font-semibold">{t.label}{t.discountPercent > 0 ? ` · −${t.discountPercent}%` : ""}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* PORK GUIDE */}
      <section className="container-x pt-20">
        <SectionHeading eyebrow="Know your pork" title="Not sure which cut to buy?" action={<Link href="/pork-guide" className="btn-outline btn-sm">Open the pork guide</Link>} />
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {CUTS.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/pork-guide#${c.id}`} className="card min-w-[250px] snap-start p-5 transition hover:-translate-y-0.5 sm:min-w-0">
              <h3 className="font-display text-2xl font-semibold text-forest">{c.name}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold">Best for</p>
              <ul className="mt-2 space-y-1 text-sm text-charcoal/75">{c.bestFor.slice(0, 4).map((b) => <li key={b} className="flex items-center gap-2"><Icon name="check" className="h-3.5 w-3.5 text-forest-2" />{b}</li>)}</ul>
            </Link>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="container-x pt-20">
        <SectionHeading eyebrow="Customer reviews" title="Fresh, well packaged, on time" center />
        <div className="grid gap-5 md:grid-cols-3">
          {revs.map(({ r, productName }) => (
            <figure key={r.id} className="card p-6">
              <Stars rating={r.rating} />
              <blockquote className="mt-4 font-display text-2xl leading-snug text-forest">“{r.comment}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold text-charcoal">{r.name}</span>
                {r.verified && <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-forest-2"><Icon name="check" className="h-3.5 w-3.5" /> Verified Purchase</span>}
                <span className="block text-charcoal/55">on {productName}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* BLOG */}
      <section className="container-x pt-20">
        <SectionHeading eyebrow="Blog & recipes" title="From our kitchen and farm" action={<Link href="/blog" className="btn-outline btn-sm">All articles</Link>} />
        <div className="grid gap-5 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="card group overflow-hidden">
              <div className="aspect-[16/10] overflow-hidden bg-forest-3"><Img src={p.image} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">{p.category} · {dateShort(p.publishedAt)}</p>
                <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-forest">{p.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">{p.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHATSAPP CTA */}
      <section className="container-x pt-20">
        <div className="rounded-2xl border border-gold/40 bg-gold-3 p-8 text-center sm:p-12">
          <h2 className="font-display text-4xl font-semibold text-forest sm:text-5xl">Large order? Custom cuts? Delivery question?</h2>
          <p className="mx-auto mt-3 max-w-xl text-charcoal/75">Chat with the Tabis team on WhatsApp — we&apos;re happy to help with wholesale, big pigs, custom cuts and quotes.</p>
          <Link href="/contact" className="btn-primary mt-6">Talk to Tabis</Link>
        </div>
      </section>
    </>
  );
}
