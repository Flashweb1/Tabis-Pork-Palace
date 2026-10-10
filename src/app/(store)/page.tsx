import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts, reviews, products } from "@/db/schema";
import { Icon } from "@/components/Icon";
import { Img } from "@/components/Img";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
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
        <Img src="https://images.pexels.com/photos/5774154/pexels-photo-5774154.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1800" alt="Fresh premium pork cuts" className="kenburns absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/85 to-forest/30" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_18%_18%,transparent_35%,rgba(6,20,13,0.6)_100%)]" />
        <div className="grain-layer" aria-hidden />
        <div className="container-x relative z-[2] grid min-h-[560px] items-center py-16 sm:py-24 lg:min-h-[640px]">
          <div className="max-w-2xl">
            <p className="eyebrow rise mb-5 !text-gold-2" style={{ animationDelay: "60ms" }}>
              Tabis Pork Palace · Est. in Lagos
            </p>
            <h1 className="font-display font-semibold leading-[0.95]">
              <span className="rise block text-[3.4rem] sm:text-7xl" style={{ animationDelay: "160ms" }}>
                Farm-fresh pork,
              </span>
              <span className="rise block text-[3.4rem] text-gold-2 sm:text-7xl" style={{ animationDelay: "300ms" }}>
                cut to your taste.
              </span>
              <span className="rise mt-3 block font-sans text-base font-normal normal-case leading-relaxed text-ivory/80 sm:text-lg" style={{ animationDelay: "440ms" }}>
                Premium cuts, family packs, bulk orders and whole pigs — sourced from trusted farms, hand-cut by expert butchers, chilled from farm to your doorstep.
              </span>
            </h1>
            <div className="rise mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "580ms" }}>
              <Link href="/shop" className="btn-gold sheen !px-8 !py-4">Shop Pork</Link>
              <Link href="/whole-pigs" className="btn-light !px-8 !py-4">Buy Whole Pig</Link>
            </div>
            <Reveal stagger className="mt-7 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-3/20 px-3.5 py-1.5 text-xs font-semibold text-ivory backdrop-blur-sm">
                <Stars rating={4.9} size="h-3.5 w-3.5" /> 4.9 from 300+ verified reviews
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/25 px-3.5 py-1.5 text-xs font-semibold text-ivory/90 backdrop-blur-sm">
                <Icon name="snow" className="h-3.5 w-3.5 text-gold-2" /> Cold-chain guaranteed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/25 px-3.5 py-1.5 text-xs font-semibold text-ivory/90 backdrop-blur-sm">
                <Icon name="truck" className="h-3.5 w-3.5 text-gold-2" /> Same-day dispatch in Lagos
              </span>
            </Reveal>
            <Link href="/wholesale" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold-2 hover:text-white">
              Wholesale &amp; bulk orders <Icon name="right" className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="relative z-[2] border-t border-ivory/15 bg-forest/80 backdrop-blur">
          <Reveal as="ul" stagger className="container-x grid grid-cols-2 gap-5 py-5 text-sm md:grid-cols-4">
            {[
              ["scale", "Accurate weights", "Pay only for what you receive"],
              ["snow", "Chilled handling", "Unbroken cold chain, farm to door"],
              ["truck", "Reliable delivery", "Lagos, Ibadan & Abuja"],
              ["shield", "Secure payments", "Paystack, Flutterwave or on delivery"],
            ].map(([i, t, d]) => (
              <li key={t} className="flex items-start gap-3 text-ivory/90">
                <Icon name={i} className="mt-0.5 h-5 w-5 shrink-0 text-gold-2" />
                <span>
                  <span className="block font-semibold text-ivory">{t}</span>
                  <span className="block text-xs text-ivory/60">{d}</span>
                </span>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-x pt-20">
        <Reveal>
          <SectionHeading eyebrow="Shop by category" title="Everything pork, beautifully organised" />
        </Reveal>
        <Reveal stagger className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
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
        </Reveal>
      </section>

      {/* BEST SELLERS */}
      <section className="container-x pt-20">
        <Reveal>
          <SectionHeading eyebrow="Best sellers" title="Loved by Tabis customers" action={<Link href="/shop" className="btn-outline btn-sm">View all products</Link>} />
        </Reveal>
        <Reveal stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {best.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </Reveal>
      </section>

      {/* WHOLE PIGS */}
      <section className="relative mt-20 overflow-hidden bg-forest text-ivory">
        <div className="grain-layer" aria-hidden />
        <Reveal stagger className="container-x relative z-[2] grid items-center gap-10 py-16 lg:grid-cols-2">
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
        </Reveal>
      </section>

      {/* WHY TABIS */}
      <section className="container-x pt-20">
        <Reveal>
          <SectionHeading eyebrow="Why Tabis?" title="Quality you can trust" center />
        </Reveal>
        <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
        </Reveal>
      </section>

      {/* FARM TO TABLE */}
      <section className="container-x pt-20">
        <Reveal>
          <SectionHeading eyebrow="From farm to table" title="Source → Quality → Selection → Order → Delivery" sub="Every Tabis order follows the same careful journey, so quality is something you can see and freshness is something you can trust." />
        </Reveal>
        <Reveal as="ol" stagger className="grid gap-4 md:grid-cols-4">
          {[["Sourcing", "Healthy pigs from trusted farms."], ["Processing", "Hygienic, inspected processing."], ["Packaging", "Weighed, sealed & labelled cold."], ["Delivery", "Chilled to your door."]].map(([t, d], i) => (
            <li key={t} className="relative rounded-xl border border-forest/10 bg-white p-6">
              <span className="font-display text-5xl font-semibold text-gold/50">0{i + 1}</span>
              <h3 className="mt-1 font-display text-2xl font-semibold text-forest">{t}</h3>
              <p className="mt-1 text-sm text-charcoal/70">{d}</p>
            </li>
          ))}
        </Reveal>
        <div className="mt-6"><Link href="/farm" className="text-sm font-semibold uppercase tracking-wider text-forest hover:text-gold">See our full process →</Link></div>
      </section>

      {/* BUSINESS */}
      <section className="container-x pt-20">
        <Reveal className="overflow-hidden rounded-2xl bg-forest text-ivory">
          <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow mb-3 !text-gold-2">Tabis Business</p>
              <h2 className="font-display text-5xl font-semibold leading-[1.02]">Pork supply built for your business</h2>
              <p className="mt-4 max-w-xl text-ivory/80">Restaurants, hotels, caterers, supermarkets, butchers, event companies and processors — enjoy tiered pricing, consistent quality and a proper quote-to-order workflow.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/quote" className="btn-gold sheen">Request a Quote</Link>
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
        </Reveal>
      </section>

      {/* PORK GUIDE */}
      <section className="container-x pt-20">
        <Reveal>
          <SectionHeading eyebrow="Know your pork" title="Not sure which cut to buy?" action={<Link href="/pork-guide" className="btn-outline btn-sm">Open the pork guide</Link>} />
        </Reveal>
        <Reveal stagger className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {CUTS.slice(0, 4).map((c) => (
            <Link key={c.id} href={`/pork-guide#${c.id}`} className="card min-w-[250px] snap-start p-5 transition hover:-translate-y-0.5 sm:min-w-0">
              <h3 className="font-display text-2xl font-semibold text-forest">{c.name}</h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold">Best for</p>
              <ul className="mt-2 space-y-1 text-sm text-charcoal/75">{c.bestFor.slice(0, 4).map((b) => <li key={b} className="flex items-center gap-2"><Icon name="check" className="h-3.5 w-3.5 text-forest-2" />{b}</li>)}</ul>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* REVIEWS */}
      <section className="container-x pt-20">
        <Reveal>
          <SectionHeading eyebrow="Customer reviews" title="Fresh, well packaged, on time" center />
        </Reveal>
        <Reveal stagger className="grid gap-5 md:grid-cols-3">
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
        </Reveal>
      </section>

      {/* BLOG */}
      <section className="container-x pt-20">
        <Reveal>
          <SectionHeading eyebrow="Blog & recipes" title="From our kitchen and farm" action={<Link href="/blog" className="btn-outline btn-sm">All articles</Link>} />
        </Reveal>
        <Reveal stagger className="grid gap-5 md:grid-cols-3">
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
        </Reveal>
      </section>

      {/* WHATSAPP CTA */}
      <section className="container-x pt-20">
        <Reveal className="rounded-2xl border border-gold/40 bg-gold-3 p-8 text-center sm:p-12">
          <h2 className="font-display text-4xl font-semibold text-forest sm:text-5xl">Large order? Custom cuts? Delivery question?</h2>
          <p className="mx-auto mt-3 max-w-xl text-charcoal/75">Chat with the Tabis team on WhatsApp — we&apos;re happy to help with wholesale, big pigs, custom cuts and quotes.</p>
          <Link href="/contact" className="btn-primary mt-6">Talk to Tabis</Link>
        </Reveal>
      </section>
    </>
  );
}
